var evo = require('./evolution/strategy_enumerables');
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
        sum += individual[i];
        max++;
    }

    return sum / max;
}

function getPopFitness() {
    var sum = 0;
    for (var i = 0; i < population.length; i++) {
        sum += fit(population[i]);
    }

    return sum / population.length;
}

// Gets the evo strategy.
var en = evo.firstFitOnePointRandomMutation(population, fit, 0.501, 0.5);

// walks through everything 10 times.
for (var i = 0; i < 100; i++) {
    console.log('Round(' + i + '): Current Fitness of population is ' + getPopFitness());

    // Performs crossover and mutation.
    var populationNext = [];
    for (var j = 0; j < population.length; j++) {
        en.moveNext();
        populationNext[j] = en.getCurrent();
    }

    var finalList = [];
    for (var j = population.length - 1; j >= 0; j--) {
        var next = null;

        // "Smarter" selects better populations
        if (fit(population[j]) > fit(populationNext[j])) {
            next = population[j];
        } else {
            next = populationNext[j];
        }

        population.pop();
        population.unshift(next);
    }
}
