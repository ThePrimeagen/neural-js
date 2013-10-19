var ANN = require('./NeuralNetwork');
var _ = require('lodash');
var NetworkMath = require('./lib/NetworkMath');
var NetworkStates = require('./lib/NetworkStates');
var FuzzyUtil = require('../ANFIS/FuzzyUtil');
var ANFISNeuron = require('./lib/ANFISNeuron');
var clusterfck = require('clusterfck');
var matrix = require('rx-data').matrix;

var ANFISNetwork = function(configuration) {
    /**
     * @type {Array.<Number[]>}
     */
    this.initialCenters = [];
    /**
     * @type {number}
     */
    this.initialSigma = 1;

    /**
     * Calculates the sigma
     * @type {boolean}
     */
    this.calculateSigma = false;

    /**
     * Gamma, its a really large positive number
     * @type {number}
     */
    this.gamma = 1000;

    /**
     * The learning decay rate.  
     * @type {Number}
     */
    this.lambda = 0.9;

    ANN.apply(this, [configuration]);

    // We keep our learning rate constant to reduce the amount of tunable parameters
    this.eta = 0.05;
    this._c = [];
};

ANFISNetwork.prototype = _.assign(ANFISNetwork.prototype, ANN.prototype);
ANFISNetwork.prototype = _.assign(ANFISNetwork.prototype, {
    reset: function() {
        // TODO: Reset coeffs of the membership and defuzz layer.
    },
    _initialize: function() {

        this._createInputLayer();
        this.M = this._inputs.length;

        // Creates the Sigma matrix
        this.S = [];
        for (var i = 0; i < this.M; i++) {
            var row = [];
            for (var j = 0; j < this.M; j++) {
                if (j === i) {
                    row.push(this.gamma);
                } else {
                    row.push(0);
                }
            }
            this.S.push(row);
        }

        this._createIfLayer();
        this._createRuleLayer();
        this._createNormLayer();
        this._createDefuzzLayer();
        this._createOutputLayer();
        this._inverseLambda = 1 / this.lambda
    },
    _createIfLayer : function() {
        var layer = [];
        for(var i = 0; i < this.initialCenters.length; i++) {
            var neuron = new ANFISNeuron('IF(' + i + '): ' + this.initialCenters[i]);
            neuron.sigma = 0.231;
            neuron.inPntrs.push(this._inputs[Math.floor(i / this.numIfs)]);
            neuron.center = this.initialCenters[i];

            layer.push(neuron);
        }


        this._layers.push(layer);
    },
    _createRuleLayer : function() {
        var layer = [];
        var layerSize = this.numIfs * this._inputs.length;
        for (var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron('Rules(' + i + '): ')
            layer.push(neuron);

            for(var j = i % this.numIfs; j < layerSize; j += this.numIfs) {
                neuron.inPntrs.push(this._layers[1][j]);
                this._layers[1][j].outPntrs.push(neuron);
            }
        }

        this._layers.push(layer);
    },
    _createNormLayer : function() {
        var layer = [];
        var layerSize = this.numIfs * this._inputs.length;
        
        for (var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron('Norm(' + i + '): ');
            layer.push(neuron);

            for (var j = 0; j < layerSize; j++) {
                neuron.inPntrs.push(this._layers[2][j]);
                this._layers[2][j].outPntrs.push(neuron);
            }
        }

        this._layers.push(layer);
        this._normLayer = layer;
    },
    _createDefuzzLayer : function() {
        var layer = [];
        var layerSize = this.numIfs * this._inputs.length;
        var self = this;
        for (var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron('Defuzz(' + i + '): ');

            // Creates X (unknown) matrix Mx1
            neuron.X = [];
            for (var j = 0; j < this.M; j++) {
                neuron.X.push(0);
            }
            neuron.X = matrix.transform([neuron.X]);

            layer.push(neuron);

            neuron.inPntrs.push(this._layers[3][i]);
            this._layers[3][i].outPntrs.push(neuron);
            this._c.push(Math.random());
        }
        this._layers.push(layer);
        this._defuzzLayer = layer;
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
            this._inputs[i].output = inputs[i];
        }
    },
    _feedForward : function () {
        //layer 1
        for (var i = 0; i < this._layers[1].length; i++) {
            var n = this._layers[1][i];
            n.output = NetworkMath.gaussian(n.inPntrs[0].output, 
                                                n.coefficients[0], 
                                                n.center[0]);
        }

        //layer 2
        for (var i = 0; i < this._layers[2].length; i++) {
            var inputValues = [];
            for (var j = 0; j < this._layers[2][i].inPntrs.length; j++) {
                inputValues.push(this._layers[2][i].inPntrs[j].output);
            }
            this._layers[2][i].output = NetworkMath.tnormFunction(inputValues);
        }

        //layer 3
        var sum = 0;
        var inPntrs = this._layers[3][0].inPntrs;
        for (var j = 0; j < inPntrs.length; j++) {
            sum += inPntrs[j].output;
        }
        for (var i = 0; i < this._layers[3].length; i++) {
            this._layers[3][i].output = inPntrs[i].output / sum;
        }

        //layer 4
        var inputValues = [];
        for (var j = 0; j < this._inputs.length; j++) {
            inputValues.push(this._inputs[j].output);
        }
        for (var i = 0; i < this._layers[4].length; i++) {
            var neuron = this._layers[4][i];
            neuron.output = neuron.inPntrs[0].output * NetworkMath.takagiSugenoFunction(inputValues, neuron.X);
        }

        //layer 5
        var prevLayer = this._layers[4];
        var outputLayer = this._outputs;
        for (var i = 0; i < outputLayer.length; i++) {
            var sum = 0;
            for (var j = 0; j < prevLayer.length; j++) {
                sum += prevLayer[j].output;
            }

            outputLayer[i].output = sum;
        }
    },
    /**
     * To make our network still operate as normal we designated adjustOutputWeights
     * as our learning method.  Don't be deceived by the name!  The name is a throwback 
     * from inheritance from NeuralNetwork
     */
    _backpropErrorOutput: function(expectedOutputs) {

        // ---------------------------------------------------
        // Forward Pass: Consequence variable tuning
        // ---------------------------------------------------
        var aT = [this.inputs];
        var a = matrix.transform(aT);
        var b = [this.expectedOutputs];

        // S(i + 1) calculations.  This is required to be caluclated
        // before X(i + 1)
        var aTmulS = matrix.multiply(aT, this.S);
        var numerator = matrix.multiply(matrix.multiply(this.S, a), aTmulS);
        var denom = this.lambda + matrix.multiply(aTmulS, a)[0][0];
        var rightHand = matrix.subtract(this.S, matrix.multiply(numerator, 1 / denom));
        var Sip1 = matrix.multiply(rightHand, this._inverseLambda);

        // X (i + 1) Calculations, requires S(i + 1)

        var defuzzLayer = this._layers[4];

        for (var i = 0; i < defuzzLayer.length; i++) {
            var neuron = defuzzLayer[i];
            var sub1 = matrix.subtract(b, matrix.multiply(aT, neuron.X));
            var sub2 = matrix.multiply(Sip1, a);
            var sub3 = matrix.multiply(sub2, sub1);

            neuron.X = matrix.add(neuron.X, sub3);
        }

        this.S = Sip1;

        // ---------------------------------------------------
        // Backward Pass: Adaptive learning part.
        // ---------------------------------------------------
        // http://www.csee.wvu.edu/classes/cpe521/presentations/ANFIS.pdf
        // Its always a single expected output in our anfis (since we always treat as controller)
        // I am slightly skeptical that this works.
        var err = this.getOutput()[0] - expectedOutputs;
        var errEta = 2 * err * this.eta;
        var sumVmulC = 0;

        for (var i = 0; i < this._normLayer.length; i++) {
            sumVmulC += this._normLayer[i] * this._c[i];
            this._c[i] += 2 * errEta * this._normLayer[i].output;
        }
        var len = input.outPntrs.length
        for (var i = 0; i < this._inputs.length; i++) {
            var input = this._inputs[i];
            for (var j = 0; j < len; i++) {
                var ifNeuron = input.outPntrs[j];
                var consequence = this._c[(i * len) + j];
                var norm = this._normLayer[(i * len) + j];

                ifNeuron.center[0] += errEta * norm * (consequence - sumVmulC);
            }
        }
    },
    _backpropErrorHidden: function() {},

    _adjustOutputWeights: function() {
    },

    _adjustHiddenWeights: function() {}
});

ANFISNetwork.createByClusters = function(configuration, inputs) {
    var columns = matrix .transform(inputs);   
    configuration.initialCenters = [];

    var tInput = [];
    for (var i = 0; i < columns.length; i++) {
        var arr = [];
        for (var j = 0; j < columns[i].length; j++) {
            arr.push([columns[i][j]]);
        }
        tInput.push(arr);
    }

    for(var i = 0; i < tInput.length; i++) {
        var clusters = clusterfck.kmeans(tInput[i], configuration.numIfs);
        for(var j = 0; j < clusters.length; j++) {

            if (clusters[j]) {
                var center = FuzzyUtil.mean.apply(null, clusters[j]);
                configuration.initialCenters.push(center);
            } else {
                // TODO: Can we do it this way always?
                configuration.initialCenters.push([-1000]);
            }
        }
    } 

    return new ANFISNetwork(configuration); 
}

module.exports = ANFISNetwork;