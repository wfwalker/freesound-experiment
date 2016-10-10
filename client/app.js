// global variables

// TODO: button sizes proportional to duration
// TODO: autoplay controls that periodically start sounds in order to reach desired average density
// TODO: weight random choice of sound to pick short ones more often

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundInfoByID = {};
var gBufferByID = {};
var gBufferSourceByID = {};
var gSearchHistory = {};

function $ (selector, el) {
     if (!el) {el = document;}
     return el.querySelector(selector);
}

// find AudioBuffer by ID, create a BufferSource, start it playing
// track all currently playing buffersources in gBufferSourceByID
// don't start another copy of a sound if it is already playing

function playRandomBuffer() {
    var soundIDs = Object.keys(gBufferByID);
    var randomIndex = Math.floor(Math.random() * soundIDs.length);
    playBufferForID(soundIDs[randomIndex]);
}

function playBufferForID(inID) {
    if (gBufferSourceByID[inID]) {
        console.log('ALREADY PLAYING', inID, gSoundInfoByID[inID].name);
        return;
    }

    console.log('PLAY', inID, gSoundInfoByID[inID].name);
    var aBufferSource = gAudioContext.createBufferSource();
    aBufferSource.buffer = gBufferByID[inID];
    aBufferSource.connect(gAudioContext.destination);
    aBufferSource.start();
    gBufferSourceByID[inID] = aBufferSource;
    handleBufferSourceListUpdated(inID);

    $('button[data-sound-id="' + inID + '"]').setAttribute('playing', 'true');

    aBufferSource.addEventListener('ended', function(e) {
        console.log('ENDED', gSoundInfoByID[inID].name);
        var selectorString = 'button[data-sound-id="' + inID + '"]';
        if ($(selectorString)) {
            $(selectorString).removeAttribute('playing');
        }
        delete gBufferSourceByID[inID];
        handleBufferSourceListUpdated(inID);
    });
}

// Make an XMLHttpRequest for the MP3 preview file, decode the MP3, and save the buffer

function createBufferForID(inID, url) {
    console.log('createBufferForID', inID, gSoundInfoByID[inID].name);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.addEventListener('progress', function(event) {
        $('button[data-sound-id="' + inID + '"]').setAttribute('loading', 'true');
        $('button[data-sound-id="' + inID + '"] span').textContent = Math.round(100 * event.loaded / event.total) + '%';
    });

    // Decode asynchronously
    request.onload = function() {
        $('button[data-sound-id="' + inID + '"]').removeAttribute('loading');

        var progressIndicator = $('button[data-sound-id="' + inID + '"] span');
        progressIndicator.parentNode.removeChild(progressIndicator);

        console.log('about to decode', inID, gSoundInfoByID[inID].name);
        gAudioContext.decodeAudioData(request.response, function(inBuffer) {
            console.log('decoded', inID, gSoundInfoByID[inID].name);
            gBufferByID[inID] = inBuffer;
            var selectorString = 'button[data-sound-id="' + inID + '"]';
            $(selectorString).removeAttribute('disabled');
            handleBufferListUpdate(inID);
        }, function (e) {
            console.log('error handler', e);
        });
    }

    request.send();
}

// create a play button for the sound info

function displaySoundInfo(inSearchText, inInfo) {
    var soundButton = Handlebars.compile($('#sound-button-template').innerHTML);

    // add the newly created element and its content into the DOM
    var containerDiv = $('div[data-search="' + inSearchText + '"]');
    containerDiv.insertAdjacentHTML('beforeend', soundButton(inInfo));

    $('button[data-sound-id="' + inInfo.id + '"]').addEventListener('click', function(event) {
        console.log('clicked', inInfo.name);
        if (gBufferSourceByID[inInfo.id]) {
            console.log('STOP', inInfo.name, gBufferSourceByID[inInfo.id]);
            gBufferSourceByID[inInfo.id].stop();
        } else {
            if (gBufferByID[inInfo.id]) {
                playBufferForID(inInfo.id);
                console.log('PLAY', inInfo.name, gBufferSourceByID[inInfo.id]);
            } else {
                console.log('no buffer yet for', inInfo.name);
            }            
        }
    });
}

// load the sound info for a given sound ID

function getInfoAndLoadPreviewByID(inSearchText, inID) {
    console.log('getInfoAndLoadPreviewByID', inID);
    freesound.getSound(inID,
        function(sound) {
            gSoundInfoByID[inID] = sound;
            displaySoundInfo(inSearchText, sound);
            handleSoundInfoUpdate(inID);
            createBufferForID(inID, sound.previews['preview-hq-mp3']);
        },
        function(e) {
            console.log("Sound could not be retrieved", e);
        }
    );
}

