var express = require('express');
var router = express.Router();
var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {
  request.post({
    url: 'https://api.twitter.com/oauth/request_token',
    oauth: {
      callback: 'http://8bc9fe0d.ngrok.io/',
      consumer_key: 'FMYyRya3fbp1ZpqSHWrrHIqYZ',
      consumer_secret: 'qQ2IrzcbnuMtB9sQ5dnFoNfAoyyBikZSa5LKwrOGcGnH5Ld2hQ',
      version: '1.0'
    }
  }, function(err, response, body) {
    var oauth_token = body.split('&')[0].substring(12, body.split('&')[0].length);
    console.log(body, oauth_token)

    res.redirect('https://api.twitter.com/oauth/authorize?oauth_token=' + oauth_token);
  })
});

module.exports = router;
