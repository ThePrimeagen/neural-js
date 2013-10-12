var ANN = require('./NeuralNetwork');
var _ = require('lodash');
var NetworkMath = require('./lib/NetworkMath');
var NetworkStates = require('./lib/NetworkStates');
var FuzzyUtil = require('FuzzyUtil');
var ANFISNeuron = require('./ANFISNeuron');
var clusterfck = require('clusterfck');

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
     * The calculated sigma constant
     * @type {number}
     */
    this.rho = 0.5;

    ANN.apply(this, [configuration]);
};

ANFISNetwork.prototype = _.assign(ANFISNetwork.prototype, ANN.prototype);
ANFISNetwork.prototype = _.assign(ANFISNetwork.prototype, {
    _initialize: function() {
        this._createInputLayer();
        this._createIfLayer();
        this._createRuleLayer();
        this._createNormLayer();
        this._createDefuzzLayer();
        this._createOutputLayer();
    },
    _createIfLayer : function() {
        var layer = [];
        for(var i = 0; i < this.initialCenters.length; i++) {
            var neuron = new ANFISNeuron();
            neuron.coefficients = {1,1,0};
            neuron.inPntrs.push(this._inputs[i / configuration.numIfs]);

            this._layers[1].push(neuron);
        }

        this._layers.push(layer);
    },
    _createRuleLayer : function() {
        var layer = [];
        var layerSize = this.configuration.numIfs * this.inputs.length;
        var self = this;
        for(var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron();
            neuron.activation = function() {

            };
            layer.push(neuron);

            for(var j = i % this.configuration.numIfs; j < layerSize; j += layerSize) {
                neuron.inPntrs.push(this._layers[1][j]);
                this._layers[1][j].outPntrs.push(neuron);
            }
        }

        this._layers.push(layer);
    },
    _createNormLayer : function() {
        var layer = [];
        var layerSize = this.configuration.numIfs * this.inputs.length;
        
        for(var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron();
            layer.push(neuron);

            for(var j = 0; j < layerSize; i++) {
                neuron.inPntrs.push(this._layers[2][j]);
                this._layers[2][j].outPntrs.push(neuron);
            }
        }

        this._layers.push(layer);
    },
    _createDefuzzLayer : function() {
        var layer = [];
        var layerSize = this.configuration.numIfs * this.inputs.length;
        var self = this;
        for(var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron();
            neuron.coefficients = [];
            for(var j = 0; j < this.inputs.length; j++) {
                neuron.coefficients.push(1);
            }
            neuron.coefficients.push(0); //the y-intercept value

            layer.push(neuron);

            neuron.inPntrs.push(this._layers[3][i]);
            this._layers[3][i].outPntrs.push(neuron);
        }
    },
    _feedForward : function () {
        //layer 1
        for(var i = 0; i < _layers[1].length; i++) {
            _layers[1][i].output = NetworkMath.generalBellCurve(_layers[1].inPntrs[0].output, 
                                                                _layers[1][i].coefficients[0], 
                                                                _layers[1][i].coefficients[1], 
                                                                _layers[1][i].coefficients[2]);
        }

        //layer 2
        for(var i = 0; i < _layers[2].length; i++) {
            var inputValues = [];
            for(var j = 0; j < _layers[2][i].inPntrs.length; j++) {
                inputValues.push(_layers[2][i].inPntrs[j].output);
            }
            _layers[2][i].output = NetworkMath.tnormFunction(inputValues);
        }

        //layer 3
        for(var i = 0; i < _layers[3].length; i++) {
            var inputValues = [];
            for(var j = 0; j < neuron.inPntrs.length; j++) {
                inputValues.push(_layers[3][i].inPntrs[j].activationFunction());
            }
            _layers[3][i].output = NetworkMath.normalizeDataFunction(inputValues[i], inputValues);
        }

        //layer 4
        for(var i = 0; i < _layers[4].length; i++) {
            var neuron = _layers[4][i];
            var inputValues = [];
            for(var j = 0; j < this.inputs.length; j++) {
                inputValues.push(this.inputs[j].activationFunction());
            }
            
            neuron.output = neuron.inPntrs[0].activationFunction() * NetworkMath.takagiSugenoFunction(inputs, neuron.coefficients);
        }

        //layer 5
        for(var i = 0; i < _layers[5].length; i++) {
            var sum = 0;
            for(var j = 0; j < _layers[5][i].inPntrs.length; j++) {
                sum += _layers[5][i].inPntrs[j].output;
            }

            _layers[5][i].output = sum;
        }
    }
});

ANFISNetwork.createByClusters = function(configuration, inputs) {
    inputs = rxStats.transform(inputs);   
    configuration.initialCenters = [];

    for(var i = 0; i < inputs.length; i++) {
        var clusters = clusterfck.kmeans(inputs, configuration.numIfs);
        for(var j = 0; j < clusters.length; j++) {
            var center = FuzzyUtil.mean.apply(null, clusters[j]);
            configuration.initialCenters.push(center);
        }
    } 

    return new ANFISNetwork(configuration); 
}

module.exports = ANFISNetwork;