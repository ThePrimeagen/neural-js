var selection = require('./lib/selection');
var crossOver = require('./lib/crossover');
var mutation = require('./lib/mutation');

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
    firstFitOnePointRandomMutation: function(basePopulation, fitnessFn, minFit, sigma, heightAdjust) {
        var select = selection.firstFit(basePopulation, fitnessFn, minFit);
        var xOver = crossOver.onePoint(select);
        var mutate = mutation.mutateRandom(xOver, sigma, heightAdjust);

        return mutate.getEnumerator();
    },
    firstFitTwoPointRandomMutation: function(basePopulation, fitnessFn, minFit, sigma, heightAdjust) {
        var select = selection.firstFit(basePopulation, fitnessFn, minFit);
        var xOver = crossOver.twoPoint(select);
        var mutate = mutation.mutateRandom(xOver, sigma, heightAdjust);

        return mutate.getEnumerator();
    },
};
