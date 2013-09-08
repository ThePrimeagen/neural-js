module.exports = {
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
        for (var x = 0; x < 100; x++) {
            for (var y = 0; y < 100; y++) {
                data.push([x, y]);
                data.push([x * y]);
            }
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
        for (var x = 1; x < 100; x++) {
            for (var y = 1; y < 100; y++) {
                data.push([x, y]);
                data.push([x + y]);
            }
        }

        return data;
    }
}