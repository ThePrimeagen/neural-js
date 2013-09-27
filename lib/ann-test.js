var ANN = require('./neural-networks/NeuralNetwork');
var RBF = require('./neural-networks/RBFNetwork');
var NetworkExperiments = require('./util/NetworkExperiments');
var NetworkMath = require('./neural-networks/lib/NetworkMath');
var defaults = require('./defaults');
var tables = require('./truth-tables');
var fs = require('fs');
var _ = require('lodash');
var args = process.argv;
var rbf = !!args[2];
var layers = args[3];
var dim = args[4];
var filename = args[5];
var baseConverge = args[6] || 0.65;

if (args.length < 6) {
    throw new Error('Incorrect arguments:  Please pass in true|false, layer_count, rosenbrock_dim');
}

var network;
var delta = baseConverge * dim;
var dataPoints = 30;
var dataC = _.clone(defaults.dataConfig);
var annC = _.clone(defaults.annConfig);

dataC.dimension = dim;
annC.inputLayerCount = dim;
annC.momentum = false;
annC.hiddenLayerNeuronCount = 70;
annC.eta = rbf ? 0.1 : 0.001;
annC.alpha = 0.2;
annC.rho = 0.231;
NetworkMath.alpha = 0.4384;

var t = tables['Rosenbrock' + dataC.dimension](dataC.range, dataC.density);

if (rbf) {
    network = RBF.create(t, annC);
} else {
    annC.hiddenLayerNeuronCount = layers;
    network = new ANN(annC);
}

// Run the tests
for (var i = 0; i < dataPoints; i++) {
    console.log('Running test: ' + i + ' out of ' + dataPoints);
    network.reset();
    var answers = NetworkExperiments.converge3(network, t, delta);
    storeData(filename, answers.join(','));
}


function storeData(filename, data) {
    fs.appendFile('./data/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(data + '\n ');
        }
    });
}
