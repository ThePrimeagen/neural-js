var RBF = require('./RBFNetwork');
var _ = require('lodash');
var evolution = require('ixjs-evolution');

/**
 * Configures an evolutionary controller.  This will control the internal ixjs evolution
 * state.
 *
 * @param {{
 *     t: Data,
 *     validation: Data,
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
    this.reset(configuration.validation);
    this.name = this.evo;
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
        var sum = 0;
        for (var i = 0; i < this._basePop.length; i++) {
            sum += this._basePop[i].fit;
        }

        return sum / this._basePop.length;
    },
    getPopulationSize: function() {
        return this._basePop.length;
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

    reset: function(validation) {

        this._fitnessFn = fitnessFn(this, validation);
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
    }
};

function getInputs(data) {
    var inputs = [];

    for (var i = 0; i < data.length; i += 2) {
        inputs.push(data[i]);
    }

    return inputs;
}

function getBasePopulation(centerCount, numberOfOutputs) {
    var weights = [];
    for (var count = 0; count < 50; count++) {
        var w = [];
        for (var i = 0; i < numberOfOutputs; i++) {
            for (var j = 0; j < centerCount; j++) {
                var dir = Math.random() > 0.5 ? -1 : 1;
                w.push(dir * Math.random());
            }
        }
        weights.push(w);
    }

    return weights;
}
function fitnessFn(network, validationSet) {
    var len = validationSet.length;
    var checkLen = Math.ceil(len / 4);
    var i = 0;

    return function(population) {
        network.setWeights(population);
        var sum = 0;

        for (var count = 0; count < checkLen; count++, i += 2) {
            if (i >= len) {
                i = 0;
            }

            // Tests 10 random points from the validation set.
            sum += Math.abs(network.test(validationSet[i]) - validationSet[i + 1]);
        }

        return sum;
    };
};
