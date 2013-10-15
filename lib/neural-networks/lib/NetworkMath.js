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
    return Math.pow(Math.E, -(x * x / (2 * s * s)));
}

/**
 * The generalized bell curve is used within the membership value for the most part
 * in all online sources.
 * @param  {Number} x The input value
 * @param  {Number} a tunable parameter
 * @param  {Number} b tunable parameter
 * @param  {Number} c tunable parameter
 * @return {Number} result
 */
function generalBellCurve(x, a, b, c) {
    return 1 / (1 + Math.pow((x - c) / a, 2 * b));
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

/**
 * Takes in 2 arrays.  The arrays are used for the distance calculation
 * @param {Number[]} arr1
 * @param {Number[]} arr2
 * @name LPNorm
 */
function lpnorm(arr1, arr2) {
    var pow = arr1.length;
    var sum = 0;
    for (var i = 0; i < arr1.length; i++) {
        sum += Math.pow(arr1[i] - arr2[i], pow);
    }
    return Math.pow(sum, 1 / pow);
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

    /* 
     * Performs a fuzzy AND on the inputs
     * which in this case is simply a 
     * multiplicative summation.
     */
    tnormFunction: function(values) {
        var sum = 1;
        for(var i = 0; i < values.length; i++) {
            sum *= values[i];
        }

        return sum;
    },

    /*
     * Returns and additive normalization according 
     * to the array passed in, and the given input to normalize
     */
    normalizeDataFunction: function(input, inputArray) {
        var sum = 0;
        for(var i = 0; i < inputArray.length; i++) {
            sum += inputArray[i];
        }

        return input / sum;
    },


    /*
     * inputs: A list of inputs {x1, x2,..., xn}
     * coefficients: A list of the corresponding coefficients for the function {c1, c2,... c(n + 1)}
     * NOTE: Coeffecients should be 1 longer than inputs, as it has a value 'r' that is added to the end
     * so that the function takes the form f = x1c1 + x2c2 + ... + xncn + c(n+1)
     */
    takagiSugenoFunction: function(inputs, coefficients) {
        var sum = 0;
        for(var i = 0; i < inputs.length; i++) {
            sum += inputs[i] * coefficients[i];
        }
        sum += coefficients[coefficients.length - 1];

        return sum;
    },

    /**
     * Makes the data not display so far out
     */
    delimitDataDisplay: delimitDataDisplay,

    /**
     * alpha
     */
    alpha: 0.431,

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
    Types: Types,

    /**
     * @type LPNorm
     */
    lpNorm: lpnorm,

    /**
     * The gaussian function
     */
    gaussian: gaussianFn,

    /**
     * The generalized bell curve.  Used for ANFIS
     * Look at effect of changing parameters.
     * http://homepages.rpi.edu/~bonisp/fuzzy-course/Papers-pdf/anfis.rpi04.pdf 
     */
    generalBellFn: generalBellCurve
};

module.exports = NetworkMath;