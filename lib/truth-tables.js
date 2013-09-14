module.exports = {
    /**
     * A simple 2 parameter function
     * @returns {Array}
     * @constructor
     */
    XplusY: function() {
        var data = [];
        for (var i = 1; i < 100; i++) {
            for (var j = 1; j < 100; j++) {

                var x = i / 100;
                var y = j / 100;
                data.push([x, y]);
                data.push([x + y]);
            }
        }

        return data;
    },
    /**
     * The truth table for AND
     * @returns {Array}
     * @constructor
     */
    AND: function() {
        return [
            [0, 0], [0],
            [0, 1], [0],
            [1, 0], [0],
            [1, 1], [1]
        ];
    },

    /**
     * The truth table for an OR
     * @returns {Array}
     * @constructor
     */
    OR: function() {
        return [
            [0, 0], [0],
            [0, 1], [1],
            [1, 0], [1],
            [1, 1], [1]
        ];
    },

    /**
     * The truth table for XOR
     * @returns {Array}
     * @constructor
     */
    XOR: function() {
        return [
            [0, 0], [0],
            [0, 1], [1],
            [1, 0], [1],
            [1, 1], [0]
        ];
    },

    /**
     * A simple 2 parameter function
     * @returns {Array}
     * @constructor
     */
    XY: function() {
        var data = [];
        for (var i = 1; i < 100; i++) {
            for (var j = 1; j < 100; j++) {

                var x = (i - 50) / 50;
                var y = (j - 50) / 50;
                data.push([x, y]);
                data.push([x * y]);
            }
        }

        return data;
    },


    /**
     * The constant function
     * @returns {Array}
     * @constructor
     */
    Constant: function() {
        var data = [];
        for (var x = 1; x < 100; x++) {
            for (var y = 1; y < 100; y++) {
                data.push([x, y]);
                data.push([5]);
            }
        }

        return data;
    },

    /**
     * x^2
     * @returns {Array}
     * @constructor
     */
    XSquared: function() {
        var data = [];
        for (var x = 1; x < 100; x++) {
            for (var y = 1; y < 100; y++) {
                data.push([x]);
                data.push([x * 2]);
            }
        }

        return data;
    },

    /**
     * Will calculate data within range
     * @param {Number} range
     * @param {Number} dataPointCount
     * @constructor
     */
    Rosenbrock2: function(range, dataPointCount) {

        var halfRange = range / 2;
        var data = [];
        for (var i = 0; i < dataPointCount; i++) {

            // X, Y
            for (var x = -halfRange; x < halfRange; x += 1 / dataPointCount) {
                for (var y = -halfRange; y < halfRange; y += 1 / dataPointCount) {
                    data.push([x, y]);
                    data.push([rosenbrock(x, y)]);
                }
            }
        }
    }
};

/**
 * The rosenbrock function
 * @returns {number}
 */
function rosenbrock() {
    var val = 0;
    for (var i = 0; i < arguments.length; i++) {
        var t1 = Math.pow(1 - arguments[i], 2);
        var t2 = Math.pow(arguments[i + 1] - arguments[i] * arguments[i], 2);

        val += t1 + 100 * t2;
    }

    return val;
}