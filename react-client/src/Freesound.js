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
          <span className='playerButton' data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>
            <i className='material-icons smaller'>delete</i>
          </span>
          <span className='playerButton' data-freesound-id={this.props.data.id} onClick={this.props.handlePlayToggle}>
            <i className='material-icons smaller'>{this.props.data.play ? 'stop' : 'play_arrow'}</i>
          </span>

          <div>{Math.round(this.props.data.duration)}s</div>

          <img alt='waveform' height='20px' width='33px' className='waveform' src={this.props.data.images.waveform_m} />

          <a target='_blank' href={this.props.data.previews['preview-hq-mp3']}>
            <div className='soundnameLabel'>{this.props.data.name}</div>
          </a>
        </div>

        {this.props.allowPlayer && this.props.data.buffer && this.props.data.play && this.createPlayer()}
      </div>
    )
  }
}

export default Freesound;
