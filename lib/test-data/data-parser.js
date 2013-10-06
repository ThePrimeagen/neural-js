var fs = require('fs');

function penDigits(callback) {
	fs.readFile('./lib/test-data/pen-digits', function (err, data) {
		var returnData = [];

	    var lines = data.split('\n');
	    for(var i in lines) {
	        var data = lines[i].split(', ');

	        var outputData = [ data.pop() ];
	        returnData.push(data);
	        returnData.push(outputData);
	    }

	    callback(returnData, 16, 1);
	})
}

module.exports = {
	'pen-digits': penDigits
};