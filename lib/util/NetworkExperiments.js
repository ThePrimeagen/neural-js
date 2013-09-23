var _ = require('lodash');

function average(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum / arr.length;
}
/**
 * Takes the data set and splits it in half for a 5 / 2 test.
 * @param t
 */
function splitData(t) {
    var dataSet1 = [], dataSet2 = [], validation = [];
    var half = Math.floor((t.length - (t.length * .2)) / 2);
    var remainder = t.length - half * 2;
    var tClone = _.clone(t);

    while (remainder) {
        var a = Math.floor(Math.random() * tClone.length);
        if (a % 2 === 1) {
            a--;
        }

        var input = tClone.splice(a, 1)[0];
        var output = tClone.splice(a, 1)[0];
        validation.push(input);
        validation.push(output);
        remainder--;
    }

    while (tClone.length) {
        var a = Math.floor(Math.random() * 100) % 2 === 0;
        var input = tClone.shift();
        var output = tClone.shift();

        if (a && dataSet1.length < half) {
            dataSet1.push(input);
            dataSet1.push(output);
        } else if (a) {
            dataSet2.push(input);
            dataSet2.push(output);
        }

        if (!a && dataSet2.length < half) {
            dataSet2.push(input);
            dataSet2.push(output);
        } else if (!a) {
            dataSet1.push(input);
            dataSet1.push(output);
        }
    }

    return [dataSet1, dataSet2, validation];
}



/**
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 */
function trainData(network, t) {
    for (var i = 0; i < t.length; i += 2) {
        var input = t[i];
        var expectedOutput = t[i + 1];

        network.train(input, expectedOutput);
    }
}

/**
 * Runs a random data point through the network with its
 * expected output
 * @name trainOnce
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 */
function trainOnce(network, t) {
    var i = Math.floor(Math.random() * t.length);

    if (i % 2 !== 0) {
        i--;
    }

    network.train(t[i], t[i + 1]);
}

/**
 * @name NetworkTrainer
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 * @param {Number} n
 */
function train(network, t, n) {
    for (var trains = 0; trains < n; trains++) {
        trainData(network, t);
    }
}

/**
 * Will perform a test and calculate the average error from perspective of to - ao
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 * @returns {Array.<Array.<Number[]>>} t
 */
function testData(network, t) {
    var tOut = [];
    var tExp = [];
    var tErr = [];

    for (var i = 0; i < t.length; i += 2) {
        var input = t[i];
        var expectedOutput = t[i + 1];

        var output = network.test(input);
        var outputs = [];
        var errors = [];
        var exp = [];
        for (var o = 0; o < output.length; o++) {
            outputs.push(output[o]);
            errors.push(expectedOutput[o] - output[o]);
            exp.push(expectedOutput[o]);
        }

        tOut.push(outputs);
        tErr.push(errors);
        tExp.push(exp);
    }

    return [tOut, tExp, tErr];
}

/**
 * Trains the network with random
 * @param {NeuralNetwork} network
 * @param t
 */
function randomTraining(network, t) {

    for (var i = 0, len = t.length; i < len; i++) {
        var r = Math.floor(Math.random() * len);
        if (r % 2 === 1) {
            r--;
        }

        network.train(t[r], t[r + 1]);
    }
    return i;
}

/**
 * Gets the training stats from the training data.
 * @param trainingData
 * @returns {Number[]} Accuracy, Error, Count  These are non averaged values
 */
function getStats(trainingData) {
    var tOut = trainingData[0];
    var tExp = trainingData[1];
    var tErr = trainingData[2];
    var accuracy = 0;
    var error = 0;

    // tOut, tExp, and tErr should all be the same length
    for (var i = 0; i < tOut.length; i++) {
        var outs = tOut[i];
        var exps = tExp[i];
        var errors = tErr[i];

        // The sub tests for each outs, exps, and errors should all be the same length
        for (var j = 0; j < outs.length; j++) {

            // NOTE: I know that there will only be one output
            accuracy += outs[j] / exps[j];
            error += Math.abs(errors[j]);
        }
    }

    return [accuracy, error, i];
}

