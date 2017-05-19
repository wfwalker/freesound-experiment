import React, { Component } from 'react';
import { createAudioMeter, volumeAudioProcess} from './volume-meter.js';

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
    let HEIGHT = 15;

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

  handlePlaybackRate = (event) => {
    this.state.bufferSource.playbackRate.value = event.target.value;
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
        <i className='material-icons'>import_export</i>
        <input type='range' min='0.1' max='2.0' step='0.01' onChange={this.handlePlaybackRate}></input>
        <canvas className='meter' id={'meter' + this.props.id} width="200" height="15"></canvas>
        <span className='timeLabel'>{this.state.currentTime && this.state.bufferSource && (Math.round(this.state.currentTime - this.state.startTime))}s</span>
      </div>);
  }
}

export default FreesoundPlayer;

