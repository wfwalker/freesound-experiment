// freesoundCollection.js

var FreesoundCollection = function(inAudioContext) {
	this.soundInfoByID = {};
	this.bufferByID = {};
	this.bufferSourceByID = {};
	this.searchHistory = {};
	this.audioContext = inAudioContext;
}

FreesoundCollection.prototype.handleBufferSourceListUpdated = function(inID) {
    // if an ID was added, use the template to add an HTML element for it...
    if (this.bufferSourceByID[inID]) {
        console.log('buffer sources add', this.soundInfoByID[inID].name);
        $('#playingcontainer').append(gTemplates['buffer-playing'](this.soundInfoByID[inID]));

        // upon pressing the remove sound button
        $('.remove-sound[data-sound-id="'+inID+'"]').click(function(event) {
            console.log('remove-sound', event.target);
            // stop playing,  remove from arrays, notify observers
            this.deleteBufferForID(inID);
            // remove from table
            $('#sound-button-row-' + inID).remove();
        }.bind(this));
    // ...otherwise remove the HTML element for this ID
    } else {
        console.log('buffer sources remove', inID);
        if ($('div[data-sound-id="' + inID + '"]')) {
            $('div[data-sound-id="' + inID + '"]').remove();
        }
    }
}

FreesoundCollection.prototype.playBufferForID = function(inID) {
    if (this.bufferSourceByID[inID]) {
        console.log('ALREADY PLAYING', inID, this.soundInfoByID[inID].name);
        return;
    }

    if (! this.soundInfoByID[inID]) {
        console.log('NO SOUND INFO FOR', inID);
        return;
    }

    console.log('PLAY', inID, this.soundInfoByID[inID].name);
    var tempDate = new Date();
    this.soundInfoByID[inID].starttime = tempDate;
    $('span[data-starttime-id="' + inID + '"]').text(tempDate.getHours() + ':' + tempDate.getMinutes() + ':' + tempDate.getSeconds());

    // CREATE gain node
    var gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(this.audioContext.destination);

    // CREATE audio buffer source
    var aBufferSource = this.audioContext.createBufferSource();
    aBufferSource.buffer = this.bufferByID[inID];
    aBufferSource.freesoundID = inID;
    aBufferSource.connect(gainNode);
    aBufferSource.start();
    aBufferSource.myGainNode = gainNode;

    this.bufferSourceByID[inID] = aBufferSource;
    this.handleBufferSourceListUpdated(inID);

    $('#play-sound-' + inID).attr('playing', 'true');

    aBufferSource.addEventListener('ended', function(e) {
    	this.handleBufferPlayEnded(e);
    }.bind(this));
}

FreesoundCollection.prototype.onPlayButtonClicked = function(inInfo) {
    console.log('clicked', inInfo.name);
    if (this.bufferSourceByID[inInfo.id]) {
        console.log('STOP', inInfo.name, this.bufferSourceByID[inInfo.id]);
        this.bufferSourceByID[inInfo.id].stop();
    } else {
        if (this.bufferByID[inInfo.id]) {
            this.playBufferForID(inInfo.id);
            console.log('PLAY', inInfo.name, this.bufferSourceByID[inInfo.id]);
        } else {
            console.log('no buffer yet for', inInfo.name);
        }            
    }
}

FreesoundCollection.prototype.handleBufferPlayEnded = function(e) {
    var freesoundID = e.target.freesoundID;

    if (this.soundInfoByID[freesoundID]) {
        console.log('ENDED', this.soundInfoByID[freesoundID].name);
        // turn off timer
        delete this.soundInfoByID[freesoundID].starttime;
    } else {
        console.log('ENDED no sound info?', freesoundID);
    }

    if (this.bufferSourceByID[freesoundID]) {
        // disconnect gain node
        this.bufferSourceByID[freesoundID].myGainNode.disconnect();
        // remove buffer from global buffer list
        delete this.bufferSourceByID[freesoundID];
        // notify observers of global buffer list
        this.handleBufferSourceListUpdated(freesoundID);
    } else {
        console.log('ENDED no buffer source?', freesoundID);
    }

    // if there's a play-button, mark it as not playing
    var selectorString = '#play-sound-' + freesoundID;
    if ($(selectorString)) {
        $(selectorString).removeAttr('playing');
    } else {
        console.log('no play button');
    }
}

