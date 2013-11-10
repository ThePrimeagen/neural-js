var RBFNetwork = require('./RBFNetwork');
var DataUtil = require('../util/DataUtil');
var _ = require('lodash');
var Controller = require('./Controller');



var RBFController = function(configuration, t) {
    Controller.apply(this, [configuration, t]);    
    for (var k in this._outputMap) {    	
        var config = _.clone(configuration);
        config.networkOutput = k;
        console.log("clustering:" + k.toString() + ' ' + this._outputMap[k].length);
        this._networks.push(RBFNetwork.createByClusters(config, this._outputMap[k]));
    }
};

RBFController.prototype = _.assign(RBFController.prototype, Controller.prototype);

module.exports = RBFController;