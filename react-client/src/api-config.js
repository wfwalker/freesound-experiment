let backendHost;

const hostname = window && window.location && window.location.hostname;

if(hostname === 'https://birdquiz.herokuapp.com/') {
  backendHost = 'https://birdquiz.herokuapp.com/';
} else {
  backendHost = process.env.REACT_APP_BACKEND_HOST || 'http://localhost:3001';
}

console.log('THIS IS IT', backendHost);

export const API_ROOT = `${backendHost}`;
