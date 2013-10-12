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

ANFISNetwork.prototype = _.assign(RBFNetwork.prototype, ANN.prototype);
ANFISNetwork.prototype = _.assign(RBFNetwork.prototype, {
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
            neuron.inPntrs.push(this._inputs[i / configuration.numIfs]);

            this._layers[1].push(neuron);
        }

        this._layers.push(layer);
    }
    _createRuleLayer : function() {
        var layer = [];
        var layerSize = this.configuration.numIfs * this.inputs.length;
        for(var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron();
            layer.push(neuron);

            for(var j = i % this.configuration.numIfs; j < layerSize; j += layerSize) {
                neuron.inPntrs.push(this._layers[1][j]);
                this._layers[1][j].outPntrs.push(neuron);
            }
        }

        this._layers.push(layer);
    }
    _createNormLayer : function() {
        var layer = [];
        var layerSize = this.configuration.numIfs * this.inputs.length;
        var self = this;
        for(var i = 0; i < layerSize; i++) {
            var neuron = new ANFISNeuron();
            neuron.activationFunction = function() {
                var inputValues = [];
                for(var j = 0; j < self.inPntrs; j++) {
                    inputValues.push(self.)
                }
                NetworkMath.normalizeDataFunction
            };
            layer.push(neuron);

            for(var j = 0; j < layerSize; i++) {
                neuron.inPntrs.push(this._layers[2][j]);
                this._layers[2][j].outPntrs.push(neuron);
            }
        }

        this._layers.push(layer);
    }
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
            neuron.activationFunction = function () {
                var inputValues = [];
                for(var j = 0; j < self.inputs.length; j++) {
                    inputValues.push(self.inputs[j].activationFunction());
                }
                
                return self.inPntrs[0].activationFunction() * NetworkMath.takagiSugenoFunction(inputs, coefficients);
            };

            layer.push(neuron);

            neuron.inPntrs.push(this._layers[3][i]);
            this._layers[3][i].outPntrs.push(neuron);
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