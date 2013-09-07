var _ = require('lodash');

var toString = function() {
    return 'Node(' + this.id + '): ' + ['i:', this.input, 'o:', this.output, 'w:', this.w, 'dW:', this.deltaW, 'e:', this.error].join(' ');
};

/**
 * the representation of a neuron
 * @type {{input: number, output: number, w: Array, error: number, deltaW: Array, tempDeltaW: Array}}
 */
var Neuron = {
    id: '',
    input: 0,
    output: 0,
    w: [], // The list of weights from the previous layer
    error: 0,
    deltaW: [], // step change of weights
    tempDeltaW: [], // temp. step change of weights
    toString: toString
};

/**
 * @returns {Neuron}
 */
module.exports = function(id) {
    var n = _.cloneDeep(Neuron);
    if (id) {
        n.id = id;
    }

    return n;
};