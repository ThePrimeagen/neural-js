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
    var tClone = _.cloneDeep(t);
    var d1 = [], d2 = [];

    // Input + output is in t and we remove 2 at a time (hence div by 4)
    var half = t.length / 4;

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
        console.log('five2Training: ' + i);

        // Train one side and get results
        network.reset();
        fixedTests(network, data[0], 5);
        var res1 = testData(network, data[1]);

        // Train other side
        network.reset();
        fixedTests(network, data[1], 5);
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