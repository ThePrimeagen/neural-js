/**
 * The neuron-connector.  Connects two neurons
 * @param {Neuron} from
 * @param {Number} weight
 * @returns {{weight: Number}}
 */
module.exports = function(from, weight) {
    return {
        weight: weight,
        from: from
    };
};