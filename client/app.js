// global variables

// TODO: button sizes proportional to duration
// TODO: autoplay controls that periodically start sounds in order to reach desired average density
// TODO: weight random choice of sound to pick short ones more often

window.AudioContext = window.AudioContext||window.webkitAudioContext;

var theCollection = new FreesoundCollection(new AudioContext());

var gTemplates = {};

// create a play button for the sound info

function displaySoundInfo(inSearchText, inInfo) {
    // add the newly created element and its content into the DOM
    var containerDiv = $('tbody[data-search="' + inSearchText + '"]');
    containerDiv.append(gTemplates['sound-button'](inInfo));

    $('#play-sound-' + inInfo.id).click(function(event) {
        console.log('clicked', event);
        theCollection.onPlayButtonClicked(inInfo);
    });

    //TODO: combine with FreesoundCollection.prototype.handleBufferSourceListUpdated
    $('.remove-sound[data-sound-id="'+inInfo.id+'"]').click(function(event) {
        console.log('remove-sound', event.target);
        // stop playing,  remove from arrays, notify observers
        theCollection.deleteBufferForID(inInfo.id);
        // remove from table`
        $('#sound-button-row-' + inInfo.id).remove();
    }.bind(this));
}

// respond to an update in the buffer list by updating the count

function handleBufferListUpdate(inID) {
    var bufferCount = Object.keys(theCollection.bufferByID).length;

    if (theCollection.bufferByID[inID]) {
        console.log('buffer list adding', theCollection.soundInfoByID[inID].name);
        $('#autoplayon').removeAttr('disabled');
    } else {
        console.log('buffer list removing', inID);

        if (bufferCount == 0) {
            $('#autoplayon').prop('checked', false);
            $('#autoplayon').attr('disabled', 'true');
            $('#autoplayon').click();
        }
    }
}

// handle the event handler by starting a Freesound text search

function doSearch(inString) {

    $('#soundcontainer').append(gTemplates['search-results']({term: inString}));

    $('button[data-search-term="' + inString + '"]').click(function(e) {
        var searchTerm = e.target.getAttribute('data-search-term');
        theCollection.deleteBuffersForSearch(searchTerm);

        // remove whole category
        $('div[data-search="' + inString + '"]').remove();
    });

    console.log('about to search', inString);
    theCollection.search(inString);
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

function autoPlayTask() {
    var autoPlayCount = document.getElementById('autoplaycount').value;
    var autoPlayDelay = document.getElementById('autoplaydelay').value;

    // if autoplay still checked
    if (document.getElementById('autoplayon').checked) {
        // and there's not enough sounds playing
        if (Object.keys(theCollection.bufferSourceByID).length < autoPlayCount) {
            console.log('autoplay random buffer');
            theCollection.playRandomBuffer();
        } else {
            console.log('autoPlayTask do nothing')
        }

        // do it again soon
        window.setTimeout(autoPlayTask, 1000 * autoPlayDelay);
    } else {
        console.log('autoPlayTask already off');
    }
}

function handleAutoPlay(event) {
    var autoPlayDelay = document.getElementById('autoplaydelay').value;

    if (event.target.checked) {
        console.log('autoplay', event.target.checked, autoPlayDelay);
        window.setTimeout(autoPlayTask, 1000 * autoPlayDelay);
    } else {
        console.log('stop all');
        for (var bufferSourceID in theCollection.bufferSourceByID) {
            console.log('STOP', bufferSourceID);
            theCollection.bufferSourceByID[bufferSourceID].stop();
        }
    }
}

function elapsedTask() {
    var timers = document.querySelectorAll('.elapsed');

    if (timers) {
        for (var index = 0; index < timers.length; index++) {
            var delta = new Date() - new Date(timers[index].getAttribute('data-starttime'));
            timers[index].innerHTML = Math.round(delta / 1000);
        }
    }
    window.setTimeout(elapsedTask, 1000);
}

// when the window is loaded, set up search and play event handlers

window.onload = function(){
    document.getElementById('autoplayon').checked = false;

    gTemplates['sound-button'] = Handlebars.compile($('#sound-button-template').html());
    gTemplates['search-results'] = Handlebars.compile($('#search-results-template').html());
    gTemplates['buffer-playing'] = Handlebars.compile($('#buffer-playing-template').html());

    Handlebars.registerHelper('round', function (num) {
        return Math.round(num);
    });

    document.getElementById('searchbutton').addEventListener('click', handleSearch);
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
