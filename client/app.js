
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
            handleBufferListUpdate(inID);
        }, function (e) {
            console.log('error handler', e);
        });
    }

    request.send();
}

function getInfoAndLoadPreviewByID(inID) {
    console.log('getInfoAndLoadPreviewByID', inID);
    freesound.getSound(inID,
        function(sound) {
            gSoundInfoByID[inID] = sound;
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
