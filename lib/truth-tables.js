module.exports = {
    X: function() {
        var data = [];
        for (var x = 0; x < 1000; x++) {
            data.push([x / 100]);
            data.push([x / 100]);
        }

        return data;
    },

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
        range = range || 1;
        dataPointCount = dataPointCount || 50;
        dataPointCount = Math.pow(dataPointCount, 0.5);

        var data = [];

        // X, Y
        for (var x = -range; x < range; x += 1 / dataPointCount) {
            for (var y = -range; y < range; y += 1 / dataPointCount) {
                data.push([x, y]);
                data.push([rosenbrock(x, y)]);
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
    Rosenbrock3: function(range, dataPointCount) {
        range = range || 1;
        dataPointCount = dataPointCount || 50;
        dataPointCount = Math.pow(dataPointCount, 0.333);

        var data = [];

        // X, Y
        for (var x = -range; x < range; x += 1 / dataPointCount) {
            for (var y = -range; y < range; y += 1 / dataPointCount) {
                for (var z = -range; z < range; z += 1 / dataPointCount) {
                    data.push([x, y, z]);
                    data.push([rosenbrock(x, y, z)]);
                }
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
    Rosenbrock4: function(range, dataPointCount) {
        range = range || 1;
        dataPointCount = dataPointCount || 50;
        dataPointCount = Math.pow(dataPointCount, 0.25);

        var data = [];

        // X, Y
        for (var x0 = -range; x0 < range; x0 += 1 / dataPointCount) {
            for (var x1 = -range; x1 < range; x1 += 1 / dataPointCount) {
                for (var x2 = -range; x2 < range; x2 += 1 / dataPointCount) {
                    for (var x3 = -range; x3 < range; x3 += 1 / dataPointCount) {
                        data.push([x0, x1, x2, x3]);
                        data.push([rosenbrock(x0, x1, x2, x3)]);
                    }
                }
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
    Rosenbrock5: function(range, dataPointCount) {
        range = range || 1;
        dataPointCount = dataPointCount || 50;
        dataPointCount = Math.pow(dataPointCount, 0.2);

        var data = [];

        // X, Y
        for (var x0 = -range; x0 < range; x0 += 1 / dataPointCount) {
            for (var x1 = -range; x1 < range; x1 += 1 / dataPointCount) {
                for (var x2 = -range; x2 < range; x2 += 1 / dataPointCount) {
                    for (var x3 = -range; x3 < range; x3 += 1 / dataPointCount) {
                        for (var x4 = -range; x4 < range; x4 += 1 / dataPointCount) {
                            data.push([x0, x1, x2, x3, x4]);
                            data.push([rosenbrock(x0, x1, x2, x3, x4)]);
                        }
                    }
                }
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
    Rosenbrock6: function(range, dataPointCount) {
        range = range || 1;
        dataPointCount = dataPointCount || 50;
        dataPointCount = Math.pow(dataPointCount, 0.1666);

        var data = [];

        // X, Y
        for (var x0 = -range; x0 < range; x0 += 1 / dataPointCount) {
            for (var x1 = -range; x1 < range; x1 += 1 / dataPointCount) {
                for (var x2 = -range; x2 < range; x2 += 1 / dataPointCount) {
                    for (var x3 = -range; x3 < range; x3 += 1 / dataPointCount) {
                        for (var x4 = -range; x4 < range; x4 += 1 / dataPointCount) {
                            for (var x5 = -range; x5 < range; x5 += 1 / dataPointCount) {
                                data.push([x0, x1, x2, x3, x4, x5]);
                                data.push([rosenbrock(x0, x1, x2, x3, x4, x5)]);
                            }
                        }
                    }
                }
            }
        }

        return data;
    },

    /**
     * The rosenbrock function
     */
    rosenbrock: rosenbrock
};

/**
 * The rosenbrock function
 * @returns {number}
 */
function rosenbrock() {
    var val = 0;
    for (var i = 0; i < arguments.length - 1; i++) {
        var t1 = Math.pow(1 - arguments[i], 2);
        var t2 = Math.pow(arguments[i + 1] - arguments[i] * arguments[i], 2);

        val += t1 + 100 * t2;
    }

    return val;
}