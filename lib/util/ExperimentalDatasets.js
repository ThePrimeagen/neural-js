var _ = require('lodash');

/**
 * Takes the data set and splits it in half for a 5 / 2 test.
 * @param t
 */
function five2(t) {
    var dataSet1 = [], dataSet2 = [];
    var half = t.length / 2;
    var tClone = _.clone(t);

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

    return [dataSet1, dataSet2];
}



module.exports = {
    five2: five2
}
