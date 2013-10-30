var Ix = require('ix');
var util = require('./util');

module.exports = {
    rouletteSelector: rouletteSelector
};

/**
 * filters with roulette
 * @param  {Array} basePopulation
 * @return {Ix.Enumerable}
 */
function rouletteSelector(basePopulation, fitnessFn) {
    var largestValue = 0;
    var maximize = true;

    return util.sequentialValue(basePopulation)
        .filter(function(individual) {
            var fit = fitnessFn(individual);
            if (fit > largestValue) {
                largestValue = fit;
            }

            if (largestValue === 0) {
                largestValue = 0.001;
            }
            var chance = Math.random();

            // Maximize the closer fit is to largest value the higher the
            // chances (1 - 0.95 == 0.05, 95% chance) of being selected.
            // Minimize is fit / largest  (so if 0.95, 5% chance of being selected).
            var take = maximize ? chance > (0.99 - fit / largestValue) : chance > (fit / largestValue);

            // Always make largest value smaller and smaller.  As our population gets
            // better, so should our largest value.
            largestValue *= 0.999;

            return take;
        })
        .distinct();
}
