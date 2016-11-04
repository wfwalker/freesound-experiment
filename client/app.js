// global variables

// TODO: button sizes proportional to duration
// TODO: autoplay controls that periodically start sounds in order to reach desired average density
// TODO: weight random choice of sound to pick short ones more often

window.AudioContext = window.AudioContext||window.webkitAudioContext;

var theCollection = new FreesoundCollection(new AudioContext());

// var gAudioContext = new AudioContext();
// var gSoundInfoByID = {};
// var gBufferByID = {};
// var gBufferSourceByID = {};
// var gSearchHistory = {};
var gTemplates = {};

// find AudioBuffer by ID, create a BufferSource, start it playing
// track all currently playing buffersources in gBufferSourceByID
// don't start another copy of a sound if it is already playing

// function playRandomBuffer() {
//     console.log('playRandomBuffer');
//     var soundIDs = Object.keys(gBufferByID);
//     var randomIndex = Math.floor(Math.random() * soundIDs.length);
//     playBufferForID(soundIDs[randomIndex]);
// }

// function playBufferForID(inID) {
//     if (gBufferSourceByID[inID]) {
//         console.log('ALREADY PLAYING', inID, gSoundInfoByID[inID].name);
//         return;
//     }

//     console.log('PLAY', inID, gSoundInfoByID[inID].name);
//     gSoundInfoByID[inID].starttime = new Date();

//     // CREATE gain node
//     var gainNode = gAudioContext.createGain();
//     gainNode.gain.value = 1;
//     gainNode.connect(gAudioContext.destination);

//     // CREATE audio buffer source
//     var aBufferSource = gAudioContext.createBufferSource();
//     aBufferSource.buffer = gBufferByID[inID];
//     aBufferSource.freesoundID = inID;
//     aBufferSource.connect(gainNode);
//     aBufferSource.start();
//     aBufferSource.myGainNode = gainNode;

//     gBufferSourceByID[inID] = aBufferSource;
//     handleBufferSourceListUpdated(inID);

//     $('#play-sound-' + inID).attr('playing', 'true');

//     aBufferSource.addEventListener('ended', handleBufferPlayEnded);
// }

// function handleBufferPlayEnded(e) {
//     var freesoundID = e.target.freesoundID;

//     if (gSoundInfoByID[freesoundID]) {
//         console.log('ENDED', gSoundInfoByID[freesoundID].name);
//         // turn off timer
//         delete gSoundInfoByID[freesoundID].starttime;
//     } else {
//         console.log('ENDED no sound info?', freesoundID);
//     }

//     // disconnect gain node
//     gBufferSourceByID[freesoundID].myGainNode.disconnect();
//     // remove buffer from global buffer list
//     delete gBufferSourceByID[freesoundID];
//     // notify observers of global buffer list
//     handleBufferSourceListUpdated(freesoundID);

//     // if there's a play-button, mark it as not playing
//     var selectorString = '#play-sound-' + freesoundID;
//     if ($(selectorString)) {
//         $(selectorString).removeAttr('playing');
//     } else {
//         console.log('no play button');
//     }
// }

// Make an XMLHttpRequest for the MP3 preview file, decode the MP3, and save the buffer

// function handleSoundDownloadProgress(event) {
//     var freesoundID = event.target.freesoundID;
//     $('#play-sound-' + freesoundID).attr('loading', 'true');
//     $('span[data-sound-id="' + freesoundID + '"]').text(Math.round(100 * event.loaded / event.total) + '%');
// }

// function handleSoundDownloadDone(event) {
//     var freesoundID = event.target.freesoundID;
//     $('#play-sound-' + freesoundID).removeAttr('loading');

//     var progressIndicator = $('span[data-sound-id="' + freesoundID + '"]');
//     progressIndicator.remove();

//     console.log('about to decode', freesoundID, gSoundInfoByID[freesoundID].name);
//     gAudioContext.decodeAudioData(event.target.response, function(inBuffer) {
//         console.log('decoded', freesoundID, gSoundInfoByID[freesoundID].name);
//         gBufferByID[freesoundID] = inBuffer;
//         $('#play-sound-' + freesoundID).removeAttr('disabled');
//         $('.remove-sound[data-sound-id="'+freesoundID+'"]').removeAttr('disabled');
//         handleBufferListUpdate(freesoundID);
//     }, function (e) {
//         console.log('error handler', e);
//     });
// }

