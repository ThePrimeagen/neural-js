var fs = require('fs');
var filePrefix = './lib/test-data/'; 

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

function penDigits(callback) {
	fs.readFile(filePrefix + 'pen-digits-small', function (err, data) {
		var returnData = []; 
		var lines = data.toString().split('\n');
		var outputLine = [0,0,0,0,0,0,0,0,0,0,0];
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

module.exports = {
	'pen-digits': penDigits,
	transformOutput: transformOutput
};