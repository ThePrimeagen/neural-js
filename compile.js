var browserify = require('browserify');
var path = require('path');
var fs = require('fs');
var mkpath = require('mkpath');
var _ = require('lodash');

module.exports = {
    /**
     * Compiles the program
     */
    compile: function() {

        var srcPath = './lib';
        var externals = './external/';
        var out = './static/src/dist';
        var debug = true;
        var b = browserify()
            .add(externals + 'index.js');

        // Adds the externals
        browserifyExternals(b, externals);
        b.bundle({debug: false}, function(err, src) {
            if (!err) {
                mkpath(out, function(err) {
                    if (!err) {
                        var bundlePath = path.join(out, 'bundle.js');

                        console.log("Writing Bundle: " + bundlePath + " : Html to: " + out);
                        fs.writeFile(bundlePath, src, function(err) {
                            if (err) {
                                console.log('Error JS(' + srcPath + '): ' + err);
                            }
                        });
                    }
                });
            } else {
                console.log(err);
            }
        });
    }
};

// TODO: Create this into something read from manifest.json
function browserifyExternals(b, externals) {
    b.require(externals + 'rx.js', {expose: 'rx'});
    b.require(externals + 'rx.binding.js', {expose: 'rxjs-bindings'});
    b.require(externals + 'Observable.js', {expose: 'Observable'});
    b.require('lodash', {expose: 'lodash'});
    b.require('./lib/neural-networks/NeuralNetwork', {expose: 'NeuralNetwork'});
    b.require('./lib/ANFIS/util.js', {expose: 'FuzzyUtil'});
    b.require('./lib/neural-networks/RBFNetwork', {expose: 'RBFNetwork'});
    b.require('./lib/neural-networks/lib/NetworkMath', {expose: 'NetworkMath'});
    b.require('./lib/neural-networks/lib/NetworkStates', {expose: 'NetworkStates'});
    b.require('./lib/util/NetworkExperiments', {expose: 'NetworkExperiments'});
    b.require('./lib/truth-tables', {expose: 'truth-tables'});
}