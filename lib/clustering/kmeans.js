var _ = require('lodash');
var ix = require('ix');

var clusterOptions = {
	data : [],
	distance : lpnorm,
	numClusters : 5
}

function kmeans(options) {
	var opt = clusterOptions.clone();
	_.apply(opt, options);

	var centers = [],
        seen = {},
        numCenters = options.numClusters;

	// Initialize k random (unique!) means.
    while(centers.length < numCenters) {
    	var index = ~~(Math.random() * data.length);	//double bitwise-NOT operator is fast and furious! ZOOOOOM 
		var datum = data[index];	
		if (!(id in seen)) { 					//Check if the id has alreayd been pushed
			seen[id] = 1;						//Set this index to be seen
			centers.push({ center : datum, dataAvg : [] });	//Push the datum wrapped in an object
		}
    }

    converged = false;

    while(!converged) {
		// Clear the state.
		for (var i = 0; i < numCenters; i++) {
			_.apply(means[i], {
				size : 0,
				data : []
			});
		
		}

		// Find the mean closest to each point.
		for (var i = 0; i < data.length; i++) {
			var datum = data[i];
			
			var center = ix.Enumerable.fromArray(centers).scan(function(winner, cur) {
				if(options.distance(winner, datum) <= options.distance(cur, datum))
					return winner;
				else 
					return cur;
			})[0];

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

		converged = true;
		// Compute the new centers.
		for (var i = 0; i < numCenters; i++) {
			var center = centers[i];
			if (!center.size) //If this doesn't have any points associated with it
				continue;

			var avgs = center.dataAvg;
			for(var j = 0; j < center.dataAvg.length; j++) {
				var avg = avgs[j] / center.size;

				converged = converged && avg === center.center[j];
				center.center[j] = avg;
			}
		}
    }

    return centers;
}

function lpnorm (p1, p2) {
	
}

function euclidean (p1, p2) {

}

module.exports = {
	kmeans : kmeans,
	distanceFunctions : {
		lpnorm : lpnorm,
		euclidean : euclidean
	}
};