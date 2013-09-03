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
 * @name ActivationFunction
 * @function
 * @param {Number} x
 */

/**
 * The set of types for the activation functions
 */
var Types = {
    HyperbolicTangent: 'hbt'
};

module.exports = {
    /**
     * Defines the set of activation functions.  Passing in a type will process the provided 'x'
     * with the specified activation function.
     * @param {String} type
     * @returns {ActivationFunction}
     */
    activationFunction: function(type) {
        if (type === Types.HyperbolicTangent) {
            return function(x) {
                return hyperTangent(x);
            }
        }
    },

    Types: Types
};