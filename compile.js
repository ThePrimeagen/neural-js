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

        var srcPath = './lib/';
        var externals = './external/';
        var out = './static/src/';
        var debug = true;
        var b = browserify()
            .add('./lib/');

        // Adds the externals
        browserifyExternals(b, externals);

        b.bundle({debug: debug}, function(err, src) {
            if (!err) {
                mkpath(out, function(err) {
                    if (!err) {
                        var bundlePath = path.join(out, 'bundle.js');

                        console.log("Writing Bundle: " + bundlePath + " : Html to: " + htmlPath);
                        fs.writeFile(bundlePath, src, function(err) {
                            if (err) {
                                console.log('Error JS(' + srcPath + '): ' + err);
                            }
                        });
                    }
                });
            }
        });
    }
};

// TODO: Create this into something read from manifest.json
function browserifyExternals(b, externals) {
    b.require(externals + 'jquery.js', {expose: 'jquery'});
    b.require(externals + 'rx.js', {expose: 'rx'});
    b.require(externals + 'rx.binding.js', {expose: 'rxjs-bindings'});
    b.require('lodash', {expose: 'lodash'});
}