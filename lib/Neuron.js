var NeuronConnector = require('NeuronConnector');
/**
 * @type {Observable}
 */
var Observable = require('Observable')

/**
 * Creates a new neuron with an initial weight
 * @param {Number} initialWeight
 * @constructor
 */
var knownKeys = {};

/**
 * Gets a key
 * @returns {Number}
 */
function getKey() {
    var k = Date.now();
    while (!!knownKeys[k]) {
        k++;
    }

    return k;
}

/**
 * Neuron.  A node in the neural network
 * @constructor
 */
var Neuron = function() {
    /**
     * @type {{}}
     * @private
     */
    this._inputs = {};
    this._inputCount = 0;
    this._firedInputs = [];
    this.id = getKey();

    /**
     * The subscriber function.  This will fire on output of neuron
     * @type {Observable}
     */
    this.subscribe = Observable.observable();
};

Neuron.prototype = {
    /**
     * Adds a connection the node.
     * @param {Neuron} neuron
     * @param {Number} weight
     */
    addInput: function(neuron, weight) {
        this._inputs[neuron.id] = NeuronConnector(neuron, weight);
        this._inputCount++;
    },

    /**
     * a fire from an input node
     * @param {Neuron} neuron
     * @param {Number} value
     */
    receive: function(neuron, value) {
        this._firedInputs.push([neuron, value]);

        if (this._firedInputs.length === this._inputCount) {
            this._fire();
        }
    },

    /**
     * Force fires to the output
     * @param value
     */
    forceFire: function(value) {
        this.subscribe.dispatch(value);
    },

    /**
     * Adjusts the input neurons
     */
    adjust: function() {
        // TODO: Adjusting the input neurons weights
    },

    /**
     * Once the set of inputs have all fired, this neuron will fire.
     * @private
     */
    _fire: function() {
        // TODO: Calculate based on inputs
        var outputValue = 1;
        this.subscribe.dispatch(outputValue);
    }
};

/**
 * Connects two neurons with an initial weight.  a -> b w/ weight w
 * @param {Neuron} a
 * @param {Neuron} b
 * @param {Number} w
 */
Neuron.connect = function(a, b, w) {
    b.addInput(a, w);
};

/**
 * Creates a new neuron
 * @returns {Neuron}
 */
module.exports = Neuron;

