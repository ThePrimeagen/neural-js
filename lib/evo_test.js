var evo = require('./evolution/evolution');
var next = require('./evolution/lib/util').next;
var Ix = require('ix');

// Constructs population.
var population = [];
for (var i = 0; i < 100; i++) {
    var individual = [];
    for (var j = 0; j < 25; j++) {
        individual[j] = Math.random();
    }
    population[i] = individual;
}

function fit(individual) {
    var len = individual.length;
    var sum = 0;
    var max = 0;

    for (var i = 0; i < len; i++) {
        if (i * 2 > len) {
            sum += individual[i];
            max++;
        } else {
            sum -= 1.75 * individual[i];
        }
    }

    return sum > 0 ? sum / max : 0;
}

function getPopFitness() {
    var sum = 0;
    for (var i = 0; i < population.length; i++) {
        sum += fit(population[i]);
    }

    return sum / population.length;
}

/** Performs a roulette selection */
function rouletteFilter(fitnessFn, maximize) {
    var largestValue = 0;
    return function(individual) {
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
    };
}

// Gets the evo strategy.
var en = evo.firstFitTwoPointRandomMutation(population, fit, 0, 0.05, 0.05);
// walks through everything 10 times.
for (var i = 0; i < 1000; i++) {
    if (i % 100 === 0)
        console.log('Round(' + i + '): Current Fitness of population is ' + getPopFitness());

    // Performs crossover and mutation.
    var populationNext = [];
    for (var j = 0; j < population.length; j++) {
        en.moveNext();
        populationNext[j] = en.getCurrent();
    }

    var len = population.length;
    var selector = evo.rouletteSelection(populationNext.concat(population), fit, len);
    for (var i = 0; i < len; i++) {
        population.pop();
        population.unshift(next(selector));
    }
}

console.log(population[1]);
