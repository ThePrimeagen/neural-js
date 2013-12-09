var fs = require('fs');
var filePrefix = './data/project4_data/';
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

function glass(callback, small) {
	fs.readFile(filePrefix + 'glass' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 7, ','), 9, 1);
	});
}

function lung(callback, small) {
	fs.readFile(filePrefix + 'lung' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 3, ','), 56, 1);
	});
}

function magic(callback, small) {
	fs.readFile(filePrefix + 'magic' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 2, ','), 10, 1);
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
	    callback(buildClassificationData(lines, 3, '\t'), 7, 1);
	});
}

function transfusion(callback, small) {
	fs.readFile(filePrefix + 'transfusion' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 2, ','), 4, 1);
	});
}

function wine(callback, small) {
	fs.readFile(filePrefix + 'transfusion' + (small ? '.small' : '') + '.data', function (err, data) {
		var lines = data.toString().split('\n');
	    callback(buildClassificationData(lines, 0, ','), 13, 0);
	});
}

function buildClassificationData(lines, outputSize, delimiter) {
	var returnData = [];
	var outputLine = [];
	var classificationSymbols = [];

	for (var i = 0; i < outputSize; i++) {
		outputLine.push(0);
	}

    for (var i in lines) {
        var data = toNumber(lines[i].split(delimiter), classificationSymbols);
        var outputIdx = data.pop();
        var output = _.clone(outputLine);
        output[outputIdx] = 1;

        returnData.push(data);
        //returnData.push(output);
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
	'glass': function(callback) {
		glass(callback, false, true);
	},
	'glass-small': function(callback) {
		glass(callback, true, true);
	},
	'lung': function(callback) {
		lung(callback, false, true);
	},
	'lung-small': function(callback) {
		lung(callback, true, true);
	},
	'magic': function(callback) {
		mammograph(callback, false, true);
	},
	'magic-small': function(callback) {
		mammograph(callback, true, true);
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
	'wine': function(callback) {
		wine(callback, false, true);
	},
	'wine-small': function(callback) {
		wine(callback, true, true);
	},
	transformOutput: transformOutput
};