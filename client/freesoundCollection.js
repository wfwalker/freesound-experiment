// freesoundCollection.js

var FreesoundCollection = function(inAudioContext) {
	this.soundInfoByID = {};
	this.bufferByID = {};
	this.bufferSourceByID = {};
	this.searchHistory = {};
	this.audioContext = inAudioContext;
}

FreesoundCollection.prototype.playBufferForID = function(inID) {
    if (this.bufferSourceByID[inID]) {
        console.log('ALREADY PLAYING', inID, this.soundInfoByID[inID].name);
        return;
    }

    console.log('PLAY', inID, this.soundInfoByID[inID].name);
    this.soundInfoByID[inID].starttime = new Date();

    // CREATE gain node
    var gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(gAudioContext.destination);

    // CREATE audio buffer source
    var aBufferSource = this.audioContext.createBufferSource();
    aBufferSource.buffer = this.bufferByID[inID];
    aBufferSource.freesoundID = inID;
    aBufferSource.connect(gainNode);
    aBufferSource.start();
    aBufferSource.myGainNode = gainNode;

    this.bufferSourceByID[inID] = aBufferSource;
    handleBufferSourceListUpdated(inID);

    $('#play-sound-' + inID).attr('playing', 'true');

    aBufferSource.addEventListener('ended', handleBufferPlayEnded);
}

function handleBufferPlayEnded(e) {
    var freesoundID = e.target.freesoundID;

    if (this.soundInfoByID[freesoundID]) {
        console.log('ENDED', this.soundInfoByID[freesoundID].name);
        // turn off timer
        delete this.soundInfoByID[freesoundID].starttime;
    } else {
        console.log('ENDED no sound info?', freesoundID);
    }

    // disconnect gain node
    this.bufferSourceByID[freesoundID].myGainNode.disconnect();
    // remove buffer from global buffer list
    delete this.bufferSourceByID[freesoundID];
    // notify observers of global buffer list
    handleBufferSourceListUpdated(freesoundID);

    // // if there's a play-button, mark it as not playing
    // var selectorString = '#play-sound-' + freesoundID;
    // if ($(selectorString)) {
    //     $(selectorString).removeAttr('playing');
    // } else {
    //     console.log('no play button');
    // }
}

FreesoundCollection.prototype.playRandomBuffer = function() {
    console.log('playRandomBuffer');
    var soundIDs = Object.keys(this.bufferByID);
    var randomIndex = Math.floor(Math.random() * soundIDs.length);
    this.playBufferForID(soundIDs[randomIndex]);
}

FreesoundCollection.prototype.search = function(inString) {
    console.log('about to search', inString);
    this.searchHistory[inString] = [];
    var collection = this;

    freesound.textSearch(inString, {},
        function(resultsObject) {
            for (var index = 0; index < resultsObject.results.length; index++) {
                var tempID = resultsObject.results[index].id;
                console.log('collection', collection.searchHistory, inString);
                collection.searchHistory[inString].push(tempID);
                collection.getInfoAndLoadPreviewByID(inString, tempID);
            }
        }, function(err) {
            console.log('textsearch err', err);
        }
    );
};


FreesoundCollection.prototype.handleSoundDownloadProgress = function(event) {
    var freesoundID = event.target.freesoundID;
    console.log('progress', event.target.freesoundID, event.loaded, event.total);
    // $('#play-sound-' + freesoundID).attr('loading', 'true');
    // $('span[data-sound-id="' + freesoundID + '"]').text(Math.round(100 * event.loaded / event.total) + '%');
}

FreesoundCollection.prototype.handleSoundDownloadDone = function(event) {
    var freesoundID = event.target.freesoundID;
    var collection = event.target.collection;
    // $('#play-sound-' + freesoundID).removeAttr('loading');

    // var progressIndicator = $('span[data-sound-id="' + freesoundID + '"]');
    // progressIndicator.remove();

    console.log('about to decode', freesoundID);
    collection.audioContext.decodeAudioData(event.target.response, function(inBuffer) {
        console.log('decoded', freesoundID, collection.soundInfoByID[freesoundID].name);
        collection.bufferByID[freesoundID] = inBuffer;
        // $('#play-sound-' + freesoundID).removeAttr('disabled');
        // $('.remove-sound[data-sound-id="'+freesoundID+'"]').removeAttr('disabled');
        // handleBufferListUpdate(freesoundID);
    }, function (e) {
        console.log('error handler', e);
    });
}

FreesoundCollection.prototype.downloadBufferForID = function(inID, url) {
    console.log('downloadBufferForID', inID, this.soundInfoByID[inID].name);

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.freesoundID = inID;
    request.collection = this;

    // handle progress events
    request.addEventListener('progress', this.handleSoundDownloadProgress);

    // Decode asynchronously
    request.onload = this.handleSoundDownloadDone;

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
    // handleBufferSourceListUpdated(anID);
    // handleBufferListUpdate(anID);
}


FreesoundCollection.prototype.getInfoAndLoadPreviewByID = function(inSearchText, inID) {
    console.log('getInfoAndLoadPreviewByID', inID);
    var collection = this;

    freesound.getSound(inID,
        function(sound) {
            collection.soundInfoByID[inID] = sound;
            // collection.displaySoundInfo(inSearchText, sound);
            collection.downloadBufferForID(inID, sound.previews['preview-hq-mp3']);
        },
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
}

if (typeof module != 'undefined') {
	module.exports = FreesoundCollection;
}
