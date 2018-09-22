let backendHost;

const hostname = window && window.location && window.location.hostname;
const requestProtocol = window.location.protocol;

if(hostname === 'freesound-experiment.herokuapp.com') {
  backendHost = '';
} else {
  backendHost = requestProtocol + (process.env.REACT_APP_BACKEND_HOST || '//localhost:3001');
}

console.log('API_ROOT from "', hostname, '" is "', backendHost, '"');

export const API_ROOT = `${backendHost}`;