var NetworkExperiments = {

    /**
     * @param {NeuralNetwork} network
     * @param {Array.<Number[]>} t
     * @param {Number} [precision]
     * @return {Number[]} avg accuracy, avg error, test input count
     */
    five2Training: function(network, t, precision) {
        var accuracy = 0;
        var error = 0;
        var tests = 0;
        precision = precision || 10000;

        for (var fiveTests = 0; fiveTests < 5; fiveTests++) {

            var datasets = splitData(t);

            network.reset();
            var stats = [];

            for (var i = 0, j = 1; i <= 1; i++, j--) {

                // quick 50 times through ds
                for (var k = 0; k < 50; k++) {
                    trainData(network, datasets[i]);
                }
                stats.push(getStats(testData(network, datasets[j])));
            }

            accuracy += stats[0][0] + stats[1][0];
            error += stats[0][1] + stats[1][1];
            tests += stats[0][2] + stats[1][2];
        }
        network.reset();

        // Returns the average accuracy, error, and the count of test points that
        // were tested
        return [accuracy / tests, error / tests, tests];
    },

    /**
     * The converging algorithm will work in this way.  It will attempt to feed through the test
     * data seeing if there are improvements.  If there are improvements based on a certain error
     * amount.  If the improvements are not beyond a certain delta then it will be considered
     * "converged"
     *
     * @param {NeuralNetwork} network
     * @param {Array.<Number[]>} t
     * @param {Number} delta
     */
    converge: function(network, t, delta) {

        var converged = false;
        var datasets = splitData(t);
        var previousValidation = [];
        var secondPrev = [];
        var tests = 0;

        while (!converged) {

            var max = network.name === 'mlp' ? 500 : 50;
            for (var k = 0; k < max; k++) {
                tests += randomTraining(network, datasets[0]);
                tests += randomTraining(network, datasets[1]);
            }

            var answers = getStats(testData(network, datasets[2]));


            if (previousValidation.length === 7 && secondPrev.length === 7) {
                var avg1 = average(previousValidation);
                var avg2 = average(secondPrev);
                var diff = Math.abs((avg1 - avg2) / avg2);
                if (diff < delta) {
                    converged = true;
                }

                secondPrev.shift();
            }

            previousValidation.push(answers[1]);
            if (previousValidation.length === 8) {
                secondPrev.push(previousValidation.shift());
            }
        }

        return [tests, answers];
    },

    /**
     * A different approach to be considered "Converged"  This one involves
     * finding the average differences lower than delta provided
     * @param {NeuralNetwork} network
     * @param {Array.<Number[]>} t
     * @param {Number} delta
     * @returns {Array}
     */
    converge2: function(network, t, delta) {

        var converged = false;
        var datasets = splitData(t);
        var runningDiff = [];
        var tests = 0;
        var prevVal;
        var prevMil = 1000000;

        while (!converged) {

            var max = network.name === 'mlp' ? 500 : 50;
            for (var k = 0; k < max; k++) {
                tests += randomTraining(network, datasets[0]);
                tests += randomTraining(network, datasets[1]);
            }

            var answers = getStats(testData(network, datasets[2]));
            if (runningDiff.length === 7) {
                var avg = average(runningDiff);
                if (avg < delta) {
                    converged = true;
                } else {

                    // Fail safe for convergence
                    if (prevMil < tests) {
                        delta += 0.05;
                        prevMil += 1000000;
                    }
                }

                runningDiff.shift();
            }

            if (prevVal) {
                runningDiff.push(Math.abs(prevVal - answers[1]));
            }
            prevVal = answers[1];
        }

        return [tests, answers];
    },

    /**
     * @type trainOnce
     */
    trainOnce: trainOnce,

    /**
     * @type NetworkTrainer
     */
    train: train,

    /**
     * The manula training
     * @param input
     * @param output
     */
    manualTrain: function(network, input, output) {
        network.train(input, output);
    }
};

module.exports = NetworkExperiments;
