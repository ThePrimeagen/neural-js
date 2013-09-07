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
 *     activationFunction: Function
 * }} configuration  The configuration has the following parameters,
 *      eta: should be between 0 - 1.
 *      alpha: should be between 0 - 1.  Momentum coefficient
 *      momentum: boolean (alpha * previous delta weight)
 *      hiddenLayerNeuronCount: the amount of neurons in the hidden layers
 *      outputCount: the amount of outputs
 *      hiddenLayerCount: the amount of hidden layers
 *      activationFunction: A phi function.  Used in post processing of outputs of neurons.  This uses the logisticFunction training fn
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
    this.eta = 0.0001;
    this.alpha = 0.5;
    this.momentum = false;
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

        return this.getOutput();
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
        var str = 'Training: ' + this._trainingCount + ' :: Time: ' + this._timeSpentTraining + this.newLine;
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
    getOutput: function() {
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
        var actFn = NetworkUtil.activationFunction(NetworkUtil.Types.Linear);
        var dAct = NetworkUtil.dActivationFunction(NetworkUtil.Types.Linear);
        for (i = 0; i < this.outputCount; i++) {
            var n = Neuron('Output: ' + i);
            n.activationFn = actFn;
            n.dActivationFn = dAct;
            outputs.push(n);
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
                    neuron.w.push(this._randomWeight(1, true));
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
        var n = (negative && Math.floor(r * 100) % 2 === 0 ? -1 : 1);
        var value = Math.floor(r * size * 10) / 10 * n;

        // do not accept random 0 values
        return value || 0.1 * n;
    },

    /**
     * Sets the inputs.
     * @param {Array.<Number>} inputs
     * @private
     */
    _setInputs: function(inputs) {
        // Set the input layer
        for (var i = 0; i < this._inputs.length - 1; i++) {
            this._inputs[i].input = inputs[i];
            this._inputs[i].output = inputs[i];
        }

        // bias calculation
        this._inputs[this._inputs.length - 1].output = 1;
    },

    /**
     * Feeds the network the changes starting from inputs
     * @private
     */
    _feedForward: function() {
        var curr = null, prev = null, cN = 0, pN = 0, cLen = 0, pLen = 0;

        // Goes through all hidden layers
        for (var i = 1; i < this._layers.length - 1; i++) {
            curr = this._layers[i];
            prev = this._layers[i - 1];

            for (cN = 0, cLen = curr.length; cN < cLen; cN++) {

                // Bias node calculation
                if (cN + 1 === cLen) {
                    curr[cN].output = 1;
                    continue;
                }

                var c = curr[cN];
                var sum = 0;
                var w = c.w;

                for (pN = 0, pLen = prev.length; pN < pLen; pN++) {
                    sum += w[pN] * prev[pN].output;
                }

                c.input = sum;
                c.output = c.activationFn(sum);
            }
        }

        var outs = this._outputs;
        prev = this._layers[this._layers.length - 2];
        for (var oN = 0, oLen = outs.length; oN < oLen; oN++) {
            var o = outs[oN];
            var sum = 0;

            for (pN = 0, pLen = prev.length; pN < pLen; pN++) {
                sum += prev[pN].output * o.w[pN];
            }

            /// TODO: Does output need activation function?
            o.input = sum;
            o.output = o.activationFn(sum);
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

        // Output layer
        for (var i = 0; i < this._outputs.length; i++) {
            var o = this._outputs[i];
            o.error = targetOutputs[i] - o.output;
            this._mse += o.error * o.error;
        }

        // Go through hidden layers
        for (var cIdx = this._layers.length - 2; cIdx > 0; cIdx--) {
            var curr = this._layers[cIdx];
            var next = this._layers[cIdx + 1];

            // Go through hidden neurons
            for (var hN = 0, hLen = curr.length; hN < hLen; hN++) {
                var h = curr[hN];
                var sum = 0;

                for (var nN = 0, nLen = next.length; nN < nLen; nN++) {
                    var n = next[nN];
                    sum += n.w[hN] * n.error;
                }
                h.error = sum * n.dActivationFn(n.output);
            }
        }
    },

    /**
     * Adjusts the weights of the network.
     * @private
     */
    _adjustWeights: function() {

        // For every layer
        for (var cL = this._layers.length - 1; cL > 0; cL--) {
            var curr = this._layers[cL];
            var prev = this._layers[cL - 1];

            // for every neuron
            for (var cN = 0, cLen = curr.length; cN < cLen; cN++) {
                var c = curr[cN];

                // for every past neuron
                for (var pN = 0, pLen = prev.length; pN < pLen; pN++) {
                    var d = this.eta * c.error * prev[pN].output;
                    if (this.momentum) {
                        c.deltaW[pN] = d + c.deltaW[pN] * this.alpha;
                    } else {
                        c.deltaW[pN] = d;
                    }

                    c.w[pN] += c.deltaW[pN];
                }
            }
        }
    }
};

module.exports = NeuralNetwork;