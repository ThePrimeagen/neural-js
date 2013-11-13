var _ = require('lodash');
var MLP_NETWORKS = ['MLP', 'RBF'];

/**
 * Gets the average from an array.
 * @param  {Number[]} arr
 * @return {Number}
 */
function average(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum / arr.length;
}

/**
 * Performs our convergence testing.
 * @param {{
 *     t: data
 * }} config
 */
var Converge = function(config) {
    this._tests = 0;
    this._prevErr = false;
    this._error = [];
    this._trials = config.t.length / 20;
    this._error2 = [];
    this.avgConvergeLim = 0.11;
    this._incrementor = 0.000005;

    _.assign(this, config);
}

Converge.prototype = {
    /**
     * Adds an error value to the converge tests
     * @param {Number} err
     */
    addError: function(err) {

        // What to do?
        if (isNaN(err)) {
            this._network.reset();
            console.log("Reset network: " + network.name);
            this._tests = 0;
            this._error = [];
            this._error2 = [];
            this._prevErr = false;
        }

        if (this._prevErr === false) {
            this._prevErr = err;
            return;
        }

        // The 'moving window' of the last 10 change in errors are averaged and put into
        // the second array.
        if (this._error.length > 10) {
            this._error.shift();
            var avg = average(this._error);
            this._error2.push(avg);
        }

        // The last 10 moving window averages.
        if (this._error2.length > 10) {
            this._error2.shift();
        }

        this._error.push(this._prevErr - err);
        this._tests++;
    },

    /**
     * Sets the number of tests
     * @param {Number} tests
     */
    setTests: function(tests) {
        this._tests = tests;
    },

    isConverged: function() {
        if (this.isMLPNetwork()) {
            return this._isConvergedMLP();
        }
        return this._isConvergedEVO();
    },

    /**
     * If this network is an mlp network
     * @return {Boolean}
     */
    isMLPNetwork: function() {
        return _.contains(MLP_NETWORKS, this.network.name);
    },

    /**
     * If the network has converged based on error.
     * @return {Boolean}
     */
    _isConvergedEVO: function() {
        if (this._error2.length < 10) {
            return false;
        }

        // makes sure we are not gaining error.
        var s1 = 0, s2 = 0;
        for (var i = 0, len = this._error2.length / 2; i < len; i++) {
            s1 += this._error2[i];
        }
        for (len = this._error2.length; i < len; i++) {
            s2 += this._error2[i];
        }
        if (s1 > s2 * 1.02) {
            return true;
        }
    },

    _isConvergedMLP: function() {
        if (this._error2.length < 10) {
            return false;
        }

        // Base idea of convergence.  If the maximum difference from the overal average
        // to each moving window average is below some required amount then were considered converged.
        var requiredAmount = this.avgConvergeLim + this._incrementor * this._tests;
        var avg = average(this._error2);
        var largestDiff = 0;
        for (var i = 0; i < this._error2.length; i++) {
            var diff = Math.abs(avg - this._error2[i]);
            if (diff > largestDiff) {
                largestDiff = diff;
            }
        }


        // Checks to see if the threshold is met.
        if (Math.sqrt(largestDiff) < requiredAmount) {
            return true;
        }
    }
};

module.exports = Converge;
