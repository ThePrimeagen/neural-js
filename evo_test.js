var evolution = require('ixjs-evolution');
var RBFNetwork = require('./lib/neural-networks/RBFNetwork');
var EvolutionaryRBFNetwork = require('./lib/neural-networks/EvolutionaryRBFNetwork');
var testData = require('./data/project3_data/data-parser');

var data = testData['casp-small'](ready);

function ready(data, numberOfInputs, numberOfOutputs) {

}
