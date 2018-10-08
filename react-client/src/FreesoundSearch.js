import React, { Component } from 'react';
import SearchForm from './SearchForm';
import LocationSearchForm from './LocationSearchForm';
import FreesoundList from './FreesoundList';

import { API_ROOT } from './api-config';

class FreesoundSearch extends React.Component {
  constructor(props) {
    super(props);
    //TESTING: this.state = { termSearches: ['wind'], locationSearches: [[37.3541,-121.9552]] };
    this.state = { termSearches: [], locationSearches: [] };
  }

  searchFreesoundForTerm = (inTerm) => {
    this.setState(function(prevState) {
      console.log('searchFreesoundForTerm', prevState.termSearches, inTerm)
      return {
        termSearches: prevState.termSearches.concat([inTerm])
      };
    });
  }

  searchFreesoundForLocation = (latLongPair) => {
    this.setState(function(prevState) {
      console.log('searchFreesoundForLocation', prevState.locationSearches, latLongPair)
      return {
        locationSearches: prevState.locationSearches.concat([latLongPair])
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

  createQueryURL = (term) => (
    API_ROOT + '/apiv2/search/text?format=json&query=' + term + '&page_size=100&filter=duration:[1 TO 90]%20tag:field-recording&fields=id,name,description,previews,duration,images'
  )

  // filter={!geofilt sfield=geotag pt=<LATITUDE>,<LONGITUDE> d=<MAX_DISTANCE_IN_KM>}
  // from docs for barcelona: {!geofilt sfield=geotag pt=41.3833,2.1833 d=10}
  // santa clara 37.3541,-121.9552

  createLocationQueryURL = (aLat, aLong) => (
    API_ROOT + '/apiv2/search/text?format=json&page_size=100&filter=duration:[1 TO 90]%20%7B!geofilt sfield=geotag pt=' + aLat + ',' + aLong + ' d=100%7D%20tag:field-recording&fields=id,name,description,previews,duration,images'
  )

  createFreesoundListForTerm = (aTerm) => (
    <FreesoundList
      audioContext={this.props.audioContext}
      onRemoveSearch={this.handleRemoveTermSearch}
      key={aTerm}
      title={aTerm}
      queryURL={this.createQueryURL(aTerm)} />
  )

  createFreesoundListForLatLong = (aLatLongPair) => (
    <FreesoundList
      audioContext={this.props.audioContext}
      onRemoveSearch={this.handleRemoveLatLongSearch}
      key={aLatLongPair[0] + ',' + aLatLongPair[1]}
      title={aLatLongPair[0] + '°, ' + aLatLongPair[1] + '°'}
      queryURL={this.createLocationQueryURL(aLatLongPair[0], aLatLongPair[1])} />
  )

  render() {
    return (
      <div>
        <SearchForm onSubmit={this.searchFreesoundForTerm} />
        <LocationSearchForm onSubmit={this.searchFreesoundForLocation} />
        {this.state.termSearches.map(this.createFreesoundListForTerm)}
        {this.state.locationSearches.map(this.createFreesoundListForLatLong)}
      </div>
    )
  }
}

export default FreesoundSearch
