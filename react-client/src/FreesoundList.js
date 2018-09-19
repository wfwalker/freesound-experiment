import React from 'react';
import Freesound from './Freesound';
import './FreesoundList.css';

const ListTitle = (props) => {
  return (
      <div className='listTitle'>
        <div onClick={props.handleToggle} className='playerButton' style={{float: 'left'}}>
          <i className='material-icons smaller'>{props.expanded ? 'expand_less': 'expand_more'}</i>
        </div>

        {props.title}
        &nbsp;{props.listItems.filter(li => li.play).length}&nbsp;of
        &nbsp;<input type='number' className='numberInput' min='0' max={props.listItems.length} value={props.playCount} onChange={props.handlePlayCountChange} />

        <div>{props.status}</div>

        <div style={{flexGrow: 1}}></div>

        <div className='playerButton' data-freesound-search={props.title} onClick={props.onRemoveSearch} style={{float: 'right'}}>
          <i className='material-icons smaller'>delete</i>
        </div>
      </div>
    )
}

class FreesoundList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      currentTime: 0,
      playCount: 2,
      expanded: false,
      status: 'initialized'
    };
  }

  sortByID = (s1, s2) => (
    s1.id - s2.id
  )

  handleFetchErrors = (response) => {
    if (! response.ok) {
      alert(response.statusText);
      throw Error(response.statusText);
    }

    return response;
  }

  loadAndDecodeBuffer(data) {
    console.log('FreesoundList.loadAndDecodeBuffer start loading', data.name);
    this.setState({
      status: 'loading ' + data.name
    })
    fetch(data.previews['preview-hq-mp3'])
    .then(result => result.blob())
    .then(function(blob) {
      console.log('FreesoundList.loadAndDecodeBuffer done loading', data.name, 'got blob', blob);
      let reader = new FileReader();

      reader.onload = function(event) {
        console.log('FreesoundList.loadAndDecodeBuffer', data.name, 'file read blob', event.target.result);
        this.props.audioContext.decodeAudioData(event.target.result, function(inBuffer) {
          this.handleBuffer(data, inBuffer);
        }.bind(this), function(inError) {
          console.log('FreesoundList.loadAndDecodeBuffer', data.name, 'error', data.id, inError);
        });
      }.bind(this);

      reader.readAsArrayBuffer(blob);
    }.bind(this));
  }

  componentDidMount = () => {
    console.log('FreesoundList.componentDidMount', this.props.term);
    this.setState({
      status: 'mounted'
    })
    let timerID = setInterval(this.handleClock, 1000);

    this.setState({
      timerID: timerID
    });

    fetch(this.props.queryURL)
    .then(this.handleFetchErrors)
    .then(result=>result.json())
    .then(data=> {
      data.results.forEach(dataItem => this.loadAndDecodeBuffer(dataItem))
      this.setState({
        listItems: data.results,
        status: 'list of ' + data.results.length
      })
    })
  }

  handleClock = () => {
    if (this.state.listItems.length == 0) {
      return;
    }

    let playing = this.state.listItems.filter(li => li.play);

    if (playing.length < this.state.playCount) {
      let randomIndex = Math.floor(Math.random() * this.state.listItems.length);
      let randomID = this.state.listItems[randomIndex].id;
      console.log('FreesoundList.handleClock starting another sound', randomIndex, randomID);
      this.setState({
        status: 'starting new'
      })

      this.setState(function(prevState) {
        let temp = prevState.listItems.filter(item => item.id == randomID);
        let others = prevState.listItems.filter(item => item.id != randomID);
        temp[0].play = true;

        return {
          listItems: others.concat(temp).sort(this.sortByID)
        }
      })
    }
  } 

  componentWillUnmount = () => {
    console.log('FreesoundList.componentWillUnmount', this.props.term);
    clearInterval(this.state.timerID);
  }

  handleRemove = (event) => {
    let freesoundID = event.target.parentElement.getAttribute('data-freesound-id');
    console.log('FreesoundList.handleRemove', freesoundID);
    this.setState(prevState => ({
      listItems: prevState.listItems.filter(item => item.id != freesoundID).sort(this.sortByID)
    }));
  }

  handlePlayToggle = (event) => {
    let freesoundID = event.target.parentElement.getAttribute('data-freesound-id');
    console.log('FreesoundList.handlePlayToggle', event.target.parentElement, freesoundID);

    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == freesoundID);
      let others = prevState.listItems.filter(item => item.id != freesoundID);
      temp[0].play = ! temp[0].play;

      return {
        listItems: others.concat(temp).sort(this.sortByID)
      }
    })
  }

  handlePlayEnded = (inFreesoundID) => {
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
        listItems: others.concat(temp).sort(this.sortByID)
      }
    })
  }

  handlePlayCountChange = (event) => {
    this.setState({playCount: event.target.value});
    console.log('Freesound.handlePlayCountChange', this.props.term, 'count', this.state.playCount);
  }

  handleToggle = (event) => {
    console.log('FreesoundList.handleToggle', this.props.term);
    this.setState({expanded: !this.state.expanded});
  }

  handleBuffer = (data, inBuffer) => {
    console.log('FreesoundList.handleBuffer', data, inBuffer);
    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == data.id);
      let others = prevState.listItems.filter(item => item.id != data.id);
      temp[0].buffer = inBuffer;

      return {
        listItems: others.concat(temp).sort(this.sortByID),
        status: ''
      }
    })
  }

  createFreesound = (item) => (
    <Freesound
      allowPlayer={true}
      currentTime={this.state.currentTime}
      key={item.id} data={item}
      handlePlayToggle={this.handlePlayToggle}
      handlePlayEnded={this.handlePlayEnded}
      handleBuffer={this.handleBuffer}
      handleDetails={this.handleDetails}
      handleRemove={this.handleRemove}
      audioContext={this.props.audioContext}
    />
  )

  // TODO: fix duplication!
  durationFormat = (num) => (
    Math.round(num).toString().padStart(2, '0')
  )

  createFreesoundNoPlayer = (item) => {
    let classNames = ['freesound-summary'];
  
    if (item.play) {
      classNames.push('freesound-summary-playing');
    } else if (item.buffer) {
      classNames.push('freesound-summary-ready')
    } else {
      classNames.push('freesound-summary-loading');
    }

    return (
      <div key={item.id}  className={classNames.join(' ')}>
        <div className='playerButton' data-freesound-id={item.id} onClick={this.handlePlayToggle}>
          <i className='material-icons smaller'>{item.play ? 'stop' : 'play_arrow'}</i>
        </div>

        <div className='timeLabel'>{this.durationFormat(item.duration)}s</div>

        <img alt='waveform' height='20px' width='33px' className='waveform' src={item.images.waveform_m} />

        <a target='_blank' href={item.previews['preview-hq-mp3']}>
          <div className='soundnameLabel'>{item.name}</div>
        </a>

        <div style={{flexGrow: 1}} />

        <div className='playerButton' data-freesound-id={item.id} onClick={this.handleRemove}>
          <i className='material-icons smaller'>delete</i>
        </div>
      </div>
    )
  }

  createFreesoundNoPlayers = (items) => {
    return (
      <div className='list'>
        {items.map(this.createFreesoundNoPlayer)}
      </div>
    )
  }

  render() {
    return (
      <div className='searchContainer'>
        <ListTitle handleToggle={this.handleToggle} playCount={this.state.playCount} handlePlayCountChange={this.handlePlayCountChange} listItems={this.state.listItems} expanded={this.state.expanded} status={this.state.status} title={this.props.title} onRemoveSearch={this.props.onRemoveSearch} />
        <div className='list playing'>
          {this.state.listItems.filter(li => li.play).map(this.createFreesound)}
        </div>
        {this.state.expanded && this.createFreesoundNoPlayers(this.state.listItems)}
      </div>
    )
  }
}

export default FreesoundList;
