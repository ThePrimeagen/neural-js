var Ix = require('ix');

module.exports = {
    mutateRandom: mutateRandom
}

/**
 * Randomly mutates the individual.  The stream coming in better be from a
 * crossover operation.
 *
 * @param  {Ix.Enumerable} selectorEnum
 * @param  {Number} probability
 * @return {Ix.Enumerable}
 */
function mutateRandom(selectorEnum, sigma, heightAdjust) {
    return selectorEnum
        .select(function(individual) {

            for(var i = 0; i < individual.length; i++)
            {
                //Use a gaussian to change the value of the individual
                var center = Math.random();
                var sigmaBase = 2 * sigma * sigma;
                var partial = Math.pow(Math.E, -1 * center * center / sigmaBase);
                var result = heightAdjust * partial;

                individual[i] += result;
            }

            return individual;
        });
}
