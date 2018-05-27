'use strict';

var request = require('request');

function CurrencyController(options) {
  this.node = options.node;
  var refresh = options.currencyRefresh || CurrencyController.DEFAULT_CURRENCY_DELAY;
  this.currencyDelay = refresh * 60000;
  this.bitstampRate = 0; // USD/BTC
  this.poloniexRate = 0; // BTC/KMD
  this.timestamp = Date.now();
}

CurrencyController.DEFAULT_CURRENCY_DELAY = 10;

CurrencyController.prototype.index = function(req, res) {
  var self = this;
  var currentTime = Date.now();
  if (self.bitstampRate === 0 || currentTime >= (self.timestamp + self.currencyDelay)) {
    self.timestamp = currentTime;
    // https://bittrex.com/api/v1.1/public/getticker?market=BTC-KMD
    // request('https://www.bitstamp.net/api/ticker/', function(err, response, body) {

    request('https://api.coinmarketcap.com/v1/ticker/komodo/', function(err, response, body) {
      if (err) {
        self.node.log.error(err);
      }
      if (!err && response.statusCode === 200) {
	//console.log("[Decker] " + body);
        self.bitstampRate = parseFloat(JSON.parse(body)[0].price_usd);
      }
        self.poloniexRate = '1.00';
        res.jsonp({
          status: 200,
          data: {
            bitstamp: self.bitstampRate * self.poloniexRate
          }
        });
      });
  } else {
    res.jsonp({
      status: 200,
      data: { 
        bitstamp: self.bitstampRate * self.poloniexRate
      }
    });
  }

};

module.exports = CurrencyController;
