var $ = require('jquery');
var Neuron = require('./lib/Neuron');
var NetworkUtil = require('./lib/NetworkUtil');

/**
 * The network states
 * @type {{}}
 */
var States = {
    FeedForward: 'ff',
    BackProp: 'bp',
    WeightCalc: 'wc'
};

/**
 * Creates a new neural network.  The configuration can contain any of the defined
 * properties within the constructor.
 *
 * @param {{
 *     eta: Number,
 *     hiddenLayerCount: Number,
 *     outputCount: Number,
 *     hiddenLayerNeuronCount: Number,
 *     alpha: Number,
 *     momentum: Boolean,
 *     phiFunction: Function
 * }} configuration  The configuration has the following parameters,
 *      eta: should be between 0 - 1.
 *      alpha: should be between 0 - 1.  Momentum coefficient
 *      momentum: boolean (alpha * previous delta weight)
 *      hiddenLayerNeuronCount: the amount of neurons in the hidden layers
 *      outputCount: the amount of outputs
 *      hiddenLayerCount: the amount of hidden layers
 *      phiFunction: A phi function.  Used in post processing of outputs of neurons.  This uses the sigmoid training fn
 * @constructor
 */
var NeuralNetwork = function(configuration) {
    this.alpha = 0;

    // Adjustable parameters
    this.hiddenLayerCount = 0;
    this.outputCount = 1;
    this.hiddenLayerNeuronCount = 5;
    this.inputLayerCount = 2;

    // Between 0 - 1
    this.eta = 0.05;
    this.alpha = 0.5;
    this.momentum = false;
    this.phiFunction = NetworkUtil.functions(NetworkUtil.Types.Sigmoid);
    this.linearOutputError = true;
    this.newLine = '<br/>';

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

    /**
     * The mean squared error.
     */
    this._mse = 0;

    /**
     * Training count
     */
    this._trainingCount = 0;

    /**
     * Contains the previous MSE.  Only contains 4 at a time and checks for convergance.
     * @type {Number[]}
     * @private
     */
    this._previousMSE = [];

    /**
     * The amount of MSE's that have to be the same.
     * @type {Number}
     * @private
     */
    this._converganceRequireCount = 4;

    /**
     * the total time spent training
     * @type {number}
     * @private
     */
    this._timeSpentTraining = 0;

    $.extend(this, configuration);
    this._initialize();
};

/**
 * The set of helper functions
 * @type {{}}
 */
