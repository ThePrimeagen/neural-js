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
var dataSet = args[3];
var mutationRate = args[4];
var baseSigma = args[5];
var heightAdjust = args[6];

//Set up defaults
var dataC = _.clone(defaults.dataConfig);
var annCon = _.clone(defaults.annConfig);
var network = null;

annCon.momentum = false;
annCon.hiddenLayerNeuronCount = 70;

//Build our data set
var dataParser = require('./../data/project3_data/data-parser');

// gets the data set from file
dataParser[dataSet](buildDataSet);

function buildDataSet(data, numInputs, numOutputs) {

}

function storeData(filename, data, callback) {
    fs.appendFile('./data/GA/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(err);
        } else {
            if (callback) {
                callback.apply();
            }
        }
    });
}