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

server.set('view engine', 'handlebars');

server.use('/lib', express.static('lib'));
server.use('/client', express.static('client'));


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


server.engine('handlebars', expressHandlebars({
  defaultLayout: 'main',
  helpers: {
    stringify: function (json) {
      return JSON.stringify(json);
    }
  }
}));

freesound.setToken(process.env.FREESOUND_API_KEY);

server.get('/soundproxy/:id', function(req, resp) {
	console.log('sound proxy', req.params.id);
	freesound.getSound(req.params.id,
		function(sound) {
			var soundObj = null;
			try {
				soundObj = JSON.parse(sound);
				console.log('sound previews', soundObj.previews['preview-hq-mp3']);
				var urlString = soundObj.previews['preview-hq-mp3'];
				pipeRequest(req, resp, urlString);
			}
			catch(e) {
				console.log('cannot parse', sound, e);
			}
		}
	);
});

server.get('/piano', function(req, resp) {
	request.get({uri:'http://www.freesound.org/apiv2/search/text?query=mp3&token=' + process.env.FREESOUND_API_KEY, timeout:this.requestTimeout}, function (err, res, data) {
		var searchResults = JSON.parse(data);
		for (var index = 0; index < searchResults.results.length; index++) {
			console.log('id', searchResults.results[index].id);
			console.log(JSON.stringify(searchResults.results[index]));
		}
		resp.render('piano', {results: searchResults.results})
	});
});


var myPort = process.env.PORT || 3001;
var mHost = process.env.VCAP_APP_HOST || "127.0.0.1";

server.listen(myPort, function () {
  console.log('Example app listening on port', myPort);
});