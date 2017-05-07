import React, { Component } from 'react';
import FreesoundPlayer from './FreesoundPlayer';

function FreesoundDescription(props) {
  return (
    <div className='description'>
      "{props.data.name}" {Math.round(props.data.duration)}s <a target='_blank' href={props.data.previews['preview-hq-mp3']}>mp3</a>
    </div>
  );
}

class Freesound extends React.Component {
  constructor(props) {
    super(props);

    this.componentDidMount = this.componentDidMount.bind(this);
    this.loadAndDecodeBuffer = this.loadAndDecodeBuffer.bind(this);
  }

  componentDidMount() {
    console.log('Freesound.componentDidMount', this.props.data.id);
    this.loadAndDecodeBuffer(this.props.data);
  }

  componentWillUnmount() {
    console.log('Freesound.componentWillUnmount', this.props.data.id);
  }

  loadAndDecodeBuffer(data) {
    fetch(data.previews['preview-hq-mp3'])
    .then(result => result.blob())
    .then(function(blob) {
      console.log('Freesound.loadAndDecodeBuffer blob', blob);
      let reader = new FileReader();

      reader.onload = function(event) {
        console.log('Freesound.loadAndDecodeBuffer file read blob', event.target.result);
        this.props.audioContext.decodeAudioData(event.target.result, function(inBuffer) {
          this.props.handleBuffer(data, inBuffer);
        }.bind(this), function(inError) {
          console.log('Freesound.loadAndDecodeBuffer error', data.id, inError);
        });
      }.bind(this);

      reader.readAsArrayBuffer(blob);
    }.bind(this));
  }

  createPlayer = () => (
    <FreesoundPlayer
      audioContext={this.props.audioContext}
      id={this.props.data.id}
      onPlayEnded={this.props.handlePlayEnded}
      buffer={this.props.data.buffer} />
  )

  render() {
    return (
      <div key={this.props.data.id} className='freesound'>
        <button data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>-</button>
        <button data-freesound-id={this.props.data.id} onClick={this.props.handlePlayToggle}>{this.props.data.buffer && this.props.data.play ? 'stop' : 'start'}</button>

        <FreesoundDescription data={this.props.data} />

        {this.props.data.buffer && this.props.data.play && this.createPlayer()}
      </div>
    )
  }
}

export default Freesound;
