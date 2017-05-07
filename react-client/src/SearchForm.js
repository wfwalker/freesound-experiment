import React, { Component } from 'react';

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
      <div className='searchForm'>
        <form onSubmit={this.handleSubmit}>
          <label>
            Search:
            <input type="text" value={this.state.value} onChange={this.handleChange} />
          </label>
          <input type="submit" disabled={!this.state.value} value="Submit" />
        </form>
      </div>
    );
  }
}

export default SearchForm;
