import React, { Component } from 'react';

class FreesoundPlayer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      bufferSource: null,
      startTime: null
    };
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
    aBufferSource.connect(this.props.audioContext.destination);
    aBufferSource.start();
    let timerID = setInterval(this.handleClock, 1000);   

    this.setState({
      bufferSource: aBufferSource,
      startTime: this.props.audioContext.currentTime,
      currentTime: this.props.audioContext.currentTime,
      timerID: timerID
    });

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
  }

  render() {
    return (<div className='player'>PLAY {this.state.currentTime && this.state.bufferSource && (Math.round(this.state.currentTime - this.state.startTime))}s</div>);
  }
}

export default FreesoundPlayer;

