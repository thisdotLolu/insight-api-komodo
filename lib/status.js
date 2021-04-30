'use strict';

var Common = require('./common');

function StatusController(node) {
  this.node = node;
  this.common = new Common({log: this.node.log});
}

StatusController.prototype.show = function(req, res) {
  var self = this;
  var option = req.query.q;

  switch(option) {
  case 'getDifficulty':
    this.getDifficulty(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getLastBlockHash':
    res.jsonp(this.getLastBlockHash());
    break;
  case 'getBestBlockHash':
    this.getBestBlockHash(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp(result);
    });
    break;
  case 'getMiningInfo':
    this.getMiningInfo(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        mininginfo: result
      });
    });
    break;
  case 'getcoinSupply':
    this.coinSupply(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        coinSupply: result
      });
    });
    break;
  case 'getInfo':
  default:
    this.getInfo(function(err, result) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      res.jsonp({
        info: result
      });
    });
  }
};

StatusController.prototype.getInfo = function(callback) {
  this.node.services.bitcoind.getInfo(function(err, result) {
    if (err) {
      return callback(err);
    }

    var base = 1000;
    var sizes = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
    var i = Math.floor(Math.log(result.difficulty) / Math.log(base));
    var diffresult = parseFloat(result.difficulty/Math.pow(base,i),2).toFixed(8);
   // return result + ' ' + sizes[i];


    var info = {
      version: result.version,
      protocolversion: result.protocolVersion,
      blocks: result.blocks,
      timeoffset: result.timeOffset,
      connections: result.connections,
      proxy: result.proxy,
      difficulty: diffresult + ' ' + sizes[i],
      testnet: result.testnet,
      relayfee: result.relayFee,
      errors: result.errors,
      network: result.network
    };
    callback(null, info);
  });
};

StatusController.prototype.getMiningInfo = function(callback) {
  this.node.services.bitcoind.getMiningInfo(function(err, result) {
    if (err) {
      return callback(err);
    };

   
      var base = 1000;
      var sizes = ['H/s', 'KH/s', 'MH/s', 'GH/s', 'TH/s'];
      var i = Math.floor(Math.log(result.networkhashps) / Math.log(base));
      var hashresult = parseFloat(result.networkhashps/Math.pow(base,i),2).toFixed(2);
   
    var mininginfo = {
      stakingsupply: result.stakingsupply,
      networkhashps: hashresult + ' ' + sizes[i]
    };
    callback(null, mininginfo);
  });
};

StatusController.prototype.coinSupply = function(callback) {
  this.node.services.bitcoind.coinSupply(function(err, result) {
    if (err) {
      return callback(err);
    }
    var coinsupply = {
      supply: result.supply.toFixed(2),
      zfunds: result.zfunds.toFixed(2),
      total: result.total.toFixed(2)
    };
    callback(null, coinsupply);
  });
};

StatusController.prototype.getLastBlockHash = function() {
  var hash = this.node.services.bitcoind.tiphash;
  return {
    syncTipHash: hash,
    lastblockhash: hash
  };
};

StatusController.prototype.getBestBlockHash = function(callback) {
  this.node.services.bitcoind.getBestBlockHash(function(err, hash) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      bestblockhash: hash
    });
  });
};

StatusController.prototype.getDifficulty = function(callback) {
  this.node.services.bitcoind.getInfo(function(err, info) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      difficulty: info.difficulty
    });
  });
};

StatusController.prototype.sync = function(req, res) {
  var self = this;
  var status = 'syncing';

  this.node.services.bitcoind.isSynced(function(err, synced) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    if (synced) {
      status = 'finished';
    }

    self.node.services.bitcoind.syncPercentage(function(err, percentage) {
      if (err) {
        return self.common.handleErrors(err, res);
      }
      var info = {
        status: status,
        blockChainHeight: self.node.services.bitcoind.height,
        syncPercentage: Math.round(percentage),
        height: self.node.services.bitcoind.height,
        error: null,
        type: 'bitcore node'
      };

      res.jsonp(info);

    });

  });

};

// API controllers

StatusController.prototype.api_coinsupply = function(req, res) {
  var self = this;

  this.node.services.bitcoind.coinSupply(function(err, coinsupply) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    res.jsonp(coinsupply);
  });

};

StatusController.prototype.api_getblockcount = function(req, res) {
  var self = this;

  this.node.services.bitcoind.getBlockCount(function(err, blockcount) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    res.jsonp(blockcount);
  });

};

StatusController.prototype.api_getblock = function(req, res) {
  var self = this;
  var hash = req._parsedUrl.query;
 // String str = "am.sunrise.ios@2x.png";
  var search = "hash=";
  if(hash){
  if (search === hash.substring(0,5)) {
      hash = hash.substring(5);
  }

  this.node.services.bitcoind.getBlock(hash, function(err, block) {

    if((err && err.code === -5) || (err && err.code === -8)) {
      return self.common.handleErrors(null, res)}
    else if(err) {
      return self.common.handleErrors(err, res);
    }
    res.jsonp(block);
  });
}
else   res.jsonp({
  error : true
});

};

StatusController.prototype.api_getblockhash = function(req, res) {
  var self = this;
  var index = req._parsedUrl.query;
 // String str = "am.sunrise.ios@2x.png";
  var search = "index=";

  if (index){
    if (search === index.substring(0,6)) {
        index = index.substring(6);
    }

    if ((index.length < 40 && /^[0-9]+$/.test(index))){

      this.node.services.bitcoind.getBlockHash(index, function(err, blockhash) {

      if((err && err.code === -5) || (err && err.code === -8)) {
        return self.common.handleErrors(null, res)}
      else if(err) {
        return self.common.handleErrors(err, res);
      }
        res.jsonp(blockhash);
      });
    }
    else  res.jsonp({
      error : true
      });
  }
  else   res.jsonp({
    error : true
    });

};

StatusController.prototype.api_getdifficulty = function(req, res) {
  var self = this;

  this.node.services.bitcoind.getInfo(function(err, info) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    var str = "" + info.difficulty;
    res.jsonp(str);
  });

};


StatusController.prototype.api_getnetworkhashps = function(req, res) {
  var self = this;

  this.node.services.bitcoind.getMiningInfo(function(err, info) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    res.jsonp(info.networkhashps);
  });

};

StatusController.prototype.api_getpeerinfo = function(req, res) {
  var self = this;

  this.node.services.bitcoind.getPeerInfo(function(err, info) {
    if (err) {
      return self.common.handleErrors(err, res);
    }
    res.jsonp(info.networkhashps);
  });

};

// Hard coded to make insight ui happy, but not applicable
StatusController.prototype.peer = function(req, res) {
  res.jsonp({
    connected: true,
    host: '127.0.0.1',
    port: null
  });
};

StatusController.prototype.version = function(req, res) {
  var pjson = require('../package.json');
  res.jsonp({
    version: pjson.version
  });
};

module.exports = StatusController;
