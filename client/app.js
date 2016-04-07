
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundInfoByID = {};
var gBufferByID = {};
var gSearchHistory = {};

function playBufferForID(inID) {
    console.log('playBufferForID', inID);
    var aBufferSource = gAudioContext.createBufferSource();
    aBufferSource.buffer = gBufferByID[inID];
    aBufferSource.connect(gAudioContext.destination);
    aBufferSource.start();    
}

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

function displaySoundInfo(inInfo) {
    var newDiv = document.createElement("button");
    newDiv.setAttribute('class', 'soundinfo');
    newDiv.setAttribute('disabled', 'true');
    newDiv.setAttribute('data-sound-id', inInfo.id);
    var newContent = document.createTextNode(inInfo.id + ' ' + inInfo.name);
    newDiv.appendChild(newContent); //add the text node to the newly created div.

    // add the newly created element and its content into the DOM
    var containerDiv = document.getElementById("soundcontainer");
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

function getInfoAndLoadPreviewByID(inID) {
    console.log('getInfoAndLoadPreviewByID', inID);
    freesound.getSound(inID,
        function(sound) {
            gSoundInfoByID[inID] = sound;
            displaySoundInfo(sound);
            handleSoundInfoUpdate(inID);
            createBufferForID(inID, sound.previews['preview-hq-mp3']);
        },
        function(e) {
            console.log("Sound could not be retrieved", e);
        }
    );
}

function handleBufferListUpdate(inID) {
    console.log('buffers now', Object.keys(gBufferByID).length);
    document.getElementById('buffercount').textContent = Object.keys(gBufferByID).length;
}

function handleSoundInfoUpdate(inID) {
    console.log('sound info now', Object.keys(gSoundInfoByID).length);
    document.getElementById('soundinfocount').textContent = Object.keys(gSoundInfoByID).length;
}

function handleSearch(event) {
    event.preventDefault();

    var searchText = document.getElementById('searchtext').value;
    console.log('clicked', searchText);
    gSearchHistory[searchText] = [];

    console.log('about to search', searchtext);
    freesound.textSearch(searchText, {},
        function(resultsObject) {
            for (var index = 0; index < resultsObject.results.length; index++) {
                var tempID = resultsObject.results[index].id;
                gSearchHistory[searchText].push(tempID);
                getInfoAndLoadPreviewByID(tempID);
            }
        }, function(err) {
            console.log('textsearch err', err);
        }
    );
}

function handlePlay(event) {
    event.preventDefault();
    var soundIDs = Object.keys(gBufferByID);
    var randomIndex = Math.floor(Math.random() * soundIDs.length);
    playBufferForID(soundIDs[randomIndex]);

    console.log('handlePlay');
}

window.onload = function(){
    document.getElementById('searchbutton').addEventListener('click', handleSearch);

    document.getElementById('playbutton').addEventListener('click', handlePlay);
};
