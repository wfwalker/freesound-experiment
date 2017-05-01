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
    console.log('SearchForm.handleSubmit', this.state.value);
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
    this.state = { searches: ['wind'] };
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
      bufferSource: null,
      startTime: null
    };
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
  }

  componentDidMount() {
    console.log('FreesoundPlayer.componentDidMount', this.props);
    let aBufferSource = gAudioContext.createBufferSource();
    aBufferSource.buffer = this.props.buffer;
    aBufferSource.connect(gAudioContext.destination);
    aBufferSource.start();
    this.setState({
      bufferSource: aBufferSource,
      startTime: gAudioContext.currentTime
    });

    aBufferSource.addEventListener('ended', function(e) {
      console.log('FreesoundPlayer bufferSource ended', e)
      this.setState({
        bufferSource: null,
        startTime: null
      });
      this.props.onPlayEnded(this.props.id);
    }.bind(this));
  }

  componentWillUnmount() {
    if (this.state.bufferSource) {
      console.log('FreesoundPlayer.componentWillUnmount', this.state.bufferSource);
      this.state.bufferSource.stop();
    } else {
      console.log('FreesoundPlayer.componentWillUnmount already stopped');
    }
  }

  render() {
    return (<div className='player'>PLAY @ T{this.state.bufferSource && (Math.round(this.state.startTime))}s</div>);
  }
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
        gAudioContext.decodeAudioData(event.target.result, function(inBuffer) {
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
        <button data-freesound-id={this.props.data.id} onClick={this.props.handleRemove}>remove</button>
        <button data-freesound-id={this.props.data.id} onClick={this.props.handlePlayToggle}>{this.props.data.buffer && this.props.data.play ? 'stop' : 'start'}</button>

        {this.props.data.buffer && this.props.data.play && <FreesoundPlayer id={this.props.data.id} onPlayEnded={this.props.handlePlayEnded} buffer={this.props.data.buffer} />}

        <FreesoundDescription id={this.props.data.id} name={this.props.data.name} buffer={this.props.data.buffer} details={this.props.data.details} />
      </div>
    )
  }
}

function FreesoundDescription(props) {
  return (
    <div className='description'>
      "{props.name}" {props.buffer && Math.round(props.buffer.duration)}s {props.details && <a target='_blank' href={props.details.previews['preview-hq-mp3']}>mp3</a>}
    </div>
  );
}

class FreesoundList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      currenTime: 0
    };
    this.handleRemove = this.handleRemove.bind(this);
    this.handleDetails = this.handleDetails.bind(this);
    this.handleBuffer = this.handleBuffer.bind(this);
    this.handlePlayToggle = this.handlePlayToggle.bind(this);
    this.handlePlayEnded = this.handlePlayEnded.bind(this);
    this.handleClock = this.handleClock.bind(this);
  }

  componentDidMount() {
    fetch('http://localhost:3001/apiv2/search/text?format=json&query=' + this.props.term + '&filter=duration:[1 TO 90]')
    .then(result=>result.json())
    .then(data=>this.setState({listItems: data.results}))

    setInterval(this.handleClock, 1000);
  }

  handleClock() {
    this.setState({
      currentTime: gAudioContext.currentTime
    });

    let playing = this.state.listItems.filter(li => li.play);
    if (playing.length < 2) {
      let randomIndex = Math.floor(Math.random() * this.state.listItems.length);
      let randomID = this.state.listItems[randomIndex].id;
      console.log('start a new one', randomIndex, randomID);

      this.setState(function(prevState) {
        let temp = prevState.listItems.filter(item => item.id == randomID);
        let others = prevState.listItems.filter(item => item.id != randomID);
        temp[0].play = true;

        return {
          listItems: others.concat(temp)
        }
      })
    }
  }

  componentWillUnmount() {
    console.log('FreesoundList.componentWillUnmount', this.props.term);
    // TODO stop clock
  }

  handleRemove(event) {
    let freesoundID = event.target.getAttribute('data-freesound-id');
    console.log('FreesoundList.handleRemove', freesoundID);
    this.setState(prevState => ({
      listItems: prevState.listItems.filter(item => item.id != freesoundID)
    }));
  }

  handlePlayToggle(event) {
    let freesoundID = event.target.getAttribute('data-freesound-id');
    console.log('FreesoundList.handlePlayToggle', event.target, freesoundID);

    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == freesoundID);
      let others = prevState.listItems.filter(item => item.id != freesoundID);
      temp[0].play = ! temp[0].play;

      return {
        listItems: others.concat(temp)
      }
    })
  }

  handlePlayEnded(inFreesoundID) {
    console.log('FreesoundList.handlePlayEnded', inFreesoundID);

    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == inFreesoundID);
      let others = prevState.listItems.filter(item => item.id != inFreesoundID);
      if (temp.length == 1) {
        temp[0].play = false;
      } else {
        console.log('FreesoundList.handlePlayEnded wrong number of listItem', inFreesoundID, 'found', temp.length);
      }

      return {
        listItems: others.concat(temp)
      }
    })
  }

  handleDetails(data) {
    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == data.id);
      let others = prevState.listItems.filter(item => item.id != data.id);
      temp[0].details = data;

      return {
        listItems: others.concat(temp)
      }
    })
  }

  handleBuffer(data, inBuffer) {
    console.log('FreesoundList.handleBuffer', data, inBuffer);
    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == data.id);
      let others = prevState.listItems.filter(item => item.id != data.id);
      temp[0].buffer = inBuffer;

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
          {this.props.term} 
          ({this.state.listItems.filter(li => li.play).length} / {this.state.listItems.filter(li => li.buffer).length})
          {Math.round(this.state.currentTime)}s
        </h1>

        {this.state.listItems.map(item => <Freesound key={item.id} data={item} handlePlayToggle={this.handlePlayToggle} handlePlayEnded={this.handlePlayEnded} handleBuffer={this.handleBuffer} handleDetails={this.handleDetails} handleRemove={this.handleRemove} />)}
      </div>
    )
  }
}

// ---------------------------------------------------------------------------

class App extends Component {
  render() {
    return (
      <div className="App">
        <FreesoundSearch />
      </div>
    );
  }
}

export default App;
