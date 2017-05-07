import React, { Component } from 'react';
import FreesoundPlayer from './FreesoundPlayer';

function FreesoundDescription(props) {
  return (
    <div className='description'>
      "{props.name}" {props.buffer && Math.round(props.buffer.duration)}s {props.details && <a target='_blank' href={props.details.previews['preview-hq-mp3']}>mp3</a>}
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
    fetch('http://localhost:3001/apiv2/sounds/' + this.props.data.id + '?format=json')
    .then(result=>result.json())
    .then(function(data) {
      console.log('Freesound.componentDidMount fetched', data);
      this.loadAndDecodeBuffer(data);
      this.props.handleDetails(data);
    }.bind(this));
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

  render() {
    return (
      <div key={this.props.data.id} className='freesound'>
        <button data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>-</button>
        <button data-freesound-id={this.props.data.id} onClick={this.props.handlePlayToggle}>{this.props.data.buffer && this.props.data.play ? 'stop' : 'start'}</button>

        {this.props.data.buffer && this.props.data.play && <FreesoundPlayer audioContext={this.props.audioContext} id={this.props.data.id} onPlayEnded={this.props.handlePlayEnded} buffer={this.props.data.buffer} />}

        <FreesoundDescription id={this.props.data.id} name={this.props.data.name} buffer={this.props.data.buffer} details={this.props.data.details} />
      </div>
    )
  }
}

export default Freesound;
