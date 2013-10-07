var annConfig = {
    hiddenLayerCount: 1,
    hiddenLayerNeuronCount: 5,
    outputCount: 1,
    eta: 0.5,
    alpha: 0.2,
    rho: 0.231,
    momentum: false,
    runOutputWeightChangeFirst: false

};

var dataConfig = {
    range: 0.75,
    density: 500,
    alpha: 0.1
};

module.exports = {
    dataConfig: dataConfig,
    annConfig: annConfig
}
