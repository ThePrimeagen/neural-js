var _ = require('lodash');
var $ = require('jquery');
var Neuron = require('./lib/Neuron');
var NetworkUtil = require('./lib/NetworkUtil');

var Layer = {
    /**
     * @type {Neuron[]}
     */
    neurons: []
};

var BookANN = function(config) {
    this.env = _.clone(Env);
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

    /**
     * @type {Layer[]}
     */
    this._arch = [];
    this._inputs = _.cloneDeep(Layer);
    this._outputs = _.cloneDeep(Layer);
    this._mse = 0;

    _.assign(this, config);
    this._initialize();
};

BookANN.prototype = {

    test: function(inputs, outputs) {
        this._setInputs(inputs);
        this._feedForward();
        return this.getOutput();
    },

    train: function(inputs, outputs) {
        this._setInputs(inputs);
        this._feedForward();
        this._backpropOutput(outputs);
        this._backpropHidden();
        this._tempWeightStepChange();
        this._weightStepChange();
        this._weightChange();
        return this.getOutput();
    },

    /**
     * Prints out current state.
     */
    toString: function() {
//        var str = 'Training: ' + this._trainingCount + ' :: Time: ' + this._timeSpentTraining + this.newLine;
        var str = '';
        for (var i = 0; i < this._arch.length; i++) {
            var layer = this._arch[i];
            for (var j = 0; j < layer.neurons.length; j++) {
                str += layer.neurons[j].toString() + this.newLine;
            }
        }
//        str += 'MSE: ' + this._mse + this.newLine;

        return str;
    },

    /**
     * Gets the current output of the network.
     * @private
     */
    getOutput: function() {
        var out = [];
        for (var i = 0; i < this._outputs.neurons.length; i++) {
            var output = this._outputs.neurons[i].output;
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
        var length = this.hiddenLayerNeuronCount + 1;
        var i = 0;
        var n;
        this._arch.push(this._inputs);
        var inputs = this._inputs;


        // Builds the inputs
        var l = this.inputLayerCount + 1;
        for (i = 0; i < l; i++) {
            n = Neuron();
            if (i + 1 === l) {
                n.bias = true;
                n.id = 'Input: Bias';
            } else {
                n.id = 'Input: ' + i;
            }
            inputs.neurons.push(n);
        }

        // Builds the hidden _layers
        for (i = 0; i < this.hiddenLayerCount; i++) {
            var hiddenLayer = _.clone(Layer);
            this._arch.push(hiddenLayer);
            for (var j = 0; j < length; j++) {
                n = this._createNeuron('Hidden(' + i + '): ' + j, this.hiddenActivationFn);
                if (j + 1 === length) {
                    n.bias = true;
                    n.id = 'Hidden(' + i + '): Bias';
                }
                hiddenLayer.neurons.push(n);
            }
        }

        // Builds the output
        var outputs = this._outputs;
        this._arch.push(outputs);
        for (i = 0; i < this.outputCount; i++) {
            outputs.neurons.push(this._createNeuron('Output(' + i + '): ', this.outputActivationFn));
        }

        // Randomly sets weights between -2.5 to 2.5
        var len;
        for (i = 1, len = this._arch.length; i < len; i++) {
            var layer = this._arch[i];
            var prevLayer = this._arch[i - 1];

            for (j = 0; j < layer.neurons.length; j++) {
                var neuron = layer.neurons[j];
                for (var k = 0; k < prevLayer.neurons.length; k++) {

                    // Pushes a random weight onto the stack for each previous layer
                    neuron.w.push(this._randomWeight(1, true));
                    neuron.deltaW.push(0);
                    neuron.tempDeltaW.push(0);
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
        var iNeurons = this._inputs.neurons;
        // Set the input layer
        for (var i = 0; i < this._inputs.neurons.length - 1; i++) {
            iNeurons[i].input = inputs[i];
            iNeurons[i].output = inputs[i];
        }

        // bias calculation
        iNeurons[iNeurons.length - 1].output = 1;
        iNeurons[iNeurons.length - 1].input = 1;
    },

    /**
     * Feeds the network the changes starting from inputs
     * @private
     */
    _feedForward: function() {
        var curr = null, prev = null, cN = 0, pN = 0, cLen = 0, pLen = 0;

        // Goes through all hidden layers
        for (var i = 1; i < this._arch.length - 1; i++) {
            curr = this._arch[i].neurons;
            prev = this._arch[i - 1].neurons;

            for (cN = 0, cLen = curr.length; cN < cLen; cN++) {

                // Bias node calculation
                if (cN + 1 === cLen) {
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
        prev = this._arch[this._arch.length - 2];
        for (var oN = 0, oLen = outs.neurons.length; oN < oLen; oN++) {
            var o = outs.neurons[oN];
            var sum = this._sumInputs(prev, o);

            /// TODO: Does output need activation function?
            o.input = sum;
            o.output = o.activationFn(sum);
        }
    },

    /**
     * Backprop output
     * @param {Number[]} expected
     * @private
     */
    _backpropOutput: function(expected) {
        for (var idx = 0; idx < this._outputs.neurons.length; idx++) {

            var o = this._outputs.neurons[idx];
            var exp = expected[idx];
            var err = exp - o.output;
            o.error = err;

            this._mse += err;
        }
    },

    /**
     * Backprop hidden
     * @private
     */
    _backpropHidden: function() {
        for (var l = this._arch.length - 2; l > 0; l--) {
            var layer = this._arch[l];
            var next = this._arch[l + 1];

            for (var cIdx = 0; cIdx < layer.neurons.length; cIdx++) {

                var sum = 0;
                if (layer.neurons[cIdx].bias) {
                    continue;
                }
                for (var nIdx = 0; nIdx < next.neurons.length; nIdx++) {

                    if (next.neurons[nIdx].bias) {
                        continue;
                    }

                    sum += next.neurons[nIdx].error * next.neurons.w[nIdx];
                }

                var t = layer.neurons[cIdx].output * (1 - layer.neurons[cIdx].output);
                layer.neurons[cIdx].error = t * sum;
            }
        }
    },

    /**
     * Changes the weight, but only in temp
     * @private
     */
    _tempWeightStepChange: function() {

        for (var l = this._arch.length - 1; l > 0; l--) {
            var layer = this._arch[l];
            var prev = this._arch[l - 1];

            for (var cIdx = 0; cIdx < layer.neurons.length; cIdx++) {
                var c = layer.neurons[cIdx];
                if (c.bias) {
                    continue;
                }

                for (var pIdx = 0; pIdx < prev.neurons.length; pIdx++) {
                    var p = prev.neurons[pIdx];
                    if (p.bias) {
                        continue;
                    }

                    var t = c.error * p.output;
                    t *= this.eta;

                    c.tempDeltaW[pIdx] += t;
                }

                c.tempDeltaW[layer.neurons.length - 1] += this.eta * c.error;
            }
        }
    },

    /**
     * The weight step change
     * @private
     */
    _weightStepChange: function() {

        for (var l = 1; l < this._arch.length; l++) {
            var layer = this._arch[l];
            var prev = this._arch[l - 1];

            for (var cIdx = 0; cIdx < layer.neurons.length; cIdx++) {
                var c = layer.neurons[cIdx];
                if (c.bias) {
                    continue;
                }

                for (var pIdx = 0; pIdx < prev.neurons.length; pIdx++) {
                    var p = prev.neurons[pIdx];

                    c.deltaW[pIdx] = c.tempDeltaW[pIdx];
                    c.tempDeltaW[pIdx] = 0;
                }
            }
        }
    },

    /**
     * The weight change
     * @private
     */
    _weightChange: function() {

        for (var l = 1; l < this._arch.length; l++) {
            var layer = this._arch[l];
            var prev = this._arch[l - 1];

            for (var cIdx = 0; cIdx < layer.neurons.length; cIdx++) {
                var c = layer.neurons[cIdx];
                if (c.bias) {
                    continue;
                }

                for (var pIdx = 0; pIdx < prev.neurons.length; pIdx++) {
                    var p = prev.neurons[pIdx];

                    c.w[pIdx] += c.deltaW[pIdx];
                }
            }
        }
    },
    /**
     * Sums the inputs from the neurons provided to n
     * @param {Layer} layer
     * @param {Neuron} n
     * @private
     */
    _sumInputs: function(layer, n) {
        var sum = 0;
        for (var i = 0; i < layer.neurons.length; i++) {
            if (layer.neurons[i].bias) {
                sum += n.w[i];
            } else {
                sum += n.w[i] * layer.neurons[i].output;
            }
        }

        return sum;
    }
};

var Env = {
    eta: 0.5,
    alpha: 0.1
};

module.exports = BookANN;
