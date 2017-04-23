import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();

// --------------------------------------------------------------------- //

class SearchForm extends React.Component {
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
    console.log('Search', this.state.value);
    event.preventDefault();
    this.props.onSubmit(this.state.value);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Search:
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
        <SearchForm onSubmit={this.searchFreesound} />
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
    console.log('FreesoundPlayer componentDidMount', this.props);
    let aBufferSource = gAudioContext.createBufferSource();
    aBufferSource.buffer = this.props.buffer;
    aBufferSource.connect(gAudioContext.destination);
    aBufferSource.start();
    this.setState({ bufferSource: aBufferSource });

    aBufferSource.addEventListener('ended', function(e) {
      console.log('buffer ended', e)
      this.setState({ bufferSource: null });
      this.props.onPlayEnded();
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
      play: false
    };
    this.componentDidMount = this.componentDidMount.bind(this);
    this.loadAndDecodeBuffer = this.loadAndDecodeBuffer.bind(this);
    this.handlePlayToggle = this.handlePlayToggle.bind(this);
    this.handlePlayEnded = this.handlePlayEnded.bind(this);
  }

  handlePlayToggle() {
    console.log('handlePlayToggle', this.state.play);
    this.setState(prevState => ({
      play: ! prevState.play
    }));
  }

  handlePlayEnded() {
    console.log('handlePlayEnded', this.state.play);
    this.setState({
      play: false
    });
  }

  componentDidMount() {
    fetch('http://localhost:3001/apiv2/sounds/' + this.props.data.id + '?format=json')
    .then(result=>result.json())
    .then(function(data) {
      console.log('fetched details', data);
      this.loadAndDecodeBuffer(data);
      this.props.handleDetails(data);
    }.bind(this));
  }

  componentWillUnmount() {
    console.log('sound unmount', this.props.data.id);
  }

  loadAndDecodeBuffer(data) {
    fetch(data.previews['preview-hq-mp3'])
    .then(result => result.blob())
    .then(function(blob) {
      console.log('blob', blob);
      let reader = new FileReader();

      reader.onload = function(event) {
        console.log('file read blob', event.target.result);
        gAudioContext.decodeAudioData(event.target.result, function(inBuffer) {
          this.props.handleBuffer(data, inBuffer);
        }.bind(this), function(inError) {
          console.log('error', data.id, inError);
        });
      }.bind(this);

      reader.readAsArrayBuffer(blob);
    }.bind(this));
  }

  render() {
    return (
      <tr key={this.props.data.id}>
        <td><button data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>remove</button></td>
        <td>Sound "{this.props.data.name}" (#{this.props.data.id})</td>
        <td>
          {this.props.data.buffer && Math.round(this.props.data.buffer.duration)}s
        </td>
        <td><button onClick={this.handlePlayToggle}>toggle</button></td>
        <td>{this.props.data.buffer && this.state.play && <FreesoundPlayer onPlayEnded={this.handlePlayEnded} buffer={this.props.data.buffer} />}</td>
        <td>{this.props.data.details && <a target='_blank' href={this.props.data.details.previews['preview-hq-mp3']}>download</a>}</td>
      </tr>
    )
  }
}

class FreesoundList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {listItems: []};
    this.handleRemove = this.handleRemove.bind(this);
    this.handleDetails = this.handleDetails.bind(this);
    this.handleBuffer = this.handleBuffer.bind(this);
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

  handleDetails(data) {
    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == data.id);
      let others = prevState.listItems.filter(item => item.id != data.id);
      temp[0].details = data;
      console.log('temp', temp, 'others', others.length);
      return {
        listItems: others.concat(temp)
      }
    })
  }

  handleBuffer(data, inBuffer) {
    console.log('handleBuffer', data, inBuffer);
    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == data.id);
      let others = prevState.listItems.filter(item => item.id != data.id);
      temp[0].buffer = inBuffer;
      console.log('added buffer', temp);
      return {
        listItems: others.concat(temp)
      }
    })
  }

  render() {
    return (
      <div>
        <h1>
          <button data-freesound-search={this.props.term} onClick={this.props.onRemoveSearch}>remove</button>
          {this.props.term},
          {this.state.listItems.length} items, 
          {this.state.listItems.filter(li => li.details).length} details, 
          {this.state.listItems.filter(li => li.buffer).length} buffers
        </h1>
        <table>
          <thead>
            <tr>
              <th>remove</th>
              <th>title</th>
              <th>duration</th>
              <th>toggle</th>
              <th>player</th>
              <th>download</th>
            </tr>
          </thead>
          <tbody>
            {this.state.listItems.map(item => <Freesound key={item.id} data={item} handleBuffer={this.handleBuffer} handleDetails={this.handleDetails} handleRemove={this.handleRemove} />)}
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
