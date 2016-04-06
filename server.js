// invoke freesound api

var express = require('express');
var expressHandlebars  = require('express-handlebars');
var url = require('url');
var http = require('http');
var https = require('https');
var request = require('request');
var progress = require('request-progress');
var freesound = require('./freesound-g-roma.js');

function pipeRequest(inReq, inResp, inURLString) {
    console.log('open pipe', inURLString);

    progress(
        request({
            uri: inURLString,
            qs: inReq.query,
            strictSSL: false
        }, function(error, response, body) {
            if (!error && response && response.statusCode == 200) {
                console.log('success', inURLString), response.statusMessage;
            } else {
                // something went wrong
                console.log('error', inURLString, response.statusCode, response.statusMessage);

                if (response && response.headers && response.headers['content-length'] > 0) {
                    console.log('CONTENT LENGTH NONZERO');
                } else {
                    inResp.sendStatus(500);
                }
            }
        }).on('response', function(message) {
          console.log('response', inURLString);

          message.on('close', function() {
            console.log('response closed', inURLString);
          });
          message.on('error', function() {
            console.log('response error', inURLString);
          });
          message.on('end', function() {
            console.log('response end', inURLString);
          });
        }), {
            throttle: 200,
            delay: 100
        }
    ).on('progress', function(state) {
        console.log(inURLString, state);
    }).pipe(inResp);
    
    console.log('done opening pipe', inURLString);
}

var server = express();

server.set('view engine', 'handlebars');

server.use('/lib', express.static('lib'));

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

// https://github.com/g-roma/freesound.js/blob/master/test.html

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

server.listen(3001, function () {
  console.log('Example app listening on port 3001!');
});