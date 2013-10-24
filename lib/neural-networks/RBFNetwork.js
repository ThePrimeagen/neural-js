var ANN = require('./NeuralNetwork');
var _ = require('lodash');
var NetworkMath = require('./lib/NetworkMath');
var NetworkStates = require('./lib/NetworkStates');
var matrix = require('rx-data').matrix;
var DataUtil = require('../util/DataUtil');
var clusterfck = require('clusterfck');
var FuzzyUtil = require('../ANFIS/FuzzyUtil');


var RBFNetwork = function(configuration) {
    /**
     * @type {Array.<Number[]>}
     */
    this.initialCenters = [];
    /**
     * @type {number}
     */
    this.initialSigma = 1;

    /**
     * Calculates the sigma
     * @type {boolean}
     */
    this.calculateSigma = false;

    /**
     * The calculated sigma constant
     * @type {number}
     */
    this.rho = 0.5;

    /**
     * Sets the hidden layer count to equal the center count
     */
    configuration.hiddenLayerNeuronCount = configuration.initialCenters.length;

    ANN.apply(this, [configuration]);
    this._rbfInitialize();
};

RBFNetwork.prototype = _.assign(RBFNetwork.prototype, ANN.prototype);
RBFNetwork.prototype = _.assign(RBFNetwork.prototype, {

    getAverageDistance: function() {
        var dist = 0;
        var hidden = this._layers[1];
        for (var i = 0; i < hidden.length - 1; i++) {
            var h = hidden[i];
            var n = hidden[i + 1];
            dist += NetworkMath.lpNorm(h.center, n.center);
        }

        return dist / this._layers[1].length;
    },

    /**
     * The sigma calculation
     * @returns {number}
     */
    getCalculatedSigma: function() {
        return this.getAverageDistance() * this.rho;
    },

    /**
     * the rbf initialization.  This spreads the range through
     * @private
     */
    _rbfInitialize: function() {

        var hidden = this._layers[1];
        for (var i = 0; i < hidden.length; i++) {
            hidden[i].center = this.initialCenters[i];
        }

        var sigma = this.getCalculatedSigma();
        for (var i = 0; i < hidden.length; i++) {
            hidden[i].sigma = sigma;
        }
    },

    name: 'RBF',

    /**
     * The feed forward algorithm is different within
     * @private
     */
    _feedForward: function() {
        var inputs = this._getInputVector();

        var hidden = this._layers[1];
        for (var i = 0; i < hidden.length; i++) {
            var h = hidden[i];
            var norm = NetworkMath.lpNorm(h.center, inputs);
            h.output = NetworkMath.gaussian(norm, h.sigma);
        }

        var outputs = this._layers[2];
        for (var oIdx = 0; oIdx < outputs.length; oIdx++) {
            var o = outputs[oIdx];
            var sum = 0;

            for (var hIdx = 0; hIdx < hidden.length; hIdx++) {
                sum += o.w[hIdx] * hidden[hIdx].output;
            }

            o.output = sum;
        }
        this.state = NetworkStates
    },

    /**
     * The hidden layer does not need error calculation
     * @private
     */
    _backpropErrorHidden: function() {
        // Note:  There are no hidden calculations
    },

    _adjustHiddenWeights: function() {
        // Note: The center / sigma are the hidden weights
    },

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
 * The center count and training data.  The configuration should be for an ANN
 * @param {Number} centerCount
 * @param {Array.<Number[]>} t
 * @param {{}} configuration
 */
RBFNetwork.create = function(t, configuration) {
    // t is in pairs.  input, output
    var centerCount = configuration.hiddenLayerNeuronCount;
    var step = Math.floor(t.length / centerCount);
    var halfStep = Math.floor(step / 2);
    var centers = [];

    for (var i = 0; i < centerCount; i++) {
        var idx = halfStep + step * i;
        if (idx % 2 === 1) {
            idx--;
        }

        centers.push(t[idx]);
    }

    configuration.initialCenters = centers;
    configuration.useBiasInput = false;
    return new RBFNetwork(configuration);
};

/**
 * Creates an RBFNetwork with a clustering method to determine
 * center of data points.
 * @param  {Array.<Number[]>} configuration
 * @param  {{}} configuration
 * @return {RBFNetwork}
 */

RBFNetwork.createByClusters = function(configuration, inputs) {
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

    return new RBFNetwork(configuration); 
}

module.exports = RBFNetwork;