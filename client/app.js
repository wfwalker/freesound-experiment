
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var myAudioElement = null;
var mySource = null;

function playSound(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        gAudioContext.decodeAudioData(request.response, function(inBuffer) {
            var aBufferSource = gAudioContext.createBufferSource();
            aBufferSource.buffer = inBuffer;
            aBufferSource.connect(gAudioContext.destination);
            aBufferSource.start();
        }, function (e) {
            console.log('error handler', e);
        });
    }

    request.send();
}

window.onload = function(){
    freesound.setToken("1beba8e340a9f1b0fad8c5bf14f0361df331a6fb");

    freesound.textSearch('piano', {}, function(results) {
            console.log('textsearch', results);
        }, function(err) {
            console.log('textsearch err', err);
        });
    
    freesound.getSound(96541,
            function(sound){
                var msg = "";

                msg = "<h3>Getting info of sound: " + sound.name + "</h3>";
                msg += "<strong>Url:</strong> " + sound.url + "<br>";
                msg += "<strong>Description:</strong> " + sound.description + "<br>";
                msg += "<strong>Tags:</strong><ul>";
                for (i in sound.tags){
                    msg += "<li>" + sound.tags[i] + "</li>";
                }
                msg += "</ul><br>";
                msg += "<img src='" + sound.images.waveform_l + "'>";

                displayMessage(msg,'resp1');                    

                playSound(sound.previews['preview-hq-mp3']);
            }, function(){ displayError("Sound could not be retrieved.")}
    );
};

function displayError(text){
    document.getElementById('error').innerHTML=text;
}

function displayMessage(text,place){
    document.getElementById(place).innerHTML=text;
}

