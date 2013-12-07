var fs = require('fs');
var filePrefix = './data/project3_data/';
var _ = require('lodash');

function toNumber(arr, classificationSymbols) {
	var returnArr = [];
	for (var i = 0; i < arr.length; i++) {
		var value = arr[i];
		var number = Number(arr[i]);

		//Stupid '' is a 0 according to js
		if (((number === 0 && value.indexOf('0') != -1) || number !== 0) &&
			!isNaN(number)) {

			returnArr.push(number);
		} else if (value.length > 0) {
			if (classificationSymbols[i] === undefined) {
				classificationSymbols[i] = {};
				classificationSymbols[i].count = 0;
			}

			if (classificationSymbols[i][value] === undefined) {
				classificationSymbols[i][value] = classificationSymbols[i].count;
				classificationSymbols[i].count++;
			}

			returnArr.push(classificationSymbols[i][value]);
		}
	}
	return returnArr;
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
function banknote(callback, small) {
	fs.readFile(filePrefix + 'banknote' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 2, ','), 4, 1);
	});
}

function casp(callback, small) {
	fs.readFile(filePrefix + 'casp' + (small ? '.small' : '') + '.data', function (err, data) {
		if (err) {
			console.log(err);
		}
		var lines = data.toString().split('\n');
	    callback(buildRegressionData(lines, ' '), 9, 1);
	});
}

function diabetes(callback, small) {
	fs.readFile(filePrefix + 'diabetes' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 2, ','), 8, 1);
	});
}

function ecoli(callback, small) {
	fs.readFile(filePrefix + 'ecoli' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 8, ' '), 8, 1);
	});
}

function energyEfficiency(callback, small) {
	fs.readFile(filePrefix + 'energy_efficiency' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildRegressionData(lines, ' '), 9, 1);
	});
}

function machine(callback, small) {
	fs.readFile(filePrefix + 'machine' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildRegressionData(lines, ','), 9, 1);
	});
}

function mammograph(callback, small) {
	fs.readFile(filePrefix + 'mammograph' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 2, ','), 5, 1);
	});
}

function seeds(callback, small) {
	fs.readFile(filePrefix + 'seeds' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, ' '), 7, 1);
	});
}

function transfusion(callback, small) {
	fs.readFile(filePrefix + 'transfusion' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 2, ','), 4, 1);
	});
}

function yacht(callback, small) {
	fs.readFile(filePrefix + 'yacht' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildRegressionData(lines, ' '), 6, 1);
	});
}

function buildClassificationData(lines, outputSize, delimiter) {
	var returnData = [];
	var classificationSymbols = [];

    for(var i in lines) {
        var data = toNumber(lines[i].split(delimiter), classificationSymbols);

        var output = data.pop();

        returnData.push(data);
        //returnData.push([output]);
    }

    return returnData;
}

function buildRegressionData(lines, delimiter) {
	returnData = [];
	var classificationSymbols = [];
    for(var i in lines) {
        var data = toNumber(lines[i].split(delimiter), classificationSymbols);

        var output = data.pop();

        returnData.push(data);
        returnData.push([output]);
    }

    return returnData;
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