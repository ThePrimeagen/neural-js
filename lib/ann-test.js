var ANN = require('./neural-networks/NeuralNetwork');
var RBF = require('./neural-networks/RBFNetwork');
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

//Set up defaults
var dataC = _.clone(defaults.dataConfig);
var annCon = _.clone(defaults.annConfig);
var network = null;


annCon.momentum = false;
annCon.hiddenLayerNeuronCount = 70;


//Build our data set
require('./test-data/data-parser')[dataType](buildDataSet);




function buildDataSet(data, numInputs, numOutputs) {
    annCon.inputLayerCount = numInputs;
    annCon.outputCount = numOutputs;

    if(networkType === 'RBF') {
        annCon.eta = 0.1;
        network = new RBF(annCon);
    } else if (networkType === 'MLP') {
        annCon.eta = 0.001;
        network = new MLP(annCon);
    } else if (networkType === 'ANFIS') {
        //MAKE A DANG OL NETWORK
    }

    console.log(NetworkExperiments.fixedTests(network, data, 10000));
}


function storeData(filename, data) {
    fs.appendFile('./data/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(data + '\n ');
        }
    });
}
