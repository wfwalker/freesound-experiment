
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gSoundInfoByID = {};
var gBufferByID = {};

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
            playBufferForID(inID);
        }, function (e) {
            console.log('error handler', e);
        });
    }

    request.send();
}

function playHighQualityMP3PreviewByID(inID) {
    console.log('playHighQualityMP3PreviewByID', inID);
    freesound.getSound(inID,
        function(sound) {
            gSoundInfoByID[inID] = sound;
            createBufferForID(inID, sound.previews['preview-hq-mp3']);
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
        playHighQualityMP3PreviewByID(inResults[index].id);
    }
}

function handleSearch(event) {
    event.preventDefault();

    var searchText = document.getElementById('searchtext').value;
    console.log('clicked', searchText);

    console.log('about to search', searchtext);
    freesound.textSearch(searchText, {},
        function(resultsObject) {
            for (var index = 0; index < resultsObject.results.length; index++) {
                console.log('loop', index, resultsObject.results[index]);
                playHighQualityMP3PreviewByID(resultsObject.results[index].id);
            }
        }, function(err) {
            console.log('textsearch err', err);
        }
    );
}

window.onload = function(){
    // TODO: must not disclose this in plaintext JS downloaded to user
    freesound.setToken("1beba8e340a9f1b0fad8c5bf14f0361df331a6fb");

    document.getElementById('searchbutton').addEventListener('click', handleSearch);
};
