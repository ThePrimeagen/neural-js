var Ix = require('ix');

module.exports = {
    randomValue: randomValue,
    sequentialValue: sequentialValue,
    next: next
};

/**
 * Moves an enumerator forward
 * @param  {Ix.Enumerator}
 * @return {Mixed} next value from enum
 */
function next(enu) {
    enu.moveNext();
    return enu.getCurrent();
}

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
function randomValue(basePopulation) {
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
function sequentialValue(basePopulation) {
    var idx = 0;
    return populationEnumerator(basePopulation)
        .select(function(pop) {
            var l = pop.length;
            if (idx >= l) {
                idx = 0;
            }

            return pop[idx++];
        });
}
