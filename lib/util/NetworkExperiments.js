var _ = require('lodash');

function average(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum / arr.length;
}

function direction(arr) {
    var sum = 0;
    for (var i = 1; i < arr.length; i++) {
        sum += arr[i - 1] - arr[i];
    }

    return sum > 0 ? 1 : -1;
}
/**
 * Takes the data set and splits it in half for a 5 / 2 test.
 * @param t
 */
function splitData(t) {
    var tClone = _.cloneDeep(t);
    var d1 = [], d2 = [];
    var half = t.length / 2;

    while (tClone.length) {
        var a = Math.floor(Math.random() * 100) % 2 === 0;
        var input = tClone.shift();
        var output = tClone.shift();

        if (a && d1.length < half) {
            d1.push(input);
            d1.push(output);
        } else if (a) {
            d2.push(input);
            d2.push(output);
        }

        if (!a && d2.length < half) {
            d2.push(input);
            d2.push(output);
        } else if (!a) {
            d1.push(input);
            d1.push(output);
        }
    }

    return [d1, d2];
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
function randomTraining(network, t, n) {
    var len = t.length;
    n = n || len / 2;

    for (var i = 0; i < n; i++) {
        var r = Math.floor(Math.random() * len);
        if (r % 2 === 1) {
            r--;
        }

        network.train(t[r], t[r + 1], r);
    }
    return i;
}

/**
 * Tests a fixed number of trains
 * @param network
 * @param t
 * @param tests
 * @returns {Array}
 */
function fixedTests(network, t, n) {
    var tests = 0;
    n = n || 1;

    console.log('Starting fixedTests');
    for (var k = 0; k < n; k++) {
        console.log('Trial: ' + k);
        tests += randomTraining(network, t);
        tests += randomTraining(network, t);
    }

    return tests;
}

/**
 * Given a training set and a network, this will converge the network.
 * @param network
 * @param t 
 */
function converge(network, t) {
    var tests = 0;
    var converged = false;
    var err = [];
    var prevErr = -100000;
    var tests = 0;
    var trials = t.length / 20;
    var error = [];
    var error2 = [];
    var avg = [];
    var avgConvergeLim = network.count() * 0.12;
    var incrementor = 0.00001;
    var out = 'Avg(' + network.name + '): ';
    var outAlert = trials * 10;
    var outStr;

    while (!converged) {
        tests += randomTraining(network, t, trials);

        // What to do?
        if (isNaN(err)) {
            network.reset();
            console.log("Reset network: " + network.name);
            tests = 0;
            error = [];
            error2 = [];
            prevErr = -100000;
        }

        if (error.length > 10) {
            error.shift();
            var avg = average(error);
            error2.push(avg);
        }

        if (error2.length > 10) {
            var avg = average(error2);
            var largestDiff = 0;
            var requiredAmount = avgConvergeLim + incrementor * tests;
            for (var i = 0; i < error2.length; i++) {
                var diff = Math.abs(avg - error2[i]);
                if (diff > largestDiff) {
                    largestDiff = diff;
                }
            }
            if (tests % outAlert === 0) {
                console.log(out + ' :: ' + largestDiff + ' :: ' + requiredAmount);
            }

            if (Math.sqrt(largestDiff) < requiredAmount) {
                converged = true;
            }
            error2.shift();
        }

        // That means summed error is less than 0.1 per output.  pretty good
        var err = network.getMSE();
        if (prevErr !== -100000) {
            error.push(err - prevErr);
        }
        prevErr = err;
    }
    return tests;
}

/**
 * Trains the network with data set t.
 * @param   network
 * @param   t
 * @return 
 */
function five2Training(network, t) {
    var data = splitData(t);
    // out, exp, err
    var results = [[], [], []];
    console.log('Starting 5/2 Training');

    for (var i = 0; i < 5; i++) {
        console.log('five2Training(' + network.name + '): ' + i);
        var tests = 0;

        // Train one side and get results
        network.reset();
        tests += converge(network, data[0]);
        var res1 = testData(network, data[1]);

        // Train other side
        network.reset();
        tests += converge(network, data[1]);
        var res2 = testData(network, data[0]);

        // // Push the results
        for (var j = 0; j < res1[0].length; j++) {
            results[0].push(res1[0][j]);
            results[1].push(res1[1][j]);
            results[2].push(res1[2][j]);
        }
        for (var j = 0; j < res2[0].length; j++) {
            results[0].push(res2[0][j]);
            results[1].push(res2[1][j]);
            results[2].push(res2[2][j]);
        }

        console.log('Tests: ' + tests);
    }

    return results;
}

function confusionMatrixFunction(processedData, outputCount) {

    // Builds the confusion matrix from each answers output and expected arrays.
    var confusionMatrix = [];
    var output = processedData[0];
    var expected = processedData[1];
    for (var i = 0; i < outputCount; i++) {
        var row = [];
        for (var j = 0; j < outputCount; j++) {
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
    var total = 0;
    var correct = 0;
    for(var i = 0; i < confusionMap.length; i++) {        
        if(i == j) {
            correct += confusionMap[i][j];
        }
        total += confusionMap[i][j];
    }

    return correct / total;
}

/**
 * Calculates the recall of the confusion map at number 'j'
 * @param  {Number[][]} confusionMap 
 * @param  {Number} j
 * @return {Number}
 */
function recall(confusionMap, j) {
    var total = 0;
    var correct = 0;
    for(var i = 0; i < confusionMap[0].length; i++) {        
        if(i == j) {
            correct += confusionMap[j][i];
        }
        total += confusionMap[j][i];
    }

    return correct / total;
}

var NetworkExperiments = {
    fixedTests: fixedTests,
    trainOnce: trainOnce,
    train: train,
    confusionMatrix: confusionMatrixFunction,
    manualTrain: function(network, input, output) {
        network.train(input, output);
    },
    recall: recall,
    precision: precision,
    five2Training: five2Training
};

module.exports = NetworkExperiments;