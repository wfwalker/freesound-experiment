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
var gTemplates = {};

function $ (selector, el) {
     if (!el) {el = document;}
     return el.querySelector(selector);
}

// find AudioBuffer by ID, create a BufferSource, start it playing
// track all currently playing buffersources in gBufferSourceByID
// don't start another copy of a sound if it is already playing

function playRandomBuffer() {
    console.log('playRandomBuffer');
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
    gSoundInfoByID[inID].starttime = new Date();
    var aBufferSource = gAudioContext.createBufferSource();
    aBufferSource.buffer = gBufferByID[inID];
    aBufferSource.connect(gAudioContext.destination);
    aBufferSource.start();
    gBufferSourceByID[inID] = aBufferSource;
    handleBufferSourceListUpdated(inID);

    $('#play-sound-' + inID).setAttribute('playing', 'true');

    aBufferSource.addEventListener('ended', function(e) {
        console.log('ENDED', gSoundInfoByID[inID].name);
        var selectorString = '#play-sound-' + inID;
        if ($(selectorString)) {
            $(selectorString).removeAttribute('playing');
        }
        delete gBufferSourceByID[inID];
        delete gSoundInfoByID[inID].starttime;

        handleBufferSourceListUpdated(inID);
    });
}

// Make an XMLHttpRequest for the MP3 preview file, decode the MP3, and save the buffer

function downloadBufferForID(inID, url) {
    console.log('downloadBufferForID', inID, gSoundInfoByID[inID].name);
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.addEventListener('progress', function(event) {
        $('#play-sound-' + inID).setAttribute('loading', 'true');
        $('span[data-sound-id="' + inID + '"]').textContent = Math.round(100 * event.loaded / event.total) + '%';
    });

    // Decode asynchronously
    request.onload = function() {
        $('#play-sound-' + inID).removeAttribute('loading');

        var progressIndicator = $('span[data-sound-id="' + inID + '"]');
        progressIndicator.parentNode.removeChild(progressIndicator);

        console.log('about to decode', inID, gSoundInfoByID[inID].name);
        gAudioContext.decodeAudioData(request.response, function(inBuffer) {
            console.log('decoded', inID, gSoundInfoByID[inID].name);
            gBufferByID[inID] = inBuffer;
            $('#play-sound-' + inID).removeAttribute('disabled');
            $('#remove-sound-' + inID).removeAttribute('disabled');
            handleBufferListUpdate(inID);
        }, function (e) {
            console.log('error handler', e);
        });
    }

    request.send();
}

// create a play button for the sound info

