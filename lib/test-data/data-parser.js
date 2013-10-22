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

/**
 * Parses the pen-digits file and defines its output
 */
function penDigits(callback, small, test) {
	fs.readFile(filePrefix + 'pen-digits' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {
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

/**
 * Defines the letter recognition file
 */
function letterRec(callback, small, test) {
	fs.readFile(filePrefix + 'letter-rec' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {
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

/**
 * Defines the optical digits
 */
function optDigits(callback, small, test) {
	fs.readFile(filePrefix + 'opt-digits' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {
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

	    callback(returnData, 64, 10);
	});
}

/**
 * Defines the semeion digits
 */
function semeionDigits(callback, small, test) {
	fs.readFile(filePrefix + 'semeion-digits' + (small ? '.small' : '') + (test ? '.test' : '.train'), function (err, data) {
		var returnData = []; 
		var lines = data.toString().split('\n');

	    for(var i in lines) {
	        var data = lines[i].split(' ');

	        // There are some lines with extra white spaces.
	        while (data[data.length - 1] === "") {
	        	data.pop();
	        }
			var startIdx = data.length - 10;
	        data = toNumber(data);

	        // The last 10 are the output digits.
	        var output = [];
	        for (var j = 0; j < 10; j++) {
		        var outputIdx = data[startIdx + j];
		        output[j] = outputIdx;
	        }
	        for (var j = 0; j < 10; j++) {
	        	data.pop();
	        }

	        returnData.push(data);
	        returnData.push(output);
	    }

	    callback(returnData, 256, 10);
	});
}

module.exports = {
	'pen-digits': function(callback) {
		penDigits(callback, false, true);
	}, 
	'pen-digits-small': function(callback) {
		penDigits(callback, true, true);
	}, 
	'letter-rec': function(callback) {
		letterRec(callback, false, true);
	},
	'letter-rec-small': function(callback) {
		letterRec(callback, true, true);
	},
	'opt-digits': function(callback) {
		optDigits(callback, false, true);
	},
	'opt-digits-small': function(callback) {
		optDigits(callback, true, true);
	},
	'semeion-digits': function(callback) {
		semeionDigits(callback, false, true);
	},
	'semeion-digits-small': function(callback) {
		semeionDigits(callback, true, true);
	},
	transformOutput: transformOutput
};