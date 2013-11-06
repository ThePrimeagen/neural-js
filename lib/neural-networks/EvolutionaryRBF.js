var RBF = require('./RBFNetwork');
var _ = require('lodash');
var NetworkMath = require('./lib/NetworkMath');
var NetworkStates = require('./lib/NetworkStates');
var matrix = require('rx-data').matrix;
var DataUtil = require('../util/DataUtil');
var clusterfck = require('clusterfck');
var FuzzyUtil = require('../ANFIS/FuzzyUtil');


var EvolutionaryRBFNetwork = function(configuration) {
    RBF.apply(this, [configuration]);
    this._rbfInitialize();
};

EvolutionaryRBFNetwork.prototype = _.assign(EvolutionaryRBFNetwork.prototype, RBF.prototype);
EvolutionaryRBFNetwork.prototype = _.assign(EvolutionaryRBFNetwork.prototype, {

    name: 'EvolutionaryRBFNetwork',

    /**
     * Sets the weights on the layer going to the output
     * @param {Number[]} w
     */
    setWeights: function(w) {
        for (var i = 0; i < this._outputs.length; i++) {
            var o = this._outputs[i];

            for (var j = 0; j < o.w.length; j++) {
                o.w[j] = w[j];
            }
        }
    },

    _backpropErrorHidden: function() { },

    // -------------------------------------------------------------------------
    // Evolution takes care of adjusting.
    // -------------------------------------------------------------------------
    _adjustOutputWeights: function() { },
    _adjustHiddenWeights: function() { },

    /**
     * Gets the input vector
     * @private
     */
    _getInputVector: function() {
        var a = [];
        for (var i = 0; i < this._inputs.length; i++) {
            a.push(this._inputs[i].output);
        }

        return a;
    }
});

/**
 * Creates an EvolutionaryRBFNetwork with a clustering method to determine
 * center of data points.
 * @param  {Array.<Number[]>} configuration
 * @param  {{}} configuration
 * @return {EvolutionaryRBFNetwork}
 */

EvolutionaryRBFNetwork.createByClusters = function(configuration, inputs) {
    configuration.initialCenters = [];

    for(var i = 0; i < inputs.length; i++) {
        for(var j = 0; j < inputs[i].length; j++) {
            if(isNaN(inputs[i][j])) {
                console.log("NaN!");
            }
        }
    }

    var clusters = clusterfck.kmeans(inputs, configuration.nodesPerDim * inputs[0].length, 'euclidean', 1);
    for (var j = 0; j < clusters.length; j++) {

        if (clusters[j]) {
            var center = FuzzyUtil.mean.apply(null, clusters[j]);
            configuration.initialCenters.push(center);
        }
    }

    return new EvolutionaryRBFNetwork(configuration);
}

module.exports = EvolutionaryRBFNetwork;