function displaySoundInfo(inSearchText, inInfo) {
    // add the newly created element and its content into the DOM
    var containerDiv = $('table[data-search="' + inSearchText + '"]');
    containerDiv.insertAdjacentHTML('beforeend', gTemplates['sound-button'](inInfo));

    $('#play-sound-' + inInfo.id).addEventListener('click', function(event) {
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

    //TODO: add hadler for remove sound button
    $('#remove-sound-' + inInfo.id).addEventListener('click', function(event) {
        console.log('remove-sound', event.target);
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
            downloadBufferForID(inID, sound.previews['preview-hq-mp3']);
        },
        function(e) {
            console.log("Sound could not be retrieved", e);
        }
    );
}

// respond to an update in the buffer list by updating the count

function handleBufferListUpdate(inID) {
    if (gBufferByID[inID]) {
        console.log('buffer list adding', gSoundInfoByID[inID].name);
    } else {
        console.log('buffer list removing', inID);
    }
    document.getElementById('buffercount').textContent = Object.keys(gBufferByID).length;
}

// respond to an update in the sound info list by updating the count

function handleSoundInfoUpdate(inID) {
    if (gSoundInfoByID[inID]) {
        console.log('sound info adding', gSoundInfoByID[inID].name);
    } else {
        console.log('sound info removing', inID);
    }
    document.getElementById('soundinfocount').textContent = Object.keys(gSoundInfoByID).length;
}

function handleBufferSourceListUpdated(inID) {
    if (gBufferSourceByID[inID]) { 
        console.log('buffer sources add', gSoundInfoByID[inID].name);
        $('#playingcontainer').insertAdjacentHTML('beforeend', gTemplates['buffer-playing'](gSoundInfoByID[inID]));
    } else {
        console.log('buffer sources remove', inID);
        if ($('div[data-sound-id="' + inID + '"]')) {
            $('div[data-sound-id="' + inID + '"]').remove();
        }
    }
    document.getElementById('playingcount').textContent = Object.keys(gBufferSourceByID).length;   
}

// handle the event handler by starting a Freesound text search

function doSearch(inString) {
    gSearchHistory[inString] = [];

    document.getElementById('soundcontainer').insertAdjacentHTML('beforeend', gTemplates['search-results']({term: inString}));

    $('button[data-search-term="' + inString + '"]').addEventListener('click', function(e) {
        var searchTerm = e.target.getAttribute('data-search-term');
        deleteBuffersForSearch(searchTerm);

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

function deleteBuffersForSearch(inSearchTerm) {
    var searchHits = gSearchHistory[inSearchTerm];

    console.log('deleteBuffersForSearch', inSearchTerm, searchHits);

    for (var index = 0; index < searchHits.length; index++) {
        var anID = searchHits[index];
        // stop playing
        if (gBufferSourceByID[anID]) {
            gBufferSourceByID[anID].stop();
        }
        delete gBufferSourceByID[anID];
        delete gSoundInfoByID[anID];
        delete gBufferByID[anID];
        handleBufferSourceListUpdated(anID);
        handleSoundInfoUpdate(anID);
        handleBufferListUpdate(anID);
    }
}

// handle search event by tokenizing the string and doing a separate search for each token

function handleSearch(event) {
    event.preventDefault();

    var searchText = document.getElementById('searchtext').value;
    console.log('handleSearh', searchText);

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

function elapsedTask() {
    var timers = document.querySelectorAll('.elapsed');

    if (timers) {
        for (var index = 0; index < timers.length; index++) {
            var delta = new Date() - new Date(timers[index].getAttribute('data-starttime'));
            console.log(delta);
            timers[index].innerHTML = Math.round(delta / 1000);
        }
    }
    window.setTimeout(elapsedTask, 1000);
}

// when the window is loaded, set up search and play event handlers

window.onload = function(){
    document.getElementById('autoplayon').checked = false;

    gTemplates['sound-button'] = Handlebars.compile($('#sound-button-template').innerHTML);
    gTemplates['search-results'] = Handlebars.compile($('#search-results-template').innerHTML);
    gTemplates['buffer-playing'] = Handlebars.compile($('#buffer-playing-template').innerHTML);

    Handlebars.registerHelper('round', function (num) {
        return Math.round(num);
    });

    document.getElementById('searchbutton').addEventListener('click', handleSearch);
    document.getElementById('stopbutton').addEventListener('click', handleStop);
    document.getElementById('playbutton').addEventListener('click', handlePlay);
    document.getElementById('autoplayon').addEventListener('click', handleAutoPlay);

    console.log('start moo');
    window.setTimeout(elapsedTask, 1000);
};


// Check if the Web MIDI API is supported by the browser
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(midiSucess, midiFailure);
} else {
    console.log("Web MIDI API not supported!");
}

function dispatchMIDIMessage(message) {
{
    // Mask off the lower nibble (MIDI channel, which we don't care about)
    switch (event.data[0] & 0xf0) {
        case 0x90:
            if (event.data[2]!=0) {  // if velocity != 0, this is a note-on message
                console.log('START', event.data[1]);
                playRandomBuffer();
                return;
            }
        // if velocity == 0, fall thru: it's a note-off.  MIDI's weird, y'all.
        case 0x80:
            console.log('STOP', event.data[1]);
            return;
        case 0xA0:
            console.log('aftertouch', event.data[1], event.data[2]);
            return;
        case 0xB0:
            console.log('knob', event.data[1], event.data[2]);
            return;
        case 0xC0:
            console.log('patch change', event.data[1], event.data[2]);
            return;
        case 0xD0:
            console.log('channel pressure', event.data[1], event.data[2]);
            return;
        case 0xE0:
            console.log('pitch bend', event.data[1], event.data[2]);
            return;
        }
    }
}

// Function executed on successful connection
function midiSucess(interface) {
    // Grab an array of all available devices
    var iter = interface.inputs.values();

    for (var i = iter.next(); i && !i.done; i = iter.next()) {
        console.log('input', i.value);
        i.value.addEventListener('midimessage', function (e) {
            dispatchMIDIMessage(e);
        });
    }
}

// Function executed on failed connection
function midiFailure(error) {
    console.log("Could not connect to the MIDI interface", error);
}
