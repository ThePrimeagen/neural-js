var MLPNetwork = require('./NeuralNetwork');
var DataUtil = require('../util/DataUtil');
var _ = require('lodash');
var Controller = require('./Controller');

var MLPController = function(configuration, t) {
    Controller.apply(this, [configuration, t]);
    
    for (var k in this._outputMap) {
        var config = _.clone(configuration);
        config.networkOutput = k;
        this._networks.push(new MLPNetwork(config));
    }
};

MLPController.prototype = _.assign(MLPController.prototype, Controller.prototype);

module.exports = MLPController;