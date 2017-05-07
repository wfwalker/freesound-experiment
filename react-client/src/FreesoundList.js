import React, { Component } from 'react';
import Freesound from './Freesound';

class FreesoundList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      listItems: [],
      currenTime: 0,
      playCount: 2
    };
    this.handleRemove = this.handleRemove.bind(this);
    this.handleDetails = this.handleDetails.bind(this);
    this.handleBuffer = this.handleBuffer.bind(this);
    this.handlePlayToggle = this.handlePlayToggle.bind(this);
    this.handlePlayEnded = this.handlePlayEnded.bind(this);
    this.handleClock = this.handleClock.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    let timerID = setInterval(this.handleClock);
    this.setState({
      timerID: timerID
    });

    fetch('http://localhost:3001/apiv2/search/text?format=json&query=' + this.props.term + '&filter=duration:[1 TO 90]')
    .then(result=>result.json())
    .then(data=>this.setState({listItems: data.results}))
  }

  handleClock() {
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
          listItems: others.concat(temp)
        }
      })
    }
  } 

  componentWillUnmount() {
    console.log('FreesoundList.componentWillUnmount', this.props.term);
    clearInterval(this.state.timerID);
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

  handleChange(event) {
    this.setState({playCount: event.target.value});
    console.log('count', this.state.playCount);
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

  createFreesounds = () => (
    this.state.listItems.map(this.createFreesound)
  )

  createListTitle = () => (
    <div className='listTitle'>
      <button data-freesound-search={this.props.term} onClick={this.props.onRemoveSearch}>-</button>&nbsp;
      {this.props.term}
      <input type='number' min='0' max={this.state.listItems.length} value={this.state.playCount} onChange={this.handleChange} />
      &nbsp;{this.state.listItems.filter(li => li.play).length}
    </div>
  )

  render() {
    return (
      <div className='list'>
        {this.createListTitle()}
        {this.createFreesounds()}
      </div>
    )
  }
}

export default FreesoundList;
