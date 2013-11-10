var _ = require('lodash');

/**
 * Gets the input data from a test set.
 * @param  {Array.<Number[]> t 
 * @return {Array.<Number[]>}
 */
function getInputData(t) {
    var inputs = [];
    for (var i = 0; i < t.length; i += 2) {
        inputs.push(_.clone(t[i]));
    }
    return inputs;
}

module.exports = {
    getInputData: getInputData
}