NeuralNetwork.prototype = {
    train: function(inputs, expectedOutputs) {
        this._trainingCount++;
        var t = Date.now();

        // Set the first layer (input) inputs to the provided set.
        this._setInputs(inputs);

        // feed forward the changes
        this._feedForward();

        // the back propagation changes.
        this._backpropErrorCalculation(expectedOutputs);

        // Adjusts the weights of the network.
        this._adjustWeights();

        // Gets the total time spent training this round
        this._timeSpentTraining += Date.now() - t;
    },

    test: function(inputs) {
        this._setInputs(inputs);
        this._feedForward();

        return this._getOutput();
    },

    /**
     * Gets the basic stats of the neural network
     * @returns {Array}
     */
    getStats: function() {
        return [this._timeSpentTraining, this._trainingCount];
    },

    /**
     * If the neural net "thinks" its converged
     * @returns {Boolean}
     */
    isConverged: function() {
        if (this._previousMSE.length !== this._converganceRequireCount) {
            return false;
        }
        for (var i = 0; i < this._converganceRequireCount - 1; i++) {
            if (this._previousMSE[i] !== this._previousMSE[i + 1]) {
                return false;
            }
        }

        return true;
    },

    /**
     * Prints out current state.
     */
    toString: function() {
        var str = 'Training: ' + this._trainingCount + ' :: Time: ' + this._timeSpentTraining + ' -- ';
        for (var i = 0; i < this._layers.length; i++) {
            var layer = this._layers[i];
            for (var j = 0; j < layer.length; j++) {
                str += layer[j].toString() + this.newLine;
            }
        }
        str += 'MSE: ' + this._mse + this.newLine;

        return str;
    },

    /**
     * Adds an mse to the previous mse list
     * @param {Number} mse
     * @private
     */
    _addMSE: function(mse) {
        if (this._previousMSE.length === this._converganceRequireCount) {
            this._previousMSE.shift();
        }
        this._previousMSE.push(mse);
    },

    /**
     * Gets the current output of the network.
     * @private
     */
    _getOutput: function() {
        var out = [];
        for (var i = 0; i < this._outputs.length; i++) {
            var output = this._outputs[i].output;
            out.push(Math.round(output * 10000) / 10000);
        }

        return out;
    },

    /**
     * Initializes the neural function
     * @private
     */
    _initialize: function() {
        // We keep a reference to inputs.  For simplicity's sake
        var inputs = this._inputs;
        var length = this.hiddenLayerNeuronCount + 1;
        var i = 0;

        this._layers.push(inputs);

        // Builds the inputs
        var l = this.inputLayerCount + 1;
        for (i = 0; i < l; i++) {
            if (i + 1 === l) {
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
            outputs.push(Neuron('Output: ' + i));
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
                    neuron.w.push(this._randomWeight(1));
                    neuron.deltaW.push(0);
                    neuron.tempDeltaW.push(0);
                }
            }
        }
    },

    /**
     * generates a random weight within -size to size
     * @returns {number}
     * @private
     */
    _randomWeight: function(size, negative) {
        var r = Math.random();
        return Math.floor(r * size * 10) / 10 * (negative && Math.floor(r * 100) % 2 === 0 ? -1 : 1);
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

            // Output does not get the phi function
            oN.input = sum;
            oN.output = sum;
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

            if (this.linearOutputError) {
                o.error = eDelta;
            } else {

                // delta out * (1 - out) * (expected - out);
                o.error = oOut * (1 - oOut) * eDelta;
            }

            this._mse += o.error;
            this._addMSE(this._mse);
        }

        // The hidden layer back prop calculations
        for (var hIdx = this._layers.length - 2; hIdx > 0; hIdx--) {
            var currLayer = this._layers[hIdx];
            var nextLayer = this._layers[hIdx + 1];

            for (var cIdx = 0, cLen = currLayer.length; cIdx < cLen; cIdx++) {
                var errorSum = 0;
                var c = currLayer[cIdx];

                // gets the error from the layer ahead
                for (var nIdx = 0, nLen = nextLayer.length; nIdx < nLen; nIdx++) {
                    var n = nextLayer[nIdx];
                    errorSum += n.error * n.w[cIdx];
                }

                var delta = c.output * (1 - c.output);
                c.error = errorSum * delta;
            }
        }
    },

    /**
     * Adjusts the weights of the network.
     * @private
     */
    _adjustWeights: function() {

        // Calculate weight step change
        var layerIdx = 0, cIdx = 0, pIdx = 0, c;

        /**
         * @type {Neuron[]}
         */
        var layer = null;
        /**
         * @type {Neuron[]}
         */
        var pLayer = null;

        for (layerIdx = this._layers.length - 1; layerIdx > 0; layerIdx--) {
            layer = this._layers[layerIdx];
            pLayer = this._layers[layerIdx - 1];

            // c === current
            // Loops through all the neurons of the current layer
            for (cIdx = 0, cLen = layer.length; cIdx < cLen; cIdx++) {
                c = layer[cIdx];

                // p === previous
                // Loops through all the neurons from the previous layer.
                for (pIdx = 0, pLen = pLayer.length; pIdx < pLen; pIdx++) {

                    //adjusts by equation
                    // eta * Err(current) * out(previous) 6.8
                    c.tempDeltaW[pIdx] += this.eta * c.error * pLayer[pIdx].output;
                } // for each connection
            } // for each layer
        } // for each layer

        for (layerIdx = this._layers.length - 1; layerIdx > 0; layerIdx--) {
            layer = this._layers[layerIdx];
            pLayer = this._layers[layerIdx - 1];

            // c === current
            // Loops through all the neurons of the current layer
            for (cIdx = 0, cLen = layer.length; cIdx < cLen; cIdx++) {
                c = layer[cIdx];

                // p === previous
                // Loops through all the neurons from the previous layer.
                for (pIdx = 0, pLen = pLayer.length; pIdx < pLen; pIdx++) {

                    var dW = c.deltaW[pIdx] * this.alpha;
                    dW += c.tempDeltaW[pIdx];
                    c.deltaW[pIdx] = dW;
                    c.w[pIdx] += dW;
                    c.tempDeltaW[pIdx] = 0;
                } // for each connection
            } // for each layer
        } // for each layer
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
            sum += layer[i].output * w[i];
        }

        return sum;
    }
};

module.exports = NeuralNetwork;