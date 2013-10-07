var fs = require('fs');
var filePrefix = './lib/test-data/'; 

function toNumber(arr) {
	for (var i = 0; i < arr.length; i++) {
		arr[i] = Number(arr[i]); 
	} 
	return arr; 
} 

function penDigits(callback) {
	fs.readFile(filePrefix + 'pen-digits-small', function (err, data) {
		var returnData = []; 
		var lines = data.toString().split('\n');
	    for(var i in lines) {
	        var data = toNumber(lines[i].split(','));

	        var outputData = [data.pop()];
	        returnData.push(data);
	        returnData.push(outputData);
	    }

	    callback(returnData, 16, 1);
	});
}

module.exports = {
	'pen-digits': penDigits
};