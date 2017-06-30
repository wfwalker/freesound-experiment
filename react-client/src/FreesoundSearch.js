import React, { Component } from 'react';
import SearchForm from './SearchForm';
import FreesoundList from './FreesoundList';

class FreesoundSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = { searches: ['wind'] };
  }

  searchFreesound = (inTerm) => {
    this.setState(function(prevState) {
      return {
        searches: prevState.searches.concat([inTerm])
      };
    });
  }

  handleRemoveSearch = (event) => {
    let aSearchTerm = event.target.parentElement.getAttribute('data-freesound-search')
    console.log('FreesoundSearch.handleRemoveSearch', aSearchTerm)

    this.setState(function(prevState) {
      return {
        searches: prevState.searches.filter(item => (item != aSearchTerm))
      }
    })
  }

  // TODO: set it to localhost:3001 if you're running the react dev server
  // for more info, see https://www.freesound.org/docs/api/resources_apiv2.html
  createQueryURL = (term) => (
    // 'http://localhost:3001' +
    '/apiv2/search/text?format=json&query=' + term + '&filter=duration:[1 TO 90]%20tag:field-recording&fields=id,name,description,previews,duration,images'
  )

  createFreesoundList = (aTerm) => (
    <FreesoundList
      audioContext={this.props.audioContext}
      onRemoveSearch={this.handleRemoveSearch}
      key={aTerm}
      title={aTerm}
      queryURL={this.createQueryURL(aTerm)} />
  )

  createFreesoundLists = () => (
    this.state.searches.map(this.createFreesoundList)
  )

  render() {
    return (
      <div>
        <SearchForm onSubmit={this.searchFreesound} />
        {this.createFreesoundLists()}
      </div>
    )
  }
}

export default FreesoundSearch
