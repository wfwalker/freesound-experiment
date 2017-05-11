// invoke freesound api

var express = require('express');
var expressHandlebars  = require('express-handlebars');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');
var progress = require('request-progress');
var freesound = require('./lib/freesound.js');

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

  req.pipe(r).pipe(res);
});

freesound.setToken(process.env.FREESOUND_API_KEY);

var myPort = process.env.PORT || 3001;
var mHost = process.env.VCAP_APP_HOST || "127.0.0.1";

server.listen(myPort, function () {
  console.log('freesound-experiment server listening on port', myPort);
});