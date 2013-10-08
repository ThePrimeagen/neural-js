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
    var remainder = Math.floor(t.length * .1);
    var half = Math.floor((t.length - remainder) / 2);
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

        network.train(t[r], t[r + 1], r);
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
            // NOTE: Accuracy of a '0' value is incalculable 
            // accuracy += outs[j] / exps[j];
            error += Math.abs(errors[j]);
        }
    }

    return [error, i];
}

/**
 * Use mse to determine if converged.
 * @param network
 * @param t
 * @param delta
 */
function converge(network, t, delta) {
    var converged = false;
    var datasets = splitData(t);
    var runningDiff = [];
    var tests = 0;
    var prevVal;
    var prevMil = 1000000;

    while (!converged) {

        var max = network.name === 'mlp' ? 1 : 5;
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
                    delta += 1;
                    prevMil += 1000000;
                }
            }

            runningDiff.shift();
        }

        if (prevVal) {
            runningDiff.push(Math.abs(prevVal - Math.sqrt(network._mse)));
        }
        prevVal = Math.sqrt(network._mse);

        if (isNaN(network._mse)) {
            converged = true;
        }
        network._mse = 0;
    }

    return [tests, answers];
}

/**
 * Tests a fixed number of trains
 * @param network
 * @param t
 * @param tests
 * @returns {Array}
 */
function fixedTests(network, t, testPoints) {
    var datasets = splitData(t);
    var tests = 0;
    network.reset();

    for (var k = 0; tests < testPoints; k++) {
        tests += randomTraining(network, datasets[0]);
        tests += randomTraining(network, datasets[1]);
    }

    var answers = testData(network, datasets[2]);
    return [tests, answers];
}

function confusionMatrixFunction(network, t, trainingPoints, reset) {
    reset = reset === undefined ? true : reset;

    var datasets = splitData(t);
    var tests = 0;
    var confusionMatrix = [];

    if (reset) {
        network.reset();
    }

    // NOTE: testData will return enough information that we can create
    // a confusion matrix
    for (tests = 0; tests < trainingPoints;) {
        tests += randomTraining(network, datasets[0]);
        tests += randomTraining(network, datasets[1]);
    }

    var answers = testData(network, datasets[2]);
    var output = answers[0];
    var expected = answers[1];
    var size = output[0].length; // output size
    for (var i = 0; i < size; i++) {
        var row = [];
        for (var j = 0; j < size; j++) {
            row.push(0);
        }
        confusionMatrix.push(row);
    }

    for (var i = 0; i < output.length; i++) {
        var row = getIndexOfClassification(expected[i]);
        var col = getIndexOfClassification(output[i]);
        confusionMatrix[row][col]++;
    }

    return confusionMatrix;
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
 * This is strictly for a classification output.  It will find which classifiction
 * index was used.
 */
function getIndexOfClassification(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i]) {
            return i;
        }
    }
}

/**
 * Calculates the precision of the confusion map at number j
 * @param  {Number[][]} confusionMap 
 * @param  {Number} j
 * @return {Number}
 */
function precision(confusionMap, j) {

}

/**
 * Calculates the recall of the confusion map at number 'j'
 * @param  {Number[][]} confusionMap 
 * @param  {Number} j
 * @return {Number}
 */
function recall(confusionMap, j) {
    
}

var NetworkExperiments = {
    converge: converge,
    fixedTests: fixedTests,
    trainOnce: trainOnce,
    train: train,
    confusionMap: confusionMatrixFunction,
    manualTrain: function(network, input, output) {
        network.train(input, output);
    }
};

module.exports = NetworkExperiments;