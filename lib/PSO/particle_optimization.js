var _ = require('lodash');

var swarm = {
	clusters: [],
	fitness: 0
}

var cluster = {
	position : [],
	velocity : [],
	best : [],
	data : []
}

var pso = {
	swarms : [],
	best : null,
	bounds : []
}


function init(numSwarm, numClusters, data) {
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

	//Randomly initialze the required number of swarms
	for(var i = 0; i < numSwarm; i++) {
		var newSwarm = _.cloneDeep(swarm);

		for(var j = 0; j < numClusters; j++) {
			//Create a new centroid
			var newCluster = _.cloneDeep(cluster);

			for (var k = 0; k < dimensions; k++) {
				//Fill out the centroid's properties, randomly initializing them
				var value = mins[k] + Math.random() * (maxs[k] - mins[k]);

				newCluster.position.push(value);
				newCluster.velocity.push((Math.random() - .5) * .1 * (maxs[k] - mins[k]));
				newCluster.best.push(value);
			}

			newSwarm.clusters.push(newCluster);
		}

		pso.swarms.push(newSwarm);
	}

	pso.bounds = _.zip(mins, maxs, function (a,b) { return { min: a, max: b } });
	pso.best = { min : 100000000000, swarm: pso.swarms[0] };
	return pso;
}

function progress(numSteps, options, data) {

	//For tracking the best swarm
	var best = pso.best;

	//Progress the specified number of steps
	for(var i = 0; i < numSteps; i++) {

		//For each particle swarm 
		for(var key in pso.swarms) {

			for(var j = 0; j < pso.swarms[key].clusters.length; j++)
				pso.swarms[key].clusters[j].data = [];

			//For each data point, assign it to a centroid in the particle swarm
			for(var point in data) {
				//Initialize the object to track the clostest centroid
				var assigned = { min: 1000000000, assignedCluster: null };
				var clusters = pso.swarms[key].clusters; //Store off the clusters
				for(var cluster in clusters) {

					//Calculate the distance between the cluster and the data point.
					var dist = euclidean(clusters[cluster], data[point]);

					//If the cluster is closer, save it in our data model
					if(assigned.min > dist) {
						assigned.min = dist;
						assigned.assignedCluster = clusters[cluster];
					}
				}

				//Save off the data point to the closest centroid
				assigned.assignedCluster.data.push(data[point]);
			}

			//Update the fitness of the given particle swarm
			pso.swarms[key].fitness = fitness(pso.swarms[key].clusters);

			update(pso.swarms[key], best, options, pso);
		}

		//Find the most fit swarm, and save it in our best.
		for(var key in pso.swarms) {
			var fit = pso.swarms[key].fitness;

			if(fit < best.min) {
				best.min = fit;
				best.swarm = _.cloneDeep(pso.swarms[key]);
			}
		}
	}

	return pso.best.min;
}

function update(particle, best, options) {
	//vi,k(t + 1) = wvi,k(t) + c1r1,k(t)(yi,k(t) − xi,k(t)) + c2r2,k(t)(yˆk(t) − xi,k(t)) 
	//xi(t+1) = xi(t)+vi(t+1)
	for(var k = 0; k < particle.clusters.length; k++) {
		center = particle.clusters[k];
		for(var i = 0; i < center.velocity.length; i++) {
			var inertia = options.w * center.velocity[i]; //Maintian a certain percent of the current velocity
			var personalAccel = options.c1 * (center.best[i] - center.position[i]); //Accelerate towards the particles best
			var globalAccel = options.c2 * (best.swarm.clusters[k].position[i] - center.position[i]); //Accelerate towards the global best

			center.velocity[i] = inertia + personalAccel + globalAccel;
			if(center.velocity[i] > (pso.bounds[i].max - pso.bounds[i].min) * .2) {
				center.velocity[i] = (pso.bounds[i].max - pso.bounds[i].min) * .2;
			}
			if(center.velocity[i] < (pso.bounds[i].max - pso.bounds[i].min) * .001) {
				center.velocity[i] = (pso.bounds[i].max - pso.bounds[i].min) * .001;
			}
		}

		for(var i = 0; i < center.velocity.length; i++) {
			center.position[i] += center.velocity[i];

			//Make the particle 'bounce' off the edges of the container
			if (center.position[i] < pso.bounds[i].min || center.position[i] > pso.bounds[i].max) {
				center.velocity[i] *= -1;
			}
		}
		//console.log(center.velocity);
	}
	
}

function fitness(clusters) {
	var sum = 0;

	for (var i = 0; i < clusters.length; i++) {
		var cluster = clusters[i];

		for (var j = 0; j < cluster.data.length; j++) {
			sum += euclidean(cluster.position, cluster.data[j]);
		}
	}

	return sum;
}

function euclidean(a, b) {
	var sum = 0;
	
	for (var i = 0; i < a.length; i++) {
		sum += Math.pow(a[i]-b[i], 2);
	}

	return Math.sqrt(sum);
}

module.exports = {
	update : update,
	init: init,
	progress: progress,
	fitness: fitness
}

