var _ = require('lodash');
var NetworkUtil = require('NetworkMath');

var toString = function() {
    var w = [];
    for (var i = 0; i < this.w.length; i++) {
        w.push(NetworkUtil.delimitDataDisplay(this.w[i]));
    }

    var dW = [];
    for (i = 0; i < this.deltaW.length; i++) {
        dW.push(NetworkUtil.delimitDataDisplay(this.deltaW[i]));
    }

    return 'Node(' + this.id + '): ' +
        [
            'i:', NetworkUtil.delimitDataDisplay(this.input),
            'o:', NetworkUtil.delimitDataDisplay(this.output),
            'w:', w,
            'dW:', dW,
            'e:', this.error
        ].join(' ');
};

/**
 * the representation of a neuron
 */
var Neuron = {
    id: '',
    bias: false,
    input: 0,
    output: 0,
    w: [], // The list of weights from the previous layer
    error: 0,
    deltaW: [], // step change of weights
    tempDeltaW: [], // step change of weights
    toString: toString,
    activationFn: NetworkUtil.activationFunction(NetworkUtil.Types.Sigmoid),
    dActivationFn: NetworkUtil.dActivationFunction(NetworkUtil.Types.Sigmoid)
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