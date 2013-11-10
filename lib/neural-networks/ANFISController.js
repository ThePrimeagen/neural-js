var ANFISNetwork = require('./ANFISNetwork');
var DataUtil = require('../util/DataUtil');
var _ = require('lodash');
var Controller = require('./Controller');



var ANFISController = function(configuration, t) {
    Controller.apply(this, [configuration, t]);
    

    for (var k in this._outputMap) {
        var config = _.clone(configuration);
        config.networkOutput = k;
        this._networks.push(ANFISNetwork.createByClusters(config, this._outputMap[k]));
    }
};

ANFISController.prototype = _.assign(ANFISController.prototype, Controller.prototype);

module.exports = ANFISController;