var RBFController = require('./RBFController');
var _ = require('lodash');



var CompetitiveRBFController = function(configuration, t) {
    RBFController.apply(this, [configuration, t]);
};

CompetitiveRBFController.prototype = _.assign(CompetitiveRBFController.prototype, RBFController.prototype, {
    /**
     * The only difference between RBF Competitive controller and regular controller
     * @param  {Number[]} input
     * @param  {Number[]} output
     */
    train: function(input, output) {
        for (var i = 0, len = this._networks.length; i < len; i++) {
            this._networks[i].test(input);
        }

        // Finds the classified network then trains that one only.
        var outs = this.getOutput();
        for (i = 0; i < len; i++) {
            if (outs[i]) {
                this._networks[i].train(input, output);
                break;
            }
        }
    }
});

module.exports = CompetitiveRBFController;