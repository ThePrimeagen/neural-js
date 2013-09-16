var _ = require('lodash');

/**
 * A required addition to the math library for the hyperbolicTangent activation function
 * @param {Number} x
 * @returns {Number}
 */
Math.tanh = function(x) {
    return 2 * logisticFunction(2 * x) - 1;
};

/**
 * The hyper tangent
 * @param {Number} x
 * @returns {Number}
 */
var hyperTangent = function(x) {
    return Math.tanh(x);
};

function dHyperTangent(x) {
    var t = Math.tanh(x);
    return NetworkMath.alpha * (1 - t * t);
}

/**
 * The logisticFunction function is 1 / (1 + e ^ (-x))
 * @param x
 */
function logisticFunction(x) {
    // Short cuts the logistic function.  Makes calculations go way faster
    if (x > NetworkMath.logisticMax / NetworkMath.alpha) {
        return .999;
    } else if (x < -NetworkMath.logisticMax / NetworkMath.alpha) {
        return 0.001;
    }
    return 1 / (1 + Math.pow(Math.E, -x * NetworkMath.alpha));
}


/**
 * The derivative of the logistic function
 * @param {Number} x
 * @returns {Number}
 */
function dLogisticFunction(x) {
    return NetworkMath.alpha * x * (1 - x);
}

/**
 * The guassian function
 * @returns {number}
 */
function gaussianFn(x, s) {
    s = s || NetworkMath.sigma;
    return Math.pow(Math.E, (x * x / 2 * s * s));
}

/**
 * The set of types for the activation functions
 * @name NetworkFunctionTypes
 */
var Types = {
    Sigmoid: 'sig',
    HyperbolicTangent: 'hbt',
    Linear: 'lin'
};

function delimitDataDisplay(value) {
    return Math.floor(value * 1000) / 1000;
}

var NetworkMath = {
    /**
     * the Activation function based on type
     * @param type
     * @returns {Function}
     */
    activationFunction: function(type) {
        if (type === Types.Sigmoid) {
            return logisticFunction;
        } else if (type === Types.HyperbolicTangent) {
            return hyperTangent;
        } else if (type === Types.Linear) {
            return function(x) {
                return x;
            }
        }
    },

    /**
     * The dActivation function
     * @param type
     * @returns {Function}
     */
    dActivationFunction: function(type) {
        if (type === Types.Sigmoid) {
            return dLogisticFunction;
        } else if (type === Types.HyperbolicTangent) {
            return dHyperTangent;
        } else if (type === Types.Linear) {
            return function(x) {
                return 1;
            }
        }
    },

    /**
     * Makes the data not display so far out
     */
    delimitDataDisplay: delimitDataDisplay,

    /**
     * alpha
     */
    alpha: 1,

    /**
     * For shortcutting the function to return 0.999 or 0.001
     * The actual value used is logisticMax / alpha
     */
    logisticMax: 7,

    /**
     * The sigma in the RBF gaussian function
     */
    sigma: 5,

    /**
     * @type NetworkFunctionTypes
     */
    Types: Types
};

module.exports = NetworkMath;