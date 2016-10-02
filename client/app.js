// global variables

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundInfoByID = {};
var gBufferByID = {};
var gBufferSourceByID = {};
var gSearchHistory = {};

// find AudioBuffer by ID, create a BufferSource, start it playing
// track all currently playing buffersources in gBufferSourceByID
// don't start another copy of a sound if it is already playing

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

    var selectorString = 'button[data-sound-id="' + inID + '"]';
    document.querySelectorAll(selectorString)[0].setAttribute('playing', 'true');

    aBufferSource.addEventListener('ended', function(e) {
        console.log('ENDED', gSoundInfoByID[inID].name);
        var selectorString = 'button[data-sound-id="' + inID + '"]';
        document.querySelectorAll(selectorString)[0].removeAttribute('playing');
        delete gBufferSourceByID[inID];
        handleBufferSourceListUpdated(inID);
    });
}

// Make an XMLHttpRequest for the MP3 preview file, decode the MP3, and save the buffer

function createBufferForID(inID, url) {
    console.log('createBufferForID', inID, url);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.addEventListener('progress', function(event) {
        var selectorString = 'button[data-sound-id="' + inID + '"] span';
        document.querySelectorAll(selectorString)[0].textContent = Math.round(100 * event.loaded / event.total) + '%';
    });

    // Decode asynchronously
    request.onload = function() {
        var selectorString = 'button[data-sound-id="' + inID + '"] span';
        document.querySelectorAll(selectorString)[0].textContent = '';

        console.log('about to decode', inID, url);
        gAudioContext.decodeAudioData(request.response, function(inBuffer) {
            console.log('decoded', inID, url);
            gBufferByID[inID] = inBuffer;
            var selectorString = 'button[data-sound-id="' + inID + '"]';
            document.querySelectorAll(selectorString)[0].removeAttribute('disabled');
            handleBufferListUpdate(inID);
        }, function (e) {
            console.log('error handler', e);
        });
    }

    request.send();
}

// create a play button for the sound info

function displaySoundInfo(inSearchText, inInfo) {
    var newButton = document.createElement("button");

    newButton.setAttribute('class', 'soundinfo');
    newButton.setAttribute('disabled', 'true');
    newButton.setAttribute('data-sound-id', inInfo.id);

    var newContent = document.createTextNode(inInfo.name);
    var newProgress = document.createElement('span');

    newProgress.setAttribute('class', 'progressinfo');

    newButton.appendChild(newProgress);
    newButton.appendChild(newContent);

    // add the newly created element and its content into the DOM
    var containerDiv = document.querySelectorAll('div[data-search="' + inSearchText + '"]')[0];
    containerDiv.appendChild(newButton);

    newButton.addEventListener('click', function(event) {
        console.log('clicked', inInfo.id);
        if (gBufferSourceByID[inInfo.id]) {
            console.log('STOP', inInfo.name);
            gBufferSourceByID[inInfo.id].stop();
        } else {
            if (gBufferByID[inInfo.id]) {
                playBufferForID(inInfo.id);
            } else {
                console.log('no buffer yet for this sound');
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
    console.log('buffers now', Object.keys(gBufferByID).length);
    document.getElementById('buffercount').textContent = Object.keys(gBufferByID).length;
}

// respond to an update in the sound info list by updating the count

function handleSoundInfoUpdate(inID) {
    console.log('sound info now', Object.keys(gSoundInfoByID).length);
    document.getElementById('soundinfocount').textContent = Object.keys(gSoundInfoByID).length;
}

function handleBufferSourceListUpdated(inID) {
    console.log(gBufferSourceByID);
    document.getElementById('playingcount').textContent = Object.keys(gBufferSourceByID).length;   
}

// handle the event handler by starting a Freesound text search

function doSearch(inString) {
    gSearchHistory[inString] = [];

    // add container for search results
    var newButton = document.createElement("div");
    newButton.setAttribute('class', 'container');
    newButton.setAttribute('data-search', inString);
    var newContent = document.createTextNode(inString);
    newButton.appendChild(newContent); //add the text node to the newly created div.
    document.getElementById('soundcontainer').appendChild(newButton);

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
    var soundIDs = Object.keys(gBufferByID);
    var randomIndex = Math.floor(Math.random() * soundIDs.length);
    playBufferForID(soundIDs[randomIndex]);

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

// when the window is loaded, set up search and play event handlers

window.onload = function(){
    document.getElementById('searchbutton').addEventListener('click', handleSearch);
    document.getElementById('stopbutton').addEventListener('click', handleStop);
    document.getElementById('playbutton').addEventListener('click', handlePlay);
};
