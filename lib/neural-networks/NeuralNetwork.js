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
    this.eta = 0.00001;
    this.alpha = 0.5;
    this.momentum = false;
    this.newLine = '<br/>';
    this.outputActivationFn = NetworkUtil.Types.Linear;
    this.hiddenActivationFn = NetworkUtil.Types.Sigmoid;
    this.runOutputWeightChangeFirst = false;
    this.errorTolerance = 0.5;

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
        var t = Date.now();

        // Set the first layer (input) inputs to the provided set.
        this._setInputs(inputs);


        do {
            // feed forward the changes
            this._feedForward();

            // the back propagation changes.
            if (this.runOutputWeightChangeFirst) {
                this._backpropErrorOutput(expectedOutputs);
                this._adjustOutputWeights();
                this._backpropErrorHiddenCalculation();
                this._adjustHiddenWeights();
            } else {
                this._backpropErrorOutput(expectedOutputs);
                this._backpropErrorHiddenCalculation();
                this._adjustOutputWeights();
                this._adjustHiddenWeights();
            }

            this._trainingCount++;
        } while (this._continueBackprop());


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
     * Gets the error of the network
     * @returns {Array}
     */
    getError: function() {
        var out = [];
        for (var i = 0; i < this._outputs.length; i++) {
            out.push(this._outputs[i].error);
        }

        return out;
    },

    /**
     * allowable error tolerance
     */
    _continueBackprop: function() {
        var err = this.getError()[0];
        return Math.abs(err) > this.errorTolerance;
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
                var n = Neuron('Input: Bias');
                n.bias = true;
                inputs.push(n);
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
                    var n = this._createNeuron('Hidden(' + i + '): Bias', this.hiddenActivationFn);
                    n.bias = true;
                    hiddenLayer.push(n);
                } else {
                    hiddenLayer.push(this._createNeuron('Hidden(' + i + '): ' + j, this.hiddenActivationFn));
                }
            }
        }

        // Builds the output
        var outputs = this._outputs;
        this._layers.push(outputs);
        for (i = 0; i < this.outputCount; i++) {
            outputs.push(this._createNeuron('Output(' + i + '): ', this.outputActivationFn));
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
                    neuron.w.push(this._randomWeight(0.3, true));
                    neuron.deltaW.push(0);
                }
            }
        }
    },

    /**
     * Creates a neuron with the proper type of activation function
     * @param {String} id
     * @param {NetworkUtil.Types} actFnType
     * @returns {Neuron}
     * @private
     */
    _createNeuron: function(id, actFnType) {
        var n = Neuron(id);
        n.activationFn = NetworkUtil.activationFunction(actFnType);
        n.dActivationFn = NetworkUtil.dActivationFunction(actFnType);
        return n;
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
        this._inputs[this._inputs.length - 1].input = 1;
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
                if (curr[cN].bias) {
                    curr[cN].output = 1;
                    curr[cN].input = 1;
                    continue;
                }

                var c = curr[cN];
                var sum = this._sumInputs(prev, c);

                c.input = sum;
                c.output = c.activationFn(sum);
            }
        }

        var outs = this._outputs;
        prev = this._layers[this._layers.length - 2];
        for (var oN = 0, oLen = outs.length; oN < oLen; oN++) {
            var o = outs[oN];
            var sum = this._sumInputs(prev, o);

            /// TODO: Does output need activation function?
            o.input = sum;
            o.output = o.activationFn(sum);
        }
    },

    /**
     *
     * @param {Number[]} targetOutputs
     * @private
     */
    _backpropErrorOutput: function(targetOutputs) {

        // Output layer
        for (var i = 0; i < this._outputs.length; i++) {
            var o = this._outputs[i];
            var out = o.output;
            o.error = o.dActivationFn(o.output) * (targetOutputs[i] - out);
            this._mse += o.error * o.error;
        }
    },

    /**
     * Goes through and calculates the error starting with the output
     * nodes to the input nodes.
     *
     * @param {Number[]} targetOutputs
     * @private
     */
    _backpropErrorHiddenCalculation: function() {

        // Go through hidden layers
        for (var cIdx = this._layers.length - 2; cIdx > 0; cIdx--) {
            var curr = this._layers[cIdx];
            var next = this._layers[cIdx + 1];

            // Go through hidden neurons
            for (var hN = 0, hLen = curr.length; hN < hLen; hN++) {
                var h = curr[hN];
                if (h.bias) {
                    continue;
                }

                var sum = 0;
                for (var nN = 0, nLen = next.length; nN < nLen; nN++) {
                    var n = next[nN];
                    if (n.bias) {
                        continue;
                    }

                    sum += n.w[hN] * n.error;
                }
                h.error = sum * h.dActivationFn(h.output);
            }
        }
    },

    /**
     * Adjusts the output weights
     * @private
     */
    _adjustOutputWeights: function() {

        var outputs = this._outputs;
        var prev = this._layers[this._layers.length - 2];

        // for every neuron
        for (var oN = 0, oLen = outputs.length; oN < oLen; oN++) {
            var o = outputs[oN];
            if (o.bias) {
                continue;
            }

            // for every past neuron
            for (var pN = 0, pLen = prev.length; pN < pLen; pN++) {

                var p = prev[pN];
                var d = this._weightDeltaCalc(o, p);

                if (this.momentum) {
                    o.deltaW[pN] = d + o.deltaW[pN] * this.alpha;
                } else {
                    o.deltaW[pN] = d;
                }

                o.w[pN] += o.deltaW[pN];
            }
        }
    },

    /**
     * Adjusts the weights of the network.
     * @private
     */
    _adjustHiddenWeights: function() {

        // For every layer
        for (var cL = this._layers.length - 2; cL > 0; cL--) {
            var curr = this._layers[cL];
            var prev = this._layers[cL - 1];

            // for every neuron
            for (var cN = 0, cLen = curr.length; cN < cLen; cN++) {
                var c = curr[cN];
                if (c.bias) {
                    continue;
                }

                // for every past neuron
                for (var pN = 0, pLen = prev.length; pN < pLen; pN++) {

                    var p = prev[pN];
                    var d = this._weightDeltaCalc(c, p);

                    if (this.momentum) {
                        c.deltaW[pN] = d + c.deltaW[pN] * this.alpha;
                    } else {
                        c.deltaW[pN] = d;
                    }

                    c.w[pN] += c.deltaW[pN];
                }
            }
        }
    },

    /**
     * Sums the inputs from the layer to the neuron.  Includes bias node
     * calculations
     * @param {Neuron[]} layer
     * @param {Neuron} neuron
     * @returns {Number}
     * @private
     */
    _sumInputs: function(layer, neuron) {
        var sum = 0;
        var w = neuron.w;

        for (var idx = 0, len = layer.length - 1; idx < len; idx++) {
            sum += w[idx] * layer[idx].output;
        }
        sum += w[len];

        return sum;
    },

    /**
     * Calculates the weight change delta
     * @param {Neuron} c
     * @param {Neuron} p
     * @private
     */
    _weightDeltaCalc: function(c, p) {

        var d;
        if (p.bias) {
            d = this.eta * c.error;
        } else {
            d = this.eta * c.error * p.output;
        }
        return d;
    }
};

module.exports = NeuralNetwork;