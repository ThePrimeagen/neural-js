/**!
Author: Michael Paulson
Email: Michael.B.Paulson@gmail.com

## Motivations
Motivations for this program is to first fulfill the requirements of Soft Computing,
a class offered at Montana State University.  The class is taught by http://www.cs.jhu.edu/~jsquad/

The secondary motivation is to create an awesome piece of open-source neural network software
that can easily be used by any novice w/ basic understanding of neural networks.  The software is
to offer an easily customizable network with n hidden layers, back prop, ..., you name it! :)
*/

var $ = require('jquery');
var NeuralNetwork = require('NeuralNetwork');

var NeuralJS = (function(context) {
    /**
     * A null operator for functions
     * @returns {boolean}
     */
    var noOp = function() {return true;};

    /**
     * The configured neural network.
     * @param {{}} configuration
     * @constructor
     */
    var NeuralJS = function(configuration) {
        this.settings = $.extend({
            teacher: [
                [0], 0
            ],
            layers: 1
        }, configuration);

        /**
         * The underlying network
         * @type {NeuralNetwork}
         */
        this.network = new NeuralNetwork({
            layers: this.settings.layers,
            layerWidth: this.settings.teacher[0].length
        });
    };

    /**
     * The neural network can be reinitialized over and over again from the initial settings.
     * The network can be altered by calling "alter".
     * It can be recalculated by calling "train" over and over again.
     * Each time "test" is called it will store the results and can be retrieved by calling "results".
     * You can clear the results by calling "clear".
     * Finally you can test your network with "test".
     */
    NeuralJS.prototype = {
        alter: function(configuration) {
            $.extend(this.settings, configuration);
        },

        /**
         * Calculates the neural network and stores the results.  Results can be called by
         * "results" or "latestResults" depending on how many times called.
         */
        train: function() {

        },

        /**
         * Will test the current network with an input vector
         * @params {Array.<Number>} inputs
         */
        test: function(inputs) {

        },

        /**
         * will return the set of calculated results.
         * @returns {Array.<Neuron>} the set of neurons.
         */
        results: function() {

        },

        /**
         * will return the last set of calculated results.
         * @returns {Array.<Neuron>} the set of neurons.
         */
        latestResults: function() {

        },

        /**
         * Clears the results.
         */
        clear: function() {
            this._results = [];
        }
    };

    return NeuralJS;
})(this);

/**
 * Creates a new neural js
 * @param {{}} configuration
 * @returns {NeuralJS}
 */
module.exports = function(configuration) {
    return new NeuralJS(configuration);
};