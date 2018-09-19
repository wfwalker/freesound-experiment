let backendHost;

const hostname = window && window.location && window.location.hostname;

if(hostname === 'freesound-experiment.herokuapp.com') {
  backendHost = 'http://freesound-experiment.herokuapp.com';
} else {
  backendHost = process.env.REACT_APP_BACKEND_HOST || 'http://localhost:3001';
}

console.log('THIS IS IT', hostname, backendHost);

export const API_ROOT = `${backendHost}`;
