// global variables

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundInfoByID = {};
var gBufferByID = {};
var gSearchHistory = {};

// find AudioBuffer by ID, create a BufferSource, start it playing

function playBufferForID(inID) {
    console.log('playBufferForID', inID);
    var aBufferSource = gAudioContext.createBufferSource();
    aBufferSource.buffer = gBufferByID[inID];
    aBufferSource.connect(gAudioContext.destination);
    aBufferSource.start();

    var selectorString = 'button[data-sound-id="' + inID + '"]';
    document.querySelectorAll(selectorString)[0].setAttribute('playing', 'true');

    aBufferSource.addEventListener('ended', function(e) {
        console.log('ENDED', e);
        var selectorString = 'button[data-sound-id="' + inID + '"]';
        document.querySelectorAll(selectorString)[0].removeAttribute('playing');
    })
}

// Make an XMLHttpRequest for the MP3 preview file, decode the MP3, and save the buffer

function createBufferForID(inID, url) {
    console.log('createBufferForID', inID, url);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
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
    var newDiv = document.createElement("button");
    newDiv.setAttribute('class', 'soundinfo');
    newDiv.setAttribute('disabled', 'true');
    newDiv.setAttribute('data-sound-id', inInfo.id);
    var newContent = document.createTextNode(inInfo.name);
    newDiv.appendChild(newContent); //add the text node to the newly created div.

    // add the newly created element and its content into the DOM
    var containerDiv = document.querySelectorAll('div[data-search="' + inSearchText + '"]')[0];
    containerDiv.appendChild(newDiv);

    newDiv.addEventListener('click', function(event) {
        console.log('clicked', inInfo.id);
        if (gBufferByID[inInfo.id]) {
            playBufferForID(inInfo.id);
        } else {
            console.log('no buffer yet for this sound');
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

// handle the event handler by starting a Freesound text search

function doSearch(inString) {
    gSearchHistory[inString] = [];

    // add container for search results
    var newDiv = document.createElement("div");
    newDiv.setAttribute('class', 'container');
    newDiv.setAttribute('data-search', inString);
    var newContent = document.createTextNode(inString);
    newDiv.appendChild(newContent); //add the text node to the newly created div.
    document.getElementById('soundcontainer').appendChild(newDiv);

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

// when the window is loaded, set up search and play event handlers

window.onload = function(){
    document.getElementById('searchbutton').addEventListener('click', handleSearch);

    document.getElementById('playbutton').addEventListener('click', handlePlay);
};
