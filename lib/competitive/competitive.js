///
///	For simplification reasons, this version of competitive learning 
///  doesn't utilize a network, but rather maintains a list of centers
///  that act as the networks output layer
///
/// The math is all the same, there is just savings in implementation time 
///

var _ = require('lodash');

var compete = {
	learningRate : .00001,
	numClusters : 5,
	centers : [],
	best : 100000000000
}

var center = {
	position : [],
	data : []
}

function init(data, options) {
	compete = {
		learningRate : .0001,
		numClusters : 5,
		centers : [],
		best : 100000000000
	}

	var mins = [];
	var maxs = [];
	var dimensions = data[0].length;

	//Find the ranges of the randomly created clusters
	for(var i = 0; i < data.length; i++) {
		for(var j = 0; j < data[i].length; j++) {
			if(!mins[j]) {
				mins[j] = data[i][j];
				maxs[j] = data[i][j];
			}

			mins[j] = Math.min(mins[j], data[i][j]);
			maxs[j] = Math.max(maxs[j], data[i][j]); 
		}
	}


	for(var j = 0; j < compete.numClusters; j++) {
		//Create a new centroid
		var newCenter = _.cloneDeep(center);

		for (var k = 0; k < dimensions; k++) {
			//Fill out the centroid's properties, randomly initializing them
			var value = mins[k] + Math.random() * (maxs[k] - mins[k]);
			newCenter.position.push(value);
		}
		compete.centers.push(newCenter);
	}

	return compete;
}

// Progresses the algorithm 'n' times, with the given data set
function progress(steps, data) {

	for(var i = 0; i < steps; i++) {

		//Reset the state of the centers
		for(var j = 0; j < compete.centers.length; j++) {
			compete.centers[j].data = [];
		}

		//For each piece of data
		for(var key in data) {

			//Find the winner by comparing the euclidean distance data -> centers
			var winner = _.reduce(compete.centers, function(cur, next) {
				var a = euclidean(cur.position, data[key]);
				var b = euclidean(next.position, data[key]);
				return a > b ? cur : next;
			});

			//Update the winner's position according to the learning rate
			for(var j = 0; j < winner.position.length; j++) {
				winner.position[j] += (data[key][j] - winner.position[j]) * compete.learningRate;
			}

			//Add the data point to the 'winner'
			winner.data.push(data[key]);
		}
	}

	return compete;

}

function euclidean(a, b) {
	var sum = 0;

	for (var i = 0; i < a.length; i++) {
		sum += Math.pow(a[i]-b[i], 2);
	}

	return Math.sqrt(sum);
}



module.exports = {
	init: init,
	progress: progress
}