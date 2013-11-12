var evolution = require('ixjs-evolution');
var EvolutionaryRBFController = require('./lib/neural-networks/EvolutionaryRBFController');
var testData = require('./data/project3_data/data-parser');
var defaults = require('./lib/defaults');
var NetworkExperiments = require('./lib/util/NetworkExperiments');
var _ = require('lodash');
var dataC = _.clone(defaults.dataConfig);
var annCon = _.clone(defaults.annConfig);
var data = testData['casp-small'](ready);

function ready(data, numberOfInputs, numberOfOutputs) {

    var splitData = NetworkExperiments.splitData(data);
    var validation = splitData[0];
    data = splitData[1];

    // Sets the data.
    annCon.nodesPerDim = 3;
    annCon.validation = validation;
    annCon.t = data;
    annCon.evo = evolution.constructGA;
    annCon.evoOptions = {};
    annCon.inputLayerCount = numberOfInputs;
    annCon.outputCount = numberOfOutputs;

    var network = new EvolutionaryRBFController(annCon);
    network.train(data[0], data[1]);
}
