var MLPNetwork = require('./MLPNetwork');
var DataUtil = require('../util/DataUtil');
var _ = require('lodash');
var Controller = require('./Controller');

var MLPNetwork = function(configuration, t) {
    Controller.apply(this, [configuration, t]);
    
    //MICHAEL FINISH THIS PLZ

    for (var k in this._outputMap) {
        var config = _.clone(configuration);
        config.networkOutput = k;
        //this._networks.push(MLPNetwork.createByCluseter(config, this._outputMap[k]));
    }
};

MLPNetwork.prototype = _.assign(MLPNetwork.prototype, Controller.prototype);

module.exports = MLPNetwork;