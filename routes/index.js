var express = require('express');
var router = express.Router();
var request = require('request');
var find_sentiment = require('../alchemy');

var happy_songs = 'spotify:user:spotify_germany:playlist:6zQkNlFnpNO5BB0MG9c165';
var happy_songs_id = '6zQkNlFnpNO5BB0MG9c165'
var bose_ip = "";

/* GET home page. */
router.get('/', function(req, res, next) {
  var happiness = 0;
  var sadness = 0;
  if (req.query.oauth_verifier) { // Twitter
    request.post({
      url: 'https://api.twitter.com/oauth/access_token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      oauth: {
        consumer_key: 'FMYyRya3fbp1ZpqSHWrrHIqYZ',
        consumer_secret: 'qQ2IrzcbnuMtB9sQ5dnFoNfAoyyBikZSa5LKwrOGcGnH5Ld2hQ',
        token: req.query.oauth_token,
        verifier: req.query.oauth_verifier
      }
    }, function(err, response, body) {
      var body_vars = body.split('&');
      console.log(body_vars);
      var last_tweet;
      setInterval(function() {
        console.log('getting tweets', happiness);
        request.get({
          url: 'https://api.twitter.com/1.1/statuses/user_timeline.json',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          oauth: {
            consumer_key: 'FMYyRya3fbp1ZpqSHWrrHIqYZ',
            consumer_secret: 'qQ2IrzcbnuMtB9sQ5dnFoNfAoyyBikZSa5LKwrOGcGnH5Ld2hQ',
            token: body_vars[0].substring(12, body_vars[0].length),
            token_secret: body_vars[1].substring(19, body_vars[1].length)
          },
          user_id: body_vars[2].substring(8, body_vars[2].length),
          count: 2
        }, function(err, response, body) {
          if (!happiness) {
            last_tweet = JSON.parse(body)[0].text;
            JSON.parse(body).map(function(tweet) {
              console.log(tweet.text);
              find_sentiment(tweet.text, function(resp) {
                happiness = happiness + (resp.docSentiment.score / JSON.parse(body).length);
              });
            });
          } else if (last_tweet != JSON.parse(body)[0].text) {
            last_tweet = JSON.parse(body)[0].text;
            find_sentiment(last_tweet, function(resp) {
              happiness = 0.85 * happiness + 0.15 * resp.docSentiment.score;
            });
          }
        })
      }, 8000);
    });
  }
  if (req.query.code) { // Spotify
    request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      url: 'https://accounts.spotify.com/api/token',
      form: {
        client_id: '7ca44c3bf52b4c689e188b565aa44942',
        client_secret: '2916e43b6e1841abbbcba05ef03f8c94',
        grant_type: 'authorization_code',
        code: req.query.code,
        redirect_uri: 'http://sentimental-bose.herokuapp.com/',
      }
    }, function(err, response, body) {
      var access_token = JSON.parse(body).access_token;
      request.get({
        url: 'https://api.spotify.com/v1/me/top/tracks',
        headers: {
          Authorization: 'Bearer ' + access_token
        }
      }, function(err, response, body) {
        var list_of_uri = [];
        console.log(list_of_uri);
        JSON.parse(body).items.map(function(track) {
          list_of_uri.push(track.uri);
        })
        request.get({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            Authorization: 'Bearer ' + access_token
          }
        }, function(err, response, body) {
          var user_id = JSON.parse(body).id;
          request.post({
            url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists',
            headers: {
              Authorization: 'Bearer ' + access_token,
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Bose'
            },
            json: true
          }, function(err, response, body) {
            var playlist_id = body.id;
            var playlist_uri = body.uri;
            request.post({
              url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
              headers: {
                Authorization: 'Bearer ' + access_token,
                'Content-Type': 'application/json'
              },
              body: {
                uris: list_of_uri
              },
              json: true
            }, function(err, response, body) {
              console.log(body);
              if (bose_ip) {
                var bose_url = 'http://' + bose_ip + '/select';
                request.post({
                  url: bose_url,
                  body: {
                    "ContentItem": {
                      "source": "SPOTIFY",
                      "type": "uri",
                      "location": playlist_uri,
                      "sourceAccount": "bosehack11"
                    }
                  },
                  json: true
                }, function(err, response, body) {
                  console.log(body);
                });
              }
              // Play the music
              // Happy Songs : spotify:user:spotify_germany:playlist:6zQkNlFnpNO5BB0MG9c165
              setInterval(function() {
                if (happiness < 0 && happiness != sadness) {
                  sadness = happiness;
                  var new_songs = [];
                  request.get({
                    url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + happy_songs_id + '/tracks',
                    headers: {
                      Authorization: 'Bearer ' + access_token,
                      'Content-Type': 'application/json'
                    },
                  }, function(err, response, body) {
                    console.log(JSON.parse(body).items);
                    for (var i = 0; i < list_of_uri.length; i++) {
                      if (i % 4 == 1) {
                        new_songs.push(JSON.parse(body).items[i].uri)
                      } else {
                        new_songs.push(list_of_uri[i]);
                      }
                      console.log(new_songs[new_songs.length - 1]);
                    }
                    request.put({
                      url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists/' + playlist_id + '/tracks',
                      headers: {
                        Authorization: 'Bearer ' + access_token,
                        'Content-Type': 'application/json'
                      },
                      body: {
                        uris: new_songs
                      },
                      json: true
                    }, function(err, response, body) {
                      console.log(err, body);
                    });
                  });
                }
              }, 4000);
            });
          });
        });
      });
    });
  }
  res.render('index');
});

router.post('/ip', function(req, res, next) {
  bose_ip = req.body.ip;
  res.redirect('/');
});

module.exports = router;
