var ANFISNetwork = require('./ANFISNetwork');
var DataUtil = require('../util/DataUtil');
var _ = require('lodash');

/**
 * Gets the output index from the outputArr. 
 * @param  {Number[]} outputArr 
 * @return {Number}
 */
function getOutputIdx(outputArr) {
    for (var i = 0; i < outputArr.length; i++) {
        if (outputArr[i]) {
            return i;
        }
    }

    return i;
}

var ANFISController = function(configuration, t) {
    var outputCount = 0;
    var outputMap = {};

    // Discovers all output characters
    for (var i = 1; i < t.length; i += 2) {

        // Assumes one output value
        var out = getOutputIdx(t[i]);
        if (!outputMap[out]) {
            outputMap[out] = [];
            outputCount++;
        }

        // Puts the input array
        outputMap[out].push(t[i - 1]);
    }

    this._networks = [];
    configuration.useBiasInput = false;
    configuration.outputCount = 1;
    for (var k in outputMap) {
        var config = _.clone(configuration);
        config.networkOutput = k;
        this._networks.push(ANFISNetwork.createByClusters(config, outputMap[k]));
    }
};

ANFISController.prototype = {
    /**
     * Trains the networks that are controlled by the anfis controller.
     * @param  {Number[]} inputs 
     * @param  {Number[]} expectedOutputs 
     */
    train: function(inputs, expectedOutputs) {
        for (var i = 0, len = this._networks.length; i < len; i++) {
            this._networks[i].train(inputs, expectedOutputs);
        }
    },

    /**
     * Tests the network and returns the output.
     * @param  {Number[]} inputs 
     * @return {Array} 
     */
    test: function(inputs) {
        for (var i = 0, len = this._networks.length; i < len; i++) {
            this._networks[i].test(inputs);
        }

        return this.getOutput();
    },

    /**
     * Traverses its networks and grabs the output.  The highest output
     * wins.
     * @return {Array}
     */
    getOutput: function() {
        var h = false, idx;
        for (var i = 0, len = this._networks.length; i < len; i++) {
            var network = this._networks[i];
            if (!h || h < network.getOutput()) {

                // Saves the idx and the highest output.  The output is always
                // a single value.
                idx = i;
                h = network.getOutput[0];
            }
        }

        return this._networks[idx].networkOutput;
    },

    reset: function() {
        for (var i = 0, len = this._networks.length; i < len; i++) {
            this._networks[i].reset();
        }
    }
};

module.exports = ANFISController;