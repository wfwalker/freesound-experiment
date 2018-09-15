import React, { Component } from 'react';
import SearchForm from './SearchForm';
import FreesoundList from './FreesoundList';

class FreesoundSearch extends React.Component {
  constructor(props) {
    super(props);
    // TESTING: this.state = { termSearches: ['wind'], locationSearches: [[37.3541,-121.9552]] };
    this.state = { termSearches: ['wind'], locationSearches: [] };
  }

  searchFreesoundForTerm = (inTerm) => {
    this.setState(function(prevState) {
      console.log('searchFreesoundForTerm', prevState.termSearches, inTerm)
      return {
        termSearches: prevState.termSearches.concat([inTerm])
      };
    });
  }

  handleRemoveTermSearch = (event) => {
    let aSearchTerm = event.target.parentElement.getAttribute('data-freesound-search')
    console.log('FreesoundSearch.handleRemoveTermSearch', aSearchTerm)

    this.setState(function(prevState) {
      return {
        termSearches: prevState.termSearches.filter(item => (item != aSearchTerm))
      }
    })
  }

  handleRemoveLatLongSearch = (event) => {
    console.log('FreesoundSearch.handleRemoveLatLongSearch NOT IMPLEMENTED')
  }

  // TODO: prepend localhost:3001 if you're running the react dev server
  // for more info, see https://www.freesound.org/docs/api/resources_apiv2.html
  createQueryURL = (term) => (
    '/apiv2/search/text?format=json&query=' + term + '&filter=duration:[1 TO 90]%20tag:field-recording&fields=id,name,description,previews,duration,images'
  )

  // filter={!geofilt sfield=geotag pt=<LATITUDE>,<LONGITUDE> d=<MAX_DISTANCE_IN_KM>}
  // from docs for barcelona: {!geofilt sfield=geotag pt=41.3833,2.1833 d=10}
  // santa clara 37.3541,-121.9552

  createLocationQueryURL = (aLat, aLong) => (
    '/apiv2/search/text?format=json&filter=%7B!geofilt sfield=geotag pt=' + aLat + ',' + aLong + ' d=100%7D%20tag:field-recording&fields=id,name,description,previews,duration,images'
  )

  createFreesoundListForTerm = (aTerm) => (
    <FreesoundList
      audioContext={this.props.audioContext}
      onRemoveSearch={this.handleRemoveTermSearch}
      key={aTerm}
      title={aTerm}
      queryURL={this.createQueryURL(aTerm)} />
  )

  createFreesoundListForLatLong = (aLat, aLong) => (
    <FreesoundList
      audioContext={this.props.audioContext}
      onRemoveSearch={this.handleRemoveLatLongSearch}
      key={aLat + ',' + aLong}
      title={aLat + ',' + aLong}
      queryURL={this.createLocationQueryURL(aLat, aLong)} />
  )

  render() {
    return (
      <div>
        <SearchForm onSubmit={this.searchFreesoundForTerm} />
        {this.state.termSearches.map(this.createFreesoundListForTerm)}
        {this.state.locationSearches.map(this.createFreesoundListForLatLong)}
      </div>
    )
  }
}

export default FreesoundSearch
