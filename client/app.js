
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundInfoByID = {};
var gBufferByID = {};

function playSound(inID, url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        gAudioContext.decodeAudioData(request.response, function(inBuffer) {
            var aBufferSource = gAudioContext.createBufferSource();
            gBufferByID[inID] = inBuffer;
            aBufferSource.buffer = inBuffer;
            aBufferSource.connect(gAudioContext.destination);
            aBufferSource.start();
        }, function (e) {
            console.log('error handler', e);
        });
    }

    request.send();
}

function playSoundByID(inID) {
    console.log('playSoundByID', inID);
    freesound.getSound(inID,
        function(sound) {
            gSoundInfoByID[inID] = sound;
            playSound(inID, sound.previews['preview-hq-mp3']);
        },
        function(e) {
            console.log("Sound could not be retrieved", e);
        }
    );
}

function playAllSoundsInSearchResults(inResults) {
    console.log('playAllSoundsInSearchResults', inResults);
    for (var index = 0; index < inResults.length; index++) {
        console.log('loop', index, inResults[index]);
        playSoundByID(inResults[index].id);
    }
}

window.onload = function(){
    freesound.setToken("1beba8e340a9f1b0fad8c5bf14f0361df331a6fb");

    console.log('about to search');
    freesound.textSearch('piano', {},
        function(resultsObject) {
            playAllSoundsInSearchResults(resultsObject.results);
        }, function(err) {
            console.log('textsearch err', err);
        }
    );
};
