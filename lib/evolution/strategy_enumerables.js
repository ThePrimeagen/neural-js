var Ix = require('ix');

// Exports the set of enumerables.
module.exports = {
    /**
     * Grabs the first fittest individual from the population.  It uses the 
     * sequential enumerator for selection so the results will always be
     * consistent.
     * 
     * @param  {Array} basePopulation
     * @param  {Function} fitnessFn
     * @param  {Number} minFit
     * @param  {Number} prop
     * @return {Ix.Enumerable}
     */
    firstFitOnePointRandomMutation: function(basePopulation, fitnessFn, minFit, prop) {
        var firstFitEnum = firstFit(basePopulation, fitnessFn, minFit);
        var cross = crossOverOnePoint(firstFitEnum);

        return mutateRandom(cross, prop).getEnumerator();
    }
};

/**
 * Creates an enumerable off of a population
 * @param  {Array} basePopulation 
 * @return {Ix.Enumerator}
 */
function populationEnumerator(basePopulation) {
    return Ix.Enumerable.repeat(1).select(function() {
        return basePopulation;
    });
}

/**
 * Chooses a random individual from the population.
 * @param  {Array} basePopulation 
 * @return {Ix.Enumerator}
 */
function randomIndividual(basePopulation) {
    return populationEnumerator(basePopulation)
        .select(function(pop) {
            return pop[Math.floor(Math.random() * pop.length)];
        });
}

/**
 * Chooses a random individual from the population.
 * @param  {Array} basePopulation 
 * @return {Ix.Enumerator}
 */
function sequentialIndividual(basePopulation) {
    var idx = 0;
    return populationEnumerator(basePopulation)
        .select(function(pop) {
            var l = pop.length;
            idx === l && (idx = 0);

            return pop[idx++];
        });
}

/**
 * WARN: Fitness does mutate the state of the individual.  It appends the value of
 * 'fit' which is the current fitness of the individual.
 * 
 * @param  {Function} fitFn
 * @param  {Number} minimumFitness
 * @param  {Boolean} [max]
 */
function fitness(fitFn, minimumFitness, max) {
    max === undefined ? (max = true) : null;
    minimumFitness === undefined ? (minimumFitness = 0) : null;
    return function(individual) {
        individual.fit = fitFn(individual);
        return max ? individual.fit > minimumFitness : individual.fit > (1 - max)
    }
}

/**
 * A filter for every other.
 * @return {Function} 
 */
function everyOther() {
    var i = 0; 
    return function() {
        return i++ % 2 === 0;
    }
}

/**
 * Gets the most fit individual from the population
 * @param  {Array} basePopulation 
 * @param  {Function} fitFn
 * @param  {Number} minimumFitness
 * @param  {Boolean} [max]
 * @return {Ix.Enumerable}
 */
function mostFit(basePopulation, fitFn, minimumFitness, max) {
    var l = 0;
    var fitnessFn = fitness(fitFn, minimumFitness, max);

    return sequentialIndividual(basePopulation)
        .filter(fitnessFn)
        .scan(function(prev, curr) {
            return prev.fit > curr.fit ? prev : curr;
        })
        .filter(function() {
            return l + 1 === basePopulation.length;
        })
        .select(function(individual) {
            l = 0;
            return individual;
        });
}

/**
 * Gets the first fit from random selection
 * @param  {Array} basePopulation 
 * @param  {Function} fitFn
 * @param  {Number} minimumFitness 
 * @param  {Boolean} [max]
 * @return {Ix.Enumerable}
 */
function randomFit(basePopulation, fitFn, minimumFitness, max) {
    var l = 0;
    var fitnessFn = fitness(fitFn, minimumFitness, max);

    return randomIndividual(basePopulation).filter(fitnessFn);
}

/**
 * gets the first sequential individual with this fitness
 * @param  {Array} basePopulation 
 * @param  {Function} fitFn
 * @param  {Number} minimumFitness 
 * @param  {Boolean} [max]
 * @return {Ix.Enumerable}
 */
function firstFit(basePopulation, fitFn, minimumFitness, max) {
    var l = 0;
    var fitnessFn = fitness(fitFn, minimumFitness, max);

    return sequentialIndividual(basePopulation).filter(fitnessFn);
}

/**
 * Performs one point cross over.
 * @param  {Ix.Enumerable} selectorEnum 
 * @return {Ix.Enumerable}
 */
function crossOverOnePoint(selectorEnum) {
    return selectorEnum
        .filter(everyOther)
        .scan(function(a, b) {
            var l = a.length;
            var idx = Math.floor(Math.random() * l);
            var child = [];

            // TODO: I am sure that we will have to do this differently
            for (var i = 0; i < l; i++) {
                if (i < idx) {
                    child[i] = a[i];
                } else {
                    child[i] = b[i];
                }
            }

            return child;
        });
}

/**
 * Performs two point cross over.
 * @param  {Ix.Enumerable} selectorEnum 
 * @return {Ix.Enumerable}
 */
function crossOverTwoPoint(selectorEnum) {
    return selectorEnum
        .filter(everyOther)
        .scan(function(a, b) {
            var l = a.length;
            var idx = Math.floor(Math.random() * l);
            var idx2 = idx + Math.floor(Math.random() * (l - idx));
            var child = [];

            for (var i = 0; i < l; i++) {
                if (i < idx || i > idx2) {
                    child[i] = a[i];
                } else {
                    child[i] = b[i];
                }
            }

            return child;
        });
}

/**
 * Performs an n point cross over.
 * @param  {Ix.Enumerable} selectorEnum 
 * @return {Ix.Enumerable}
 */
function crossOverNPoint(selectorEnum) {
    return selectorEnum
        .filter(everyOther)
        .scan(function(a, b) {
            var l = a.length;

            for (var i = 0; i < l; i++) {
                if (Math.random() > 0.499) {
                    child[i] = a[i];
                } else {
                    child[i] = b[i];
                }
            }

            return child;
        });
}

/**
 * Randomly mutates the individual.  The stream coming in better be from a 
 * crossover operation.
 * 
 * @param  {Ix.Enumerable} selectorEnum
 * @param  {Number} probability
 * @return {Ix.Enumerable}
 */
function mutateRandom(selectorEnum, probability) {
    var prob = 1 - probability;
    return selectorEnum
        .select(function(individual) {

            // TODO: Mutate?
            var l = individual.length;

            for (var i = 0; i < l; i++) {
                if (Math.random() > prob) {
                    var idx1 = Math.floor(Math.random() * l);
                    var idx2 = Math.floor(Math.random() * l);

                    var tmp = individual[idx1];
                    individual[idx1] = individual[idx2];
                    individual[idx2] = tmp;
                }
            }

            return individual;
        });
}
