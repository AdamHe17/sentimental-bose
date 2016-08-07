var express = require('express');
var router = express.Router();
var request = require('request');
var watson = require('watson-developer-cloud');

var find_sentiment = function(text, cb) {
  var result;
  var alchemy_language = watson.alchemy_language({
    api_key: 'c15ff73fe58537e41f9ab2b9d19daa3355829a45'
  })

  var parameters = {
    text: text
  };

  alchemy_language.sentiment(parameters, function(err, response) {
    if (err) {
      cb(new Error(err));
    } else {
      cb(response);
    }
  });
}

module.exports = find_sentiment;
