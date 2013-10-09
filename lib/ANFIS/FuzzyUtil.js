/**
 * Fuzzy set operations.
 */
 var _ = require('lodash');

/**
 * Normalizes an array and returns the result.  Does not mutate
 * @param  {Number[]} a 
 * @return {Number[]} Normalized a
 */
function normalize(a) {
    var largestVal = 0;
    var largestIdx = 0;
    var c = _.clone(a);

    for (var i = 0, len = c.length; i < len; i++) {
        if (largestVal < c[i]) {
            largestVal = c[i];
            largestIdx = i;
        }
    }

    for (var i = 0, len = c.length; i < len; i++) {
        c[i] = c[i] / largestVal;
    }

    return c;
}

/**
 * Concentrates the fuzzy set by taking each value to the power of p.
 * @param  {Number[]} a The fuzzy Set.  Does not mutate the set
 * @param  {Number} [p] the power to take each value to.  Cannot provide 0
 * @return {Number[]} A concentration p clone of a
 */
function concentrate(a, p) {
    p = p || 2;

    var c = _.clone(a);
    for (var i = 0, len = c.length; i < len; i++) {
        c[i] = Math.pow(c[i], p);
    }

    return c;
}

/**
 * The opposite operation as concentration
 * @param  {Number[]} a The fuzzy Set.  Does not mutate the set
 * @param  {Number} [p] the power to take each value squarerooted too.  Cannot provide 0
 * @return {Number[]} dialation p clone of a
 */
function dialate(a, p) {
    p = 1 / (p || 2);

    var c = _.clone(a);
    for (var i = 0, len = c.length; i < len; i++) {
        c[i] = Math.pow(c[i], p);
    }

    return c;
}

/**
 * Intensification is concentrating and dialating half of the set to make the
 * divide more apparent.
 * 
 * @param  {Number[]} a The set to intensify
 * @param  {Number} [p] The power to dialate / concentrate on
 * @return {Number[]} The clone, intensified by p set of a
 */
function intensify(a, p) {
    p = p || 2;

    var c = _.clone(a);
    for (var i = 0, len = c.length; i < len; i++) {
        if (c[i] <= 0.5) {
            c[i] = Math.pow(c[i], p);

        // From p.283 [Computational Intelligence]
        } else {
            c[i] = 1 - 2 * Math.pow(1 - c[i], p);
        }
    }

    return c;
}

/**
 * Not operation.  This is based off of 1 - membership value.
 * This may not apply to logistic/gaussian function.
 *  
 * @param  {Number[]} a Set A
 * @return {Number[]} Normalized set A
 */
function not(a) {
    var c = _.clone(a);
    for (var i = 0, len = c.length; i < len; i++) {
        c[i] = 1 - c[i];
    }
    return c;
}

/**
 * The gamma function is a more complex Compensatory function that is
 * hoped to mimic human behavior better.  Developed by Zimmerman and Zysno (80, 83)
 *
 * Based on p.289 [Computation Intelligence] a gamma value should be between 0.2 and 0.4
 * and usually best to start with 0.25 - 0.3
 * 
 * @param  {Number[]} a Set A 
 * @param  {Number} gamma  0 <= gamma <= 1
 * @return {Number} gamma Value 
 */
function gammaFunction(a, gamma) {
    // there are two product terms which must be multiplied together at the end.
    var g0 = 1, g1 = 1;
    for (var i = 0, len = a.length; i < len; i++) {
        g0 *= Math.pow(a[i], 1 - gamma);
        g1 *= (1 - a[i]);
    }
    g1 = Math.pow(1 - g1, gamma);

    return g0 * g1;
}

/**
 * AND (Intersect) the two sets together which is the minimum set between
 * the two sets
 * @param  {Number[]} a Set A
 * @param  {Number[]} b Set B
 * @return {Number[]}   Set A AND B (Intersection)
 */
function intersect(a, b) {
    var c = [];
    for (var i = 0, len = a.length; i < len; i++) {
        c.push(a[i] > b[i] ? b[i] : a[i]);
    }
    return c;
}

/**
 * OR (Union) the two sets together which is the maximum set between
 * the two sets
 * @param  {Number[]} a Set A
 * @param  {Number[]} b Set B
 * @return {Number[]}   Set A AND B (Intersection)
 */
function union(a, b) {
    var c = [];
    for (var i = 0, len = a.length; i < len; i++) {
        c.push(a[i] > b[i] ? a[i] : b[i]);
    }
    return c;
}

/**
 * If the two sets are equal or not
 * @param  {Number[]} a Set A
 * @param  {Number[]} b Set B
 * @return {Boolean} If the two sets are equal
 */
function equal(a, b) {
    for (var i = 0, len = a.length; i < len; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

/**
 * If 'b' is contained within 'a'
 * @param  {Number[]} a Set A 
 * @param  {[type]} b Set B
 * @return {Boolean} If 'b' is contained within 'a'
 */
function contained(a, b) {
    for (var i = 0, len = a.length; i < len; i++) {
        if (a[i] < b[i]) {
            return false;
        }
    }
    return true;
}

/**
 * The mean of all the sets provided.  There is no specified parameters
 * to how many sets can be used.  But a minimum of 2 is required for a mean.
 * @return {Number[]} The mean of the sets provided
 */
function mean() {
    var c = [];
    var dimensions = arguments.length;
    for (var i = 0, len = arguments[0].length; i < len; i++) {
        var sum = 0;
        for (var j = 0; j < dimensions; j++) {
            sum += arguments[j];
        }
        c.push(sum / dimensions);
    }

    return c;
}

// The available operations for fuzzy sets
module.exports = {
    // Fuzzy operations and compensatories 
    normalize: normalize,
    concentrate: concentrate,
    dialate: dialate,
    intensify: intensify,
    equal: equal,
    contained: contained,
    union: union,
    intersect: intersect,
    mean: mean,
    gamma: gammaFunction,

    // Logical operations
    AND: intersect,
    OR: union,
    NOT: not
};