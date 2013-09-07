var d3 = require('d3');

/**
 * Takes in a selector and an artifical neural network
 * @param {String} selector
 * @param {NeuralNetwork} ann
 * @constructor
 */
var D3Visualizer = function(selector, ann) {
    this.host = d3(selector);
    this._ann = ann;

    this._initialize();
};

/**
 * The D3 Visualizer
 * @type {{}}
 */
D3Visualizer.prototype = {

    /**
     * Takes the host element and pumps in the current state of the artifical neural network.
     * @private
     */
    _initialize: function() {

    }
};

