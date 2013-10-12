var ANN = require('./NeuralNetwork');
var _ = require('lodash');
var NetworkMath = require('./lib/NetworkMath');
var NetworkStates = require('./lib/NetworkStates');
var FuzzyUtil = require('../ANFIS/FuzzyUtil');
var ANFISNeuron = require('./lib/ANFISNeuron');

var ANFISNetwork = function(configuration) {

    // TODO: Define our own neuron for ANFIS
    // this._neuronType = ?h 

    ANN.apply(this, [configuration]);
};

ANFISNetwork.prototype = _.assign(ANFISNetwork.prototype, ANN.prototype);
ANFISNetwork.prototype = _.assign(ANFISNetwork.prototype, {
    _initialize: function() {
        this._createInputLayer();
        // TODO: Layer 1
        // TODO: Layer 2
        // TODO: Layer 3
        // TODO: Layer 4
        // TODO: Layer 5
    }
});

module.exports = ANFISNetwork;