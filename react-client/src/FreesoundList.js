import React, { Component } from 'react';
import Freesound from './Freesound';
import './FreesoundList.css';

class FreesoundList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      currenTime: 0,
      playCount: 2,
      expanded: false
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

  componentDidMount = () => {
    let timerID = setInterval(this.handleClock, 1000);

    this.setState({
      timerID: timerID
    });

    fetch(this.props.queryURL)
    .then(this.handleFetchErrors)
    .then(result=>result.json())
    .then(data=>this.setState({listItems: data.results}))
  }

  handleClock = () => {
    if (this.state.listItems.length == 0) {
      return;
    }

    let playing = this.state.listItems.filter(li => li.play);

    if (playing.length < this.state.playCount) {
      let randomIndex = Math.floor(Math.random() * this.state.listItems.length);
      let randomID = this.state.listItems[randomIndex].id;
      console.log('start a new one', randomIndex, randomID);

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
    console.log('count', this.state.playCount);
    // TODO: set min-height of "playing" to 32 * count
  }

  handleToggle = (event) => {
    this.setState({expanded: !this.state.expanded});
  }

  handleBuffer = (data, inBuffer) => {
    console.log('FreesoundList.handleBuffer', data, inBuffer);
    this.setState(function(prevState) {
      let temp = prevState.listItems.filter(item => item.id == data.id);
      let others = prevState.listItems.filter(item => item.id != data.id);
      temp[0].buffer = inBuffer;

      return {
        listItems: others.concat(temp).sort(this.sortByID)
      }
    })
  }

  createFreesound = (item) => (
    <Freesound
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

  createListTitle = () => (
    <div className='listTitle'>
      <span className='playerButton' data-freesound-search={this.props.title} onClick={this.props.onRemoveSearch}>
        <i className='material-icons'>delete</i>
      </span>

      {this.props.title}
      &nbsp;<input type='number' min='0' max={this.state.listItems.length} value={this.state.playCount} onChange={this.handlePlayCountChange} />
      &nbsp;{this.state.listItems.filter(li => li.play).length}
      <span onClick={this.handleToggle} style={{float: 'right'}}>
        <i className='material-icons'>{this.state.expanded ? 'expand_less': 'expand_more'}</i>
      </span>
    </div>
  )

  render() {
    return (
      <div className='list'>
        {this.createListTitle()}
        <div className='playing' style={{minHeight: (this.state.playCount * 32) + 'px'}}>
          {this.state.listItems.filter(li => li.play).map(this.createFreesound)}
        </div>
        {this.state.expanded && this.state.listItems.filter(li => !li.play).map(this.createFreesound)}
      </div>
    )
  }
}

export default FreesoundList;
