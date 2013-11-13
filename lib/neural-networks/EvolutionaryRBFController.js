var RBF = require('./RBFNetwork');
var _ = require('lodash');
var evolution = require('ixjs-evolution');

/**
 * Configures an evolutionary controller.  This will control the internal ixjs evolution
 * state.
 *
 * @param {{
 *     t: Data,
 *     evo: evolution.construct,
 *     evoOptions: {}
 * }} configuration
 */
var EvolutionaryRBFController = function(configuration) {
    var self = this;
    var inputs = getInputs(configuration.t);

    this._network = RBF.createByClusters(configuration, inputs);
    this._network._adjustOutputWeights = function() {};

    _.assign(this, configuration);
    this.reset(configuration.t);
};

module.exports = EvolutionaryRBFController;

EvolutionaryRBFController.prototype = {
    train: function(inputs, expectedOutputs) {

        // Runs the loop once (causes a new generation).
        this._loop();
    },
    test: function(inputs) {
        return this._network.test(inputs);
    },
    getError: function() {
        return [this._getMostFit().fit];
    },
    getPopulationSize: function() {
        return this._basePop.length;
    },

    setMostFit: function() {
        this.setWeights(this._getMostFit());
    },

    /**
     * Sets the weights of the rbf
     * @param {} w
     */
    setWeights: function(w) {
        var len = this._network._outputs[0].w.length;
        for (var i = 0; i < this._network._outputs.length; i++) {
            var o = this._network._outputs[i];

            for (var j = 0; j < o.w.length; j++) {
                o.w[j] = w[len * i + j];
            }
        }
    },

    //resets the network, population, and enumerable to begin testing anew
    reset: function(testData) {

        this._fitnessFn = fitnessFn(this, testData);
        var rbfs = this._network._outputs[0].w.length;

        this._basePop = getBasePopulation(rbfs, this.t[1].length);
        this.evoOptions.basePopulation = this._basePop;
        this.evoOptions.fitnessFn = this._fitnessFn;
        this._selector = this.evo(this.evoOptions);
        this._loop = evolution.loop({
            fitnessFn: this._fitnessFn,
            selector: this._selector,
            basePopulation: this._basePop
        });
    },

    //returns the most fit individual from the population
    _getMostFit: function() {
        var mostFit = 10000000;
        var dude = [];
        for (var i = 0; i < this._basePop.length; i++) {
            if (this._basePop[i].fit < mostFit) {
                mostFit = this._basePop[i].fit;
                dude = this._basePop[i];
            }
        }

        return dude;
    }
};

//The data is given as an array in the format [input, output, intput, output...]
// This strips off the inputs and returns them in an array
function getInputs(data) {
    var inputs = [];

    //Grab every other, according to our data scheme
    for (var i = 0; i < data.length; i += 2) {
        inputs.push(data[i]);
    }

    return inputs;
}

//Generates a population, according to the specified center count and number of outputs
function getBasePopulation(centerCount, numberOfOutputs) {
    var weights = [];
    for (var count = 0; count < 50; count++) {
        var w = [];
        //Create a member, and fill it with weights
        for (var i = 0; i < numberOfOutputs; i++) {
            for (var j = 0; j < centerCount; j++) {
                //Create a weight between (-1, 1), and add it as a "chromosome"
                var dir = Math.random() > 0.5 ? -1 : 1;
                w.push(dir * Math.random());
            }
        }
        weights.push(w);
    }

    return weights;
}

//Fitness function for calculating the error of a network, given a set of weights (genome)
function fitnessFn(network, testData) {
    var len = testData.length;
    var checkLen = Math.ceil(len / 4);
    var i = 0;

    return function(population) {
        network.setWeights(population);
        var sum = 0;

        for (var count = 0; count < checkLen; count++, i += 2) {
            if (i >= len) {
                i = 0;
            }

            // Tests 10 random points from the testData set.
            sum += Math.abs(network.test(testData[i])[0] - testData[i + 1][0]);
        }

        return sum;
    };
};
