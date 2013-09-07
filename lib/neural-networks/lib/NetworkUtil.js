var _ = require('lodash');

/**
 * A required addition to the math library for the hyperbolicTangent activation function
 * @param {Number} x
 * @returns {Number}
 */
Math.tanh = function(x) {
    var eX = Math.pow(Math.E, x);
    var emX = Math.pow(Math.E, -x);

    return (eX - emX) / (eX + emX);
};

/**
 * The hypertangent
 * @param {Number} x
 * @returns {Number}
 */
var hyperTangent = function(x) {
    return Math.tanh(x);
};

/**
 * The sigmoid function is 1 / (1 + e ^ (-x))
 * @param x
 */
var sigmoid = function(x) {
    return 1 / (1 - Math.pow(Math.E, -x));
};

/**
 * The set of types for the activation functions
 * @name NetworkFunctionTypes
 */
var Types = {
    HyperbolicTangent: 'hbt',
    Sigmoid: 'sig'
};

/**
 * @param {NeuralNetwork} network
 * @param t
 */
function trainData(network, t) {
    for (var i = 0; i < t.length; i += 2) {
        var input = t[i];
        var expectedOutput = t[i + 1];

        network.train(input, expectedOutput);
    }
}

/**
 *
 * @name NetworkTrainer
 * @param {NeuralNetwork} network
 * @param t
 * @param n
 */
function train(network, t, n) {
    for (var trains = 0; trains < n; trains++) {
        trainData(network, t);
    }
}

/**
 * @name NetworkConverger
 * @param {NeuralNetwork} network
 * @param t
 * @param exit
 */
function converge(network, t, exit) {
    exit = exit || 1000000;
    var i = 0;
    while (i < exit && !network.isConverged()) {
        trainData(network, t);
        i++;
    }
}

/**
 * @name NetworkValidator
 * @param {NeuralNetwork} network
 * @param t
 */
function validate(network, t) {
    for (var i = 0; i < t.length; i += 2) {
        var input = t[i];
        var expectedOutput = t[i + 1];

        var actualOutput = network.test(input, expectedOutput);
        if (_.difference(expectedOutput, actualOutput).length !== 0) {
            return false;
        }
    }
    return true;
}

module.exports = {
    /**
     * Defines the set of activation functions.  Passing in a type will process the provided 'x'
     * with the specified activation function.
     * @param {String} type
     * @returns {Function}
     */
    functions: function(type) {
        if (type === Types.HyperbolicTangent) {
            return function(x) {
                return hyperTangent(x);
            }
        } else if (type === Types.Sigmoid) {
            return function(x) {
                return sigmoid(x);
            }
        }
    },
    /**
     * The training program for a neural network
     * @type NetworkTrainer
     */
    train: train,

    /**
     * Converges the network
     * @type NetworkConverger
     */
    convergeNetwork: converge,

    /**
     * @type NetworkValidator
     */
    validate: validate,

    /**
     * @type NetworkFunctionTypes
     */
    Types: Types
};