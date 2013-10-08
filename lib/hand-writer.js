var MLP = require('./neural-networks/NeuralNetwork');
var RBFNetwork = require('./neural-networks/RBFNetwork');
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
var testCount = Number(args[4]) || 10000;

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

    if(networkType === 'RBF') {
        annCon.eta = 0.1;
        network = RBFNetwork.createByCluster(data, annCon);
    } else if (networkType === 'MLP') {
        annCon.eta = 0.05;
        annCon.hiddenLayerCount = Number(args[5]) || 2;
        annCon.hiddenLayerNeuronCount = Number(args[6]) || 75;
        network = new MLP(annCon);
    } else if (networkType === 'ANFIS') {
        //MAKE A DANG OL NETWORK
    }

    // The transform of output gets an output that will produce a clean 0/1 for "guess" based off highest output node
    network.transformOutput = dataParser.transformOutput;

    // Gets the confusion matrix.  From this we can calculate precision
    var conMap = NetworkExperiments.confusionMap(network, data, testCount);
}

function storeData(filename, data) {
    fs.appendFile('./data/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(data + '\n ');
        }
    });
}