FreesoundCollection.prototype.playRandomBuffer = function() {
    console.log('playRandomBuffer');
    var soundIDs = Object.keys(this.bufferByID);
    var randomIndex = Math.floor(Math.random() * soundIDs.length);
    this.playBufferForID(soundIDs[randomIndex]);
}

FreesoundCollection.prototype.search = function(inString) {
    var fullSearch = inString + '&filter=duration:[1 TO 90]'
    console.log('about to search', fullSearch);
    this.searchHistory[inString] = [];

    freesound.textSearch(fullSearch, {},
        function(resultsObject) {
            for (var index = 0; index < resultsObject.results.length; index++) {
                var tempID = resultsObject.results[index].id;
                this.searchHistory[inString].push(tempID);
                this.getInfoAndLoadPreviewByID(inString, tempID);
            }
        }.bind(this), function(err) {
            console.log('textsearch err', err);
        }
    );
};


FreesoundCollection.prototype.handleSoundDownloadProgress = function(event) {
    var freesoundID = event.target.freesoundID;
    // console.log('progress', event.target.freesoundID, event.loaded, event.total);
    $('#play-sound-' + freesoundID).attr('loading', 'true');
    $('span[data-sound-id="' + freesoundID + '"]').text(Math.round(100 * event.loaded / event.total) + '%');
}

FreesoundCollection.prototype.handleSoundDownloadDone = function(event) {
    var freesoundID = event.target.freesoundID;
    $('#play-sound-' + freesoundID).removeAttr('loading');

    var progressIndicator = $('span[data-sound-id="' + freesoundID + '"]');
    progressIndicator.remove();

    console.log('about to decode', freesoundID);
    this.audioContext.decodeAudioData(event.target.response, function(inBuffer) {
        console.log('decoded', freesoundID, this.soundInfoByID[freesoundID].name);
        this.bufferByID[freesoundID] = inBuffer;

        // TODO belongs elsewhere?
        $('#play-sound-' + freesoundID).removeAttr('disabled');
        $('.remove-sound[data-sound-id="'+freesoundID+'"]').removeAttr('disabled');
        handleBufferListUpdate(freesoundID);
    }.bind(this), function (e) {
        console.log('error handler', e);
    });
}

FreesoundCollection.prototype.downloadBufferForID = function(inID, url) {
    console.log('downloadBufferForID', inID, this.soundInfoByID[inID].name);

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.freesoundID = inID;

    // handle progress events
    request.addEventListener('progress', this.handleSoundDownloadProgress);

    // Decode asynchronously
    request.onload = this.handleSoundDownloadDone.bind(this);

    request.send();
}

FreesoundCollection.prototype.deleteBufferForID = function(anID) {  
    console.log('deleteBufferForID', anID);
    // stop playing
    if (this.bufferSourceByID[anID]) {
        this.bufferSourceByID[anID].stop();
    }
    delete this.bufferSourceByID[anID];
    delete this.soundInfoByID[anID];
    delete this.bufferByID[anID];
    this.handleBufferSourceListUpdated(anID);
    handleBufferListUpdate(anID);
}


FreesoundCollection.prototype.getInfoAndLoadPreviewByID = function(inSearchText, inID) {
    console.log('getInfoAndLoadPreviewByID', inID);

    freesound.getSound(inID,
        function(sound) {
            this.soundInfoByID[inID] = sound;
            displaySoundInfo(inSearchText, sound);
            this.downloadBufferForID(inID, sound.previews['preview-hq-mp3']);
        }.bind(this),
        function(e) {
            console.log("Sound could not be retrieved", e);
        }
    );
}

FreesoundCollection.prototype.deleteBuffersForSearch = function(inSearchTerm) {
    var searchHits = this.searchHistory[inSearchTerm];

    console.log('deleteBuffersForSearch', inSearchTerm, searchHits);

    for (var index = 0; index < searchHits.length; index++) {
        var anID = searchHits[index];
        this.deleteBufferForID(anID);
    }

    delete this.searchHistory[inSearchTerm];
}

if (typeof module != 'undefined') {
	module.exports = FreesoundCollection;
}
