import React, { Component } from 'react';
import './SearchForm.css';

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
    this.setState({value: ''});
  }

  render() {
    return (
      <div>
        <form className='searchForm' onSubmit={this.handleSubmit}>
          <span className='playerButton' data-freesound-search={this.props.title} onClick={this.handleSubmit}>
            <i className='material-icons smaller'>search</i>
          </span>
          <input className='searchTermText' type="text" size='20' value={this.state.value} placeholder='search term' onChange={this.handleChange} />
        </form>
      </div>
    );
  }
}

export default SearchForm;
