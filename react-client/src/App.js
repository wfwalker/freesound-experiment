import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();

// --------------------------------------------------------------------- //

class Toggle extends React.Component {
  constructor(props) {
    super(props)

    this.state = {isToggleOn: true};
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState(prevState => ({
      isToggleOn: !prevState.isToggleOn
    }));
    this.props.onStateChange(this.state.isToggleOn);
  }

  render() {
    return (
      <button onClick={this.handleClick} disabled={this.props.disabled} >
        {this.state.isToggleOn ? (
          <span>ON</span>
        ) : (
          <span>OFF</span>
        )}
      </button>
    )
  }
}

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    console.log('A name was submitted: ' + this.state.value);
    event.preventDefault();
    this.props.onSubmit(this.state.value);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {date: new Date()};
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      date: new Date()
    });
  }

  render() {
    return (
      <h2>{this.state.date.toLocaleString()}</h2>
    );
  }
}

// ----------------------------------------- LIFTED STATE ------------------------------- //

class FreesoundSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = { searches: ['surf'] };
    this.searchFreesound = this.searchFreesound.bind(this);
    this.handleRemoveSearch = this.handleRemoveSearch.bind(this);
  }

  searchFreesound(inTerm) {
    this.setState(function(prevState) {
      return {
        searches: prevState.searches.concat([inTerm])
      };
    });
  }

  handleRemoveSearch(event) {
    let aSearchTerm = event.target.getAttribute('data-freesound-search');
    this.setState(function(prevState) {
      return {
        searches: prevState.searches.filter(item => (item != aSearchTerm))
      }
    })
  }

  render() {
    return (
      <div>
        <NameForm onSubmit={this.searchFreesound} />
        <h1>{this.state.searches.length} searches</h1>
        {this.state.searches.map(aSearch => <FreesoundList onRemoveSearch={this.handleRemoveSearch} key={aSearch} term={aSearch} />)}
      </div>
    )
  }
}

class AudioBufferLoader extends React.Component {
  constructor(props) {
    super(props);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.bufferDecoded = this.bufferDecoded.bind(this);
  }

  bufferDecoded(buffer) {
    console.log('decoded', buffer);
    this.props.onBufferDecoded(buffer);
  }

  bufferError(error) {
    console.log('error', error);
  }

  componentDidMount() {
    fetch(this.props.data['preview-hq-mp3'])
    .then(result => result.blob())
    .then(function(blob) {
      let reader = new FileReader();

      reader.onload = function(event) {
        console.log('file read blob', event.target.result);
        gAudioContext.decodeAudioData(event.target.result, this.bufferDecoded, this.bufferError);
      }.bind(this);

      reader.readAsArrayBuffer(blob);
    }.bind(this));
  }

  componentWillUnmount() {
  }

  render() {
    return (<span>LOADER</span>)
  }
}

class Freesound extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      details: {},
      bufferSource: null
    };
    this.onBufferDecoded = this.onBufferDecoded.bind(this);
    this.playButtonChanged = this.playButtonChanged.bind(this);
  }

  componentDidMount() {
    fetch('http://localhost:3001/apiv2/sounds/' + this.props.data.id + '?format=json')
    .then(result=>result.json())
    .then(data=>this.setState({details: data}))
  }

  componentWillUnmount() {
    console.log('sound unmount', this.props.data.id);
  }

  onBufferDecoded(buffer) {
    console.log('onBufferDecoded', buffer);
    this.setState({ buffer: buffer });
  }

  playButtonChanged(value) {
    console.log('play button changed', value);

    if (value) {
      let aBufferSource = gAudioContext.createBufferSource();
      aBufferSource.buffer = this.state.buffer;
      aBufferSource.connect(gAudioContext.destination);
      aBufferSource.start();
      this.setState({ bufferSource: aBufferSource });

      aBufferSource.addEventListener('ended', function(e) {
        console.log('buffer ended', e)
      }.bind(this));

    } else if (this.state.bufferSource) {
      this.state.bufferSource.stop();
      this.setState({ bufferSource: null });
    }
  }

  render() {
    return (
      <li key={this.props.data.id}>
        Sound "{this.props.data.name}" (#{this.props.data.id})
        {this.state.details.previews && (! this.state.buffer) && (<AudioBufferLoader onBufferDecoded={this.onBufferDecoded} data={this.state.details.previews} />)}
        <span>
          <Toggle onStateChange={this.playButtonChanged} disabled={! this.state.buffer} /> 
          {this.state.buffer && Math.round(this.state.buffer.duration)}s
        </span>
        <button data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>remove</button>
      </li>
    )
  }
}

class FreesoundList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {listItems: []};
    this.handleRemove = this.handleRemove.bind(this);
  }

  componentDidMount() {
    fetch('http://localhost:3001/apiv2/search/text?format=json&query=' + this.props.term + '&filter=duration:[1 TO 90]')
    .then(result=>result.json())
    .then(data=>this.setState({listItems: data.results}))
  }

  componentWillUnmount() {
    console.log('freesound list unmount', this.props.term);
  }

  handleRemove(event) {
    let freesoundID = event.target.getAttribute('data-freesound-id');
    console.log('handleRemove', freesoundID);
    this.setState(prevState => ({
      listItems: prevState.listItems.filter(item => item.id != freesoundID)
    }));
  }

  render() {
    return (
      <div>
        <h1>{this.props.term}, {this.state.listItems.length} items <button data-freesound-search={this.props.term} onClick={this.props.onRemoveSearch}>remove</button></h1>
        <ul>
          {this.state.listItems.map(item => <Freesound key={item.id} data={item} handleRemove={this.handleRemove} />)}
        </ul>
      </div>
    )
  }
}

// ---------------------------------------------------------------------------

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <Clock />
        </div>

        <FreesoundSearch />
      </div>
    );
  }
}

export default App;
