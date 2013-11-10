/**
 * Gets the output index from the outputArr. 
 * @param  {Number[]} outputArr 
 * @return {Number}
 */
function getOutputIdx(outputArr) {
    for (var i = 0; i < outputArr.length; i++) {
        if (outputArr[i]) {
            return i;
        }
    }

    return i;
}

var Controller = function(configuration, t) {
    var outputCount = 0;
    var outputMap = {};

    // Discovers all output characters
    for (var i = 1; i < t.length; i += 2) {

        // Assumes one output value
        var out = getOutputIdx(t[i]);
        if (!outputMap[out]) {
            outputMap[out] = [];
            outputCount++;
        }

        // Puts the input array
        outputMap[out].push(t[i - 1]);
    }

    this._networks = [];
    configuration.useBiasInput = false;
    configuration.outputCount = 1;
    this._outputMap = outputMap;
};

Controller.prototype = {
    /**
     * Trains the networks that are controlled by the anfis controller.
     * @param  {Number[]} inputs 
     * @param  {Number[]} expectedOutputs 
     */
    train: function(inputs, expectedOutputs) {
        for (var i = 0, len = this._networks.length; i < len; i++) {
            this._networks[i].train(inputs, expectedOutputs.slice(i,i+1));
        }
        this._networks[getOutputIdx(expectedOutputs)].train(inputs, [1]);
    },

    /**
     * Tests the network and returns the output.
     * @param  {Number[]} inputs 
     * @return {Array} 
     */
    test: function(inputs) {
        for (var i = 0, len = this._networks.length; i < len; i++) {
            this._networks[i].test(inputs);
        }

        return this.getOutput();
    },

    /**
     * Traverses its networks and grabs the output.  The highest output
     * wins.
     * @return {Array}
     */
    getOutput: function() {
        var h = false, idx;
        var output = [];
        for (var i = 0; i < this._networks.length; i++) {
            output.push(0);
        }

        for (var i = 0, len = this._networks.length; i < len; i++) {
            var network = this._networks[i];
            if (!h || h < network.getOutput()[0]) {

                // Saves the idx and the highest output.  The output is always
                // a single value.
                idx = i;
                h = network.getOutput()[0];
            }
        }

        output[idx] = 1;
        return output;
    },

    /**
     * Gets the total error of the network.  This is unique in that it returns
     * the summed total
     * @return {Number}
     */
    getError: function() {
        var sum = 0;
        for (var i = 0, len = this._networks.length; i < len; i++) {
            sum += this._networks[i].getError()[0];
        }

        return sum;
    },

    reset: function() {
        for (var i = 0, len = this._networks.length; i < len; i++) {
            this._networks[i].reset();
        }
    },

    /**
     * Gets the network count
     */
    count: function() {
        return this._networks.length;
    },

    /**
     * Gets the total MSE for the networks.
     */
    getMSE: function() {
        var sum = 0;
        for (var i = 0, len = this._networks.length; i < len; i++) {
            sum += this._networks[i]._mse;
        }

        return sum;
    }
};

module.exports = Controller;