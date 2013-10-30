var selection = require('./lib/selection');
var crossOver = require('./lib/crossover');
var mutation = require('./lib/mutation');
var population = require('./lib/population');
var next = require('./lib/util').next;

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

    /**
     * Performs a roulette selection from the provided population
     * @param  {Array} basePopulation
     * @param  {Function} fitnessFn
     * @param  {Number} lambda The amount to select from the population
     * @return {Array} A subset of the base population selected by their fitness
     */
    rouletteSelection: function(basePopulation, fitnessFn, lambda) {
        var enu = population.rouletteSelector(basePopulation, fitnessFn);
        return enu.getEnumerator();
    }
};
