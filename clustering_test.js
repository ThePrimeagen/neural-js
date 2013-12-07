var testData = require('./data/project3_data/data-parser');
var defaults = require('./lib/defaults');
var _ = require('lodash');
var args = process.argv;
var fs = require('fs');

var aco = require('./lib/aco/ant_colony.js');
var pso = require('./lib/pso/particle_optimization.js');
var kmeans = require('./lib/clustering/kmeans.js');
//var compete = require('./lib/competitive/competitive.js');

//Grab passed in values
var data = testData[args[2]](ready);

function determineClusterDistances(inputs, centers) {

}

function ready(data, numberOfInputs, numberOfOutputs) {
	var clusteringType = args[3];
	var bestResult = 2000000000; //Some arbitrarily large value
	var clusteringMethod = null;
	var results = "";

	switch(clusteringType) {
		case ('aco') : 
			aco.init(data);
			for(var i = 0; i < 1000; i++) {
				aco.progress(50);
				bestResult = Math.min(bestResult, determineClusterDistances(data, aco.centers));
			}

			break;
		case ('pso') :
			var options = {
				numSwarms: args[4],		//The number of desierd swarms
				numClusters: args[5],	//The number of desired clusters
				c1: args[6],			//The 'personal' influence
				c2: args[7],			//The 'social' influence
				w: args[8]				//The inertia
			};

			//Initialze the PSO, then run it a bunch of times, logging the results as we go
			pso.init(options.numSwarms, options.numClusters, data);
			for(var i = 0; i < 500; i++) {
				bestResult = Math.min(bestResult, pso.progress(10, options, data));
				console.log(bestResult);
				results += bestResult + "\n";
			}

			break;
		case ('kmeans') :
			kmeans.init(data);
			for(var i = 0; i < 1000; i++) {
				kmeans.progress(50);
				bestResult = Math.min(bestResult, determineClusterDistances(data, kmeans.centers));
			}
			
			break;
		case ('compete') :
			for(var i = 0; i < 1000; i++) {
				compete.train(data);
				bestResult = Math.min(bestResult, determineClusterDistances(data, compete.centers));
			}

			break;
		default:
			break;
	}

    var filename = args[2].replace('-', '_');
    filename += args[3];
    storeData(filename, results);
}

function storeData(filename, data, callback) {
    fs.appendFile('./data/project3_data/results/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(err);
        } else {
            if (callback) {
                callback.apply();
            }
        }
    });
}