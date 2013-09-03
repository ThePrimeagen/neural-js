var $ = require('jquery');
var Neuron = require('./lib/Neuron');
var NetworkUtil = require('./lib/NetworkUtil');

/**
 * Creates a new neural network.  The configuration can contain any of the defined
 * properties within the constructor.
 *
 * @param {{}} configuration
 * @constructor
 */
var NeuralNetwork = function(configuration) {
    this.alpha = 0;

    // Adjustable parameters
    this.hiddenLayerCount = 1;
    this.outputCount = 1;
    this.layerLength = 5;
    this.eta = 0.05;
    this.phiFunction = NetworkUtil.activationFunction(NetworkUtil.Types.HyperbolicTangent);

    /**
     * @type {Neuron[]}
     * @private
     */
    this._inputs = [];
    /**
     * @type {Neuron[]}
     * @private
     */
    this._outputs = [];
    /**
     * @type {Array.<Neuron[]>}
     */
    this._layers = [];

    $.extend(this, configuration);
    this._initialize();
};

/**
 * The set of helper functions
 * @type {{}}
 */
NeuralNetwork.prototype = {
    train: function(inputs, expectedOutputs) {

        // Set the first layer (input) inputs to the provided set.
        this._setInputs(inputs);

        // feed forward the changes
        this._feedForward();

        // the back propagation changes.
        this._backpropErrorCalculation(expectedOutputs);
    },

    /**
     * Prints out current state.
     */
    toString: function() {
        var str = '';
        for (var i = 0; i < this._layers.length; i++) {
            var layer = this._layers[i];
            for (var j = 0; j < layer.length; j++) {
                str += layer[j].toString() + '\n'
            }
            str += '\n';
        }

        return str;
    },

    /**
     * Initializes the neural function
     * @private
     */
    _initialize: function() {
        // We keep a reference to inputs.  For simplicity's sake
        var inputs = this._inputs;
        var length = this.layerLength + 1;
        var i = 0;

        this._layers.push(inputs);

        // Builds the inputs
        for (i = 0; i < length; i++) {
            if (i + 1 === length) {
                inputs.push(Neuron('Input: Bias'));
            } else {
                inputs.push(Neuron('Input: ' + i));
            }
        }

        // Builds the hidden _layers
        for (i = 0; i < this.hiddenLayerCount; i++) {
            var hiddenLayer = [];
            this._layers.push(hiddenLayer);
            for (var j = 0; j < length; j++) {
                if (j + 1 === length) {
                    hiddenLayer.push(Neuron('Hidden(' + i + '): Bias'));
                } else {
                    hiddenLayer.push(Neuron('Hidden(' + i + '): ' + j));
                }
            }
        }

        // Builds the output
        var outputs = this._outputs;
        this._layers.push(outputs);
        for (i = 0; i < this.outputCount; i++) {
            if (i + 1 === length) {
                outputs.push(Neuron('Output: Bias'));
            } else {
                outputs.push(Neuron('Output: ' + i));
            }
        }

        // Randomly sets weights between -2.5 to 2.5
        var len;
        for (i = 1, len = this._layers.length; i < len; i++) {
            var layer = this._layers[i];
            var prevLayer = this._layers[i - 1];

            for (j = 0; j < layer.length; j++) {
                var neuron = layer[j];
                for (var k = 0; k < prevLayer.length; k++) {

                    // Pushes a random weight onto the stack for each previous layer
                    neuron.w.push(this._randomWeight(2.5));
                }
            }
        }
    },

    /**
     * generates a random weight within -size to size
     * @returns {number}
     * @private
     */
    _randomWeight: function(size) {
        var r = Math.random();
        return Math.floor(r * size * 10) / 10 * (Math.floor(r * 100) % 2 === 0 ? -1 : 1);
    },

    /**
     * Sets the inputs.
     * @param {Array.<Number>} inputs
     * @private
     */
    _setInputs: function(inputs) {
        // Set the input layer
        for (var i = 0; i < this._inputs.length; i++) {
            this._inputs[i].input = inputs[i];
        }
    },

    /**
     * Feeds the network the changes starting from inputs
     * @private
     */
    _feedForward: function() {
        var i = 0, j = 0;
        var len = 0;
        var prevLayer = null;
        var sum = 0;

        // The initial feeding forward from the input loop.
        for (i = 0, len = this._inputs.length; i < len; i++) {
            if (i + 1 === len) {
                // The last node (bias node) is always activated
                this._inputs[i].output = 1;
            } else {
                this._inputs[i].output = this._inputs[i].input;
            }
        }

        // The hidden layer calculation
        for (i = 0, len = this.hiddenLayerCount; i < len; i++) {
            var layer = this._layers[i + 1];
            prevLayer = this._layers[i];

            for (var nIdx = 0; nIdx < layer.length; nIdx++) {
                var n = layer[nIdx];
                sum = this._sumLayer(prevLayer, n);

                n.input = sum;
                n.output = this.phiFunction(sum);
            }
        }

        // The output layer calculation
        prevLayer = this._layers[this._layers.length - 2];
        for (i = 0, len = this._outputs.length; i < len; i++) {
            var oN = this._outputs[i];
            sum = this._sumLayer(prevLayer, oN);

            oN.input = sum;
            oN.output = this.phiFunction(sum);
        }
    },

    /**
     * Goes through and calculates the error starting with the output
     * nodes to the input nodes.
     *
     * @param {Number[]} targetOutputs
     * @private
     */
    _backpropErrorCalculation: function(targetOutputs) {

        // Output error calculations
        for (var oIdx = 0, len = this._outputs.length; oIdx < len; oIdx++) {
            var o = this._outputs[oIdx];
            var oOut = o.output;
            var eDelta = targetOutputs[oIdx] - oOut;

            // TODO: Parameterize this
            o.error = oOut * (1 - oOut) * eDelta;

            // TODO: mse?
        }

        // The hidden layer back prop calculations
        for (var hIdx = 0, len = this.hiddenLayerCount; hIdx < len; hIdx++) {
            var hiddenLayer = this._layers[len - hIdx];
            var nextLayer = this._layers[(len - hIdx) + 1];

            for (var cIdx = 0, cLen = hiddenLayer.length; cIdx < cLen; cIdx++) {
                var errorSum = 0;
                var h = hiddenLayer[cIdx];

                // gets the error from the layer ahead
                for (var nIdx = 0, nLen = nextLayer.length; nIdx < nLen; nIdx++) {
                    var n = nextLayer[nIdx];
                    errorSum += n.error * n.w[cIdx];
                }

                var delta = h.output * (1 - h.output);
                h.error = errorSum * delta;
            }
        }
    },

    // TODO: Weight Adjustment
    /**
     * Adjusts the weights of the network.
     * @private
     */
    _adjustWeights: function() {

    },

    /**
     * @param {Neuron[]} layer
     * @param {Neuron} neuron
     * @private
     */
    _sumLayer: function(layer, neuron) {

        var sum = 0;
        var w = neuron.w;
        for (var i = 0, len = layer.length; i < len; i++) {

            // Pushes in the 'bias' node as the last node.
            if (i + 1 === len) {
                sum += w[i];
            } else {
                sum += layer[i].output * w[i];
            }
        }

        return sum;
    },
};

module.exports = NeuralNetwork;