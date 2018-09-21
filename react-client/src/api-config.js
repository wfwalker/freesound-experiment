let backendHost;

const hostname = window && window.location && window.location.hostname;
const requestProtocol = window.location.protocol;

if(hostname === 'freesound-experiment.herokuapp.com') {
  backendHost = requestProtocol + '//freesound-experiment.herokuapp.com';
} else {
  backendHost = requestProtocol + (process.env.REACT_APP_BACKEND_HOST || '//localhost:3001');
}

console.log('THIS IS IT', hostname, backendHost);

export const API_ROOT = `${backendHost}`;
