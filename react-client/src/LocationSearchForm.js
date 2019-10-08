import React, { Component } from 'react';
import './SearchForm.css';

class LocationSearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {lat: '', long: ''};

    this.handleLatChange = this.handleLatChange.bind(this);
    this.handleLongChange = this.handleLongChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleLatChange(event) {
    this.setState({lat: event.target.value});
  }

  handleLongChange(event) {
    this.setState({long: event.target.value});
  }

  handleSubmit(event) {
    console.log('LocationSearchForm.handleSubmit', this.state.lat, ', ', this.state.long);
    event.preventDefault();
    this.props.onSubmit([this.state.lat, this.state.long]);
    this.setState({lat: '', long: ''});
  }

  handleSelectChange(event) {
    console.log('handleSelectChange', event.target.selectedOptions[0].getAttribute('data-lat'), event.target.selectedOptions[0].getAttribute('data-long'));
    this.setState({
      lat: event.target.selectedOptions[0].getAttribute('data-lat'),
      long: event.target.selectedOptions[0].getAttribute('data-long')
    })
  }

  render() {
    return (
      <div>
        <form className='searchForm' onSubmit={this.handleSubmit}>
          <span className='playerButton' data-freesound-search={this.props.title} onClick={this.handleSubmit}>
            <i className='material-icons smaller'>search</i>
          </span>
          <input className='searchTermText' type="text" size='10' value={this.state.lat} placeholder='37.3541' onChange={this.handleLatChange} />
          <input className='searchTermText' type="text" size='10' value={this.state.long} placeholder='-121.9552' onChange={this.handleLongChange} />
          <select className='searchTermText' onChange={this.handleSelectChange} >
            <option className='searchTermText' data-lat="48.8566" data-long="2.3522" value="paris">Paris</option>
            <option className='searchTermText' data-lat="51.5074" data-long="0.1278" value="london">London</option>
            <option className='searchTermText' data-lat="48.1351" data-long="11.5820" value="munich">Munich</option>
            <option className='searchTermText' data-lat="43.0962" data-long="-79.0377" value="niagrafalls">Niagra Falls</option>
          </select>
        </form>
      </div>
    );
  }
}

export default LocationSearchForm;
