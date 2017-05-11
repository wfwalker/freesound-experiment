import React, { Component } from 'react';


// ----------------------------------------------------------------------------------------


/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*

Usage:
audioNode = createAudioMeter(audioContext,clipLevel,averaging,clipLag);

audioContext: the AudioContext you're using.
clipLevel: the level (0 to 1) that you would consider "clipping".
   Defaults to 0.98.
averaging: how "smoothed" you would like the meter to be over time.
   Should be between 0 and less than 1.  Defaults to 0.95.
clipLag: how long you would like the "clipping" indicator to show
   after clipping has occured, in milliseconds.  Defaults to 750ms.

Access the clipping through node.checkClipping(); use node.shutdown to get rid of it.
*/

function createAudioMeter(audioContext,clipLevel,averaging,clipLag) {
  var processor = audioContext.createScriptProcessor(512);
  processor.onaudioprocess = volumeAudioProcess;
  processor.clipping = false;
  processor.lastClip = 0;
  processor.volume = 0;
  processor.clipLevel = clipLevel || 0.98;
  processor.averaging = averaging || 0.95;
  processor.clipLag = clipLag || 750;

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination);

  processor.checkClipping =
    function(){
      if (!this.clipping)
        return false;
      if ((this.lastClip + this.clipLag) < window.performance.now())
        this.clipping = false;
      return this.clipping;
    };

  processor.shutdown =
    function(){
      this.disconnect();
      this.onaudioprocess = null;
    };

  return processor;
}

function volumeAudioProcess( event ) {
  var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
  var sum = 0;
    var x;

  // Do a root-mean-square on the samples: sum up the squares...
    for (var i=0; i<bufLength; i++) {
      x = buf[i];
      if (Math.abs(x)>=this.clipLevel) {
        this.clipping = true;
        this.lastClip = window.performance.now();
      }
      sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume*this.averaging);
}

// ----------------------------------------------------------------------------------------

class FreesoundPlayer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      bufferSource: null,
      startTime: null
    };
  }

  createDrawFrameForID = (inFreesoundID, inMeter) => {
    let canvasContext = document.getElementById( "meter" + inFreesoundID ).getContext("2d");  
    let WIDTH = 200;
    let HEIGHT = 25;

    return () => {
        // clear the background
        canvasContext.clearRect(0,0,WIDTH,HEIGHT);

        // check if we're currently clipping
        if (inMeter.checkClipping())
            canvasContext.fillStyle = "red";
        else
            canvasContext.fillStyle = "green";

        // draw a bar based on the current volume
        canvasContext.fillRect(0, 0, inMeter.volume*WIDTH*1.4, HEIGHT);

    }
  }

  drawLoop = () => {
    if (this.drawFrame) {
      this.drawFrame();
      window.requestAnimationFrame(this.drawLoop);
    } else {
      console.log('stopping drawloop')
    }
  }

  handleBufferSourceEnded = (event) => {
    console.log('FreesoundPlayer bufferSource ended', event)
    this.setState({
      bufferSource: null,
      startTime: null,
      currentTime: null
    });
    this.props.onPlayEnded(this.props.id);
  }

  componentDidMount = () => {
    console.log('FreesoundPlayer.componentDidMount', this.props);

    let aBufferSource = this.props.audioContext.createBufferSource();
    aBufferSource.buffer = this.props.buffer;
    this.meter = createAudioMeter(this.props.audioContext, this.props.id);
    aBufferSource.connect(this.meter);
    aBufferSource.connect(this.props.audioContext.destination);
    aBufferSource.start();
    let timerID = setInterval(this.handleClock, 1000);   

    this.setState({
      bufferSource: aBufferSource,
      startTime: this.props.audioContext.currentTime,
      currentTime: this.props.audioContext.currentTime,
      timerID: timerID
    });

    this.drawFrame = this.createDrawFrameForID(this.props.id, this.meter);
    this.drawLoop();

    aBufferSource.addEventListener('ended', this.handleBufferSourceEnded);
  }

  handleClock = () => {
    this.setState({
      currentTime: this.props.audioContext.currentTime
    });
  } 

  componentWillUnmount = () => {
    if (this.state.bufferSource) {
      console.log('FreesoundPlayer.componentWillUnmount', this.state.bufferSource);
      this.state.bufferSource.stop();
    } else {
      console.log('FreesoundPlayer.componentWillUnmount already stopped');
    }
    clearInterval(this.state.timerID);
    this.setState({
      bufferSource: null,
      startTime: null,
      currentTime: null,
      timerID: null
    });
    this.drawLoop = null;
  }

  render() {
    return (
      <div className='player'>
        <canvas id={'meter' + this.props.id} width="200" height="25"></canvas>
        PLAY {this.state.currentTime && this.state.bufferSource && (Math.round(this.state.currentTime - this.state.startTime))}s
      </div>);
  }
}

export default FreesoundPlayer;