// function downloadBufferForID(inID, url) {
//     console.log('downloadBufferForID', inID, gSoundInfoByID[inID].name);
//     var request = new XMLHttpRequest();
//     request.open('GET', url, true);
//     request.responseType = 'arraybuffer';
//     request.freesoundID = inID;

//     // handle progress events
//     request.addEventListener('progress', handleSoundDownloadProgress);

//     // Decode asynchronously
//     request.onload = handleSoundDownloadDone;

//     request.send();
// }

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

// load the sound info for a given sound ID

// function getInfoAndLoadPreviewByID(inSearchText, inID) {
//     console.log('getInfoAndLoadPreviewByID', inID);
//     freesound.getSound(inID,
//         function(sound) {
//             gSoundInfoByID[inID] = sound;
//             displaySoundInfo(inSearchText, sound);
//             handleSoundInfoUpdate(inID);
//             downloadBufferForID(inID, sound.previews['preview-hq-mp3']);
//         },
//         function(e) {
//             console.log("Sound could not be retrieved", e);
//         }
//     );
// }

// respond to an update in the buffer list by updating the count

function handleBufferListUpdate(inID) {
    var bufferCount = Object.keys(theCollection.bufferByID).length;

    if (theCollection.bufferByID[inID]) {
        console.log('buffer list adding', theCollection.soundInfoByID[inID].name);
        $('#autoplayon').removeAttr('disabled');
    } else {
        console.log('buffer list removing', inID);

        if (bufferCount == 0) {
            $('#autoplayon').attr('disabled', 'true');
        }
    }
}

// respond to an update in the sound info list by updating the count

// function handleSoundInfoUpdate(inID) {
//     if (gSoundInfoByID[inID]) {
//         console.log('sound info adding', gSoundInfoByID[inID].name);
//     } else {
//         console.log('sound info removing', inID);
//     }
// // }

// function handleBufferSourceListUpdated(inID) {
//     if (theCollection.bufferSourceByID[inID]) { 
//         console.log('buffer sources add', theCollection.soundInfoByID[inID].name);
//         $('#playingcontainer').append(gTemplates['buffer-playing'](theCollection.soundInfoByID[inID]));

//         // TODO wire up remove sound button
//         $('.remove-sound[data-sound-id="'+inID+'"]').click(function(event) {
//             console.log('remove-sound', event.target);
//             // stop playing,  remove from arrays, notify observers
//             deleteBufferForID(inID);
//             // remove from table
//             $('#sound-button-row-' + inID).remove();
//         });

//     } else {
//         console.log('buffer sources remove', inID);
//         if ($('div[data-sound-id="' + inID + '"]')) {
//             $('div[data-sound-id="' + inID + '"]').remove();
//         }
//     }
// }

// handle the event handler by starting a Freesound text search

function doSearch(inString) {

    $('#soundcontainer').append(gTemplates['search-results']({term: inString}));

    $('button[data-search-term="' + inString + '"]').click(function(e) {
        var searchTerm = e.target.getAttribute('data-search-term');
        deleteBuffersForSearch(searchTerm);

        // remove whole category
        $('div[data-search="' + inString + '"]').remove();
        delete gSearchHistory[searchTerm];
    });

    console.log('about to search', inString);
    theCollection.search(inString);
    // freesound.textSearch(inString, {},
    //     function(resultsObject) {
    //         for (var index = 0; index < resultsObject.results.length; index++) {
    //             var tempID = resultsObject.results[index].id;
    //             gSearchHistory[inString].push(tempID);
    //             getInfoAndLoadPreviewByID(inString, tempID);
    //         }
    //     }, function(err) {
    //         console.log('textsearch err', err);
    //     }
    // );
}

// function deleteBufferForID(anID) {  
//     console.log('deleteBufferForID', anID);
//     // stop playing
//     if (gBufferSourceByID[anID]) {
//         gBufferSourceByID[anID].stop();
//     }
//     delete gBufferSourceByID[anID];
//     delete gSoundInfoByID[anID];
//     delete gBufferByID[anID];
//     handleBufferSourceListUpdated(anID);
//     handleSoundInfoUpdate(anID);
//     handleBufferListUpdate(anID);
// }

// function deleteBuffersForSearch(inSearchTerm) {
//     var searchHits = gSearchHistory[inSearchTerm];

//     console.log('deleteBuffersForSearch', inSearchTerm, searchHits);

//     for (var index = 0; index < searchHits.length; index++) {
//         var anID = searchHits[index];
//         deleteBufferForID(anID);
//     }
// }

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
