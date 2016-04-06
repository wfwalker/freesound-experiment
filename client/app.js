
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var myAudioElement = null;
var mySource = null;

window.onload = function(){

    freesound.setToken("1beba8e340a9f1b0fad8c5bf14f0361df331a6fb");
    
    var fields = 'id,name,url';
    // Example 1
    // Example of geeting the info of a sound, queying for similar sounds (content based) and showing some analysis
    // features. Both similar sounds and analysis features are obtained with additional requests to the api.
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

                myAudioElement = new Audio(sound.previews['preview-hq-mp3']);
                myAudioElement.setAttribute('crossorigin', 'anonymous')
                mySource = gAudioContext.createMediaElementSource(myAudioElement);
                mySource.connect(gAudioContext.destination);

                // var oscillator = gAudioContext.createOscillator();

                // oscillator.type = 'square';
                // oscillator.frequency.value = 30; // value in hertz
                // oscillator.connect(gAudioContext.destination);
                // oscillator.start(0);

                msg += '<br><button onclick="myAudioElement.play()">play</button><button onclick="myAudioElement.pause()">pause</button><br><br>';
                displayMessage(msg,'resp1');                    
            }, function(){ displayError("Sound could not be retrieved.")}
    );
    
};

function displayError(text){
    document.getElementById('error').innerHTML=text;
}

function displayMessage(text,place){
    document.getElementById(place).innerHTML=text;
}

