// invoke freesound api

var express = require('express');
var request = require('request');

var server = express();

server.use('/', express.static('react-client/build'));

server.use('/apiv2', function(req, res) {
  var options = {
    url: 'https://www.freesound.org/apiv2'+ req.url,
    headers: {
      "Authorization": "Token " + process.env.FREESOUND_API_KEY,
    }
  };

  console.log('proxy', options.url);

  var r = request(options);

  r.on('error', function(err) {
    console.log('ERROR', err);
  })

  req.pipe(r).pipe(res);
});

var myPort = process.env.PORT || 3001;
var mHost = process.env.VCAP_APP_HOST || "127.0.0.1";

server.listen(myPort, function () {
  console.log('freesound-experiment server listening on port', myPort);
});