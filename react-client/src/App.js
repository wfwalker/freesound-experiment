import React, { Component } from 'react'
import logo from './logo.svg'
import './App.css'
import FreesoundSearch from './FreesoundSearch'

window.AudioContext = window.AudioContext || window.webkitAudioContext
var gAudioContext = new AudioContext()

// ---------------------------------------------------------------------------

class App extends Component {
  render () {
    return (
      <div className="App">
	    <div className='logotype'><img src='/tapereel.png' width='24px' height='24px' />Freesound Musique Concrete</div>
        <FreesoundSearch audioContext={gAudioContext} />
      </div>
    )
  }
}

export default App
