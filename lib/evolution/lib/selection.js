var Ix = require('ix');
var util = require('./util');

module.exports = {
    firstFit: firstFit,
    randomFit: randomFit
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
    if (typeof minimumFitness === 'number') {
        return function(individual) {
            individual.fit = fitFn(individual);
            return max ? individual.fit >= minimumFitness : individual.fit >= (1 - minimumFitness);
        }
    } else {
        return function(individual) {
            individual.fit = fitFn(individual);
            return individual;
        }
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

    return util.sequentialValue(basePopulation)
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

    return util.randomValue(basePopulation).filter(fitnessFn);
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

    return util.sequentialValue(basePopulation).filter(fitnessFn);
}

