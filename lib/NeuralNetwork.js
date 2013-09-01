var Neuron = require('Neuron');

var NeuralNetwork = function(configuration) {
    /**
     * @type {Array.<Neuron>}
     * @private
     */
    this._inputs = [];

    /**
     * The set of outputs
     * @type {Array.<Neuron>}
     * @private
     */
    this._outputs = [];

    /**
     * The set of layers
     * @type {Array.<Array.<Neuron>>}
     * @private
     */
    this._layers = [];

    /**
     * The width of the layer
     * @type {number}
     */
    this.layerWidth = 1;

    /**
     * The count of layers
     * @type {number}
     */
    this.layers = 1;

    /**
     * The width of the output.  Typically set to 1
     * @type {number}
     */
    this.outputWidth = 1;

    $.extend(this, configuration);

    // Constructs the network
    this._construct();
};

NeuralNetwork.prototype = {
    /**
     * Constructs a network
     * @private
     */
    _construct: function() {
        var i;
        for (i = 0; i < this.layerWidth; i++) {
            this._inputs.push(new Neuron());
        }

        //Goes through and connects each layer to the previous layer
        for (i = 1; i < this.layers; i++) {
            // TODO: Figure out multi-layer networks
        }

        // Connects the last layer to the output
        // TODO: ^--- Previous applies here as well. lastLayer === the last calculated layer
        var lastLayer = this._inputs;

        for (i = 0; i < this.outputWidth; i++) {
            this._outputs.push(new Neuron());
        }

        for (i = 0; i < this.outputWidth; i++) {
            var output = this._outputs[i];

            for (var j = 0; j < this.layers; j++) {

                // TODO: Determine some random weight calculator
                Neuron.connect(lastLayer[j], output, this._getRandomWeight(j));
            }
        }
    },

    /**
     * Fires the input nodes
     * @param {Array.<Number>} inputs
     */
    input: function(inputs) {
        for (var i = 0; i < this.layers; i++) {
            this._inputs[i].forceFire(inputs[i]);
        }
    },

    /**
     * Gets a random weight value
     * @param {Number} idx
     * @private
     */
    _getRandomWeight: function(idx) {
        return Math.floor(Math.random() * 100) * (idx % 2 === 0 ? -1 : 1);
    }
};

/**
 * @type {NeuralNetwork}
 */
module.exports = NeuralNetwork;
