import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();

// --------------------------------------------------------------------- //

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

class FreesoundPlayer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      bufferSource: null
    };
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }

  componentDidMount() {
    let aBufferSource = gAudioContext.createBufferSource();
    aBufferSource.buffer = this.props.buffer;
    aBufferSource.connect(gAudioContext.destination);
    aBufferSource.start();
    this.setState({ bufferSource: aBufferSource });

    aBufferSource.addEventListener('ended', function(e) {
      console.log('buffer ended', e)
      this.setState({ bufferSource: null });
      // this.props.onPlayEnded();
    }.bind(this));
  }

  componentWillUnmount() {
    if (this.state.bufferSource) {
      console.log('stopping', this.state.bufferSource);
      this.state.bufferSource.stop();
    } else {
      console.log('already stopped');
    }
  }

  render() {
    return (<span>PLAYAH {this.state.bufferSource && ('ing')}</span>);
  }
}

class Freesound extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      details: {},
      play: false
    };
    this.bufferDecoded = this.bufferDecoded.bind(this);
    this.bufferError = this.bufferError.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.loadAndDecodeBuffer = this.loadAndDecodeBuffer.bind(this);
    this.handlePlayToggle = this.handlePlayToggle.bind(this);
  }

  handlePlayToggle() {
    console.log('handlePlayToggle', this.state.play);
    this.setState(prevState => ({
      play: ! prevState.play
    }))
  }

  componentDidMount() {
    fetch('http://localhost:3001/apiv2/sounds/' + this.props.data.id + '?format=json')
    .then(result=>result.json())
    .then(function(data) {
      console.log('details', data);
      this.loadAndDecodeBuffer(data.previews);
      this.setState({details: data});
    }.bind(this));
  }

  componentWillUnmount() {
    console.log('sound unmount', this.props.data.id);
  }

  loadAndDecodeBuffer(previews) {
    fetch(previews['preview-hq-mp3'])
    .then(result => result.blob())
    .then(function(blob) {
      console.log('blob', blob);
      let reader = new FileReader();

      reader.onload = function(event) {
        console.log('file read blob', event.target.result);
        gAudioContext.decodeAudioData(event.target.result, this.bufferDecoded, this.bufferError);
      }.bind(this);

      reader.readAsArrayBuffer(blob);
    }.bind(this));
  }

  bufferDecoded(buffer) {
    console.log('onBufferDecoded', buffer);
    this.setState({ buffer: buffer });
  }

  bufferError(error) {
    console.log('error', error);
  }

  render() {
    return (
      <tr key={this.props.data.id}>
        <td><button data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>remove</button></td>
        <td>Sound "{this.props.data.name}" (#{this.props.data.id})</td>
        <td>
          {this.state.buffer && Math.round(this.state.buffer.duration)}s
        </td>
        <td><button onClick={this.handlePlayToggle}>toggle</button></td>
        <td>{this.state.buffer && this.state.play && <FreesoundPlayer buffer={this.state.buffer} />}</td>
        <td>{this.state.details.previews && <a target='_blank' href={this.state.details.previews['preview-hq-mp3']}>download</a>}</td>
      </tr>
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
        <h1>
          {this.props.term}, {this.state.listItems.length} items
          <button data-freesound-search={this.props.term} onClick={this.props.onRemoveSearch}>remove</button>
        </h1>
        <table>
          <tbody>
            {this.state.listItems.map(item => <Freesound key={item.id} data={item} handleRemove={this.handleRemove} />)}
          </tbody>
        </table>
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
        </div>

        <FreesoundSearch />
      </div>
    );
  }
}

export default App;
