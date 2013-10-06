var FuzzyUtil = require('../../lib/fuzzy-logic/util');

// TODO: Learn more about mocha and nyan cat reporter.  Very important
describe('unit:lib/fuzzy-logic/util.js', function() {
    describe('#mean', function() {
        it('should take the mean of 2 sets.', function() {
            var a = [0.2, 0.3, 0.4];
            var b = [0.5, 0.6, 0.7];
            FuzzyUtil.mean(a, b).should.equal([0.35, 0.45, 0.55]);
        });
    });
});