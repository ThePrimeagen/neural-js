var MLPController = require('./neural-networks/MLPController');
var RBFController = require('./neural-networks/RBFController');
var ANFISController = require('./neural-networks/ANFISController');
var NetworkExperiments = require('./util/NetworkExperiments');
var NetworkMath = require('./neural-networks/lib/NetworkMath');
var defaults = require('./defaults');
var tables = require('./truth-tables');
var fs = require('fs');
var _ = require('lodash');
var args = process.argv;

//Grab passed in values
var networkType = args[2];
var dataType = args[3];
var testCount = Number(args[4]) || 2;

//Set up defaults
var dataC = _.clone(defaults.dataConfig);
var annCon = _.clone(defaults.annConfig);
var network = null;

annCon.momentum = false;
annCon.hiddenLayerNeuronCount = 70;

//Build our data set
var dataParser = require('./test-data/data-parser');

// gets the data set from file
dataParser[dataType](buildDataSet);

function buildDataSet(data, numInputs, numOutputs) {
    annCon.inputLayerCount = numInputs;
    annCon.outputCount = numOutputs;
    transformOutput = dataParser.transformOutput;
    var dataTypeName = dataType.split('-');
    var filename = networkType + dataTypeName[0].charAt(0) + dataTypeName[1].charAt(0);

    if(networkType === 'RBF') {
        annCon.eta = 0.1;
        annCon.nodesPerDim = Number(args[5]) || 3;
        network = new RBFController(annCon, data);
        filename += annCon.nodesPerDim;
    } else if (networkType === 'MLP') {
        annCon.eta = 0.05;
        annCon.hiddenLayerCount = Number(args[5]) || 2;
        annCon.hiddenLayerNeuronCount = Number(args[6]) || 75;
        network = new MLPController(annCon, data);
        filename += annCon.hiddenLayerCount;
        filename += annCon.hiddenLayerNeuronCount;
    } else if (networkType === 'ANFIS') {
        // This is actually a controller but it contains similar methods for networks.
        annCon.numIfs = Number(args[5]) || 3;
        network = new ANFISController(annCon, data);
        filename += annCon.numIfs;
    }

    console.log('Running: ' + filename);
    // Gets the confusion matrix.  From this we can calculate precision
    var results = NetworkExperiments.fixedTests(network, data, testCount)[1];

    // Cycles through the outs and the expecteds and saves it off for further processing.
    var outs = results[1];
    var exps = results[1];
    var dataStr = "";
    for (var i = 0; i < outs.length; i++) {
        dataStr += numOutputs + ',' + outs[i].join(',') + ',' + exps[i];
    }

    storeData(filename, dataStr);
    var confusionMatrix = NetworkExperiments.confusionMatrix(results);
    var precision = [];
    var recall = [];
    for (var i = 0; i < numOutputs; i++) {
        precision.push(NetworkExperiments.precision(confusionMatrix, i));
        recall.push(NetworkExperiments.recall(confusionMatrix, i));
    }


    filename = 'results/' + filename;
    dataStr = precision + '\n' + recall + '\n';
    for (var i = 0; i < confusionMatrix.length; i++) {
        dataStr += confusionMatrix[i] + '\n';
    }
    storeData(filename, dataStr);
}

function storeData(filename, data, callback) {
    fs.appendFile('./data/project2/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(err);
        } else {
            if (callback) {
                callback.apply();
            }
        }
    });
}