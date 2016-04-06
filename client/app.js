
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
    freesound.getSound(inID,
        function(sound) {
            gSoundInfoByID[inID] = sound;
            playSound(inID, sound.previews['preview-hq-mp3']);
        },
        function(e) {
            displayError("Sound could not be retrieved.");
        }
    );
}

window.onload = function(){
    freesound.setToken("1beba8e340a9f1b0fad8c5bf14f0361df331a6fb");

    freesound.textSearch('piano', {}, function(results) {
            console.log('textsearch', results);
        }, function(err) {
            console.log('textsearch err', err);
        });

    playSoundByID(96541);
    playSoundByID(96542);
};

function displayError(text){
    document.getElementById('error').innerHTML=text;
}

function displayMessage(text,place){
    document.getElementById(place).innerHTML=text;
}

