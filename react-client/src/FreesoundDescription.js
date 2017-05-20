import React, { Component } from 'react';

function FreesoundDescription(props) {
  return (
    <div className='description'>
      <img alt='waveform' height='20px' width='33px' src={props.data.images.waveform_m} />
      <a target='_blank' href={props.data.previews['preview-hq-mp3']}>
        <span className='timeLabel'>{Math.round(props.data.duration)}s</span>
      </a>
      <a target='_blank' href={props.data.url}>
        {props.data.name}
      </a>
    </div>
  );
}

export default FreesoundDescription;