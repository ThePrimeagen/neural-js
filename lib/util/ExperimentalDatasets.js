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
        var val = tClone.shift();

        if (a && dataSet1.length < half) {
            dataSet1.push(val);
        } else if (a) {
            dataSet2.push(val);
        }

        if (!a && dataSet2.length < half) {
            dataSet2.push(val);
        } else if (!a) {
            dataSet1.push(val);
        }
    }
}


module.exports = {
    five2: five2
}
