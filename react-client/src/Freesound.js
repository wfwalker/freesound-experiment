import React, { Component } from 'react';
import FreesoundPlayer from './FreesoundPlayer';
import FreesoundDescription from './FreesoundDescription';
import './Freesound.css';

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
    console.log('Freesound.loadAndDecodeBuffer start loading', data.name);
    fetch(data.previews['preview-hq-mp3'])
    .then(result => result.blob())
    .then(function(blob) {
      console.log('Freesound.loadAndDecodeBuffer done loading', data.name, 'got blob', blob);
      let reader = new FileReader();

      reader.onload = function(event) {
        console.log('Freesound.loadAndDecodeBuffer', data.name, 'file read blob', event.target.result);
        this.props.audioContext.decodeAudioData(event.target.result, function(inBuffer) {
          this.props.handleBuffer(data, inBuffer);
        }.bind(this), function(inError) {
          console.log('Freesound.loadAndDecodeBuffer', data.name, 'error', data.id, inError);
        });
      }.bind(this);

      reader.readAsArrayBuffer(blob);
    }.bind(this));
  }

  createPlayer = () => (
    <FreesoundPlayer
      audioContext={this.props.audioContext}
      id={this.props.data.id}
      duration={this.props.data.duration}
      waveform={this.props.data.images.waveform_m}
      onPlayEnded={this.props.handlePlayEnded}
      buffer={this.props.data.buffer} />
  )

  render() {
    let classNames = ['freesound'];
  
    if (this.props.data.play) {
      classNames.push('freesound-playing');
    } else if (this.props.data.buffer) {
      classNames.push('freesound-ready')
    } else {
      classNames.push('freesound-loading');
    }

    return (
      <div key={this.props.data.id} className={classNames.join(' ')}>
        <div className='playerTopLine'>
          <div className='playerButton' data-freesound-id={this.props.data.id} onClick={this.props.handlePlayToggle}>
            <i className='material-icons smaller'>{this.props.data.play ? 'stop' : 'play_arrow'}</i>
          </div>

          <a target='_blank' href={this.props.data.previews['preview-hq-mp3']}>
            <div className='soundnameLabel'>{this.props.data.name}</div>
          </a>

          <div style={{flexGrow: 1}}></div>

          <div className='playerButton' data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>
            <i className='material-icons smaller'>delete</i>
          </div>
        </div>

        {this.props.allowPlayer && this.props.data.buffer && this.props.data.play && this.createPlayer()}
      </div>
    )
  }
}

export default Freesound;
