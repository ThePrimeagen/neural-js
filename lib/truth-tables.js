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
     * A simple 2 parameter function
     * @returns {Array}
     * @constructor
     */
    XY: function() {
        var data = [];
        for (var x = 0; x < 1000; x++) {
            for (var y = 0; y < 1000; y++) {
                data.push([x, y]);
                data.push(x * y);
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
        for (var x = 0; x < 1000; x++) {
            for (var y = 0; y < 1000; y++) {
                data.push([x, y]);
                data.push(x + y);
            }
        }

        return data;
    }
}