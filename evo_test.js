var evolution = require('ixjs-evolution');
var RBFNetwork = require('./lib/neural-networks/RBFNetwork');
var EvolutionaryRBFController = require('./lib/neural-networks/EvolutionaryRBFController');
var testData = require('./data/project3_data/data-parser');
var defaults = require('./lib/defaults');
var NetworkExperiments = require('./lib/util/NetworkExperiments');
var _ = require('lodash');
var dataC = _.clone(defaults.dataConfig);
var annCon = _.clone(defaults.annConfig);
var args = process.argv;
var fs = require('fs');

//Grab passed in values
var data = testData[args[2]](ready);

function ready(data, numberOfInputs, numberOfOutputs) {

    var splitData = NetworkExperiments.splitData(data);
    var validation = splitData[0];
    data = splitData[1];

    // Sets the data.
    annCon.nodesPerDim = 3;
    annCon.validation = validation;
    annCon.t = data;
    annCon.evo = evolution['construct' + args[3]];
    annCon.evoOptions = {};
    annCon.inputLayerCount = numberOfInputs;
    annCon.outputCount = numberOfOutputs;

    if (args[3] === 'RBF') {
        var network = RBFNetwork.createByClusters(annCon, NetworkExperiments.getInputs(data));
    } else {
        var network = new EvolutionaryRBFController(annCon);
    }

    // Gets the results
    var results = NetworkExperiments.newConverge(network, data, validation);
    var filename = args[2].replace('-', '_');
    filename += args[3];
    storeData(filename, results);
}

function storeData(filename, data, callback) {
    fs.appendFile('./data/project3_data/results/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(err);
        } else {
            if (callback) {
                callback.apply();
            }
        }
    });
}