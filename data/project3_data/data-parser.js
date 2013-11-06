var fs = require('fs');
var filePrefix = './lib/test-data/'; 
var _ = require('lodash');

function toNumber(arr) {
	var returnArr = [];
	for (var i = 0; i < arr.length; i++) {
		var value = arr[i];
		var number = Number(arr[i]);

		//Stupid '' is a 0 according to js
		if((number === 0 && value.indexOf('0') != -1) || number !== 0) {
			returnArr.push(number);
		}		 
	} 
	return arr; 
}

/**
 * Transforms the outputs into something useful to be classified.
 * @param  {NeuralNetwork} network 
 * @param  {Neuron[]} outputs
 * @return {Number[]}
 */
function transformOutput(network, outputs) {
	var highestVal = -100;
	var highestIdx = 0;

	for (var i = 0; i < outputs.length; i++) {
		if (outputs[i].output > highestVal) {
			highestVal = outputs[i].output;
			highestIdx = i;
		}
	}

	var guess = [];
	for (var i = 0; i < outputs.length; i++) {
		if (i === highestIdx) {
			guess.push(1);
		} else {
			guess.push(0);
		}
	}

	return guess;
}

/**
 * Parses the banknotes file and defines its output
 */
function banknote(callback, small, test) {
	fs.readFile(filePrefix + 'banknote' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {		
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 2, ','), 4, 2);
	});
}

function casp(callback, small, test) {
	fs.readFile(filePrefix + 'casp' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {		
		var lines = data.toString().split('\n');
	    callback(buildRegressionData(lines, '\t'), 9, 2);
	});
}

function diabetes(callback, small, test) {
	fs.readFile(filePrefix + 'diabetes' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {		
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, ','), 8, 2);
	});
}

function ecoli(callback, small, test) {
	fs.readFile(filePrefix + 'ecoli' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {		
		var lines = data.toString().split('\n');
	    callback(buildRegressionData(lines, ','), 8, 2);
	});
}

function buildClassificationData(lines, outputSize, delimiter) {
	var returnData = []; 
	var outputLine = [];
	for (var i = 0; i < outputSize; i++) {
		outputLine.push(0);
	}

    for(var i in lines) {
        var data = toNumber(lines[i].split(delimiter));

        var outputIdx = data.pop();
        var output = _.clone(outputLine);
        output[outputIdx] = 1;

        returnData.push(data);
        returnData.push(output);
    }
}

function buildRegressionData(lines, delimiter) {
	returnData = [];
    for(var i in lines) {
        var data = toNumber(lines[i].split(delimiter));

        var output = data.pop();

        returnData.push(data);
        returnData.push([output]);
    }
}

module.exports = {
	'banknote': function(callback) {
		banknote(callback, false, true);
	}, 
	'banknote-small': function(callback) {
		banknote(callback, true, true);
	}, 
	'casp': function(callback) {
		casp(callback, false, true);
	},
	'casp-small': function(callback) {
		casp(callback, true, true);
	},
	'diabetes': function(callback) {
		diabetes(callback, false, true);
	},
	'diabetes-small': function(callback) {
		diabetes(callback, true, true);
	},
	'ecoli': function(callback) {
		ecoli(callback, false, true);
	},
	'ecoli-small': function(callback) {
		ecoli(callback, true, true);
	},
	'energy-efficiency': function(callback) {
		energyEfficiency(callback, false, true);
	},
	'energy-efficiency-small': function(callback) {
		energyEfficiency(callback, true, true);
	},
	'machine': function(callback) {
		machine(callback, false, true);
	},
	'machine-small': function(callback) {
		machine(callback, true, true);
	},
	'mammograph': function(callback) {
		mammograph(callback, false, true);
	},
	'mammograph-small': function(callback) {
		mammograph(callback, true, true);
	},
	'seeds': function(callback) {
		seeds(callback, false, true);
	},
	'seeds-small': function(callback) {
		seeds(callback, true, true);
	},
	'transfusion': function(callback) {
		transfusion(callback, false, true);
	},
	'transfusion-small': function(callback) {
		transfusion(callback, true, true);
	},
	'yacht': function(callback) {
		yacht(callback, false, true);
	},
	'yacht-small': function(callback) {
		yacht(callback, true, true);
	},
	transformOutput: transformOutput
};