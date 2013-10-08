var fs = require('fs');
var filePrefix = './lib/test-data/'; 
var _ = require('lodash');

function toNumber(arr) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = Number(arr[i]); 
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

function penDigits(callback, small) {
	small = small || false;
	fs.readFile(filePrefix + 'pen-digits' + (small ? '-small' : ''), function (err, data) {
		var returnData = []; 
		var lines = data.toString().split('\n');
		var outputLine = [];
		for (var i = 0; i < 10; i++) {
			outputLine.push(0);
		}

	    for(var i in lines) {
	        var data = toNumber(lines[i].split(','));

	        var outputIdx = data.pop();
	        var output = _.clone(outputLine);
	        output[outputIdx] = 1;

	        returnData.push(data);
	        returnData.push(output);
	    }

	    callback(returnData, 16, 10);
	});
}

function letterRec(callback, small) {
	small = small || false;
	fs.readFile(filePrefix + 'letter-rec' + (small ? '-small' : ''), function (err, data) {
		var returnData = []; 
		var lines = data.toString().split('\n');
		var outputLine = [];
		for (var i = 0; i < 26; i++) {
			outputLine.push(0);
		}
	    for(var i in lines) {
	        var data = lines[i].split(',');

	        // A = 65.  A = our 0th output as well.
	        var outputIdx = data.shift().charCodeAt(0) - 65;
	        var output = _.clone(outputLine);
	        output[outputIdx] = 1;

	        returnData.push(toNumber(data));
	        returnData.push(output);
	    }

	    callback(returnData, 16, 26);
	});
}

module.exports = {
	'pen-digits': function(callback) {
		penDigits(callback);
	}, 
	'letter-rec': function(callback) {
		letterRec(callback);
	},
	'pen-digits-small': function(callback) {
		penDigits(callback, true);
	}, 
	'letter-rec-small': function(callback) {
		letterRec(callback, true);
	},
	transformOutput: transformOutput
};