// respond to an update in the buffer list by updating the count

function handleBufferListUpdate(inID) {
    console.log('buffer list adding', gSoundInfoByID[inID].name)
    document.getElementById('buffercount').textContent = Object.keys(gBufferByID).length;
}

// respond to an update in the sound info list by updating the count

function handleSoundInfoUpdate(inID) {
    console.log('sound info adding', gSoundInfoByID[inID].name);
    document.getElementById('soundinfocount').textContent = Object.keys(gSoundInfoByID).length;
}

function handleBufferSourceListUpdated(inID) {
    if (gBufferSourceByID[inID]) { 
        console.log('buffer sources add', gSoundInfoByID[inID].name);
    } else {
        console.log('buffer sources remove', gSoundInfoByID[inID].name);
    }
    document.getElementById('playingcount').textContent = Object.keys(gBufferSourceByID).length;   
}

// handle the event handler by starting a Freesound text search

function doSearch(inString) {
    gSearchHistory[inString] = [];

    var searchResults = Handlebars.compile($('#search-results-template').innerHTML);
    document.getElementById('soundcontainer').insertAdjacentHTML('beforeend', searchResults({term: inString}));

    $('button[data-search-term="' + inString + '"]').addEventListener('click', function(e) {
        var searchTerm = e.target.getAttribute('data-search-term');
        var searchHits = gSearchHistory[searchTerm];

        console.log('clicked remove ', searchTerm, searchHits);

        for (var index = 0; index < searchHits.length; index++) {
            var anID = searchHits[index];
            // stop playing
            if (gBufferSourceByID[anID]) {
                gBufferSourceByID[anID].stop();
            }
            delete gBufferSourceByID[anID];
            delete gBufferByID[anID];
            handleBufferSourceListUpdated(anID);
        }

        // remove whole category
        $('div[data-search="' + inString + '"]').remove();
        delete gSearchHistory[searchTerm];
    });

    console.log('about to search', inString);
    freesound.textSearch(inString, {},
        function(resultsObject) {
            for (var index = 0; index < resultsObject.results.length; index++) {
                var tempID = resultsObject.results[index].id;
                gSearchHistory[inString].push(tempID);
                getInfoAndLoadPreviewByID(inString, tempID);
            }
        }, function(err) {
            console.log('textsearch err', err);
        }
    );

}

// handle search event by tokenizing the string and doing a separate search for each token

function handleSearch(event) {
    event.preventDefault();

    var searchText = document.getElementById('searchtext').value;
    console.log('clicked', searchText);

    var stringTokens = searchText.split(' ');
    for (var index = 0; index < stringTokens.length; index++) {
        doSearch(stringTokens[index]);
    }
}

// choose a random ID from the buffer dictionary and start playing

function handlePlay(event) {
    event.preventDefault();
    playRandomBuffer();

    console.log('handlePlay');
}

// stop all playing sounds by iterating through gBufferSourceByID

function handleStop(event) {
    console.log('handleStop');
    for (var bufferSourceID in gBufferSourceByID) {
        console.log('STOP', bufferSourceID);
        gBufferSourceByID[bufferSourceID].stop();
    }
}

function autoPlayTask() {

    var autoPlayCount = document.getElementById('autoplaycount').value;
    var autoPlayDelay = document.getElementById('autoplaydelay').value;

    if (Object.keys(gBufferSourceByID).length < autoPlayCount) {
        console.log('autoplay random buffer');
        playRandomBuffer();
    } else {
        console.log('autoPlayTask do nothing')
    }

    if (document.getElementById('autoplayon').checked) {
        window.setTimeout(autoPlayTask, 1000 * autoPlayDelay);
    } else {
        console.log('autoPlayTask not renewing');
    }
}

function handleAutoPlay(event) {
    var autoPlayDelay = document.getElementById('autoplaydelay').value;

    if (event.target.checked) {
        console.log('autoplay', event.target.checked, autoPlayDelay);
        window.setTimeout(autoPlayTask, 1000 * autoPlayDelay);
    }
}

// when the window is loaded, set up search and play event handlers

window.onload = function(){
    document.getElementById('autoplayon').checked = false;

    document.getElementById('searchbutton').addEventListener('click', handleSearch);
    document.getElementById('stopbutton').addEventListener('click', handleStop);
    document.getElementById('playbutton').addEventListener('click', handlePlay);
    document.getElementById('autoplayon').addEventListener('click', handleAutoPlay);

};
