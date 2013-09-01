
/**
 * @type {{
 *     observable: Function
 * }}
 */
var Observable = {

    /**
     * the observable factory.
     */
    observable: function() {
        /**
         * @type {Array}
         */
        var callbacks = [];

        /**
         * The observable.
         * @param {Function} fn
         * @param {Object} scope
         */
        var observable = function(fn, scope) {
            callbacks.push({
                scope: scope,
                fn: fn
            });
        };

        /**
         * the observable dispatch function.
         */
        observable.dispatch = function() {
            for (var i = 0, len = callbacks.length; i < len; i++) {
                var callbackSet = callbacks[i];

                callbackSet.fn.apply(callbackSet.scope, arguments);
            }
        };

        return observable;
    }
};

module.exports = Observable;