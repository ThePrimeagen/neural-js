var _ = require('lodash');
var ix = require('ix');

var kmeans = {
	centers : [],
	numCenters : 0,
	seen : {},
	data : [],
	converged : false
}

var center = {
	position : [],
	data : []
}

function init(options) {
	kmeans = {
		centers : [],
		numCenters : 0,
		seen : {},
		data : [],
		converged : false
	}

	_.assign(kmeans, options);

	// Initialize k random (unique!) means.
    while(kmeans.centers.length < kmeans.numCenters) {
    	var index = ~~(Math.random() * kmeans.data.length);	//double bitwise-NOT operator is fast and furious! ZOOOOOM 
		var datum = kmeans.data[index];	
		if (!(index in kmeans.seen)) { 					//Check if the id has alreayd been pushed
			kmeans.seen[index] = 1;						//Set this index to be seen
			kmeans.centers.push({ position : _.cloneDeep(datum), dataAvg : [] });	//Push the datum wrapped in an object
		}
    }
}

function progress(numSteps) {
    for(var m = 0; m < numSteps && !kmeans.converged; m++) {
		// Clear the state.
		for (var i = 0; i < kmeans.numCenters; i++) {
			_.assign(kmeans.centers[i], {
				data : [],
				dataAvg : [],
				size : 0
			});
		
		}

		// Find the mean closest to each point.
		for (var i = 0; i < kmeans.data.length; i++) {
			var datum = kmeans.data[i];
			
			var center = _.reduce(kmeans.centers, function(winner, cur) {
				if(euclidean(winner.position, datum) <= euclidean(cur.position, datum))
					return winner;
				else 
					return cur;
			});
			
			//Add this point to the center's tracked average
			for(var j = 0; j < datum.length; j++) {
				if(center.dataAvg.length == j) {
					center.dataAvg.push(datum[j]);
				} else {
					center.dataAvg[j] += datum[j];
				}
			}

			center.size++;
			center.data.push(datum);
		}

		kmeans.converged = true;
		// Compute the new centers.
		for (var i = 0; i < kmeans.numCenters; i++) {
			var center = kmeans.centers[i];
			if (!center.size) //If this doesn't have any points associated with it
				continue;

			var avgs = center.dataAvg;
			for(var j = 0; j < center.dataAvg.length; j++) {
				var avg = avgs[j] / center.size;

				kmeans.converged = kmeans.converged && avg === center.position[j];
				center.position[j] = avg;
			}
		}
    }

    return kmeans;
}

function euclidean(a, b) {
	var sum = 0;
	
	for (var i = 0; i < a.length; i++) {
		sum += (a[i]-b[i]) * (a[i]-b[i]);
	}

	return Math.sqrt(sum);
}

module.exports = {
	init : init,
	progress : progress,
	euclidean : euclidean
};