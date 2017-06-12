import React, { Component } from 'react';
import './FreesoundDescription.css';

function FreesoundDescription(props) {
  return (
    <div className='description'>
      <img alt='waveform' height='20px' width='33px' src={props.data.images.waveform_m} />
      <a target='_blank' href={props.data.previews['preview-hq-mp3']}>
        <div className='timeLabel'>{Math.round(props.data.duration)}s</div>
      </a>
      <a target='_blank' href={props.data.url}>
        <div className='soundnameLabel'>{props.data.name}</div>
      </a>
    </div>
  );
}

export default FreesoundDescription;