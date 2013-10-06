require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Y+5ueL":[function(require,module,exports){

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
},{}],"Observable":[function(require,module,exports){
module.exports=require('Y+5ueL');
},{}],3:[function(require,module,exports){
var Rx = require('rx');
var RxBindings = require('rxjs-bindings');
var _ = require('lodash');

},{"lodash":"fYW/7L","rx":"nNHdGN","rxjs-bindings":"uJtLUA"}],"rxjs-bindings":[function(require,module,exports){
module.exports=require('uJtLUA');
},{}],"uJtLUA":[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.txt in the project root for license information.

(function (root, factory) {
    var freeExports = typeof exports == 'object' && exports,
        freeModule = typeof module == 'object' && module && module.exports == freeExports && module,
        freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal) {
        window = freeGlobal;
    }

    // Because of build optimizers
    if (typeof define === 'function' && define.amd) {
        define(['rx', 'exports'], function (Rx, exports) {
            root.Rx = factory(root, exports, Rx);
            return root.Rx;
        });
    } else if (typeof module === 'object' && module && module.exports === freeExports) {
        module.exports = factory(root, module.exports, require('./rx'));
    } else {
        root.Rx = factory(root, {}, root.Rx);
    }
}(this, function (global, exp, Rx, undefined) {
    
    var Observable = Rx.Observable,
        observableProto = Observable.prototype,
        AnonymousObservable = Rx.Internals.AnonymousObservable,
        Subject = Rx.Subject,
        AsyncSubject = Rx.AsyncSubject,
        Observer = Rx.Observer,
        ScheduledObserver = Rx.Internals.ScheduledObserver,
        disposableCreate = Rx.Disposable.create,
        disposableEmpty = Rx.Disposable.empty,
        CompositeDisposable = Rx.CompositeDisposable,
        currentThreadScheduler = Rx.Scheduler.currentThread,
        inherits = Rx.Internals.inherits,
        addProperties = Rx.Internals.addProperties;

    // Utilities
    var objectDisposed = 'Object has been disposed';
    function checkDisposed() {
        if (this.isDisposed) {
            throw new Error(objectDisposed);
        }
    }

    /**
     * Multicasts the source sequence notifications through an instantiated subject into all uses of the sequence within a selector function. Each
     * subscription to the resulting sequence causes a separate multicast invocation, exposing the sequence resulting from the selector function's
     * invocation. For specializations with fixed subject types, see Publish, PublishLast, and Replay.
     * 
     * @example
     * 1 - res = source.multicast(observable);
     * 2 - res = source.multicast(function () { return new Subject(); }, function (x) { return x; });
     * 
     * @param {Mixed} subjectOrSubjectSelector 
     * Factory function to create an intermediate subject through which the source sequence's elements will be multicast to the selector function.
     * Or:
     * Subject to push source elements into.
     * 
     * @param {Function} [selector] Optional selector function which can use the multicasted source sequence subject to the policies enforced by the created subject. Specified only if <paramref name="subjectOrSubjectSelector" is a factory function.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.multicast = function (subjectOrSubjectSelector, selector) {
        var source = this;
        return typeof subjectOrSubjectSelector === 'function' ?
            new AnonymousObservable(function (observer) {
                var connectable = source.multicast(subjectOrSubjectSelector());
                return new CompositeDisposable(selector(connectable).subscribe(observer), connectable.connect());
            }) :
            new ConnectableObservable(source, subjectOrSubjectSelector);
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence.
     * This operator is a specialization of Multicast using a regular Subject.
     * 
     * @example
     * 1 - res = source.publish();
     * 2 - res = source.publish(function (x) { return x; });
     * 
     * @param {Function} [selector] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive all notifications of the source from the time of the subscription on.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.publish = function (selector) {
        return !selector ?
            this.multicast(new Subject()) :
            this.multicast(function () {
                return new Subject();
            }, selector);
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence containing only the last notification.
     * This operator is a specialization of Multicast using a AsyncSubject.
     * 
     * @example
     * 1 - res = source.publishLast();
     * 2 - res = source.publishLast(function (x) { return x; });
     * 
     * @param selector [Optional] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will only receive the last notification of the source.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.publishLast = function (selector) {
        return !selector ?
            this.multicast(new AsyncSubject()) :
            this.multicast(function () {
                return new AsyncSubject();
            }, selector);
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence and starts with initialValue.
     * This operator is a specialization of Multicast using a BehaviorSubject.
     * 
     * @example
     * 1 - res = source.publishValue(42);
     * 2 - res = source.publishLast(function (x) { return x.select(function (y) { return y * y; }) }, 42);
     * 
     * @param {Function} [selector] Optional selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive immediately receive the initial value, followed by all notifications of the source from the time of the subscription on.
     * @param {Mixed} initialValue Initial value received by observers upon subscription.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.publishValue = function (initialValueOrSelector, initialValue) {
        return arguments.length === 2 ?
            this.multicast(function () {
                return new BehaviorSubject(initialValue);
            }, initialValueOrSelector) :
            this.multicast(new BehaviorSubject(initialValueOrSelector));
    };

    /**
     * Returns an observable sequence that is the result of invoking the selector on a connectable observable sequence that shares a single subscription to the underlying sequence replaying notifications subject to a maximum time length for the replay buffer.
     * This operator is a specialization of Multicast using a ReplaySubject.
     * 
     * @example
     * 1 - res = source.replay(null, 3);
     * 2 - res = source.replay(null, 3, 500);
     * 3 - res = source.replay(null, 3, 500, scheduler);
     * 4 - res = source.replay(function (x) { return x.take(6).repeat(); }, 3, 500, scheduler);
     * 
     * @param selector [Optional] Selector function which can use the multicasted source sequence as many times as needed, without causing multiple subscriptions to the source sequence. Subscribers to the given source will receive all the notifications of the source subject to the specified replay buffer trimming policy.
     * @param bufferSize [Optional] Maximum element count of the replay buffer.
     * @param window [Optional] Maximum time length of the replay buffer.
     * @param scheduler [Optional] Scheduler where connected observers within the selector function will be invoked on.
     * @returns {Observable} An observable sequence that contains the elements of a sequence produced by multicasting the source sequence within a selector function.
     */
    observableProto.replay = function (selector, bufferSize, window, scheduler) {
        return !selector ?
            this.multicast(new ReplaySubject(bufferSize, window, scheduler)) :
            this.multicast(function () {
                return new ReplaySubject(bufferSize, window, scheduler);
            }, selector);
    };

    /** @private */
    var InnerSubscription = function (subject, observer) {
        this.subject = subject;
        this.observer = observer;
    };

    /**
     * @private
     * @memberOf InnerSubscription
     */
    InnerSubscription.prototype.dispose = function () {
        if (!this.subject.isDisposed && this.observer !== null) {
            var idx = this.subject.observers.indexOf(this.observer);
            this.subject.observers.splice(idx, 1);
            this.observer = null;
        }
    };

    /**
     *  Represents a value that changes over time.
     *  Observers can subscribe to the subject to receive the last (or initial) value and all subsequent notifications.
     */
    var BehaviorSubject = Rx.BehaviorSubject = (function (_super) {
        function subscribe(observer) {
            var ex;
            checkDisposed.call(this);
            if (!this.isStopped) {
                this.observers.push(observer);
                observer.onNext(this.value);
                return new InnerSubscription(this, observer);
            }
            ex = this.exception;
            if (ex) {
                observer.onError(ex);
            } else {
                observer.onCompleted();
            }
            return disposableEmpty;
        }

        inherits(BehaviorSubject, _super);

        /**
         *  Initializes a new instance of the BehaviorSubject class which creates a subject that caches its last value and starts with the specified value.
         *  
         *  @param value Initial value sent to observers when no other value has been received by the subject yet.
         */       
        function BehaviorSubject(value) {
            _super.call(this, subscribe);

            this.value = value,
            this.observers = [],
            this.isDisposed = false,
            this.isStopped = false,
            this.exception = null;
        }

        addProperties(BehaviorSubject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             * 
             * @memberOf BehaviorSubject# 
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */         
            hasObservers: function () {
                return this.observers.length > 0;
            },
            /**
             * Notifies all subscribed observers about the end of the sequence.
             * 
             * @memberOf BehaviorSubject#
             */ 
            onCompleted: function () {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onCompleted();
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             * 
             * @memberOf BehaviorSubject#
             * @param {Mixed} error The exception to send to all observers.
             */             
            onError: function (error) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    this.exception = error;

                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onError(error);
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the arrival of the specified element in the sequence.
             * 
             * @memberOf BehaviorSubject#
             * @param {Mixed} value The value to send to all observers.
             */              
            onNext: function (value) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.value = value;
                    var os = this.observers.slice(0);
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onNext(value);
                    }
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             * 
             * @memberOf BehaviorSubject#
             */            
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
                this.value = null;
                this.exception = null;
            }
        });

        return BehaviorSubject;
    }(Observable));

    /**
     * Represents an object that is both an observable sequence as well as an observer.
     * Each notification is broadcasted to all subscribed and future observers, subject to buffer trimming policies.
     */  
    var ReplaySubject = Rx.ReplaySubject = (function (_super) {
        /** 
         * @private
         * @constructor
         */
        var RemovableDisposable = function (subject, observer) {
            this.subject = subject;
            this.observer = observer;
        };

        /* 
         * @private
         * @memberOf RemovableDisposable#
         */
        RemovableDisposable.prototype.dispose = function () {
            this.observer.dispose();
            if (!this.subject.isDisposed) {
                var idx = this.subject.observers.indexOf(this.observer);
                this.subject.observers.splice(idx, 1);
            }
        };

        function subscribe(observer) {
            var so = new ScheduledObserver(this.scheduler, observer),
                subscription = new RemovableDisposable(this, so);
            checkDisposed.call(this);
            this._trim(this.scheduler.now());
            this.observers.push(so);

            var n = this.q.length;

            for (var i = 0, len = this.q.length; i < len; i++) {
                so.onNext(this.q[i].value);
            }

            if (this.hasError) {
                n++;
                so.onError(this.error);
            } else if (this.isStopped) {
                n++;
                so.onCompleted();
            }

            so.ensureActive(n);
            return subscription;
        }

        inherits(ReplaySubject, _super);

        /**
         *  Initializes a new instance of the ReplaySubject class with the specified buffer size, window and scheduler.
         * 
         *  @param {Number} [bufferSize] Maximum element count of the replay buffer.
         *  @param {Number} [window] Maximum time length of the replay buffer.
         *  @param {Scheduler} [scheduler] Scheduler the observers are invoked on.
         */
        function ReplaySubject(bufferSize, window, scheduler) {
            this.bufferSize = bufferSize == null ? Number.MAX_VALUE : bufferSize;
            this.window = window == null ? Number.MAX_VALUE : window;
            this.scheduler = scheduler || currentThreadScheduler;
            this.q = [];
            this.observers = [];
            this.isStopped = false;
            this.isDisposed = false;
            this.hasError = false;
            this.error = null;
            _super.call(this, subscribe);
        }

        addProperties(ReplaySubject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             * 
             * @memberOf ReplaySubject# 
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */         
            hasObservers: function () {
                return this.observers.length > 0;
            },            
            /*
             * @private
             * @memberOf ReplaySubject#
             */
            _trim: function (now) {
                while (this.q.length > this.bufferSize) {
                    this.q.shift();
                }
                while (this.q.length > 0 && (now - this.q[0].interval) > this.window) {
                    this.q.shift();
                }
            },
            /**
             * Notifies all subscribed observers about the arrival of the specified element in the sequence.
             * 
             * @memberOf ReplaySubject#
             * @param {Mixed} value The value to send to all observers.
             */              
            onNext: function (value) {
                var observer;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var now = this.scheduler.now();
                    this.q.push({ interval: now, value: value });
                    this._trim(now);

                    var o = this.observers.slice(0);
                    for (var i = 0, len = o.length; i < len; i++) {
                        observer = o[i];
                        observer.onNext(value);
                        observer.ensureActive();
                    }
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             * 
             * @memberOf ReplaySubject#
             * @param {Mixed} error The exception to send to all observers.
             */                 
            onError: function (error) {
                var observer;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.isStopped = true;
                    this.error = error;
                    this.hasError = true;
                    var now = this.scheduler.now();
                    this._trim(now);
                    var o = this.observers.slice(0);
                    for (var i = 0, len = o.length; i < len; i++) {
                        observer = o[i];
                        observer.onError(error);
                        observer.ensureActive();
                    }
                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the end of the sequence.
             * 
             * @memberOf ReplaySubject#
             */             
            onCompleted: function () {
                var observer;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.isStopped = true;
                    var now = this.scheduler.now();
                    this._trim(now);
                    var o = this.observers.slice(0);
                    for (var i = 0, len = o.length; i < len; i++) {
                        observer = o[i];
                        observer.onCompleted();
                        observer.ensureActive();
                    }
                    this.observers = [];
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             * 
             * @memberOf ReplaySubject#
             */               
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
            }
        });

        return ReplaySubject;
    }(Observable));

    /** @private */
    var ConnectableObservable = (function (_super) {
        inherits(ConnectableObservable, _super);

        /**
         * @constructor
         * @private
         */
        function ConnectableObservable(source, subject) {
            var state = {
                subject: subject,
                source: source.asObservable(),
                hasSubscription: false,
                subscription: null
            };

            this.connect = function () {
                if (!state.hasSubscription) {
                    state.hasSubscription = true;
                    state.subscription = new CompositeDisposable(state.source.subscribe(state.subject), disposableCreate(function () {
                        state.hasSubscription = false;
                    }));
                }
                return state.subscription;
            };

            function subscribe(observer) {
                return state.subject.subscribe(observer);
            }

            _super.call(this, subscribe);
        }

        /**
         * @private
         * @memberOf ConnectableObservable
         */
        ConnectableObservable.prototype.connect = function () { return this.connect(); };

        /**
         * @private
         * @memberOf ConnectableObservable
         */        
        ConnectableObservable.prototype.refCount = function () {
            var connectableSubscription = null, count = 0, source = this;
            return new AnonymousObservable(function (observer) {
                var shouldConnect, subscription;
                count++;
                shouldConnect = count === 1;
                subscription = source.subscribe(observer);
                if (shouldConnect) {
                    connectableSubscription = source.connect();
                }
                return disposableCreate(function () {
                    subscription.dispose();
                    count--;
                    if (count === 0) {
                        connectableSubscription.dispose();
                    }
                });
            });
        };

        return ConnectableObservable;
    }(Observable));

    return Rx;
}));
},{"./rx":"nNHdGN"}],"rx":[function(require,module,exports){
module.exports=require('nNHdGN');
},{}],"nNHdGN":[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Copyright (c) Microsoft Open Technologies, Inc. All rights reserved. See License.txt in the project root for license information.

(function (window, undefined) {

    var freeExports = typeof exports == 'object' && exports,
        freeModule = typeof module == 'object' && module && module.exports == freeExports && module,
        freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal) {
        window = freeGlobal;
    }

     /**
     * @name Rx
     * @type Object
     */
    var Rx = { Internals: {} };

    // Defaults
    function noop() { }
    function identity(x) { return x; }
    function defaultNow() { return new Date().getTime(); }
    function defaultComparer(x, y) { return isEqual(x, y); }
    function defaultSubComparer(x, y) { return x - y; }
    function defaultKeySerializer(x) { return x.toString(); }
    function defaultError(err) { throw err; }

    // Errors
    var sequenceContainsNoElements = 'Sequence contains no elements.';
    var argumentOutOfRange = 'Argument out of range';
    var objectDisposed = 'Object has been disposed';
    function checkDisposed() {
        if (this.isDisposed) {
            throw new Error(objectDisposed);
        }
    }

    /** Used to determine if values are of the language type Object */
    var objectTypes = {
        'boolean': false,
        'function': true,
        'object': true,
        'number': false,
        'string': false,
        'undefined': false
    };

    /** `Object#toString` result shortcuts */
    var argsClass = '[object Arguments]',
        arrayClass = '[object Array]',
        boolClass = '[object Boolean]',
        dateClass = '[object Date]',
        errorClass = '[object Error]',
        funcClass = '[object Function]',
        numberClass = '[object Number]',
        objectClass = '[object Object]',
        regexpClass = '[object RegExp]',
        stringClass = '[object String]';

    var toString = Object.prototype.toString,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        supportsArgsClass = toString.call(arguments) == argsClass, // For less <IE9 && FF<4
        suportNodeClass;

    try {
        suportNodeClass = !(toString.call(document) == objectClass && !({ 'toString': 0 } + ''));
    } catch(e) {
        suportNodeClass = true;
    }

    function isNode(value) {
        // IE < 9 presents DOM nodes as `Object` objects except they have `toString`
        // methods that are `typeof` "string" and still can coerce nodes to strings
        return typeof value.toString != 'function' && typeof (value + '') == 'string';
    }

    function isArguments(value) {
        return (value && typeof value == 'object') ? toString.call(value) == argsClass : false;
    }

    // fallback for browsers that can't detect `arguments` objects by [[Class]]
    if (!supportsArgsClass) {
        isArguments = function(value) {
            return (value && typeof value == 'object') ? hasOwnProperty.call(value, 'callee') : false;
        };
    }

    function isFunction(value) {
        return typeof value == 'function';
    }

    // fallback for older versions of Chrome and Safari
    if (isFunction(/x/)) {
        isFunction = function(value) {
            return typeof value == 'function' && toString.call(value) == funcClass;
        };
    }

    var isEqual = Rx.Internals.isEqual = function (x, y) {
        return deepEquals(x, y, [], []);
    };

    /** @private
     * Used for deep comparison
     **/
    function deepEquals(a, b, stackA, stackB) {
        var result;
        // exit early for identical values
        if (a === b) {
            // treat `+0` vs. `-0` as not equal
            return a !== 0 || (1 / a == 1 / b);
        }
        var type = typeof a,
            otherType = typeof b;

        // exit early for unlike primitive values
        if (a === a &&
            !(a && objectTypes[type]) &&
            !(b && objectTypes[otherType])) {
            return false;
        }

        // exit early for `null` and `undefined`, avoiding ES3's Function#call behavior
        // http://es5.github.io/#x15.3.4.4
        if (a == null || b == null) {
            return a === b;
        }
        // compare [[Class]] names
        var className = toString.call(a),
            otherClass = toString.call(b);

        if (className == argsClass) {
            className = objectClass;
        }
        if (otherClass == argsClass) {
            otherClass = objectClass;
        }
        if (className != otherClass) {
            return false;
        }

        switch (className) {
            case boolClass:
            case dateClass:
                // coerce dates and booleans to numbers, dates to milliseconds and booleans
                // to `1` or `0`, treating invalid dates coerced to `NaN` as not equal
                return +a == +b;

            case numberClass:
                // treat `NaN` vs. `NaN` as equal
                return (a != +a)
                    ? b != +b
                    // but treat `+0` vs. `-0` as not equal
                    : (a == 0 ? (1 / a == 1 / b) : a == +b);

            case regexpClass:
            case stringClass:
                // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
                // treat string primitives and their corresponding object instances as equal
                return a == String(b);
        }

        var isArr = className == arrayClass;
        if (!isArr) {

            // exit for functions and DOM nodes
            if (className != objectClass || (!suportNodeClass && (isNode(a) || isNode(b)))) {
                return false;
            }

            // in older versions of Opera, `arguments` objects have `Array` constructors
            var ctorA = !supportsArgsClass && isArguments(a) ? Object : a.constructor,
                ctorB = !supportsArgsClass && isArguments(b) ? Object : b.constructor;

            // non `Object` object instances with different constructors are not equal
            if (ctorA != ctorB && !(
                isFunction(ctorA) && ctorA instanceof ctorA &&
                isFunction(ctorB) && ctorB instanceof ctorB
            )) {
                return false;
            }
        }

        // assume cyclic structures are equal
        // the algorithm for detecting cyclic structures is adapted from ES 5.1
        // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
        var length = stackA.length;
        while (length--) {
            if (stackA[length] == a) {
                return stackB[length] == b;
            }
        }

        var size = 0;
        result = true;

        // add `a` and `b` to the stack of traversed objects
        stackA.push(a);
        stackB.push(b);

        // recursively compare objects and arrays (susceptible to call stack limits)
        if (isArr) {
            length = a.length;
            size = b.length;

            // compare lengths to determine if a deep comparison is necessary
            result = size == a.length;
            // deep compare the contents, ignoring non-numeric properties
            while (size--) {
                var index = length,
                    value = b[size];

                if (!(result = deepEquals(a[size], value, stackA, stackB))) {
                    break;
                }
            }

            return result;
        }

        // deep compare each object
        for(var key in b) {
            if (hasOwnProperty.call(b, key)) {
                // count properties and deep compare each property value
                size++;
                return (result = hasOwnProperty.call(a, key) && deepEquals(a[key], b[key], stackA, stackB));
            }
        }

        if (result) {
            // ensure both objects have the same number of properties
            for (var key in a) {
                if (hasOwnProperty.call(a, key)) {
                    // `size` will be `-1` if `a` has more properties than `b`
                    return (result = --size > -1);
                }
            }
        }
        stackA.pop();
        stackB.pop();

        return result;
    }
    var slice = Array.prototype.slice;
    function argsOrArray(args, idx) {
        return args.length === 1 && Array.isArray(args[idx]) ?
            args[idx] :
            slice.call(args);
    }
    var hasProp = {}.hasOwnProperty;

    /** @private */
    var inherits = this.inherits = Rx.Internals.inherits = function (child, parent) {
        function __() { this.constructor = child; }
        __.prototype = parent.prototype;
        child.prototype = new __();
    };

    /** @private */
    var addProperties = Rx.Internals.addProperties = function (obj) {
        var sources = slice.call(arguments, 1);
        for (var i = 0, len = sources.length; i < len; i++) {
            var source = sources[i];
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    };

    // Rx Utils
    var addRef = Rx.Internals.addRef = function (xs, r) {
        return new AnonymousObservable(function (observer) {
            return new CompositeDisposable(r.getDisposable(), xs.subscribe(observer));
        });
    };

    // Collection polyfills
    function arrayInitialize(count, factory) {
        var a = new Array(count);
        for (var i = 0; i < count; i++) {
            a[i] = factory();
        }
        return a;
    }

    // Utilities
    if (!Function.prototype.bind) {
        Function.prototype.bind = function (that) {
            var target = this,
                args = slice.call(arguments, 1);
            var bound = function () {
                if (this instanceof bound) {
                    function F() { }
                    F.prototype = target.prototype;
                    var self = new F();
                    var result = target.apply(self, args.concat(slice.call(arguments)));
                    if (Object(result) === result) {
                        return result;
                    }
                    return self;
                } else {
                    return target.apply(that, args.concat(slice.call(arguments)));
                }
            };

            return bound;
        };
    }

    var boxedString = Object("a"),
        splitString = boxedString[0] != "a" || !(0 in boxedString);
    if (!Array.prototype.every) {
        Array.prototype.every = function every(fun /*, thisp */) {
            var object = Object(this),
                self = splitString && {}.toString.call(this) == "[object String]" ?
                    this.split("") :
                    object,
                length = self.length >>> 0,
                thisp = arguments[1];

            if ({}.toString.call(fun) != "[object Function]") {
                throw new TypeError(fun + " is not a function");
            }

            for (var i = 0; i < length; i++) {
                if (i in self && !fun.call(thisp, self[i], i, object)) {
                    return false;
                }
            }
            return true;
        };
    }

    if (!Array.prototype.map) {
        Array.prototype.map = function map(fun /*, thisp*/) {
            var object = Object(this),
                self = splitString && {}.toString.call(this) == "[object String]" ?
                    this.split("") :
                    object,
                length = self.length >>> 0,
                result = Array(length),
                thisp = arguments[1];

            if ({}.toString.call(fun) != "[object Function]") {
                throw new TypeError(fun + " is not a function");
            }

            for (var i = 0; i < length; i++) {
                if (i in self)
                    result[i] = fun.call(thisp, self[i], i, object);
            }
            return result;
        };
    }

    if (!Array.prototype.filter) {
        Array.prototype.filter = function (predicate) {
            var results = [], item, t = new Object(this);
            for (var i = 0, len = t.length >>> 0; i < len; i++) {
                item = t[i];
                if (i in t && predicate.call(arguments[1], item, i, t)) {
                    results.push(item);
                }
            }
            return results;
        };
    }

    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) == '[object Array]';
        };
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function indexOf(searchElement) {
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n !== n) {
                    n = 0;
                } else if (n !== 0 && n != Infinity && n !== -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

    // Collections
    var IndexedItem = function (id, value) {
        this.id = id;
        this.value = value;
    };

    IndexedItem.prototype.compareTo = function (other) {
        var c = this.value.compareTo(other.value);
        if (c === 0) {
            c = this.id - other.id;
        }
        return c;
    };

    // Priority Queue for Scheduling
    var PriorityQueue = function (capacity) {
        this.items = new Array(capacity);
        this.length = 0;
    };
    var priorityProto = PriorityQueue.prototype;
    priorityProto.isHigherPriority = function (left, right) {
        return this.items[left].compareTo(this.items[right]) < 0;
    };
    priorityProto.percolate = function (index) {
        if (index >= this.length || index < 0) {
            return;
        }
        var parent = index - 1 >> 1;
        if (parent < 0 || parent === index) {
            return;
        }
        if (this.isHigherPriority(index, parent)) {
            var temp = this.items[index];
            this.items[index] = this.items[parent];
            this.items[parent] = temp;
            this.percolate(parent);
        }
    };
    priorityProto.heapify = function (index) {
        if (index === undefined) {
            index = 0;
        }
        if (index >= this.length || index < 0) {
            return;
        }
        var left = 2 * index + 1,
            right = 2 * index + 2,
            first = index;
        if (left < this.length && this.isHigherPriority(left, first)) {
            first = left;
        }
        if (right < this.length && this.isHigherPriority(right, first)) {
            first = right;
        }
        if (first !== index) {
            var temp = this.items[index];
            this.items[index] = this.items[first];
            this.items[first] = temp;
            this.heapify(first);
        }
    };
    priorityProto.peek = function () {
        return this.items[0].value;
    };
    priorityProto.removeAt = function (index) {
        this.items[index] = this.items[--this.length];
        delete this.items[this.length];
        this.heapify();
    };
    priorityProto.dequeue = function () {
        var result = this.peek();
        this.removeAt(0);
        return result;
    };
    priorityProto.enqueue = function (item) {
        var index = this.length++;
        this.items[index] = new IndexedItem(PriorityQueue.count++, item);
        this.percolate(index);
    };
    priorityProto.remove = function (item) {
        for (var i = 0; i < this.length; i++) {
            if (this.items[i].value === item) {
                this.removeAt(i);
                return true;
            }
        }
        return false;
    };
    PriorityQueue.count = 0;
    /**
     * Represents a group of disposable resources that are disposed together.
     *
     * @constructor
     */
    var CompositeDisposable = Rx.CompositeDisposable = function () {
        this.disposables = argsOrArray(arguments, 0);
        this.isDisposed = false;
        this.length = this.disposables.length;
    };

    var CompositeDisposablePrototype = CompositeDisposable.prototype;

    /**
     *  Adds a disposable to the CompositeDisposable or disposes the disposable if the CompositeDisposable is disposed.
     *
     * @param {Mixed} item Disposable to add.
     */
    CompositeDisposablePrototype.add = function (item) {
        if (this.isDisposed) {
            item.dispose();
        } else {
            this.disposables.push(item);
            this.length++;
        }
    };

    /**
     *  Removes and disposes the first occurrence of a disposable from the CompositeDisposable.
     *
     * @memberOf CompositeDisposable#
     * @param {Mixed} item Disposable to remove.
     * @returns {Boolean} true if found; false otherwise.
     */
    CompositeDisposablePrototype.remove = function (item) {
        var shouldDispose = false;
        if (!this.isDisposed) {
            var idx = this.disposables.indexOf(item);
            if (idx !== -1) {
                shouldDispose = true;
                this.disposables.splice(idx, 1);
                this.length--;
                item.dispose();
            }

        }
        return shouldDispose;
    };

    /**
     *  Disposes all disposables in the group and removes them from the group.
     *
     * @memberOf CompositeDisposable#
     */
    CompositeDisposablePrototype.dispose = function () {
        if (!this.isDisposed) {
            this.isDisposed = true;
            var currentDisposables = this.disposables.slice(0);
            this.disposables = [];
            this.length = 0;

            for (var i = 0, len = currentDisposables.length; i < len; i++) {
                currentDisposables[i].dispose();
            }
        }
    };

    /**
     *  Removes and disposes all disposables from the CompositeDisposable, but does not dispose the CompositeDisposable.
     *
     * @memberOf CompositeDisposable#
     */
    CompositeDisposablePrototype.clear = function () {
        var currentDisposables = this.disposables.slice(0);
        this.disposables = [];
        this.length = 0;
        for (var i = 0, len = currentDisposables.length; i < len; i++) {
            currentDisposables[i].dispose();
        }
    };

    /**
     *  Determines whether the CompositeDisposable contains a specific disposable.
     *
     * @memberOf CompositeDisposable#
     * @param {Mixed} item Disposable to search for.
     * @returns {Boolean} true if the disposable was found; otherwise, false.
     */
    CompositeDisposablePrototype.contains = function (item) {
        return this.disposables.indexOf(item) !== -1;
    };

    /**
     *  Converts the existing CompositeDisposable to an array of disposables
     *
     * @memberOf CompositeDisposable#
     * @returns {Array} An array of disposable objects.
     */
    CompositeDisposablePrototype.toArray = function () {
        return this.disposables.slice(0);
    };

    /**
     * Provides a set of static methods for creating Disposables.
     *
     * @constructor
     * @param {Function} dispose Action to run during the first call to dispose. The action is guaranteed to be run at most once.
     */
    var Disposable = Rx.Disposable = function (action) {
        this.isDisposed = false;
        this.action = action || noop;
    };

    /**
     * Performs the task of cleaning up resources.
     *
     * @memberOf Disposable#
     */
    Disposable.prototype.dispose = function () {
        if (!this.isDisposed) {
            this.action();
            this.isDisposed = true;
        }
    };

    /**
     *  Creates a disposable object that invokes the specified action when disposed.
     *
     * @static
     * @memberOf Disposable
     * @param {Function} dispose Action to run during the first call to dispose. The action is guaranteed to be run at most once.
     * @return {Disposable} The disposable object that runs the given action upon disposal.
     */
    var disposableCreate = Disposable.create = function (action) { return new Disposable(action); };

    /**
     * Gets the disposable that does nothing when disposed.
     *
     * @static
     * @memberOf Disposable
     */
    var disposableEmpty = Disposable.empty = { dispose: noop };

    /**
     * Represents a disposable resource which only allows a single assignment of its underlying disposable resource.
     * If an underlying disposable resource has already been set, future attempts to set the underlying disposable resource will throw an Error.
     *
     * @constructor
     */
    var SingleAssignmentDisposable = Rx.SingleAssignmentDisposable = function () {
        this.isDisposed = false;
        this.current = null;
    };

    var SingleAssignmentDisposablePrototype = SingleAssignmentDisposable.prototype;

    /**
     *  Gets or sets the underlying disposable. After disposal, the result of getting this method is undefined.
     *
     * @memberOf SingleAssignmentDisposable#
     * @param {Disposable} [value] The new underlying disposable.
     * @returns {Disposable} The underlying disposable.
     */
    SingleAssignmentDisposablePrototype.disposable = function (value) {
        return !value ? this.getDisposable() : this.setDisposable(value);
    };

    /**
     *  Gets the underlying disposable. After disposal, the result of getting this method is undefined.
     *
     * @memberOf SingleAssignmentDisposable#
     * @returns {Disposable} The underlying disposable.
     */
    SingleAssignmentDisposablePrototype.getDisposable = function () {
        return this.current;
    };

    /**
     *  Sets the underlying disposable.
     *
     * @memberOf SingleAssignmentDisposable#
     * @param {Disposable} value The new underlying disposable.
     */
    SingleAssignmentDisposablePrototype.setDisposable = function (value) {
        if (this.current) {
            throw new Error('Disposable has already been assigned');
        }
        var shouldDispose = this.isDisposed;
        if (!shouldDispose) {
            this.current = value;
        }
        if (shouldDispose && value) {
            value.dispose();
        }
    };

    /**
     * Disposes the underlying disposable.
     *
     * @memberOf SingleAssignmentDisposable#
     */
    SingleAssignmentDisposablePrototype.dispose = function () {
        var old;
        if (!this.isDisposed) {
            this.isDisposed = true;
            old = this.current;
            this.current = null;
        }
        if (old) {
            old.dispose();
        }
    };

    /**
     * Represents a disposable resource whose underlying disposable resource can be replaced by another disposable resource, causing automatic disposal of the previous underlying disposable resource.
     *
     * @constructor
     */
    var SerialDisposable = Rx.SerialDisposable = function () {
        this.isDisposed = false;
        this.current = null;
    };

    /**
     * Gets the underlying disposable.
     * @return The underlying disposable</returns>
     */
    SerialDisposable.prototype.getDisposable = function () {
        return this.current;
    };

    /**
     * Sets the underlying disposable.
     *
     * @memberOf SerialDisposable#
     * @param {Disposable} value The new underlying disposable.
     */
    SerialDisposable.prototype.setDisposable = function (value) {
        var shouldDispose = this.isDisposed, old;
        if (!shouldDispose) {
            old = this.current;
            this.current = value;
        }
        if (old) {
            old.dispose();
        }
        if (shouldDispose && value) {
            value.dispose();
        }
    };

    /**
     * Gets or sets the underlying disposable.
     * If the SerialDisposable has already been disposed, assignment to this property causes immediate disposal of the given disposable object. Assigning this property disposes the previous disposable object.
     *
     * @memberOf SerialDisposable#
     * @param {Disposable} [value] The new underlying disposable.
     * @returns {Disposable} The underlying disposable.
     */
    SerialDisposable.prototype.disposable = function (value) {
        if (!value) {
            return this.getDisposable();
        } else {
            this.setDisposable(value);
        }
    };

    /**
     * Disposes the underlying disposable as well as all future replacements.
     *
     * @memberOf SerialDisposable#
     */
    SerialDisposable.prototype.dispose = function () {
        var old;
        if (!this.isDisposed) {
            this.isDisposed = true;
            old = this.current;
            this.current = null;
        }
        if (old) {
            old.dispose();
        }
    };

    /**
     * Represents a disposable resource that only disposes its underlying disposable resource when all dependent disposable objects have been disposed.
     */
    var RefCountDisposable = Rx.RefCountDisposable = (function () {

        /**
         * @constructor
         * @private
         */
        function InnerDisposable(disposable) {
            this.disposable = disposable;
            this.disposable.count++;
            this.isInnerDisposed = false;
        }

        /** @private */
        InnerDisposable.prototype.dispose = function () {
            if (!this.disposable.isDisposed) {
                if (!this.isInnerDisposed) {
                    this.isInnerDisposed = true;
                    this.disposable.count--;
                    if (this.disposable.count === 0 && this.disposable.isPrimaryDisposed) {
                        this.disposable.isDisposed = true;
                        this.disposable.underlyingDisposable.dispose();
                    }
                }
            }
        };

        /**
         * Initializes a new instance of the RefCountDisposable with the specified disposable.
         *
         * @constructor
         * @param {Disposable} disposable Underlying disposable.
          */
        function RefCountDisposable(disposable) {
            this.underlyingDisposable = disposable;
            this.isDisposed = false;
            this.isPrimaryDisposed = false;
            this.count = 0;
        }

        /**
         * Disposes the underlying disposable only when all dependent disposables have been disposed
         *
         * @memberOf RefCountDisposable#
         */
        RefCountDisposable.prototype.dispose = function () {
            if (!this.isDisposed) {
                if (!this.isPrimaryDisposed) {
                    this.isPrimaryDisposed = true;
                    if (this.count === 0) {
                        this.isDisposed = true;
                        this.underlyingDisposable.dispose();
                    }
                }
            }
        };

        /**
         * Returns a dependent disposable that when disposed decreases the refcount on the underlying disposable.
         *
         * @memberOf RefCountDisposable#
         * @returns {Disposable} A dependent disposable contributing to the reference count that manages the underlying disposable's lifetime.H
         */
        RefCountDisposable.prototype.getDisposable = function () {
            return this.isDisposed ? disposableEmpty : new InnerDisposable(this);
        };

        return RefCountDisposable;
    })();

    /**
     * @constructor
     * @private
     */
    function ScheduledDisposable(scheduler, disposable) {
        this.scheduler = scheduler, this.disposable = disposable, this.isDisposed = false;
    }

    /**
     * @private
     * @memberOf ScheduledDisposable#
     */
    ScheduledDisposable.prototype.dispose = function () {
        var parent = this;
        this.scheduler.schedule(function () {
            if (!parent.isDisposed) {
                parent.isDisposed = true;
                parent.disposable.dispose();
            }
        });
    };

    /**
    * @private
    * @constructor
    */
    function ScheduledItem(scheduler, state, action, dueTime, comparer) {
        this.scheduler = scheduler;
        this.state = state;
        this.action = action;
        this.dueTime = dueTime;
        this.comparer = comparer || defaultSubComparer;
        this.disposable = new SingleAssignmentDisposable();
    }

    /**
    * @private
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.invoke = function () {
        this.disposable.disposable(this.invokeCore());
    };

    /**
    * @private
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.compareTo = function (other) {
        return this.comparer(this.dueTime, other.dueTime);
    };

    /**
    * @private
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.isCancelled = function () {
        return this.disposable.isDisposed;
    };

    /**
    * @private
    * @memberOf ScheduledItem#
    */
    ScheduledItem.prototype.invokeCore = function () {
        return this.action(this.scheduler, this.state);
    };

    /** Provides a set of static properties to access commonly used schedulers. */
    var Scheduler = Rx.Scheduler = (function () {

        /**
         * @constructor
         * @private
         */
        function Scheduler(now, schedule, scheduleRelative, scheduleAbsolute) {
            this.now = now;
            this._schedule = schedule;
            this._scheduleRelative = scheduleRelative;
            this._scheduleAbsolute = scheduleAbsolute;
        }

        function invokeRecImmediate(scheduler, pair) {
            var state = pair.first, action = pair.second, group = new CompositeDisposable(),
            recursiveAction = function (state1) {
                action(state1, function (state2) {
                    var isAdded = false, isDone = false,
                    d = scheduler.scheduleWithState(state2, function (scheduler1, state3) {
                        if (isAdded) {
                            group.remove(d);
                        } else {
                            isDone = true;
                        }
                        recursiveAction(state3);
                        return disposableEmpty;
                    });
                    if (!isDone) {
                        group.add(d);
                        isAdded = true;
                    }
                });
            };
            recursiveAction(state);
            return group;
        }

        function invokeRecDate(scheduler, pair, method) {
            var state = pair.first, action = pair.second, group = new CompositeDisposable(),
            recursiveAction = function (state1) {
                action(state1, function (state2, dueTime1) {
                    var isAdded = false, isDone = false,
                    d = scheduler[method].call(scheduler, state2, dueTime1, function (scheduler1, state3) {
                        if (isAdded) {
                            group.remove(d);
                        } else {
                            isDone = true;
                        }
                        recursiveAction(state3);
                        return disposableEmpty;
                    });
                    if (!isDone) {
                        group.add(d);
                        isAdded = true;
                    }
                });
            };
            recursiveAction(state);
            return group;
        }

        function invokeAction(scheduler, action) {
            action();
            return disposableEmpty;
        }

        var schedulerProto = Scheduler.prototype;

        /**
         * Returns a scheduler that wraps the original scheduler, adding exception handling for scheduled actions.
         *
         * @memberOf Scheduler#
         * @param {Function} handler Handler that's run if an exception is caught. The exception will be rethrown if the handler returns false.
         * @returns {Scheduler} Wrapper around the original scheduler, enforcing exception handling.
         */
        schedulerProto.catchException = function (handler) {
            return new CatchScheduler(this, handler);
        };

        /**
         * Schedules a periodic piece of work by dynamically discovering the scheduler's capabilities. The periodic task will be scheduled using window.setInterval for the base implementation.
         *
         * @memberOf Scheduler#
         * @param {Number} period Period for running the work periodically.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled recurring action (best effort).
         */
        schedulerProto.schedulePeriodic = function (period, action) {
            return this.schedulePeriodicWithState(null, period, function () {
                action();
            });
        };

        /**
         * Schedules a periodic piece of work by dynamically discovering the scheduler's capabilities. The periodic task will be scheduled using window.setInterval for the base implementation.
         *
         * @memberOf Scheduler#
         * @param {Mixed} state Initial state passed to the action upon the first iteration.
         * @param {Number} period Period for running the work periodically.
         * @param {Function} action Action to be executed, potentially updating the state.
         * @returns {Disposable} The disposable object used to cancel the scheduled recurring action (best effort).
         */
        schedulerProto.schedulePeriodicWithState = function (state, period, action) {
            var s = state, id = window.setInterval(function () {
                s = action(s);
            }, period);
            return disposableCreate(function () {
                window.clearInterval(id);
            });
        };

        /**
         * Schedules an action to be executed.
         *
         * @memberOf Scheduler#
         * @param {Function} action Action to execute.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.schedule = function (action) {
            return this._schedule(action, invokeAction);
        };

        /**
         * Schedules an action to be executed.
         *
         * @memberOf Scheduler#
         * @param state State passed to the action to be executed.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithState = function (state, action) {
            return this._schedule(state, action);
        };

        /**
         * Schedules an action to be executed after the specified relative due time.
         *
         * @memberOf Scheduler#
         * @param {Function} action Action to execute.
         * @param {Number}dueTime Relative time after which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithRelative = function (dueTime, action) {
            return this._scheduleRelative(action, dueTime, invokeAction);
        };

        /**
         * Schedules an action to be executed after dueTime.
         *
         * @memberOf Scheduler#
         * @param state State passed to the action to be executed.
         * @param {Function} action Action to be executed.
         * @param {Number}dueTime Relative time after which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithRelativeAndState = function (state, dueTime, action) {
            return this._scheduleRelative(state, dueTime, action);
        };

        /**
         * Schedules an action to be executed at the specified absolute due time.
         *
         * @memberOf Scheduler#
         * @param {Function} action Action to execute.
         * @param {Number}dueTime Absolute time at which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
          */
        schedulerProto.scheduleWithAbsolute = function (dueTime, action) {
            return this._scheduleAbsolute(action, dueTime, invokeAction);
        };

        /**
         * Schedules an action to be executed at dueTime.
         *
         * @memberOf Scheduler#
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to be executed.
         * @param {Number}dueTime Absolute time at which to execute the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleWithAbsoluteAndState = function (state, dueTime, action) {
            return this._scheduleAbsolute(state, dueTime, action);
        };

        /**
         * Schedules an action to be executed recursively.
         *
         * @memberOf Scheduler#
         * @param {Function} action Action to execute recursively. The parameter passed to the action is used to trigger recursive scheduling of the action.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursive = function (action) {
            return this.scheduleRecursiveWithState(action, function (_action, self) {
                _action(function () {
                    self(_action);
                });
            });
        };

        /**
         * Schedules an action to be executed recursively.
         *
         * @memberOf Scheduler#
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in recursive invocation state.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithState = function (state, action) {
            return this.scheduleWithState({ first: state, second: action }, function (s, p) {
                return invokeRecImmediate(s, p);
            });
        };

        /**
         * Schedules an action to be executed recursively after a specified relative due time.
         *
         * @memberOf Scheduler
         * @param {Function} action Action to execute recursively. The parameter passed to the action is used to trigger recursive scheduling of the action at the specified relative time.
         * @param {Number}dueTime Relative time after which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithRelative = function (dueTime, action) {
            return this.scheduleRecursiveWithRelativeAndState(action, dueTime, function (_action, self) {
                _action(function (dt) {
                    self(_action, dt);
                });
            });
        };

        /**
         * Schedules an action to be executed recursively after a specified relative due time.
         *
         * @memberOf Scheduler
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in the recursive due time and invocation state.
         * @param {Number}dueTime Relative time after which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithRelativeAndState = function (state, dueTime, action) {
            return this._scheduleRelative({ first: state, second: action }, dueTime, function (s, p) {
                return invokeRecDate(s, p, 'scheduleWithRelativeAndState');
            });
        };

        /**
         * Schedules an action to be executed recursively at a specified absolute due time.
         *
         * @memberOf Scheduler
         * @param {Function} action Action to execute recursively. The parameter passed to the action is used to trigger recursive scheduling of the action at the specified absolute time.
         * @param {Number}dueTime Absolute time at which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithAbsolute = function (dueTime, action) {
            return this.scheduleRecursiveWithAbsoluteAndState(action, dueTime, function (_action, self) {
                _action(function (dt) {
                    self(_action, dt);
                });
            });
        };

        /**
         * Schedules an action to be executed recursively at a specified absolute due time.
         *
         * @memberOf Scheduler
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Function} action Action to execute recursively. The last parameter passed to the action is used to trigger recursive scheduling of the action, passing in the recursive due time and invocation state.
         * @param {Number}dueTime Absolute time at which to execute the action for the first time.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        schedulerProto.scheduleRecursiveWithAbsoluteAndState = function (state, dueTime, action) {
            return this._scheduleAbsolute({ first: state, second: action }, dueTime, function (s, p) {
                return invokeRecDate(s, p, 'scheduleWithAbsoluteAndState');
            });
        };

        /** Gets the current time according to the local machine's system clock. */
        Scheduler.now = defaultNow;

        /**
         * Normalizes the specified TimeSpan value to a positive value.
         *
         * @static
         * @memberOf Scheduler
         * @param {Number} timeSpan The time span value to normalize.
         * @returns {Number} The specified TimeSpan value if it is zero or positive; otherwise, 0
         */
        Scheduler.normalize = function (timeSpan) {
            if (timeSpan < 0) {
                timeSpan = 0;
            }
            return timeSpan;
        };

        return Scheduler;
    }());

    var schedulerNoBlockError = 'Scheduler is not allowed to block the thread';

    /**
     * Gets a scheduler that schedules work immediately on the current thread.
     *
     * @memberOf Scheduler
     */
    var immediateScheduler = Scheduler.immediate = (function () {

        function scheduleNow(state, action) {
            return action(this, state);
        }

        function scheduleRelative(state, dueTime, action) {
            if (dueTime > 0) throw new Error(schedulerNoBlockError);
            return action(this, state);
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
        }

        return new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
    }());

    /**
     * Gets a scheduler that schedules work as soon as possible on the current thread.
     */
    var currentThreadScheduler = Scheduler.currentThread = (function () {
        var queue;

        /**
         * @private
         * @constructor
         */
        function Trampoline() {
            queue = new PriorityQueue(4);
        }

        /**
        * @private
        * @memberOf Trampoline
        */
        Trampoline.prototype.dispose = function () {
            queue = null;
        };

        /**
        * @private
        * @memberOf Trampoline
        */
        Trampoline.prototype.run = function () {
            var item;
            while (queue.length > 0) {
                item = queue.dequeue();
                if (!item.isCancelled()) {
                    while (item.dueTime - Scheduler.now() > 0) {
                    }
                    if (!item.isCancelled()) {
                        item.invoke();
                    }
                }
            }
        };

        function scheduleNow(state, action) {
            return this.scheduleWithRelativeAndState(state, 0, action);
        }

        function scheduleRelative(state, dueTime, action) {
            var dt = this.now() + Scheduler.normalize(dueTime),
                    si = new ScheduledItem(this, state, action, dt),
                    t;
            if (!queue) {
                t = new Trampoline();
                try {
                    queue.enqueue(si);
                    t.run();
                } catch (e) {
                    throw e;
                } finally {
                    t.dispose();
                }
            } else {
                queue.enqueue(si);
            }
            return si.disposable;
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
        }

        var currentScheduler = new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
        currentScheduler.scheduleRequired = function () { return queue === null; };
        currentScheduler.ensureTrampoline = function (action) {
            if (queue === null) {
                return this.schedule(action);
            } else {
                return action();
            }
        };

        return currentScheduler;
    }());

    /**
     * @private
     */
    var SchedulePeriodicRecursive = (function () {
        function tick(command, recurse) {
            recurse(0, this._period);
            try {
                this._state = this._action(this._state);
            } catch (e) {
                this._cancel.dispose();
                throw e;
            }
        }

        /**
         * @constructor
         * @private
         */
        function SchedulePeriodicRecursive(scheduler, state, period, action) {
            this._scheduler = scheduler;
            this._state = state;
            this._period = period;
            this._action = action;
        }

        SchedulePeriodicRecursive.prototype.start = function () {
            var d = new SingleAssignmentDisposable();
            this._cancel = d;
            d.setDisposable(this._scheduler.scheduleRecursiveWithRelativeAndState(0, this._period, tick.bind(this)));

            return d;
        };

        return SchedulePeriodicRecursive;
    }());

    /** Provides a set of extension methods for virtual time scheduling. */
    Rx.VirtualTimeScheduler = (function (_super) {

        function localNow() {
            return this.toDateTimeOffset(this.clock);
        }

        function scheduleNow(state, action) {
            return this.scheduleAbsoluteWithState(state, this.clock, action);
        }

        function scheduleRelative(state, dueTime, action) {
            return this.scheduleRelativeWithState(state, this.toRelative(dueTime), action);
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleRelativeWithState(state, this.toRelative(dueTime - this.now()), action);
        }

        function invokeAction(scheduler, action) {
            action();
            return disposableEmpty;
        }

        inherits(VirtualTimeScheduler, _super);

        /**
         * Creates a new virtual time scheduler with the specified initial clock value and absolute time comparer.
         *
         * @constructor
         * @param {Number} initialClock Initial value for the clock.
         * @param {Function} comparer Comparer to determine causality of events based on absolute time.
         */
        function VirtualTimeScheduler(initialClock, comparer) {
            this.clock = initialClock;
            this.comparer = comparer;
            this.isEnabled = false;
            this.queue = new PriorityQueue(1024);
            _super.call(this, localNow, scheduleNow, scheduleRelative, scheduleAbsolute);
        }

        var VirtualTimeSchedulerPrototype = VirtualTimeScheduler.prototype;

        /**
         * Schedules a periodic piece of work by dynamically discovering the scheduler's capabilities. The periodic task will be emulated using recursive scheduling.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Mixed} state Initial state passed to the action upon the first iteration.
         * @param {Number} period Period for running the work periodically.
         * @param {Function} action Action to be executed, potentially updating the state.
         * @returns {Disposable} The disposable object used to cancel the scheduled recurring action (best effort).
         */
        VirtualTimeSchedulerPrototype.schedulePeriodicWithState = function (state, period, action) {
            var s = new SchedulePeriodicRecursive(this, state, period, action);
            return s.start();
        };

        /**
         * Schedules an action to be executed after dueTime.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Number} dueTime Relative time after which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        VirtualTimeSchedulerPrototype.scheduleRelativeWithState = function (state, dueTime, action) {
            var runAt = this.add(this.clock, dueTime);
            return this.scheduleAbsoluteWithState(state, runAt, action);
        };

        /**
         * Schedules an action to be executed at dueTime.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Number} dueTime Relative time after which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        VirtualTimeSchedulerPrototype.scheduleRelative = function (dueTime, action) {
            return this.scheduleRelativeWithState(action, dueTime, invokeAction);
        };

        /**
         * Starts the virtual time scheduler.
         *
         * @memberOf VirtualTimeScheduler#
         */
        VirtualTimeSchedulerPrototype.start = function () {
            var next;
            if (!this.isEnabled) {
                this.isEnabled = true;
                do {
                    next = this.getNext();
                    if (next !== null) {
                        if (this.comparer(next.dueTime, this.clock) > 0) {
                            this.clock = next.dueTime;
                        }
                        next.invoke();
                    } else {
                        this.isEnabled = false;
                    }
                } while (this.isEnabled);
            }
        };

        /**
         * Stops the virtual time scheduler.
         *
         * @memberOf VirtualTimeScheduler#
         */
        VirtualTimeSchedulerPrototype.stop = function () {
            this.isEnabled = false;
        };

        /**
         * Advances the scheduler's clock to the specified time, running all work till that point.
         *
         * @param {Number} time Absolute time to advance the scheduler's clock to.
         */
        VirtualTimeSchedulerPrototype.advanceTo = function (time) {
            var next;
            var dueToClock = this.comparer(this.clock, time);
            if (this.comparer(this.clock, time) > 0) {
                throw new Error(argumentOutOfRange);
            }
            if (dueToClock === 0) {
                return;
            }
            if (!this.isEnabled) {
                this.isEnabled = true;
                do {
                    next = this.getNext();
                    if (next !== null && this.comparer(next.dueTime, time) <= 0) {
                        if (this.comparer(next.dueTime, this.clock) > 0) {
                            this.clock = next.dueTime;
                        }
                        next.invoke();
                    } else {
                        this.isEnabled = false;
                    }
                } while (this.isEnabled);
                this.clock = time;
            }
        };

        /**
         * Advances the scheduler's clock by the specified relative time, running all work scheduled for that timespan.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Number} time Relative time to advance the scheduler's clock by.
         */
        VirtualTimeSchedulerPrototype.advanceBy = function (time) {
            var dt = this.add(this.clock, time);
            var dueToClock = this.comparer(this.clock, dt);
            if (dueToClock > 0) {
                throw new Error(argumentOutOfRange);
            }
            if (dueToClock === 0) {
                return;
            }
            return this.advanceTo(dt);
        };

        /**
         * Advances the scheduler's clock by the specified relative time.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Number} time Relative time to advance the scheduler's clock by.
         */
        VirtualTimeSchedulerPrototype.sleep = function (time) {
            var dt = this.add(this.clock, time);

            if (this.comparer(this.clock, dt) >= 0) {
                throw new Error(argumentOutOfRange);
            }

            this.clock = dt;
        };

        /**
         * Gets the next scheduled item to be executed.
         *
         * @memberOf VirtualTimeScheduler#
         * @returns {ScheduledItem} The next scheduled item.
         */
        VirtualTimeSchedulerPrototype.getNext = function () {
            var next;
            while (this.queue.length > 0) {
                next = this.queue.peek();
                if (next.isCancelled()) {
                    this.queue.dequeue();
                } else {
                    return next;
                }
            }
            return null;
        };

        /**
         * Schedules an action to be executed at dueTime.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Scheduler} scheduler Scheduler to execute the action on.
         * @param {Number} dueTime Absolute time at which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        VirtualTimeSchedulerPrototype.scheduleAbsolute = function (dueTime, action) {
            return this.scheduleAbsoluteWithState(action, dueTime, invokeAction);
        };

        /**
         * Schedules an action to be executed at dueTime.
         *
         * @memberOf VirtualTimeScheduler#
         * @param {Mixed} state State passed to the action to be executed.
         * @param {Number} dueTime Absolute time at which to execute the action.
         * @param {Function} action Action to be executed.
         * @returns {Disposable} The disposable object used to cancel the scheduled action (best effort).
         */
        VirtualTimeSchedulerPrototype.scheduleAbsoluteWithState = function (state, dueTime, action) {
            var self = this,
                run = function (scheduler, state1) {
                    self.queue.remove(si);
                    return action(scheduler, state1);
                },
                si = new ScheduledItem(self, state, run, dueTime, self.comparer);
            self.queue.enqueue(si);
            return si.disposable;
        };

        return VirtualTimeScheduler;
    }(Scheduler));

    /** Provides a virtual time scheduler that uses Date for absolute time and number for relative time. */
    Rx.HistoricalScheduler = (function (_super) {
        inherits(HistoricalScheduler, _super);

        /**
         * Creates a new historical scheduler with the specified initial clock value.
         *
         * @constructor
         * @param {Number} initialClock Initial value for the clock.
         * @param {Function} comparer Comparer to determine causality of events based on absolute time.
         */
        function HistoricalScheduler(initialClock, comparer) {
            var clock = initialClock == null ? 0 : initialClock;
            var cmp = comparer || defaultSubComparer;
            _super.call(this, clock, cmp);
        }

        var HistoricalSchedulerProto = HistoricalScheduler.prototype;

        /**
         * Adds a relative time value to an absolute time value.
         *
         * @memberOf HistoricalScheduler
         * @param {Number} absolute Absolute virtual time value.
         * @param {Number} relative Relative virtual time value to add.
         * @return {Number} Resulting absolute virtual time sum value.
         */
        HistoricalSchedulerProto.add = function (absolute, relative) {
            return absolute + relative;
        };

        /**
         * @private
         * @memberOf HistoricalScheduler
         */
        HistoricalSchedulerProto.toDateTimeOffset = function (absolute) {
            return new Date(absolute).getTime();
        };

        /**
         * Converts the TimeSpan value to a relative virtual time value.
         *
         * @memberOf HistoricalScheduler
         * @param {Number} timeSpan TimeSpan value to convert.
         * @return {Number} Corresponding relative virtual time value.
         */
        HistoricalSchedulerProto.toRelative = function (timeSpan) {
            return timeSpan;
        };

        return HistoricalScheduler;
    }(Rx.VirtualTimeScheduler));

    var scheduleMethod, clearMethod = noop;
    (function () {
        function postMessageSupported () {
            // Ensure not in a worker
            if (!window.postMessage || window.importScripts) { return false; }
            var isAsync = false,
                oldHandler = window.onmessage;
            // Test for async
            window.onmessage = function () { isAsync = true; };
            window.postMessage('','*');
            window.onmessage = oldHandler;

            return isAsync;
        }

        if (typeof window.process === 'object' && Object.prototype.toString.call(window.process) === '[object process]') {
            scheduleMethod = window.process.nextTick;
        } else if (typeof window.setImmediate === 'function') {
            scheduleMethod = window.setImmediate;
            clearMethod = window.clearImmediate;
        } else if (postMessageSupported()) {
            var MSG_PREFIX = 'ms.rx.schedule' + Math.random(),
                tasks = {},
                taskId = 0;

            function onGlobalPostMessage(event) {
                // Only if we're a match to avoid any other global events
                if (typeof event.data === 'string' && event.data.substring(0, MSG_PREFIX.length) === MSG_PREFIX) {
                    var handleId = event.data.substring(MSG_PREFIX.length),
                        action = tasks[handleId];
                    action();
                    delete tasks[handleId];
                }
            }

            if (window.addEventListener) {
                window.addEventListener('message', onGlobalPostMessage, false);
            } else {
                window.attachEvent('onmessage', onGlobalPostMessage, false);
            }

            scheduleMethod = function (action) {
                var currentId = taskId++;
                tasks[currentId] = action;
                window.postMessage(MSG_PREFIX + currentId, '*');
            };
        } else if (!!window.MessageChannel) {
            var channel = new window.MessageChannel(),
                channelTasks = {},
                channelTaskId = 0;

            channel.port1.onmessage = function (event) {
                var id = event.data,
                    action = channelTasks[id];
                action();
                delete channelTasks[id];
            };

            scheduleMethod = function (action) {
                var id = channelTaskId++;
                channelTasks[id] = action;
                channel.port2.postMessage(id);
            };
        } else if ('document' in window && 'onreadystatechange' in window.document.createElement('script')) {

            scheduleMethod = function (action) {
                var scriptElement = window.document.createElement('script');
                scriptElement.onreadystatechange = function () {
                    action();
                    scriptElement.onreadystatechange = null;
                    scriptElement.parentNode.removeChild(scriptElement);
                    scriptElement = null;
                };
                window.document.documentElement.appendChild(scriptElement);
            };

        } else {
            scheduleMethod = function (action) { return window.setTimeout(action, 0); };
            clearMethod = window.clearTimeout;
        }
    }());

    /**
     * Gets a scheduler that schedules work via a timed callback based upon platform.
     *
     * @memberOf Scheduler
     */
    var timeoutScheduler = Scheduler.timeout = (function () {

        function scheduleNow(state, action) {
            var scheduler = this,
                disposable = new SingleAssignmentDisposable();
            var id = scheduleMethod(function () {
                if (!disposable.isDisposed) {
                    disposable.setDisposable(action(scheduler, state));
                }
            });
            return new CompositeDisposable(disposable, disposableCreate(function () {
                clearMethod(id);
            }));
        }

        function scheduleRelative(state, dueTime, action) {
            var scheduler = this,
                dt = Scheduler.normalize(dueTime);
            if (dt === 0) {
                return scheduler.scheduleWithState(state, action);
            }
            var disposable = new SingleAssignmentDisposable();
            var id = window.setTimeout(function () {
                if (!disposable.isDisposed) {
                    disposable.setDisposable(action(scheduler, state));
                }
            }, dt);
            return new CompositeDisposable(disposable, disposableCreate(function () {
                window.clearTimeout(id);
            }));
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this.scheduleWithRelativeAndState(state, dueTime - this.now(), action);
        }

        return new Scheduler(defaultNow, scheduleNow, scheduleRelative, scheduleAbsolute);
    })();

    /** @private */
    var CatchScheduler = (function (_super) {

        function localNow() {
            return this._scheduler.now();
        }

        function scheduleNow(state, action) {
            return this._scheduler.scheduleWithState(state, this._wrap(action));
        }

        function scheduleRelative(state, dueTime, action) {
            return this._scheduler.scheduleWithRelativeAndState(state, dueTime, this._wrap(action));
        }

        function scheduleAbsolute(state, dueTime, action) {
            return this._scheduler.scheduleWithAbsoluteAndState(state, dueTime, this._wrap(action));
        }

        inherits(CatchScheduler, _super);

        /** @private */
        function CatchScheduler(scheduler, handler) {
            this._scheduler = scheduler;
            this._handler = handler;
            this._recursiveOriginal = null;
            this._recursiveWrapper = null;
            _super.call(this, localNow, scheduleNow, scheduleRelative, scheduleAbsolute);
        }

        /** @private */
        CatchScheduler.prototype._clone = function (scheduler) {
            return new CatchScheduler(scheduler, this._handler);
        };

        /** @private */
        CatchScheduler.prototype._wrap = function (action) {
            var parent = this;
            return function (self, state) {
                try {
                    return action(parent._getRecursiveWrapper(self), state);
                } catch (e) {
                    if (!parent._handler(e)) { throw e; }
                    return disposableEmpty;
                }
            };
        };

        /** @private */
        CatchScheduler.prototype._getRecursiveWrapper = function (scheduler) {
            if (this._recursiveOriginal !== scheduler) {
                this._recursiveOriginal = scheduler;
                var wrapper = this._clone(scheduler);
                wrapper._recursiveOriginal = scheduler;
                wrapper._recursiveWrapper = wrapper;
                this._recursiveWrapper = wrapper;
            }
            return this._recursiveWrapper;
        };

        /** @private */
        CatchScheduler.prototype.schedulePeriodicWithState = function (state, period, action) {
            var self = this, failed = false, d = new SingleAssignmentDisposable();

            d.setDisposable(this._scheduler.schedulePeriodicWithState(state, period, function (state1) {
                if (failed) { return null; }
                try {
                    return action(state1);
                } catch (e) {
                    failed = true;
                    if (!self._handler(e)) { throw e; }
                    d.dispose();
                    return null;
                }
            }));

            return d;
        };

        return CatchScheduler;
    }(Scheduler));

    /**
     *  Represents a notification to an observer.
     */
    var Notification = Rx.Notification = (function () {
        function Notification(kind, hasValue) {
            this.hasValue = hasValue == null ? false : hasValue;
            this.kind = kind;
        }

        var NotificationPrototype = Notification.prototype;

        /**
         * Invokes the delegate corresponding to the notification or the observer's method corresponding to the notification and returns the produced result.
         *
         * @memberOf Notification
         * @param {Any} observerOrOnNext Delegate to invoke for an OnNext notification or Observer to invoke the notification on..
         * @param {Function} onError Delegate to invoke for an OnError notification.
         * @param {Function} onCompleted Delegate to invoke for an OnCompleted notification.
         * @returns {Any} Result produced by the observation.
         */
        NotificationPrototype.accept = function (observerOrOnNext, onError, onCompleted) {
            if (arguments.length === 1 && typeof observerOrOnNext === 'object') {
                return this._acceptObservable(observerOrOnNext);
            }
            return this._accept(observerOrOnNext, onError, onCompleted);
        };

        /**
         * Returns an observable sequence with a single notification.
         *
         * @memberOf Notification
         * @param {Scheduler} [scheduler] Scheduler to send out the notification calls on.
         * @returns {Observable} The observable sequence that surfaces the behavior of the notification upon subscription.
         */
        NotificationPrototype.toObservable = function (scheduler) {
            var notification = this;
            scheduler = scheduler || immediateScheduler;
            return new AnonymousObservable(function (observer) {
                return scheduler.schedule(function () {
                    notification._acceptObservable(observer);
                    if (notification.kind === 'N') {
                        observer.onCompleted();
                    }
                });
            });
        };

        return Notification;
    })();

    /**
     * Creates an object that represents an OnNext notification to an observer.
     *
     * @static
     * @memberOf Notification
     * @param {Any} value The value contained in the notification.
     * @returns {Notification} The OnNext notification containing the value.
     */
    var notificationCreateOnNext = Notification.createOnNext = (function () {

        function _accept (onNext) {
            return onNext(this.value);
        }

        function _acceptObservable(observer) {
            return observer.onNext(this.value);
        }

        function toString () {
            return 'OnNext(' + this.value + ')';
        }

        return function (value) {
            var notification = new Notification('N', true);
            notification.value = value;
            notification._accept = _accept.bind(notification);
            notification._acceptObservable = _acceptObservable.bind(notification);
            notification.toString = toString.bind(notification);
            return notification;
        };
    }());

    /**
     *  Creates an object that represents an OnError notification to an observer.
     *
     * @static     s
     * @memberOf Notification
     * @param {Any} error The exception contained in the notification.
     * @returns {Notification} The OnError notification containing the exception.
     */
    var notificationCreateOnError = Notification.createOnError = (function () {

        function _accept (onNext, onError) {
            return onError(this.exception);
        }

        function _acceptObservable(observer) {
            return observer.onError(this.exception);
        }

        function toString () {
            return 'OnError(' + this.exception + ')';
        }

        return function (exception) {
            var notification = new Notification('E');
            notification.exception = exception;
            notification._accept = _accept.bind(notification);
            notification._acceptObservable = _acceptObservable.bind(notification);
            notification.toString = toString.bind(notification);
            return notification;
        };
    }());

    /**
     *  Creates an object that represents an OnCompleted notification to an observer.
     *
     * @static
     * @memberOf Notification
     * @returns {Notification} The OnCompleted notification.
     */
    var notificationCreateOnCompleted = Notification.createOnCompleted = (function () {

        function _accept (onNext, onError, onCompleted) {
            return onCompleted();
        }

        function _acceptObservable(observer) {
            return observer.onCompleted();
        }

        function toString () {
            return 'OnCompleted()';
        }

        return function () {
            var notification = new Notification('C');
            notification._accept = _accept.bind(notification);
            notification._acceptObservable = _acceptObservable.bind(notification);
            notification.toString = toString.bind(notification);
            return notification;
        };
    }());

    /**
     * @constructor
     * @private
     */
    var Enumerator = Rx.Internals.Enumerator = function (moveNext, getCurrent, dispose) {
        this.moveNext = moveNext;
        this.getCurrent = getCurrent;
        this.dispose = dispose;
    };

    /**
     * @static
     * @memberOf Enumerator
     * @private
     */
    var enumeratorCreate = Enumerator.create = function (moveNext, getCurrent, dispose) {
        var done = false;
        dispose || (dispose = noop);
        return new Enumerator(function () {
            if (done) {
                return false;
            }
            var result = moveNext();
            if (!result) {
                done = true;
                dispose();
            }
            return result;
        }, function () { return getCurrent(); }, function () {
            if (!done) {
                dispose();
                done = true;
            }
        });
    };

    /** @private */
    var Enumerable = Rx.Internals.Enumerable = (function () {

        /**
         * @constructor
         * @private
         */
        function Enumerable(getEnumerator) {
            this.getEnumerator = getEnumerator;
        }

        /**
         * @private
         * @memberOf Enumerable#
         */
        Enumerable.prototype.concat = function () {
            var sources = this;
            return new AnonymousObservable(function (observer) {
                var e = sources.getEnumerator(), isDisposed = false, subscription = new SerialDisposable();
                var cancelable = immediateScheduler.scheduleRecursive(function (self) {
                    var current, ex, hasNext = false;
                    if (!isDisposed) {
                        try {
                            hasNext = e.moveNext();
                            if (hasNext) {
                                current = e.getCurrent();
                            } else {
                                e.dispose();
                            }
                        } catch (exception) {
                            ex = exception;
                            e.dispose();
                        }
                    } else {
                        return;
                    }
                    if (ex) {
                        observer.onError(ex);
                        return;
                    }
                    if (!hasNext) {
                        observer.onCompleted();
                        return;
                    }
                    var d = new SingleAssignmentDisposable();
                    subscription.setDisposable(d);
                    d.setDisposable(current.subscribe(
                        observer.onNext.bind(observer),
                        observer.onError.bind(observer),
                        function () { self(); })
                    );
                });
                return new CompositeDisposable(subscription, cancelable, disposableCreate(function () {
                    isDisposed = true;
                    e.dispose();
                }));
            });
        };

        /**
         * @private
         * @memberOf Enumerable#
         */
        Enumerable.prototype.catchException = function () {
            var sources = this;
            return new AnonymousObservable(function (observer) {
                var e = sources.getEnumerator(), isDisposed = false, lastException;
                var subscription = new SerialDisposable();
                var cancelable = immediateScheduler.scheduleRecursive(function (self) {
                    var current, ex, hasNext;
                    hasNext = false;
                    if (!isDisposed) {
                        try {
                            hasNext = e.moveNext();
                            if (hasNext) {
                                current = e.getCurrent();
                            }
                        } catch (exception) {
                            ex = exception;
                        }
                    } else {
                        return;
                    }
                    if (ex) {
                        observer.onError(ex);
                        return;
                    }
                    if (!hasNext) {
                        if (lastException) {
                            observer.onError(lastException);
                        } else {
                            observer.onCompleted();
                        }
                        return;
                    }
                    var d = new SingleAssignmentDisposable();
                    subscription.setDisposable(d);
                    d.setDisposable(current.subscribe(
                        observer.onNext.bind(observer),
                        function (exn) {
                            lastException = exn;
                            self();
                        },
                        observer.onCompleted.bind(observer)));
                });
                return new CompositeDisposable(subscription, cancelable, disposableCreate(function () {
                    isDisposed = true;
                }));
            });
        };

        return Enumerable;
    }());

    /**
     * @static
     * @private
     * @memberOf Enumerable
     */
    var enumerableRepeat = Enumerable.repeat = function (value, repeatCount) {
        if (repeatCount === undefined) {
            repeatCount = -1;
        }
        return new Enumerable(function () {
            var current, left = repeatCount;
            return enumeratorCreate(function () {
                if (left === 0) {
                    return false;
                }
                if (left > 0) {
                    left--;
                }
                current = value;
                return true;
            }, function () { return current; });
        });
    };

    /**
     * @static
     * @private
     * @memberOf Enumerable
     */
    var enumerableFor = Enumerable.forEach = function (source, selector) {
        selector || (selector = identity);
        return new Enumerable(function () {
            var current, index = -1;
            return enumeratorCreate(
                function () {
                    if (++index < source.length) {
                        current = selector(source[index], index);
                        return true;
                    }
                    return false;
                },
                function () { return current; }
            );
        });
    };

    /**
     * Supports push-style iteration over an observable sequence.
     */
    var Observer = Rx.Observer = function () { };

    /**
     *  Creates a notification callback from an observer.
     *
     * @param observer Observer object.
     * @returns The action that forwards its input notification to the underlying observer.
     */
    Observer.prototype.toNotifier = function () {
        var observer = this;
        return function (n) {
            return n.accept(observer);
        };
    };

    /**
     *  Hides the identity of an observer.

     * @returns An observer that hides the identity of the specified observer.
     */
    Observer.prototype.asObserver = function () {
        return new AnonymousObserver(this.onNext.bind(this), this.onError.bind(this), this.onCompleted.bind(this));
    };

    /**
     *  Checks access to the observer for grammar violations. This includes checking for multiple OnError or OnCompleted calls, as well as reentrancy in any of the observer methods.
     *  If a violation is detected, an Error is thrown from the offending observer method call.
     *
     * @returns An observer that checks callbacks invocations against the observer grammar and, if the checks pass, forwards those to the specified observer.
     */
    Observer.prototype.checked = function () { return new CheckedObserver(this); };

    /**
     *  Creates an observer from the specified OnNext, along with optional OnError, and OnCompleted actions.
     *
     * @static
     * @memberOf Observer
     * @param {Function} [onNext] Observer's OnNext action implementation.
     * @param {Function} [onError] Observer's OnError action implementation.
     * @param {Function} [onCompleted] Observer's OnCompleted action implementation.
     * @returns {Observer} The observer object implemented using the given actions.
     */
    var observerCreate = Observer.create = function (onNext, onError, onCompleted) {
        onNext || (onNext = noop);
        onError || (onError = defaultError);
        onCompleted || (onCompleted = noop);
        return new AnonymousObserver(onNext, onError, onCompleted);
    };

    /**
     *  Creates an observer from a notification callback.
     *
     * @static
     * @memberOf Observer
     * @param {Function} handler Action that handles a notification.
     * @returns The observer object that invokes the specified handler using a notification corresponding to each message it receives.
     */
    Observer.fromNotifier = function (handler) {
        return new AnonymousObserver(function (x) {
            return handler(notificationCreateOnNext(x));
        }, function (exception) {
            return handler(notificationCreateOnError(exception));
        }, function () {
            return handler(notificationCreateOnCompleted());
        });
    };

    /**
     * Abstract base class for implementations of the Observer class.
     * This base class enforces the grammar of observers where OnError and OnCompleted are terminal messages.
     */
    var AbstractObserver = Rx.Internals.AbstractObserver = (function (_super) {
        inherits(AbstractObserver, _super);

        /**
         * Creates a new observer in a non-stopped state.
         *
         * @constructor
         */
        function AbstractObserver() {
            this.isStopped = false;
            _super.call(this);
        }

        /**
         * Notifies the observer of a new element in the sequence.
         *
         * @memberOf AbstractObserver
         * @param {Any} value Next element in the sequence.
         */
        AbstractObserver.prototype.onNext = function (value) {
            if (!this.isStopped) {
                this.next(value);
            }
        };

        /**
         * Notifies the observer that an exception has occurred.
         *
         * @memberOf AbstractObserver
         * @param {Any} error The error that has occurred.
         */
        AbstractObserver.prototype.onError = function (error) {
            if (!this.isStopped) {
                this.isStopped = true;
                this.error(error);
            }
        };

        /**
         * Notifies the observer of the end of the sequence.
         */
        AbstractObserver.prototype.onCompleted = function () {
            if (!this.isStopped) {
                this.isStopped = true;
                this.completed();
            }
        };

        /**
         * Disposes the observer, causing it to transition to the stopped state.
         */
        AbstractObserver.prototype.dispose = function () {
            this.isStopped = true;
        };

        AbstractObserver.prototype.fail = function () {
            if (!this.isStopped) {
                this.isStopped = true;
                this.error(true);
                return true;
            }

            return false;
        };

        return AbstractObserver;
    }(Observer));

    /**
     * Class to create an Observer instance from delegate-based implementations of the on* methods.
     */
    var AnonymousObserver = Rx.AnonymousObserver = (function (_super) {
        inherits(AnonymousObserver, _super);

        /**
         * Creates an observer from the specified OnNext, OnError, and OnCompleted actions.
         *
         * @constructor
         * @param {Any} onNext Observer's OnNext action implementation.
         * @param {Any} onError Observer's OnError action implementation.
         * @param {Any} onCompleted Observer's OnCompleted action implementation.
         */
        function AnonymousObserver(onNext, onError, onCompleted) {
            _super.call(this);
            this._onNext = onNext;
            this._onError = onError;
            this._onCompleted = onCompleted;
        }

        /**
         * Calls the onNext action.
         *
         * @memberOf AnonymousObserver
         * @param {Any} value Next element in the sequence.
         */
        AnonymousObserver.prototype.next = function (value) {
            this._onNext(value);
        };

        /**
         * Calls the onError action.
         *
         * @memberOf AnonymousObserver
         * @param {Any{ error The error that has occurred.
         */
        AnonymousObserver.prototype.error = function (exception) {
            this._onError(exception);
        };

        /**
         *  Calls the onCompleted action.
         *
         * @memberOf AnonymousObserver
         */
        AnonymousObserver.prototype.completed = function () {
            this._onCompleted();
        };

        return AnonymousObserver;
    }(AbstractObserver));

    var CheckedObserver = (function (_super) {
        inherits(CheckedObserver, _super);

        function CheckedObserver(observer) {
            _super.call(this);
            this._observer = observer;
            this._state = 0; // 0 - idle, 1 - busy, 2 - done
        }

        var CheckedObserverPrototype = CheckedObserver.prototype;

        CheckedObserverPrototype.onNext = function (value) {
            this.checkAccess();
            try {
                this._observer.onNext(value);
            } catch (e) {
                throw e;
            } finally {
                this._state = 0;
            }
        };

        CheckedObserverPrototype.onError = function (err) {
            this.checkAccess();
            try {
                this._observer.onError(err);
            } catch (e) {
                throw e;
            } finally {
                this._state = 2;
            }
        };

        CheckedObserverPrototype.onCompleted = function () {
            this.checkAccess();
            try {
                this._observer.onCompleted();
            } catch (e) {
                throw e;
            } finally {
                this._state = 2;
            }
        };

        CheckedObserverPrototype.checkAccess = function () {
            if (this._state === 1) { throw new Error('Re-entrancy detected'); }
            if (this._state === 2) { throw new Error('Observer completed'); }
            if (this._state === 0) { this._state = 1; }
        };

        return CheckedObserver;
    }(Observer));

    /** @private */
    var ScheduledObserver = Rx.Internals.ScheduledObserver = (function (_super) {
        inherits(ScheduledObserver, _super);

        function ScheduledObserver(scheduler, observer) {
            _super.call(this);
            this.scheduler = scheduler;
            this.observer = observer;
            this.isAcquired = false;
            this.hasFaulted = false;
            this.queue = [];
            this.disposable = new SerialDisposable();
        }

        /** @private */
        ScheduledObserver.prototype.next = function (value) {
            var self = this;
            this.queue.push(function () {
                self.observer.onNext(value);
            });
        };

        /** @private */
        ScheduledObserver.prototype.error = function (exception) {
            var self = this;
            this.queue.push(function () {
                self.observer.onError(exception);
            });
        };

        /** @private */
        ScheduledObserver.prototype.completed = function () {
            var self = this;
            this.queue.push(function () {
                self.observer.onCompleted();
            });
        };

        /** @private */
        ScheduledObserver.prototype.ensureActive = function () {
            var isOwner = false, parent = this;
            if (!this.hasFaulted && this.queue.length > 0) {
                isOwner = !this.isAcquired;
                this.isAcquired = true;
            }
            if (isOwner) {
                this.disposable.setDisposable(this.scheduler.scheduleRecursive(function (self) {
                    var work;
                    if (parent.queue.length > 0) {
                        work = parent.queue.shift();
                    } else {
                        parent.isAcquired = false;
                        return;
                    }
                    try {
                        work();
                    } catch (ex) {
                        parent.queue = [];
                        parent.hasFaulted = true;
                        throw ex;
                    }
                    self();
                }));
            }
        };

        /** @private */
        ScheduledObserver.prototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.disposable.dispose();
        };

        return ScheduledObserver;
    }(AbstractObserver));

    /** @private */
    var ObserveOnObserver = (function (_super) {
        inherits(ObserveOnObserver, _super);

        /** @private */
        function ObserveOnObserver() {
            _super.apply(this, arguments);
        }

        /** @private */
        ObserveOnObserver.prototype.next = function (value) {
            _super.prototype.next.call(this, value);
            this.ensureActive();
        };

        /** @private */
        ObserveOnObserver.prototype.error = function (e) {
            _super.prototype.error.call(this, e);
            this.ensureActive();
        };

        /** @private */
        ObserveOnObserver.prototype.completed = function () {
            _super.prototype.completed.call(this);
            this.ensureActive();
        };

        return ObserveOnObserver;
    })(ScheduledObserver);

    var observableProto;

    /**
     * Represents a push-style collection.
     */
    var Observable = Rx.Observable = (function () {

        /**
         * @constructor
         * @private
         */
        function Observable(subscribe) {
            this._subscribe = subscribe;
        }

        observableProto = Observable.prototype;

        observableProto.finalValue = function () {
            var source = this;
            return new AnonymousObservable(function (observer) {
                var hasValue = false, value;
                return source.subscribe(function (x) {
                    hasValue = true;
                    value = x;
                }, observer.onError.bind(observer), function () {
                    if (!hasValue) {
                        observer.onError(new Error(sequenceContainsNoElements));
                    } else {
                        observer.onNext(value);
                        observer.onCompleted();
                    }
                });
            });
        };

        /**
         *  Subscribes an observer to the observable sequence.
         *
         * @example
         *  1 - source.subscribe();
         *  2 - source.subscribe(observer);
         *  3 - source.subscribe(function (x) { console.log(x); });
         *  4 - source.subscribe(function (x) { console.log(x); }, function (err) { console.log(err); });
         *  5 - source.subscribe(function (x) { console.log(x); }, function (err) { console.log(err); }, function () { console.log('done'); });
         *  @param {Mixed} [observerOrOnNext] The object that is to receive notifications or an action to invoke for each element in the observable sequence.
         *  @param {Function} [onError] Action to invoke upon exceptional termination of the observable sequence.
         *  @param {Function} [onCompleted] Action to invoke upon graceful termination of the observable sequence.
         *  @returns {Diposable} The source sequence whose subscriptions and unsubscriptions happen on the specified scheduler.
         */
        observableProto.subscribe = observableProto.forEach = function (observerOrOnNext, onError, onCompleted) {
            var subscriber;
            if (typeof observerOrOnNext === 'object') {
                subscriber = observerOrOnNext;
            } else {
                subscriber = observerCreate(observerOrOnNext, onError, onCompleted);
            }

            return this._subscribe(subscriber);
        };

        /**
         *  Creates a list from an observable sequence.
         *
         * @memberOf Observable
         * @returns An observable sequence containing a single element with a list containing all the elements of the source sequence.
         */
        observableProto.toArray = function () {
            function accumulator(list, i) {
                var newList = list.slice(0);
                newList.push(i);
                return newList;
            }
            return this.scan([], accumulator).startWith([]).finalValue();
        };

        return Observable;
    })();

    /**
     * Invokes the specified function asynchronously on the specified scheduler, surfacing the result through an observable sequence.
     *
     * @example
     * 1 - res = Rx.Observable.start(function () { console.log('hello'); });
     * 2 - res = Rx.Observable.start(function () { console.log('hello'); }, Rx.Scheduler.timeout);
     * 2 - res = Rx.Observable.start(function () { this.log('hello'); }, Rx.Scheduler.timeout, console);
     *
     * @param {Function} func Function to run asynchronously.
     * @param {Scheduler} [scheduler]  Scheduler to run the function on. If not specified, defaults to Scheduler.timeout.
     * @param [context]  The context for the func parameter to be executed.  If not specified, defaults to undefined.
     * @returns {Observable} An observable sequence exposing the function's result value, or an exception.
     *
     * Remarks
     * * The function is called immediately, not during the subscription of the resulting sequence.
     * * Multiple subscriptions to the resulting sequence can observe the function's result.
     */
    Observable.start = function (func, scheduler, context) {
        return observableToAsync(func, scheduler)();
    };

    /**
     * Converts the function into an asynchronous function. Each invocation of the resulting asynchronous function causes an invocation of the original synchronous function on the specified scheduler.
     *
     * @example
     * 1 - res = Rx.Observable.toAsync(function (x, y) { return x + y; })(4, 3);
     * 2 - res = Rx.Observable.toAsync(function (x, y) { return x + y; }, Rx.Scheduler.timeout)(4, 3);
     * 2 - res = Rx.Observable.toAsync(function (x) { this.log(x); }, Rx.Scheduler.timeout, console)('hello');
     *
     * @param function Function to convert to an asynchronous function.
     * @param {Scheduler} [scheduler] Scheduler to run the function on. If not specified, defaults to Scheduler.timeout.
     * @param {Mixed} [context] The context for the func parameter to be executed.  If not specified, defaults to undefined.
     * @returns {Function} Asynchronous function.
     */
    var observableToAsync = Observable.toAsync = function (func, scheduler, context) {
        scheduler || (scheduler = timeoutScheduler);
        return function () {
            var args = slice.call(arguments, 0), subject = new AsyncSubject();
            scheduler.schedule(function () {
                var result;
                try {
                    result = func.apply(context, args);
                } catch (e) {
                    subject.onError(e);
                    return;
                }
                subject.onNext(result);
                subject.onCompleted();
            });
            return subject.asObservable();
        };
    };
     /**
     *  Wraps the source sequence in order to run its observer callbacks on the specified scheduler.
     *
     *  This only invokes observer callbacks on a scheduler. In case the subscription and/or unsubscription actions have side-effects
     *  that require to be run on a scheduler, use subscribeOn.
     *
     *  @param {Scheduler} scheduler Scheduler to notify observers on.
     *  @returns {Observable} The source sequence whose observations happen on the specified scheduler.
     */
    observableProto.observeOn = function (scheduler) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(new ObserveOnObserver(scheduler, observer));
        });
    };

     /**
     *  Wraps the source sequence in order to run its subscription and unsubscription logic on the specified scheduler. This operation is not commonly used;
     *  see the remarks section for more information on the distinction between subscribeOn and observeOn.

     *  This only performs the side-effects of subscription and unsubscription on the specified scheduler. In order to invoke observer
     *  callbacks on a scheduler, use observeOn.

     *  @param {Scheduler} scheduler Scheduler to perform subscription and unsubscription actions on.
     *  @returns {Observable} The source sequence whose subscriptions and unsubscriptions happen on the specified scheduler.
     */
    observableProto.subscribeOn = function (scheduler) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var m = new SingleAssignmentDisposable(), d = new SerialDisposable();
            d.setDisposable(m);
            m.setDisposable(scheduler.schedule(function () {
                d.setDisposable(new ScheduledDisposable(scheduler, source.subscribe(observer)));
            }));
            return d;
        });
    };

    /**
     *  Creates an observable sequence from a specified subscribe method implementation.
     *
     * @example
     *  1 - res = Rx.Observable.create(function (observer) { return function () { } );
     *
     * @param {Function} subscribe Implementation of the resulting observable sequence's subscribe method, returning a function that will be wrapped in a Disposable.
     * @returns {Observable} The observable sequence with the specified implementation for the Subscribe method.
     */
    Observable.create = function (subscribe) {
        return new AnonymousObservable(function (o) {
            return disposableCreate(subscribe(o));
        });
    };

    /**
     *  Creates an observable sequence from a specified subscribe method implementation.
     *
     * @example
     *  1 - res = Rx.Observable.create(function (observer) { return Rx.Disposable.empty; } );
     * @static
     * @memberOf Observable
     * @param {Function} subscribe Implementation of the resulting observable sequence's subscribe method.
     * @returns {Observable} The observable sequence with the specified implementation for the Subscribe method.
     */
    Observable.createWithDisposable = function (subscribe) {
        return new AnonymousObservable(subscribe);
    };

    /**
     *  Returns an observable sequence that invokes the specified factory function whenever a new observer subscribes.
     *
     * @example
     *  1 - res = Rx.Observable.defer(function () { return Rx.Observable.fromArray([1,2,3]); });
     * @static
     * @memberOf Observable
     * @param {Function} observableFactory Observable factory function to invoke for each observer that subscribes to the resulting sequence.
     * @returns {Observable} An observable sequence whose observers trigger an invocation of the given observable factory function.
     */
    var observableDefer = Observable.defer = function (observableFactory) {
        return new AnonymousObservable(function (observer) {
            var result;
            try {
                result = observableFactory();
            } catch (e) {
                return observableThrow(e).subscribe(observer);
            }
            return result.subscribe(observer);
        });
    };

    /**
     *  Returns an empty observable sequence, using the specified scheduler to send out the single OnCompleted message.
     *
     * @example
     *  1 - res = Rx.Observable.empty();
     *  2 - res = Rx.Observable.empty(Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Scheduler} [scheduler] Scheduler to send the termination call on.
     * @returns {Observable} An observable sequence with no elements.
     */
    var observableEmpty = Observable.empty = function (scheduler) {
        scheduler || (scheduler = immediateScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.schedule(function () {
                observer.onCompleted();
            });
        });
    };

    /**
     *  Converts an array to an observable sequence, using an optional scheduler to enumerate the array.
     *
     * @example
     *  1 - res = Rx.Observable.fromArray([1,2,3]);
     *  2 - res = Rx.Observable.fromArray([1,2,3], Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Scheduler} [scheduler] Scheduler to run the enumeration of the input sequence on.
     * @returns {Observable} The observable sequence whose elements are pulled from the given enumerable sequence.
     */
    var observableFromArray = Observable.fromArray = function (array, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        return new AnonymousObservable(function (observer) {
            var count = 0;
            return scheduler.scheduleRecursive(function (self) {
                if (count < array.length) {
                    observer.onNext(array[count++]);
                    self();
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Generates an observable sequence by running a state-driven loop producing the sequence's elements, using the specified scheduler to send out observer messages.
     *
     * @example
     *  1 - res = Rx.Observable.generate(0, function (x) { return x < 10; }, function (x) { return x + 1; }, function (x) { return x; });
     *  2 - res = Rx.Observable.generate(0, function (x) { return x < 10; }, function (x) { return x + 1; }, function (x) { return x; }, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} initialState Initial state.
     * @param {Function} condition Condition to terminate generation (upon returning false).
     * @param {Function} iterate Iteration step function.
     * @param {Function} resultSelector Selector function for results produced in the sequence.
     * @param {Scheduler} [scheduler] Scheduler on which to run the generator loop. If not provided, defaults to Scheduler.currentThread.
     * @returns {Observable} The generated sequence.
     */
    Observable.generate = function (initialState, condition, iterate, resultSelector, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        return new AnonymousObservable(function (observer) {
            var first = true, state = initialState;
            return scheduler.scheduleRecursive(function (self) {
                var hasResult, result;
                try {
                    if (first) {
                        first = false;
                    } else {
                        state = iterate(state);
                    }
                    hasResult = condition(state);
                    if (hasResult) {
                        result = resultSelector(state);
                    }
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                if (hasResult) {
                    observer.onNext(result);
                    self();
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Returns a non-terminating observable sequence, which can be used to denote an infinite duration (e.g. when using reactive joins).
     *
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence whose observers will never get called.
     */
    var observableNever = Observable.never = function () {
        return new AnonymousObservable(function () {
            return disposableEmpty;
        });
    };

    /**
     *  Generates an observable sequence of integral numbers within a specified range, using the specified scheduler to send out observer messages.
     *
     * @example
     *  1 - res = Rx.Observable.range(0, 10);
     *  2 - res = Rx.Observable.range(0, 10, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Number} start The value of the first integer in the sequence.
     * @param {Number} count The number of sequential integers to generate.
     * @param {Scheduler} [scheduler] Scheduler to run the generator loop on. If not specified, defaults to Scheduler.currentThread.
     * @returns {Observable} An observable sequence that contains a range of sequential integral numbers.
     */
    Observable.range = function (start, count, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.scheduleRecursiveWithState(0, function (i, self) {
                if (i < count) {
                    observer.onNext(start + i);
                    self(i + 1);
                } else {
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Generates an observable sequence that repeats the given element the specified number of times, using the specified scheduler to send out observer messages.
     *
     * @example
     *  1 - res = Rx.Observable.repeat(42);
     *  2 - res = Rx.Observable.repeat(42, 4);
     *  3 - res = Rx.Observable.repeat(42, 4, Rx.Scheduler.timeout);
     *  4 - res = Rx.Observable.repeat(42, null, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} value Element to repeat.
     * @param {Number} repeatCount [Optiona] Number of times to repeat the element. If not specified, repeats indefinitely.
     * @param {Scheduler} scheduler Scheduler to run the producer loop on. If not specified, defaults to Scheduler.immediate.
     * @returns {Observable} An observable sequence that repeats the given element the specified number of times.
     */
    Observable.repeat = function (value, repeatCount, scheduler) {
        scheduler || (scheduler = currentThreadScheduler);
        if (repeatCount == null) {
            repeatCount = -1;
        }
        return observableReturn(value, scheduler).repeat(repeatCount);
    };

    /**
     *  Returns an observable sequence that contains a single element, using the specified scheduler to send out observer messages.
     *  There is an alias called 'returnValue' for browsers <IE9.
     *
     * @example
     *  1 - res = Rx.Observable.return(42);
     *  2 - res = Rx.Observable.return(42, Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} value Single element in the resulting observable sequence.
     * @param {Scheduler} scheduler Scheduler to send the single element on. If not specified, defaults to Scheduler.immediate.
     * @returns {Observable} An observable sequence containing the single specified element.
     */
    var observableReturn = Observable['return'] = Observable.returnValue = function (value, scheduler) {
        scheduler || (scheduler = immediateScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.schedule(function () {
                observer.onNext(value);
                observer.onCompleted();
            });
        });
    };

    /**
     *  Returns an observable sequence that terminates with an exception, using the specified scheduler to send out the single onError message.
     *  There is an alias to this method called 'throwException' for browsers <IE9.
     *
     * @example
     *  1 - res = Rx.Observable.throwException(new Error('Error'));
     *  2 - res = Rx.Observable.throwException(new Error('Error'), Rx.Scheduler.timeout);
     * @static
     * @memberOf Observable
     * @param {Mixed} exception An object used for the sequence's termination.
     * @param {Scheduler} scheduler Scheduler to send the exceptional termination call on. If not specified, defaults to Scheduler.immediate.
     * @returns {Observable} The observable sequence that terminates exceptionally with the specified exception object.
     */
    var observableThrow = Observable['throw'] = Observable.throwException = function (exception, scheduler) {
        scheduler || (scheduler = immediateScheduler);
        return new AnonymousObservable(function (observer) {
            return scheduler.schedule(function () {
                observer.onError(exception);
            });
        });
    };

    /**
     *  Constructs an observable sequence that depends on a resource object, whose lifetime is tied to the resulting observable sequence's lifetime.
     *
     * @example
     *  1 - res = Rx.Observable.using(function () { return new AsyncSubject(); }, function (s) { return s; });
     * @static
     * @memberOf Observable
     * @param {Function} resourceFactory Factory function to obtain a resource object.
     * @param {Function} observableFactory Factory function to obtain an observable sequence that depends on the obtained resource.
     * @returns {Observable} An observable sequence whose lifetime controls the lifetime of the dependent resource object.
     */
    Observable.using = function (resourceFactory, observableFactory) {
        return new AnonymousObservable(function (observer) {
            var disposable = disposableEmpty, resource, source;
            try {
                resource = resourceFactory();
                if (resource) {
                    disposable = resource;
                }
                source = observableFactory(resource);
            } catch (exception) {
                return new CompositeDisposable(observableThrow(exception).subscribe(observer), disposable);
            }
            return new CompositeDisposable(source.subscribe(observer), disposable);
        });
    };

    /**
     * Propagates the observable sequence that reacts first.
     *
     * @memberOf Observable#
     * @param {Observable} rightSource Second observable sequence.
     * @returns {Observable} {Observable} An observable sequence that surfaces either of the given sequences, whichever reacted first.
     */
    observableProto.amb = function (rightSource) {
        var leftSource = this;
        return new AnonymousObservable(function (observer) {

            var choice,
                leftChoice = 'L', rightChoice = 'R',
                leftSubscription = new SingleAssignmentDisposable(),
                rightSubscription = new SingleAssignmentDisposable();

            function choiceL() {
                if (!choice) {
                    choice = leftChoice;
                    rightSubscription.dispose();
                }
            }

            function choiceR() {
                if (!choice) {
                    choice = rightChoice;
                    leftSubscription.dispose();
                }
            }

            leftSubscription.setDisposable(leftSource.subscribe(function (left) {
                choiceL();
                if (choice === leftChoice) {
                    observer.onNext(left);
                }
            }, function (err) {
                choiceL();
                if (choice === leftChoice) {
                    observer.onError(err);
                }
            }, function () {
                choiceL();
                if (choice === leftChoice) {
                    observer.onCompleted();
                }
            }));

            rightSubscription.setDisposable(rightSource.subscribe(function (right) {
                choiceR();
                if (choice === rightChoice) {
                    observer.onNext(right);
                }
            }, function (err) {
                choiceR();
                if (choice === rightChoice) {
                    observer.onError(err);
                }
            }, function () {
                choiceR();
                if (choice === rightChoice) {
                    observer.onCompleted();
                }
            }));

            return new CompositeDisposable(leftSubscription, rightSubscription);
        });
    };

    /**
     * Propagates the observable sequence that reacts first.
     *
     * @example
     * E.g. winner = Rx.Observable.amb(xs, ys, zs);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence that surfaces any of the given sequences, whichever reacted first.
     */
    Observable.amb = function () {
        var acc = observableNever(),
            items = argsOrArray(arguments, 0);
        function func(previous, current) {
            return previous.amb(current);
        }
        for (var i = 0, len = items.length; i < len; i++) {
            acc = func(acc, items[i]);
        }
        return acc;
    };

    function observableCatchHandler(source, handler) {
        return new AnonymousObservable(function (observer) {
            var d1 = new SingleAssignmentDisposable(), subscription = new SerialDisposable();
            subscription.setDisposable(d1);
            d1.setDisposable(source.subscribe(observer.onNext.bind(observer), function (exception) {
                var d, result;
                try {
                    result = handler(exception);
                } catch (ex) {
                    observer.onError(ex);
                    return;
                }
                d = new SingleAssignmentDisposable();
                subscription.setDisposable(d);
                d.setDisposable(result.subscribe(observer));
            }, observer.onCompleted.bind(observer)));
            return subscription;
        });
    }

    /**
     * Continues an observable sequence that is terminated by an exception with the next observable sequence.
     * @example
     * 1 - xs.catchException(ys)
     * 2 - xs.catchException(function (ex) { return ys(ex); })
     * @memberOf Observable#
     * @param {Mixed} handlerOrSecond Exception handler function that returns an observable sequence given the error that occurred in the first sequence, or a second observable sequence used to produce results when an error occurred in the first sequence.
     * @returns {Observable} An observable sequence containing the first sequence's elements, followed by the elements of the handler sequence in case an exception occurred.
     */
    observableProto.catchException = function (handlerOrSecond) {
        if (typeof handlerOrSecond === 'function') {
            return observableCatchHandler(this, handlerOrSecond);
        }
        return observableCatch([this, handlerOrSecond]);
    };

    /**
     * Continues an observable sequence that is terminated by an exception with the next observable sequence.
     *
     * @example
     * 1 - res = Rx.Observable.catchException(xs, ys, zs);
     * 2 - res = Rx.Observable.catchException([xs, ys, zs]);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence containing elements from consecutive source sequences until a source sequence terminates successfully.
     */
    var observableCatch = Observable.catchException = function () {
        var items = argsOrArray(arguments, 0);
        return enumerableFor(items).catchException();
    };

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever any of the observable sequences produces an element.
     * This can be in the form of an argument list of observables or an array.
     *
     * @example
     * 1 - obs = observable.combineLatest(obs1, obs2, obs3, function (o1, o2, o3) { return o1 + o2 + o3; });
     * 2 - obs = observable.combineLatest([obs1, obs2, obs3], function (o1, o2, o3) { return o1 + o2 + o3; });
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
     */
    observableProto.combineLatest = function () {
        var args = slice.call(arguments);
        if (Array.isArray(args[0])) {
            args[0].unshift(this);
        } else {
            args.unshift(this);
        }
        return combineLatest.apply(this, args);
    };

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever any of the observable sequences produces an element.
     *
     * @example
     * 1 - obs = Rx.Observable.combineLatest(obs1, obs2, obs3, function (o1, o2, o3) { return o1 + o2 + o3; });
     * 2 - obs = Rx.Observable.combineLatest([obs1, obs2, obs3], function (o1, o2, o3) { return o1 + o2 + o3; });
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
     */
    var combineLatest = Observable.combineLatest = function () {
        var args = slice.call(arguments), resultSelector = args.pop();

        if (Array.isArray(args[0])) {
            args = args[0];
        }

        return new AnonymousObservable(function (observer) {
            var falseFactory = function () { return false; },
                n = args.length,
                hasValue = arrayInitialize(n, falseFactory),
                hasValueAll = false,
                isDone = arrayInitialize(n, falseFactory),
                values = new Array(n);

            function next(i) {
                var res;
                hasValue[i] = true;
                if (hasValueAll || (hasValueAll = hasValue.every(function (x) { return x; }))) {
                    try {
                        res = resultSelector.apply(null, values);
                    } catch (ex) {
                        observer.onError(ex);
                        return;
                    }
                    observer.onNext(res);
                } else if (isDone.filter(function (x, j) { return j !== i; }).every(function (x) { return x; })) {
                    observer.onCompleted();
                }
            }

            function done (i) {
                isDone[i] = true;
                if (isDone.every(function (x) { return x; })) {
                    observer.onCompleted();
                }
            }

            var subscriptions = new Array(n);
            for (var idx = 0; idx < n; idx++) {
                (function (i) {
                    subscriptions[i] = new SingleAssignmentDisposable();
                    subscriptions[i].setDisposable(args[i].subscribe(function (x) {
                        values[i] = x;
                        next(i);
                    }, observer.onError.bind(observer), function () {
                        done(i);
                    }));
                }(idx));
            }

            return new CompositeDisposable(subscriptions);
        });
    };

    /**
     * Concatenates all the observable sequences.  This takes in either an array or variable arguments to concatenate.
     *
     * @example
     * 1 - concatenated = xs.concat(ys, zs);
     * 2 - concatenated = xs.concat([ys, zs]);
     * @memberOf Observable#
     * @returns {Observable} An observable sequence that contains the elements of each given sequence, in sequential order.
     */
    observableProto.concat = function () {
        var items = slice.call(arguments, 0);
        items.unshift(this);
        return observableConcat.apply(this, items);
    };

    /**
     * Concatenates all the observable sequences.
     *
     * @example
     * 1 - res = Rx.Observable.concat(xs, ys, zs);
     * 2 - res = Rx.Observable.concat([xs, ys, zs]);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence that contains the elements of each given sequence, in sequential order.
     */
    var observableConcat = Observable.concat = function () {
        var sources = argsOrArray(arguments, 0);
        return enumerableFor(sources).concat();
    };

    /**
     * Concatenates an observable sequence of observable sequences.
     *
     * @memberOf Observable#
     * @returns {Observable} An observable sequence that contains the elements of each observed inner sequence, in sequential order.
     */
    observableProto.concatObservable = observableProto.concatAll =function () {
        return this.merge(1);
    };

    /**
     * Merges an observable sequence of observable sequences into an observable sequence, limiting the number of concurrent subscriptions to inner sequences.
     * Or merges two observable sequences into a single observable sequence.
     *
     * @example
     * 1 - merged = sources.merge(1);
     * 2 - merged = source.merge(otherSource);
     * @memberOf Observable#
     * @param {Mixed} [maxConcurrentOrOther] Maximum number of inner observable sequences being subscribed to concurrently or the second observable sequence.
     * @returns {Observable} The observable sequence that merges the elements of the inner sequences.
     */
    observableProto.merge = function (maxConcurrentOrOther) {
        if (typeof maxConcurrentOrOther !== 'number') {
            return observableMerge(this, maxConcurrentOrOther);
        }
        var sources = this;
        return new AnonymousObservable(function (observer) {
            var activeCount = 0,
                group = new CompositeDisposable(),
                isStopped = false,
                q = [],
                subscribe = function (xs) {
                    var subscription = new SingleAssignmentDisposable();
                    group.add(subscription);
                    subscription.setDisposable(xs.subscribe(observer.onNext.bind(observer), observer.onError.bind(observer), function () {
                        var s;
                        group.remove(subscription);
                        if (q.length > 0) {
                            s = q.shift();
                            subscribe(s);
                        } else {
                            activeCount--;
                            if (isStopped && activeCount === 0) {
                                observer.onCompleted();
                            }
                        }
                    }));
                };
            group.add(sources.subscribe(function (innerSource) {
                if (activeCount < maxConcurrentOrOther) {
                    activeCount++;
                    subscribe(innerSource);
                } else {
                    q.push(innerSource);
                }
            }, observer.onError.bind(observer), function () {
                isStopped = true;
                if (activeCount === 0) {
                    observer.onCompleted();
                }
            }));
            return group;
        });
    };

    /**
     * Merges all the observable sequences into a single observable sequence.
     * The scheduler is optional and if not specified, the immediate scheduler is used.
     *
     * @example
     * 1 - merged = Rx.Observable.merge(xs, ys, zs);
     * 2 - merged = Rx.Observable.merge([xs, ys, zs]);
     * 3 - merged = Rx.Observable.merge(scheduler, xs, ys, zs);
     * 4 - merged = Rx.Observable.merge(scheduler, [xs, ys, zs]);
     *
     * @static
     * @memberOf Observable
     * @returns {Observable} The observable sequence that merges the elements of the observable sequences.
     */
    var observableMerge = Observable.merge = function () {
        var scheduler, sources;
        if (!arguments[0]) {
            scheduler = immediateScheduler;
            sources = slice.call(arguments, 1);
        } else if (arguments[0].now) {
            scheduler = arguments[0];
            sources = slice.call(arguments, 1);
        } else {
            scheduler = immediateScheduler;
            sources = slice.call(arguments, 0);
        }
        if (Array.isArray(sources[0])) {
            sources = sources[0];
        }
        return observableFromArray(sources, scheduler).mergeObservable();
    };

    /**
     * Merges an observable sequence of observable sequences into an observable sequence.
     *
     * @memberOf Observable#
     * @returns {Observable} The observable sequence that merges the elements of the inner sequences.
     */
    observableProto.mergeObservable = observableProto.mergeAll =function () {
        var sources = this;
        return new AnonymousObservable(function (observer) {
            var group = new CompositeDisposable(),
                isStopped = false,
                m = new SingleAssignmentDisposable();
            group.add(m);
            m.setDisposable(sources.subscribe(function (innerSource) {
                var innerSubscription = new SingleAssignmentDisposable();
                group.add(innerSubscription);
                innerSubscription.setDisposable(innerSource.subscribe(function (x) {
                    observer.onNext(x);
                }, observer.onError.bind(observer), function () {
                    group.remove(innerSubscription);
                    if (isStopped && group.length === 1) {
                        observer.onCompleted();
                    }
                }));
            }, observer.onError.bind(observer), function () {
                isStopped = true;
                if (group.length === 1) {
                    observer.onCompleted();
                }
            }));
            return group;
        });
    };

    /**
     * Continues an observable sequence that is terminated normally or by an exception with the next observable sequence.
     *
     * @memberOf Observable
     * @param {Observable} second Second observable sequence used to produce results after the first sequence terminates.
     * @returns {Observable} An observable sequence that concatenates the first and second sequence, even if the first sequence terminates exceptionally.
     */
    observableProto.onErrorResumeNext = function (second) {
        if (!second) {
            throw new Error('Second observable is required');
        }
        return onErrorResumeNext([this, second]);
    };

    /**
     * Continues an observable sequence that is terminated normally or by an exception with the next observable sequence.
     *
     * @example
     * 1 - res = Rx.Observable.onErrorResumeNext(xs, ys, zs);
     * 1 - res = Rx.Observable.onErrorResumeNext([xs, ys, zs]);
     * @static
     * @memberOf Observable
     * @returns {Observable} An observable sequence that concatenates the source sequences, even if a sequence terminates exceptionally.
     */
    var onErrorResumeNext = Observable.onErrorResumeNext = function () {
        var sources = argsOrArray(arguments, 0);
        return new AnonymousObservable(function (observer) {
            var pos = 0, subscription = new SerialDisposable(),
            cancelable = immediateScheduler.scheduleRecursive(function (self) {
                var current, d;
                if (pos < sources.length) {
                    current = sources[pos++];
                    d = new SingleAssignmentDisposable();
                    subscription.setDisposable(d);
                    d.setDisposable(current.subscribe(observer.onNext.bind(observer), function () {
                        self();
                    }, function () {
                        self();
                    }));
                } else {
                    observer.onCompleted();
                }
            });
            return new CompositeDisposable(subscription, cancelable);
        });
    };

    /**
     * Returns the values from the source observable sequence only after the other observable sequence produces a value.
     *
     * @memberOf Observable#
     * @param {Observable} other The observable sequence that triggers propagation of elements of the source sequence.
     * @returns {Observable} An observable sequence containing the elements of the source sequence starting from the point the other sequence triggered propagation.
     */
    observableProto.skipUntil = function (other) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var isOpen = false;
            var disposables = new CompositeDisposable(source.subscribe(function (left) {
                if (isOpen) {
                    observer.onNext(left);
                }
            }, observer.onError.bind(observer), function () {
                if (isOpen) {
                    observer.onCompleted();
                }
            }));

            var rightSubscription = new SingleAssignmentDisposable();
            disposables.add(rightSubscription);
            rightSubscription.setDisposable(other.subscribe(function () {
                isOpen = true;
                rightSubscription.dispose();
            }, observer.onError.bind(observer), function () {
                rightSubscription.dispose();
            }));

            return disposables;
        });
    };

    /**
     * Transforms an observable sequence of observable sequences into an observable sequence producing values only from the most recent observable sequence.
     *
     * @memberOf Observable#
     * @returns {Observable} The observable sequence that at any point in time produces the elements of the most recent inner observable sequence that has been received.
     */
    observableProto.switchLatest = function () {
        var sources = this;
        return new AnonymousObservable(function (observer) {
            var hasLatest = false,
                innerSubscription = new SerialDisposable(),
                isStopped = false,
                latest = 0,
                subscription = sources.subscribe(function (innerSource) {
                    var d = new SingleAssignmentDisposable(), id = ++latest;
                    hasLatest = true;
                    innerSubscription.setDisposable(d);
                    d.setDisposable(innerSource.subscribe(function (x) {
                        if (latest === id) {
                            observer.onNext(x);
                        }
                    }, function (e) {
                        if (latest === id) {
                            observer.onError(e);
                        }
                    }, function () {
                        if (latest === id) {
                            hasLatest = false;
                            if (isStopped) {
                                observer.onCompleted();
                            }
                        }
                    }));
                }, observer.onError.bind(observer), function () {
                    isStopped = true;
                    if (!hasLatest) {
                        observer.onCompleted();
                    }
                });
            return new CompositeDisposable(subscription, innerSubscription);
        });
    };

    /**
     * Returns the values from the source observable sequence until the other observable sequence produces a value.
     *
     * @memberOf Observable#
     * @param {Observable} other Observable sequence that terminates propagation of elements of the source sequence.
     * @returns {Observable} An observable sequence containing the elements of the source sequence up to the point the other sequence interrupted further propagation.
     */
    observableProto.takeUntil = function (other) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return new CompositeDisposable(
                source.subscribe(observer),
                other.subscribe(observer.onCompleted.bind(observer), observer.onError.bind(observer), noop)
            );
        });
    };

    function zipArray(second, resultSelector) {
        var first = this;
        return new AnonymousObservable(function (observer) {
            var index = 0, len = second.length;
            return first.subscribe(function (left) {
                if (index < len) {
                    var right = second[index++], result;
                    try {
                        result = resultSelector(left, right);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                    observer.onNext(result);
                } else {
                    observer.onCompleted();
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    }

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever all of the observable sequences or an array have produced an element at a corresponding index.
     * The last element in the arguments must be a function to invoke for each series of elements at corresponding indexes in the sources.
     *
     * @example
     * 1 - res = obs1.zip(obs2, fn);
     * 1 - res = x1.zip([1,2,3], fn);
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
     */
    observableProto.zip = function () {
        if (Array.isArray(arguments[0])) {
            return zipArray.apply(this, arguments);
        }
        var parent = this, sources = slice.call(arguments), resultSelector = sources.pop();
        sources.unshift(parent);
        return new AnonymousObservable(function (observer) {
            var n = sources.length,
              queues = arrayInitialize(n, function () { return []; }),
              isDone = arrayInitialize(n, function () { return false; });

            var next = function (i) {
                var res, queuedValues;
                if (queues.every(function (x) { return x.length > 0; })) {
                    try {
                        queuedValues = queues.map(function (x) { return x.shift(); });
                        res = resultSelector.apply(parent, queuedValues);
                    } catch (ex) {
                        observer.onError(ex);
                        return;
                    }
                    observer.onNext(res);
                } else if (isDone.filter(function (x, j) { return j !== i; }).every(identity)) {
                    observer.onCompleted();
                }
            };

            function done(i) {
                isDone[i] = true;
                if (isDone.every(function (x) { return x; })) {
                    observer.onCompleted();
                }
            }

            var subscriptions = new Array(n);
            for (var idx = 0; idx < n; idx++) {
                (function (i) {
                    subscriptions[i] = new SingleAssignmentDisposable();
                    subscriptions[i].setDisposable(sources[i].subscribe(function (x) {
                        queues[i].push(x);
                        next(i);
                    }, observer.onError.bind(observer), function () {
                        done(i);
                    }));
                })(idx);
            }

            return new CompositeDisposable(subscriptions);
        });
    };

    /**
     * Merges the specified observable sequences into one observable sequence by using the selector function whenever all of the observable sequences have produced an element at a corresponding index.
     *
     * @static
     * @memberOf Observable
     * @param arguments Observable sources.
     * @param {Function} resultSelector Function to invoke for each series of elements at corresponding indexes in the sources.
     * @returns {Observable} An observable sequence containing the result of combining elements of the sources using the specified result selector function.
     */
    Observable.zip = function () {
        var args = slice.call(arguments, 0),
            first = args.shift();
        return first.zip.apply(first, args);
    };

    /**
     * Merges the specified observable sequences into one observable sequence by emitting a list with the elements of the observable sequences at corresponding indexes.
     *
     * @static
     * @memberOf Observable
     * @param arguments Observable sources.
     * @returns {Observable} An observable sequence containing lists of elements at corresponding indexes.
     */
    Observable.zipArray = function () {
        var sources = slice.call(arguments);
        return new AnonymousObservable(function (observer) {
            var n = sources.length,
              queues = arrayInitialize(n, function () { return []; }),
              isDone = arrayInitialize(n, function () { return false; });

            function next(i) {
                if (queues.every(function (x) { return x.length > 0; })) {
                    var res = queues.map(function (x) { return x.shift(); });
                    observer.onNext(res);
                } else if (isDone.filter(function (x, j) { return j !== i; }).every(identity)) {
                    observer.onCompleted();
                    return;
                }
            };

            function done(i) {
                isDone[i] = true;
                if (isDone.every(identity)) {
                    observer.onCompleted();
                    return;
                }
            }

            var subscriptions = new Array(n);
            for (var idx = 0; idx < n; idx++) {
                (function (i) {
                    subscriptions[i] = new SingleAssignmentDisposable();
                    subscriptions[i].setDisposable(sources[i].subscribe(function (x) {
                        queues[i].push(x);
                        next(i);
                    }, observer.onError.bind(observer), function () {
                        done(i);
                    }));
                })(idx);
            }

            var compositeDisposable = new CompositeDisposable(subscriptions);
            compositeDisposable.add(disposableCreate(function () {
                for (var qIdx = 0, qLen = queues.length; qIdx < qLen; qIdx++) {
                    queues[qIdx] = [];
                }
            }));
            return compositeDisposable;
        });
    };


    /**
     *  Hides the identity of an observable sequence.
     *
     * @returns {Observable} An observable sequence that hides the identity of the source sequence.
     */
    observableProto.asObservable = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(observer);
        });
    };

    /**
     *  Projects each element of an observable sequence into zero or more buffers which are produced based on element count information.
     *
     * @example
     *  1 - xs.bufferWithCount(10);
     *  2 - xs.bufferWithCount(10, 1);
     *
     * @memberOf Observable#
     * @param {Number} count Length of each buffer.
     * @param {Number} [skip] Number of elements to skip between creation of consecutive buffers. If not provided, defaults to the count.
     * @returns {Observable} An observable sequence of buffers.
     */
    observableProto.bufferWithCount = function (count, skip) {
        if (skip === undefined) {
            skip = count;
        }
        return this.windowWithCount(count, skip).selectMany(function (x) {
            return x.toArray();
        }).where(function (x) {
            return x.length > 0;
        });
    };

    /**
     *  Dematerializes the explicit notification values of an observable sequence as implicit notifications.
     *
     * @memberOf Observable#
     * @returns {Observable} An observable sequence exhibiting the behavior corresponding to the source sequence's notification values.
     */
    observableProto.dematerialize = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (x) {
                return x.accept(observer);
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Returns an observable sequence that contains only distinct contiguous elements according to the keySelector and the comparer.
     *
     *  1 - var obs = observable.distinctUntilChanged();
     *  2 - var obs = observable.distinctUntilChanged(function (x) { return x.id; });
     *  3 - var obs = observable.distinctUntilChanged(function (x) { return x.id; }, function (x, y) { return x === y; });
     *
     * @memberOf Observable#
     * @param {Function} [keySelector] A function to compute the comparison key for each element. If not provided, it projects the value.
     * @param {Function} [comparer] Equality comparer for computed key values. If not provided, defaults to an equality comparer function.
     * @returns {Observable} An observable sequence only containing the distinct contiguous elements, based on a computed key value, from the source sequence.
     */
    observableProto.distinctUntilChanged = function (keySelector, comparer) {
        var source = this;
        keySelector || (keySelector = identity);
        comparer || (comparer = defaultComparer);
        return new AnonymousObservable(function (observer) {
            var hasCurrentKey = false, currentKey;
            return source.subscribe(function (value) {
                var comparerEquals = false, key;
                try {
                    key = keySelector(value);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                if (hasCurrentKey) {
                    try {
                        comparerEquals = comparer(currentKey, key);
                    } catch (exception) {
                        observer.onError(exception);
                        return;
                    }
                }
                if (!hasCurrentKey || !comparerEquals) {
                    hasCurrentKey = true;
                    currentKey = key;
                    observer.onNext(value);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Invokes an action for each element in the observable sequence and invokes an action upon graceful or exceptional termination of the observable sequence.
     *  This method can be used for debugging, logging, etc. of query behavior by intercepting the message stream to run arbitrary actions for messages on the pipeline.
     *
     * @example
     *  1 - observable.doAction(observer);
     *  2 - observable.doAction(onNext);
     *  3 - observable.doAction(onNext, onError);
     *  4 - observable.doAction(onNext, onError, onCompleted);
     *
     * @memberOf Observable#
     * @param {Mixed} observerOrOnNext Action to invoke for each element in the observable sequence or an observer.
     * @param {Function} [onError]  Action to invoke upon exceptional termination of the observable sequence. Used if only the observerOrOnNext parameter is also a function.
     * @param {Function} [onCompleted]  Action to invoke upon graceful termination of the observable sequence. Used if only the observerOrOnNext parameter is also a function.
     * @returns {Observable} The source sequence with the side-effecting behavior applied.
     */
    observableProto.doAction = function (observerOrOnNext, onError, onCompleted) {
        var source = this, onNextFunc;
        if (typeof observerOrOnNext === 'function') {
            onNextFunc = observerOrOnNext;
        } else {
            onNextFunc = observerOrOnNext.onNext.bind(observerOrOnNext);
            onError = observerOrOnNext.onError.bind(observerOrOnNext);
            onCompleted = observerOrOnNext.onCompleted.bind(observerOrOnNext);
        }
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (x) {
                try {
                    onNextFunc(x);
                } catch (e) {
                    observer.onError(e);
                }
                observer.onNext(x);
            }, function (exception) {
                if (!onError) {
                    observer.onError(exception);
                } else {
                    try {
                        onError(exception);
                    } catch (e) {
                        observer.onError(e);
                    }
                    observer.onError(exception);
                }
            }, function () {
                if (!onCompleted) {
                    observer.onCompleted();
                } else {
                    try {
                        onCompleted();
                    } catch (e) {
                        observer.onError(e);
                    }
                    observer.onCompleted();
                }
            });
        });
    };

    /**
     *  Invokes a specified action after the source observable sequence terminates gracefully or exceptionally.
     *
     * @example
     *  1 - obs = observable.finallyAction(function () { console.log('sequence ended'; });
     *
     * @memberOf Observable#
     * @param {Function} finallyAction Action to invoke after the source observable sequence terminates.
     * @returns {Observable} Source sequence with the action-invoking termination behavior applied.
     */
    observableProto.finallyAction = function (action) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var subscription = source.subscribe(observer);
            return disposableCreate(function () {
                try {
                    subscription.dispose();
                } catch (e) {
                    throw e;
                } finally {
                    action();
                }
            });
        });
    };

    /**
     *  Ignores all elements in an observable sequence leaving only the termination messages.
     *
     * @memberOf Observable#
     * @returns {Observable} An empty observable sequence that signals termination, successful or exceptional, of the source sequence.
     */
    observableProto.ignoreElements = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(noop, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Materializes the implicit notifications of an observable sequence as explicit notification values.
     *
     * @memberOf Observable#
     * @returns {Observable} An observable sequence containing the materialized notification values from the source sequence.
     */
    observableProto.materialize = function () {
        var source = this;
        return new AnonymousObservable(function (observer) {
            return source.subscribe(function (value) {
                observer.onNext(notificationCreateOnNext(value));
            }, function (exception) {
                observer.onNext(notificationCreateOnError(exception));
                observer.onCompleted();
            }, function () {
                observer.onNext(notificationCreateOnCompleted());
                observer.onCompleted();
            });
        });
    };

    /**
     *  Repeats the observable sequence a specified number of times. If the repeat count is not specified, the sequence repeats indefinitely.
     *
     * @example
     *  1 - repeated = source.repeat();
     *  2 - repeated = source.repeat(42);
     *
     * @memberOf Observable#
     * @param {Number} [repeatCount]  Number of times to repeat the sequence. If not provided, repeats the sequence indefinitely.
     * @returns {Observable} The observable sequence producing the elements of the given sequence repeatedly.
     */
    observableProto.repeat = function (repeatCount) {
        return enumerableRepeat(this, repeatCount).concat();
    };

    /**
     *  Repeats the source observable sequence the specified number of times or until it successfully terminates. If the retry count is not specified, it retries indefinitely.
     *
     * @example
     *  1 - retried = retry.repeat();
     *  2 - retried = retry.repeat(42);
     *
     * @memberOf Observable#
     * @param {Number} [retryCount]  Number of times to retry the sequence. If not provided, retry the sequence indefinitely.
     * @returns {Observable} An observable sequence producing the elements of the given sequence repeatedly until it terminates successfully.
     */
    observableProto.retry = function (retryCount) {
        return enumerableRepeat(this, retryCount).catchException();
    };

    /**
     *  Applies an accumulator function over an observable sequence and returns each intermediate result. The optional seed value is used as the initial accumulator value.
     *  For aggregation behavior with no intermediate results, see Observable.aggregate.
     *
     *  1 - scanned = source.scan(function (acc, x) { return acc + x; });
     *  2 - scanned = source.scan(0, function (acc, x) { return acc + x; });
     *
     * @memberOf Observable#
     * @param {Mixed} [seed] The initial accumulator value.
     * @param {Function} accumulator An accumulator function to be invoked on each element.
     * @returns {Observable} An observable sequence containing the accumulated values.
     */
    observableProto.scan = function () {
        var seed, hasSeed = false, accumulator;
        if (arguments.length === 2) {
            seed = arguments[0];
            accumulator = arguments[1];
            hasSeed = true;
        } else {
            accumulator = arguments[0];
        }
        var source = this;
        return observableDefer(function () {
            var hasAccumulation = false, accumulation;
            return source.select(function (x) {
                if (hasAccumulation) {
                    accumulation = accumulator(accumulation, x);
                } else {
                    accumulation = hasSeed ? accumulator(seed, x) : x;
                    hasAccumulation = true;
                }
                return accumulation;
            });
        });
    };

    /**
     *  Bypasses a specified number of elements at the end of an observable sequence.
     *
     * @memberOf Observable#
     * @description
     *  This operator accumulates a queue with a length enough to store the first <paramref name="count"/> elements. As more elements are
     *  received, elements are taken from the front of the queue and produced on the result sequence. This causes elements to be delayed.
     * @param count Number of elements to bypass at the end of the source sequence.
     * @returns {Observable} An observable sequence containing the source sequence elements except for the bypassed ones at the end.
     */
    observableProto.skipLast = function (count) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var q = [];
            return source.subscribe(function (x) {
                q.push(x);
                if (q.length > count) {
                    observer.onNext(q.shift());
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Prepends a sequence of values to an observable sequence with an optional scheduler and an argument list of values to prepend.
     *
     *  1 - source.startWith(1, 2, 3);
     *  2 - source.startWith(Rx.Scheduler.timeout, 1, 2, 3);
     *
     * @memberOf Observable#
     * @returns {Observable} The source sequence prepended with the specified values.
     */
    observableProto.startWith = function () {
        var values, scheduler, start = 0;
        if (!!arguments.length && 'now' in Object(arguments[0])) {
            scheduler = arguments[0];
            start = 1;
        } else {
            scheduler = immediateScheduler;
        }
        values = slice.call(arguments, start);
        return enumerableFor([observableFromArray(values, scheduler), this]).concat();
    };

    /**
     *  Returns a specified number of contiguous elements from the end of an observable sequence, using an optional scheduler to drain the queue.
     *
     * @example
     *  1 - obs = source.takeLast(5);
     *  2 - obs = source.takeLast(5, Rx.Scheduler.timeout);
     *
     * @description
     *  This operator accumulates a buffer with a length enough to store elements count elements. Upon completion of
     *  the source sequence, this buffer is drained on the result sequence. This causes the elements to be delayed.
     *
     * @memberOf Observable#
     * @param {Number} count Number of elements to take from the end of the source sequence.
     * @param {Scheduler} [scheduler] Scheduler used to drain the queue upon completion of the source sequence.
     * @returns {Observable} An observable sequence containing the specified number of elements from the end of the source sequence.
     */
    observableProto.takeLast = function (count, scheduler) {
        return this.takeLastBuffer(count).selectMany(function (xs) { return observableFromArray(xs, scheduler); });
    };

    /**
     *  Returns an array with the specified number of contiguous elements from the end of an observable sequence.
     *
     * @description
     *  This operator accumulates a buffer with a length enough to store count elements. Upon completion of the
     *  source sequence, this buffer is produced on the result sequence.
     *
     * @memberOf Observable#
     * @param {Number} count Number of elements to take from the end of the source sequence.
     * @returns {Observable} An observable sequence containing a single array with the specified number of elements from the end of the source sequence.
     */
    observableProto.takeLastBuffer = function (count) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var q = [];
            return source.subscribe(function (x) {
                q.push(x);
                if (q.length > count) {
                    q.shift();
                }
            }, observer.onError.bind(observer), function () {
                observer.onNext(q);
                observer.onCompleted();
            });
        });
    };

    /**
     *  Projects each element of an observable sequence into zero or more windows which are produced based on element count information.
     *
     *  1 - xs.windowWithCount(10);
     *  2 - xs.windowWithCount(10, 1);
     *
     * @memberOf Observable#
     * @param {Number} count Length of each window.
     * @param {Number} [skip] Number of elements to skip between creation of consecutive windows. If not specified, defaults to the count.
     * @returns {Observable} An observable sequence of windows.
     */
    observableProto.windowWithCount = function (count, skip) {
        var source = this;
        if (count <= 0) {
            throw new Error(argumentOutOfRange);
        }
        if (skip == null) {
            skip = count;
        }
        if (skip <= 0) {
            throw new Error(argumentOutOfRange);
        }
        return new AnonymousObservable(function (observer) {
            var m = new SingleAssignmentDisposable(),
                refCountDisposable = new RefCountDisposable(m),
                n = 0,
                q = [],
                createWindow = function () {
                    var s = new Subject();
                    q.push(s);
                    observer.onNext(addRef(s, refCountDisposable));
                };
            createWindow();
            m.setDisposable(source.subscribe(function (x) {
                var s;
                for (var i = 0, len = q.length; i < len; i++) {
                    q[i].onNext(x);
                }
                var c = n - count + 1;
                if (c >= 0 && c % skip === 0) {
                    s = q.shift();
                    s.onCompleted();
                }
                n++;
                if (n % skip === 0) {
                    createWindow();
                }
            }, function (exception) {
                while (q.length > 0) {
                    q.shift().onError(exception);
                }
                observer.onError(exception);
            }, function () {
                while (q.length > 0) {
                    q.shift().onCompleted();
                }
                observer.onCompleted();
            }));
            return refCountDisposable;
        });
    };

    /**
     *  Returns the elements of the specified sequence or the specified value in a singleton sequence if the sequence is empty.
     *
     *  1 - obs = xs.defaultIfEmpty();
     *  2 - obs = xs.defaultIfEmpty(false);
     *
     * @memberOf Observable#
     * @param defaultValue The value to return if the sequence is empty. If not provided, this defaults to null.
     * @returns {Observable} An observable sequence that contains the specified default value if the source is empty; otherwise, the elements of the source itself.
     */
    observableProto.defaultIfEmpty = function (defaultValue) {
        var source = this;
        if (defaultValue === undefined) {
            defaultValue = null;
        }
        return new AnonymousObservable(function (observer) {
            var found = false;
            return source.subscribe(function (x) {
                found = true;
                observer.onNext(x);
            }, observer.onError.bind(observer), function () {
                if (!found) {
                    observer.onNext(defaultValue);
                }
                observer.onCompleted();
            });
        });
    };

    /**
     *  Returns an observable sequence that contains only distinct elements according to the keySelector and the comparer.
     *  Usage of this operator should be considered carefully due to the maintenance of an internal lookup structure which can grow large.
     *
     * @example
     *  1 - obs = xs.distinct();
     *  2 - obs = xs.distinct(function (x) { return x.id; });
     *  2 - obs = xs.distinct(function (x) { return x.id; }, function (x) { return x.toString(); });
     *
     * @memberOf Observable#
     * @param {Function} [keySelector]  A function to compute the comparison key for each element.
     * @param {Function} [keySerializer]  Used to serialize the given object into a string for object comparison.
     * @returns {Observable} An observable sequence only containing the distinct elements, based on a computed key value, from the source sequence.
     */
   observableProto.distinct = function (keySelector, keySerializer) {
        var source = this;
        keySelector || (keySelector = identity);
        keySerializer || (keySerializer = defaultKeySerializer);
        return new AnonymousObservable(function (observer) {
            var hashSet = {};
            return source.subscribe(function (x) {
                var key, serializedKey, otherKey, hasMatch = false;
                try {
                    key = keySelector(x);
                    serializedKey = keySerializer(key);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                for (otherKey in hashSet) {
                    if (serializedKey === otherKey) {
                        hasMatch = true;
                        break;
                    }
                }
                if (!hasMatch) {
                    hashSet[serializedKey] = null;
                    observer.onNext(x);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Groups the elements of an observable sequence according to a specified key selector function and comparer and selects the resulting elements by using a specified function.
     *
     * @example
     *  1 - observable.groupBy(function (x) { return x.id; });
     *  2 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; });
     *  3 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; }, function (x) { return x.toString(); });
     *
     * @memberOf Observable#
     * @param {Function} keySelector A function to extract the key for each element.
     * @param {Function} [elementSelector]  A function to map each source element to an element in an observable group.
     * @param {Function} [keySerializer]  Used to serialize the given object into a string for object comparison.
     * @returns {Observable} A sequence of observable groups, each of which corresponds to a unique key value, containing all elements that share that same key value.
     */
    observableProto.groupBy = function (keySelector, elementSelector, keySerializer) {
        return this.groupByUntil(keySelector, elementSelector, function () {
            return observableNever();
        }, keySerializer);
    };

    /**
     *  Groups the elements of an observable sequence according to a specified key selector function.
     *  A duration selector function is used to control the lifetime of groups. When a group expires, it receives an OnCompleted notification. When a new element with the same
     *  key value as a reclaimed group occurs, the group will be reborn with a new lifetime request.
     *
     * @example
     *  1 - observable.groupByUntil(function (x) { return x.id; }, null,  function () { return Rx.Observable.never(); });
     *  2 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; },  function () { return Rx.Observable.never(); });
     *  3 - observable.groupBy(function (x) { return x.id; }), function (x) { return x.name; },  function () { return Rx.Observable.never(); }, function (x) { return x.toString(); });
     *
     * @memberOf Observable#
     * @param {Function} keySelector A function to extract the key for each element.
     * @param {Function} durationSelector A function to signal the expiration of a group.
     * @param {Function} [keySerializer]  Used to serialize the given object into a string for object comparison.
     * @returns {Observable}
     *  A sequence of observable groups, each of which corresponds to a unique key value, containing all elements that share that same key value.
     *  If a group's lifetime expires, a new group with the same key value can be created once an element with such a key value is encoutered.
     *
     */
    observableProto.groupByUntil = function (keySelector, elementSelector, durationSelector, keySerializer) {
        var source = this;
        elementSelector || (elementSelector = identity);
        keySerializer || (keySerializer = defaultKeySerializer);
        return new AnonymousObservable(function (observer) {
            var map = {},
                groupDisposable = new CompositeDisposable(),
                refCountDisposable = new RefCountDisposable(groupDisposable);
            groupDisposable.add(source.subscribe(function (x) {
                var duration, durationGroup, element, fireNewMapEntry, group, key, serializedKey, md, writer, w;
                try {
                    key = keySelector(x);
                    serializedKey = keySerializer(key);
                } catch (e) {
                    for (w in map) {
                        map[w].onError(e);
                    }
                    observer.onError(e);
                    return;
                }
                fireNewMapEntry = false;
                try {
                    writer = map[serializedKey];
                    if (!writer) {
                        writer = new Subject();
                        map[serializedKey] = writer;
                        fireNewMapEntry = true;
                    }
                } catch (e) {
                    for (w in map) {
                        map[w].onError(e);
                    }
                    observer.onError(e);
                    return;
                }
                if (fireNewMapEntry) {
                    group = new GroupedObservable(key, writer, refCountDisposable);
                    durationGroup = new GroupedObservable(key, writer);
                    try {
                        duration = durationSelector(durationGroup);
                    } catch (e) {
                        for (w in map) {
                            map[w].onError(e);
                        }
                        observer.onError(e);
                        return;
                    }
                    observer.onNext(group);
                    md = new SingleAssignmentDisposable();
                    groupDisposable.add(md);
                    var expire = function  () {
                        if (serializedKey in map) {
                            delete map[serializedKey];
                            writer.onCompleted();
                        }
                        groupDisposable.remove(md);
                    };
                    md.setDisposable(duration.take(1).subscribe(noop, function (exn) {
                        for (w in map) {
                            map[w].onError(exn);
                        }
                        observer.onError(exn);
                    }, function () {
                        expire();
                    }));
                }
                try {
                    element = elementSelector(x);
                } catch (e) {
                    for (w in map) {
                        map[w].onError(e);
                    }
                    observer.onError(e);
                    return;
                }
                writer.onNext(element);
            }, function (ex) {
                for (var w in map) {
                    map[w].onError(ex);
                }
                observer.onError(ex);
            }, function () {
                for (var w in map) {
                    map[w].onCompleted();
                }
                observer.onCompleted();
            }));
            return refCountDisposable;
        });
    };

    /**
     *  Projects each element of an observable sequence into a new form by incorporating the element's index.
     *
     * @example
     *  source.select(function (value, index) { return value * value + index; });
     *
     * @memberOf Observable#
     * @param {Function} selector A transform function to apply to each source element; the second parameter of the function represents the index of the source element.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Observable} An observable sequence whose elements are the result of invoking the transform function on each element of source.
     */
    observableProto.select = function (selector, thisArg) {
        var parent = this;
        return new AnonymousObservable(function (observer) {
            var count = 0;
            return parent.subscribe(function (value) {
                var result;
                try {
                    result = selector.call(thisArg, value, count++, parent);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                observer.onNext(result);
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    observableProto.map = observableProto.select;

    function selectMany(selector) {
        return this.select(selector).mergeObservable();
    }

    /**
     *  One of the Following:
     *  Projects each element of an observable sequence to an observable sequence and merges the resulting observable sequences into one observable sequence.
     *
     * @example
     *  1 - source.selectMany(function (x) { return Rx.Observable.range(0, x); });
     *  Or:
     *  Projects each element of an observable sequence to an observable sequence, invokes the result selector for the source element and each of the corresponding inner sequence's elements, and merges the results into one observable sequence.
     *
     *  1 - source.selectMany(function (x) { return Rx.Observable.range(0, x); }, function (x, y) { return x + y; });
     *  Or:
     *  Projects each element of the source observable sequence to the other observable sequence and merges the resulting observable sequences into one observable sequence.
     *
     *  1 - source.selectMany(Rx.Observable.fromArray([1,2,3]));
     *
     * @memberOf Observable#
     * @param selector A transform function to apply to each element or an observable sequence to project each element from the source sequence onto.
     * @param {Function} [resultSelector]  A transform function to apply to each element of the intermediate sequence.
     * @returns {Observable} An observable sequence whose elements are the result of invoking the one-to-many transform function collectionSelector on each element of the input sequence and then mapping each of those sequence elements and their corresponding source element to a result element.
     */
    observableProto.selectMany = observableProto.flatMap = function (selector, resultSelector) {
        if (resultSelector) {
            return this.selectMany(function (x) {
                return selector(x).select(function (y) {
                    return resultSelector(x, y);
                });
            });
        }
        if (typeof selector === 'function') {
            return selectMany.call(this, selector);
        }
        return selectMany.call(this, function () {
            return selector;
        });
    };

    /**
     *  Bypasses a specified number of elements in an observable sequence and then returns the remaining elements.
     *
     * @memberOf Observable#
     * @param {Number} count The number of elements to skip before returning the remaining elements.
     * @returns {Observable} An observable sequence that contains the elements that occur after the specified index in the input sequence.
     */
    observableProto.skip = function (count) {
        if (count < 0) {
            throw new Error(argumentOutOfRange);
        }
        var observable = this;
        return new AnonymousObservable(function (observer) {
            var remaining = count;
            return observable.subscribe(function (x) {
                if (remaining <= 0) {
                    observer.onNext(x);
                } else {
                    remaining--;
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Bypasses elements in an observable sequence as long as a specified condition is true and then returns the remaining elements.
     *  The element's index is used in the logic of the predicate function.
     *
     *  1 - source.skipWhile(function (value) { return value < 10; });
     *  1 - source.skipWhile(function (value, index) { return value < 10 || index < 10; });
     *
     * @memberOf Observable#
     * @param {Function} predicate A function to test each element for a condition; the second parameter of the function represents the index of the source element.
     * @returns {Observable} An observable sequence that contains the elements from the input sequence starting at the first element in the linear series that does not pass the test specified by predicate.
     */
    observableProto.skipWhile = function (predicate) {
        var source = this;
        return new AnonymousObservable(function (observer) {
            var i = 0, running = false;
            return source.subscribe(function (x) {
                if (!running) {
                    try {
                        running = !predicate(x, i++);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                }
                if (running) {
                    observer.onNext(x);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Returns a specified number of contiguous elements from the start of an observable sequence, using the specified scheduler for the edge case of take(0).
     *
     *  1 - source.take(5);
     *  2 - source.take(0, Rx.Scheduler.timeout);
     *
     * @memberOf Observable#
     * @param {Number} count The number of elements to return.
     * @param {Scheduler} [scheduler] Scheduler used to produce an OnCompleted message in case <paramref name="count count</paramref> is set to 0.
     * @returns {Observable} An observable sequence that contains the specified number of elements from the start of the input sequence.
     */
    observableProto.take = function (count, scheduler) {
        if (count < 0) {
            throw new Error(argumentOutOfRange);
        }
        if (count === 0) {
            return observableEmpty(scheduler);
        }
        var observable = this;
        return new AnonymousObservable(function (observer) {
            var remaining = count;
            return observable.subscribe(function (x) {
                if (remaining > 0) {
                    remaining--;
                    observer.onNext(x);
                    if (remaining === 0) {
                        observer.onCompleted();
                    }
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Returns elements from an observable sequence as long as a specified condition is true.
     *  The element's index is used in the logic of the predicate function.
     *
     * @example
     *  1 - source.takeWhile(function (value) { return value < 10; });
     *  1 - source.takeWhile(function (value, index) { return value < 10 || index < 10; });
     *
     * @memberOf Observable#
     * @param {Function} predicate A function to test each element for a condition; the second parameter of the function represents the index of the source element.
     * @returns {Observable} An observable sequence that contains the elements from the input sequence that occur before the element at which the test no longer passes.
     */
    observableProto.takeWhile = function (predicate) {
        var observable = this;
        return new AnonymousObservable(function (observer) {
            var i = 0, running = true;
            return observable.subscribe(function (x) {
                if (running) {
                    try {
                        running = predicate(x, i++);
                    } catch (e) {
                        observer.onError(e);
                        return;
                    }
                    if (running) {
                        observer.onNext(x);
                    } else {
                        observer.onCompleted();
                    }
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    /**
     *  Filters the elements of an observable sequence based on a predicate by incorporating the element's index.
     *
     * @example
     *  1 - source.where(function (value) { return value < 10; });
     *  1 - source.where(function (value, index) { return value < 10 || index < 10; });
     *
     * @memberOf Observable#
     * @param {Function} predicate A function to test each source element for a condition; the second parameter of the function represents the index of the source element.
     * @param {Any} [thisArg] Object to use as this when executing callback.
     * @returns {Observable} An observable sequence that contains elements from the input sequence that satisfy the condition.
     */
    observableProto.where = function (predicate, thisArg) {
        var parent = this;
        return new AnonymousObservable(function (observer) {
            var count = 0;
            return parent.subscribe(function (value) {
                var shouldRun;
                try {
                    shouldRun = predicate.call(thisArg, value, count++, parent);
                } catch (exception) {
                    observer.onError(exception);
                    return;
                }
                if (shouldRun) {
                    observer.onNext(value);
                }
            }, observer.onError.bind(observer), observer.onCompleted.bind(observer));
        });
    };

    observableProto.filter = observableProto.where;
    /** @private */
    var AnonymousObservable = Rx.Internals.AnonymousObservable = (function (_super) {
        inherits(AnonymousObservable, _super);

        /**
         * @private
         * @constructor
         */
        function AnonymousObservable(subscribe) {
            if (!(this instanceof AnonymousObservable)) {
                return new AnonymousObservable(subscribe);
            }

            function s(observer) {
                var autoDetachObserver = new AutoDetachObserver(observer);
                if (currentThreadScheduler.scheduleRequired()) {
                    currentThreadScheduler.schedule(function () {
                        try {
                            autoDetachObserver.disposable(subscribe(autoDetachObserver));
                        } catch (e) {
                            if (!autoDetachObserver.fail(e)) {
                                throw e;
                            }
                        }
                    });
                } else {
                    try {
                        autoDetachObserver.disposable(subscribe(autoDetachObserver));
                    } catch (e) {
                        if (!autoDetachObserver.fail(e)) {
                            throw e;
                        }
                    }
                }

                return autoDetachObserver;
            }

            _super.call(this, s);
        }

        return AnonymousObservable;

    }(Observable));

    /** @private */
    var AutoDetachObserver = (function (_super) {
        inherits(AutoDetachObserver, _super);

        /**
         * @private
         * @constructor
         */
        function AutoDetachObserver(observer) {
            _super.call(this);
            this.observer = observer;
            this.m = new SingleAssignmentDisposable();
        }

        var AutoDetachObserverPrototype = AutoDetachObserver.prototype;

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.next = function (value) {
            var noError = false;
            try {
                this.observer.onNext(value);
                noError = true;
            } catch (e) {
                throw e;
            } finally {
                if (!noError) {
                    this.dispose();
                }
            }
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.error = function (exn) {
            try {
                this.observer.onError(exn);
            } catch (e) {
                throw e;
            } finally {
                this.dispose();
            }
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.completed = function () {
            try {
                this.observer.onCompleted();
            } catch (e) {
                throw e;
            } finally {
                this.dispose();
            }
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.disposable = function (value) {
            return this.m.disposable(value);
        };

        /**
         * @private
         * @memberOf AutoDetachObserver#
         */
        AutoDetachObserverPrototype.dispose = function () {
            _super.prototype.dispose.call(this);
            this.m.dispose();
        };

        return AutoDetachObserver;
    }(AbstractObserver));

    /** @private */
    var GroupedObservable = (function (_super) {
        inherits(GroupedObservable, _super);

        function subscribe(observer) {
            return this.underlyingObservable.subscribe(observer);
        }

        /**
         * @constructor
         * @private
         */
        function GroupedObservable(key, underlyingObservable, mergedDisposable) {
            _super.call(this, subscribe);
            this.key = key;
            this.underlyingObservable = !mergedDisposable ?
                underlyingObservable :
                new AnonymousObservable(function (observer) {
                    return new CompositeDisposable(mergedDisposable.getDisposable(), underlyingObservable.subscribe(observer));
                });
        }

        return GroupedObservable;
    }(Observable));

    /** @private */
    var InnerSubscription = function (subject, observer) {
        this.subject = subject;
        this.observer = observer;
    };

    /**
     * @private
     * @memberOf InnerSubscription
     */
    InnerSubscription.prototype.dispose = function () {
        if (!this.subject.isDisposed && this.observer !== null) {
            var idx = this.subject.observers.indexOf(this.observer);
            this.subject.observers.splice(idx, 1);
            this.observer = null;
        }
    };

    /**
     *  Represents an object that is both an observable sequence as well as an observer.
     *  Each notification is broadcasted to all subscribed observers.
     */
    var Subject = Rx.Subject = (function (_super) {
        function subscribe(observer) {
            checkDisposed.call(this);
            if (!this.isStopped) {
                this.observers.push(observer);
                return new InnerSubscription(this, observer);
            }
            if (this.exception) {
                observer.onError(this.exception);
                return disposableEmpty;
            }
            observer.onCompleted();
            return disposableEmpty;
        }

        inherits(Subject, _super);

        /**
         * Creates a subject.
         *
         * @constructor
         */
        function Subject() {
            _super.call(this, subscribe);
            this.isDisposed = false,
            this.isStopped = false,
            this.observers = [];
        }

        addProperties(Subject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             *
             * @memberOf ReplaySubject#
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */
            hasObservers: function () {
                return this.observers.length > 0;
            },
            /**
             * Notifies all subscribed observers about the end of the sequence.
             *
             * @memberOf ReplaySubject#
             */
            onCompleted: function () {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onCompleted();
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             *
             * @memberOf ReplaySubject#
             * @param {Mixed} error The exception to send to all observers.
             */
            onError: function (exception) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    this.exception = exception;
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onError(exception);
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the arrival of the specified element in the sequence.
             *
             * @memberOf ReplaySubject#
             * @param {Mixed} value The value to send to all observers.
             */
            onNext: function (value) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onNext(value);
                    }
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             *
             * @memberOf ReplaySubject#
             */
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
            }
        });

        /**
         * Creates a subject from the specified observer and observable.
         *
         * @static
         * @memberOf Subject
         * @param {Observer} observer The observer used to send messages to the subject.
         * @param {Observable} observable The observable used to subscribe to messages sent from the subject.
         * @returns {Subject} Subject implemented using the given observer and observable.
         */
        Subject.create = function (observer, observable) {
            return new AnonymousSubject(observer, observable);
        };

        return Subject;
    }(Observable));

    /**
     *  Represents the result of an asynchronous operation.
     *  The last value before the OnCompleted notification, or the error received through OnError, is sent to all subscribed observers.
     */
    var AsyncSubject = Rx.AsyncSubject = (function (_super) {

        function subscribe(observer) {
            checkDisposed.call(this);
            if (!this.isStopped) {
                this.observers.push(observer);
                return new InnerSubscription(this, observer);
            }
            var ex = this.exception;
            var hv = this.hasValue;
            var v = this.value;
            if (ex) {
                observer.onError(ex);
            } else if (hv) {
                observer.onNext(v);
                observer.onCompleted();
            } else {
                observer.onCompleted();
            }
            return disposableEmpty;
        }

        inherits(AsyncSubject, _super);

        /**
         * Creates a subject that can only receive one value and that value is cached for all future observations.
         *
         * @constructor
         */
        function AsyncSubject() {
            _super.call(this, subscribe);

            this.isDisposed = false,
            this.isStopped = false,
            this.value = null,
            this.hasValue = false,
            this.observers = [],
            this.exception = null;
        }

        addProperties(AsyncSubject.prototype, Observer, {
            /**
             * Indicates whether the subject has observers subscribed to it.
             *
             * @memberOf AsyncSubject#
             * @returns {Boolean} Indicates whether the subject has observers subscribed to it.
             */
            hasObservers: function () {
                return this.observers.length > 0;
            },
            /**
             * Notifies all subscribed observers about the end of the sequence, also causing the last received value to be sent out (if any).
             *
             * @memberOf AsyncSubject#
             */
            onCompleted: function () {
                var o, i, len;
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    var v = this.value;
                    var hv = this.hasValue;

                    if (hv) {
                        for (i = 0, len = os.length; i < len; i++) {
                            o = os[i];
                            o.onNext(v);
                            o.onCompleted();
                        }
                    } else {
                        for (i = 0, len = os.length; i < len; i++) {
                            os[i].onCompleted();
                        }
                    }

                    this.observers = [];
                }
            },
            /**
             * Notifies all subscribed observers about the exception.
             *
             * @memberOf AsyncSubject#
             * @param {Mixed} error The exception to send to all observers.
             */
            onError: function (exception) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    var os = this.observers.slice(0);
                    this.isStopped = true;
                    this.exception = exception;

                    for (var i = 0, len = os.length; i < len; i++) {
                        os[i].onError(exception);
                    }

                    this.observers = [];
                }
            },
            /**
             * Sends a value to the subject. The last value received before successful termination will be sent to all subscribed and future observers.
             *
             * @memberOf AsyncSubject#
             * @param {Mixed} value The value to store in the subject.
             */
            onNext: function (value) {
                checkDisposed.call(this);
                if (!this.isStopped) {
                    this.value = value;
                    this.hasValue = true;
                }
            },
            /**
             * Unsubscribe all observers and release resources.
             *
             * @memberOf AsyncSubject#
             */
            dispose: function () {
                this.isDisposed = true;
                this.observers = null;
                this.exception = null;
                this.value = null;
            }
        });

        return AsyncSubject;
    }(Observable));

    /** @private */
    var AnonymousSubject = (function (_super) {
        inherits(AnonymousSubject, _super);

        function subscribe(observer) {
            return this.observable.subscribe(observer);
        }

        /**
         * @private
         * @constructor
         */
        function AnonymousSubject(observer, observable) {
            _super.call(this, subscribe);
            this.observer = observer;
            this.observable = observable;
        }

        addProperties(AnonymousSubject.prototype, Observer, {
            /**
             * @private
             * @memberOf AnonymousSubject#
            */
            onCompleted: function () {
                this.observer.onCompleted();
            },
            /**
             * @private
             * @memberOf AnonymousSubject#
            */
            onError: function (exception) {
                this.observer.onError(exception);
            },
            /**
             * @private
             * @memberOf AnonymousSubject#
            */
            onNext: function (value) {
                this.observer.onNext(value);
            }
        });

        return AnonymousSubject;
    }(Observable));

    // Check for AMD
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        window.Rx = Rx;
        return define(function () {
            return Rx;
        });
    } else if (freeExports) {
        if (typeof module == 'object' && module && module.exports == freeExports) {
            module.exports = Rx;
        } else {
            freeExports = Rx;
        }
    } else {
        window.Rx = Rx;
    }
}(this));
},{}],"FuzzyUtil":[function(require,module,exports){
module.exports=require('A2weKb');
},{}],"A2weKb":[function(require,module,exports){
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
},{"lodash":"fYW/7L"}],"NeuralNetwork":[function(require,module,exports){
module.exports=require('FF39dm');
},{}],"FF39dm":[function(require,module,exports){
var _ = require('lodash');
var Neuron = require('./lib/Neuron');
var NetworkMath = require('./lib/NetworkMath');
var NetworkStates = require('./lib/NetworkStates');


/**
 * Creates a new neural network.  The configuration can contain any of the defined
 * properties within the constructor.
 *
 * @param {{
 *     eta: Number,
 *     hiddenLayerCount: Number,
 *     outputCount: Number,
 *     hiddenLayerNeuronCount: Number,
 *     alpha: Number,
 *     momentum: Boolean,
 *     activationFunction: Function
 * }} configuration  The configuration has the following parameters,
 *      eta: should be between 0 - 1.
 *      alpha: should be between 0 - 1.  Momentum coefficient
 *      momentum: boolean (alpha * previous delta weight)
 *      hiddenLayerNeuronCount: the amount of neurons in the hidden layers
 *      outputCount: the amount of outputs
 *      hiddenLayerCount: the amount of hidden layers
 *      activationFunction: A phi function.  Used in post processing of outputs of neurons.  This uses the logisticFunction training fn
 * @constructor
 */
var NeuralNetwork = function(configuration) {

    // Adjustable parameters
    this.hiddenLayerCount = 0;
    this.outputCount = 1;
    this.hiddenLayerNeuronCount = 5;
    this.inputLayerCount = 2;

    // Between 0 - 1
    this.eta = 0.00001;
    this.alpha = 0.5;
    this.momentum = false;
    this.newLine = '<br/>';
    this.outputActivationFn = NetworkMath.Types.Linear;
    this.hiddenActivationFn = NetworkMath.Types.Sigmoid;
    this.runOutputWeightChangeFirst = false;
    this.runBackpropUntilErrorMarginMet = true;
    this.useBiasInput = true;
    this.errorTolerance = 0.01;

    // for case of 0
    this.errorMin = 0.5;

    /**
     * @type {NetworkStates}
     */
    this.state = NetworkStates.Finished;

    /**
     * @type {Number[]}
     */
    this.inputs = null;

    /**
     * @type {Number[]}
     */
    this.expectedOutputs = null;

    /**
     * @type {Neuron[]}
     * @private
     */
    this._inputs = [];
    /**
     * @type {Neuron[]}
     * @private
     */
    this._outputs = [];
    /**
     * @type {Array.<Neuron[]>}
     */
    this._layers = [];

    /**
     * The mean squared error.
     */
    this._mse = 0;

    /**
     * Training count
     */
    this._trainingCount = 0;

    /**
     * Contains the previous MSE.  Only contains 4 at a time and checks for convergance.
     * @type {Number[]}
     * @private
     */
    this._previousMSE = [];

    /**
     * The amount of MSE's that have to be the same.
     * @type {Number}
     * @private
     */
    this._converganceRequireCount = 4;

    /**
     * the total time spent training
     * @type {number}
     * @private
     */
    this._timeSpentTraining = 0;

    _.assign(this, configuration);
    this._initialize();
};

/**
 * The set of helper functions
 * @type {{}}
 */
NeuralNetwork.prototype = {
    /**
     * The name of the network
     */
    name: 'mlp',

    /**
     * Runs once through the training cycle.
     * @param inputs
     * @param expectedOutputs
     */
    train: function(inputs, expectedOutputs) {

        this.state = NetworkStates.SetInputs;
        this.inputs = inputs;
        this.expectedOutputs = expectedOutputs;

        // Starts the state transfering
        this._stateTransfer(true);
    },

    /**
     * Trains the network interactively
     * @param inputs
     * @param expectedOutputs
     */
    stepTrain: function(inputs, expectedOutputs) {

        var self = this;
        this.state = NetworkStates.SetInputs;
        this.inputs = inputs;
        this.expectedOutputs = expectedOutputs;
        this.clearError();

        return function() {
            self._stateTransfer();
        }
    },

    /**
     * Gets the serialized version of the network
     */
    serialize: function() {
        var serialize = [
            this.state,
            this.expectedOutputs
        ];
        for (var i = 0; i < this._layers.length; i++) {
            var layer = this._layers[i];
            var l = {
                neurons: []
            };

            for (var j = 0; j < layer.length; j++) {
                l.neurons.push(layer[j]);
            }

            serialize.push(l);
        }

        return serialize;
    },

    /**
     * Tests the inputs and returns the outputs
     * @param {Number[]} inputs
     * @returns {Number[]}
     */
    test: function(inputs) {
        this._setInputs(inputs);
        this._feedForward();

        return this.getOutput();
    },

    /**
     * Gets the basic stats of the neural network
     * @returns {Array}
     */
    getStats: function() {
        return [this._timeSpentTraining, this._trainingCount];
    },

    /**
     * If the neural net "thinks" its converged
     * @returns {Boolean}
     */
    isConverged: function() {
        if (this._previousMSE.length !== this._converganceRequireCount) {
            return false;
        }
        for (var i = 0; i < this._converganceRequireCount - 1; i++) {
            if (this._previousMSE[i] !== this._previousMSE[i + 1]) {
                return false;
            }
        }

        return true;
    },

    /**
     * Prints out current state.
     */
    toString: function() {
        var str = 'Training: ' + this._trainingCount + ' :: Time: ' + this._timeSpentTraining + this.newLine;
        for (var i = 0; i < this._layers.length; i++) {
            var layer = this._layers[i];
            for (var j = 0; j < layer.length; j++) {
                str += layer[j].toString() + this.newLine;
            }
        }
        str += 'MSE: ' + this._mse + this.newLine;

        return str;
    },

    /**
     * Gets the current output of the network.
     * @private
     */
    getOutput: function() {
        var out = [];
        for (var i = 0; i < this._outputs.length; i++) {
            var output = this._outputs[i].output;
            out.push(Math.round(output * 10000) / 10000);
        }

        return out;
    },

    /**
     * Gets the error of the network
     * @returns {Array}
     */
    getError: function() {
        var out = [];
        for (var i = 0; i < this._outputs.length; i++) {
            out.push(this._outputs[i].error);
        }

        return out;
    },

    /**
     * Clears all error from the board
     * @private
     */
    clearError: function() {
        for (var i = 0; i < this._layers.length; i++) {
            var neurons = this._layers[i];

            for (var j = 0; j < neurons.length; j++) {
                neurons[j].error = 0;
            }
        }
    },

    /**
     * Reset the weights of the network.
     */
    reset: function() {

        // input layer does not have any weights.
        for (var i = 1; i < this._layers.length; i++) {
            var neurons = this._layers[i];

            for (var j = 0; j < neurons.length; j++) {
                var c = neurons[j];

                for (var k = 0; k < c.w.length; k++) {
                    c.w[k] = this._randomWeight(0.4, true);
                    c.deltaW[k] = 0;
                }

                c.error = 0;
            }
        }

        this._mse = 0;
    },

    /**
     * allowable error tolerance
     * @param {Number[]} expectedOutput
     */
    _continueBackprop: function(expectedOutput) {
        var err = Math.abs(this.getError()[0]);
        var exp = Math.abs(expectedOutput[0]);

        return exp * this.errorTolerance < err &&
            err > this.errorMin;
    },

    /**
     * Adds an mse to the previous mse list
     * @param {Number} mse
     * @private
     */
    _addMSE: function(mse) {
        if (this._previousMSE.length === this._converganceRequireCount) {
            this._previousMSE.shift();
        }
        this._previousMSE.push(mse);
    },

    /**
     * The state transfer for the neural net
     * @param {Boolean} [runUntilFinished]
     * @private
     */
    _stateTransfer: function(runUntilFinished) {

        do {
            switch (this.state) {
                case NetworkStates.SetInputs:
                    this._setInputs(this.inputs);
                    this.state = NetworkStates.FeedForward;
                    break;
                case NetworkStates.FeedForward:
                    this._feedForward();
                    this.state = NetworkStates.BackPropOutput;
                    break;
                case NetworkStates.BackPropOutput:
                    this._backpropErrorOutput(this.expectedOutputs);
                    if (this.runOutputWeightChangeFirst) {
                        this.state = NetworkStates.WeightCalcOutput;
                    } else {
                        this.state = NetworkStates.BackPropHidden;
                    }
                    break;
                case NetworkStates.BackPropHidden:
                    this._backpropErrorHidden();
                    if (this.runOutputWeightChangeFirst) {
                        this.state = NetworkStates.WeightCalcHidden;
                    } else {
                        this.state = NetworkStates.WeightCalcOutput;
                    }
                    break;
                case NetworkStates.WeightCalcOutput:
                    this._adjustOutputWeights();
                    if (this.runOutputWeightChangeFirst) {
                        this.state = NetworkStates.BackPropHidden;
                    } else {
                        this.state = NetworkStates.WeightCalcHidden;
                    }
                    break;
                case NetworkStates.WeightCalcHidden:
                    this._adjustHiddenWeights();
                    this.state = NetworkStates.Finished;
                    break;
            }
        } while (runUntilFinished && this.state !== NetworkStates.Finished);
    },


    /**
     * Initializes the neural function
     * @private
     */
    _initialize: function() {
        // We keep a reference to inputs.  For simplicity's sake
        var inputs = this._inputs;
        var length = this.hiddenLayerNeuronCount + 1;
        var i = 0;

        this._layers.push(inputs);

        // Builds the inputs
        var l = this.inputLayerCount + 1;
        for (i = 0; i < l; i++) {
            if (i + 1 === l) {
                if (this.useBiasInput) {
                    var n = Neuron('Input: Bias');
                    n.bias = true;
                    inputs.push(n);
                }
            } else {
                inputs.push(Neuron('Input: ' + i));
            }
        }

        // Builds the hidden _layers
        for (i = 0; i < this.hiddenLayerCount; i++) {
            var hiddenLayer = [];
            var lastLayer = i + 1 === this.hiddenLayerCount;
            this._layers.push(hiddenLayer);
            for (var j = 0; j < length; j++) {
                var biasNode = j + 1 === length;
                if (biasNode && !lastLayer) {
                    var n = this._createNeuron('Hidden(' + i + '): Bias', this.hiddenActivationFn);
                    n.bias = true;
                    hiddenLayer.push(n);
                } else if (!biasNode) {
                    hiddenLayer.push(this._createNeuron('Hidden(' + i + '): ' + j, this.hiddenActivationFn));
                }
            }
        }

        // Builds the output
        var outputs = this._outputs;
        this._layers.push(outputs);
        for (i = 0; i < this.outputCount; i++) {
            outputs.push(this._createNeuron('Output(' + i + '): ', this.outputActivationFn));
        }

        // Randomly sets weights between -2.5 to 2.5
        var len;
        for (i = 1, len = this._layers.length; i < len; i++) {
            var layer = this._layers[i];
            var prevLayer = this._layers[i - 1];

            for (j = 0; j < layer.length; j++) {
                var neuron = layer[j];
                for (var k = 0; k < prevLayer.length; k++) {

                    // Pushes a random weight onto the stack for each previous layer
                    neuron.w.push(this._randomWeight(0.4, true));
                    neuron.deltaW.push(0);
                }
            }
        }
    },

    /**
     * Creates a neuron with the proper type of activation function
     * @param {String} id
     * @param {NetworkMath.Types} actFnType
     * @returns {Neuron}
     * @private
     */
    _createNeuron: function(id, actFnType) {
        var n = Neuron(id);
        n.activationFn = NetworkMath.activationFunction(actFnType);
        n.dActivationFn = NetworkMath.dActivationFunction(actFnType);
        return n;
    },

    /**
     * generates a random weight within -size to size
     * @returns {number}
     * @private
     */
    _randomWeight: function(size, negative) {
        var r = Math.random();
        var n = (negative && Math.floor(r * 100) % 2 === 0 ? -1 : 1);
        var value = Math.floor(r * size * 10) / 10 * n;

        // do not accept random 0 values
        return value || 0.1 * n;
    },

    /**
     * Sets the inputs.
     * @param {Array.<Number>} inputs
     * @private
     */
    _setInputs: function(inputs) {
        // Set the input layer
        var mod = this.useBiasInput ? 1 : 0;
        for (var i = 0; i < this._inputs.length - mod; i++) {
            this._inputs[i].input = inputs[i];
            this._inputs[i].output = inputs[i];
        }

        if (this.useBiasInput) {
            // bias calculation
            this._inputs[this._inputs.length - 1].output = 1;
            this._inputs[this._inputs.length - 1].input = 1;
        }
    },

    /**
     * Feeds the network the changes starting from inputs
     * @private
     */
    _feedForward: function() {
        var curr = null, prev = null, cN = 0, pN = 0, cLen = 0, pLen = 0;

        // Goes through all hidden layers
        for (var i = 1; i < this._layers.length - 1; i++) {
            curr = this._layers[i];
            prev = this._layers[i - 1];

            for (cN = 0, cLen = curr.length; cN < cLen; cN++) {

                // Bias node calculation
                if (curr[cN].bias) {
                    curr[cN].output = 1;
                    curr[cN].input = 1;
                    continue;
                }

                var c = curr[cN];
                var sum = this._sumInputs(prev, c);

                c.input = sum;
                c.output = c.activationFn(sum);
            }
        }

        var outs = this._outputs;
        prev = this._layers[this._layers.length - 2];
        for (var oN = 0, oLen = outs.length; oN < oLen; oN++) {
            var o = outs[oN];
            var sum = this._sumInputs(prev, o);

            /// TODO: Does output need activation function?
            o.input = sum;
            o.output = o.activationFn(sum);
        }
    },

    /**
     *
     * @param {Number[]} targetOutputs
     * @private
     */
    _backpropErrorOutput: function(targetOutputs) {

        // Output layer
        for (var i = 0; i < this._outputs.length; i++) {
            var o = this._outputs[i];
            var out = o.output;
            var err = (targetOutputs[i] - out);
            o.error = o.dActivationFn(o.output) * err;
            this._mse += o.error * o.error;
        }

    },

    /**
     * Goes through and calculates the error starting with the output
     * nodes to the input nodes.
     *
     * @param {Number[]} targetOutputs
     * @private
     */
    _backpropErrorHidden: function() {

        // Go through hidden layers
        for (var cIdx = this._layers.length - 2; cIdx > 0; cIdx--) {
            var curr = this._layers[cIdx];
            var next = this._layers[cIdx + 1];

            // Go through hidden neurons
            for (var hN = 0, hLen = curr.length; hN < hLen; hN++) {
                var h = curr[hN];
                if (h.bias) {
                    continue;
                }

                var sum = 0;
                for (var nN = 0, nLen = next.length; nN < nLen; nN++) {
                    var n = next[nN];
                    if (n.bias) {
                        continue;
                    }

                    sum += n.w[hN] * n.error;
                }
                h.error = sum * h.dActivationFn(h.output);
            }
        }

    },

    /**
     * Adjusts the output weights
     * @private
     */
    _adjustOutputWeights: function() {

        var outputs = this._outputs;
        var prev = this._layers[this._layers.length - 2];

        // for every neuron
        for (var oN = 0, oLen = outputs.length; oN < oLen; oN++) {
            var o = outputs[oN];
            if (o.bias) {
                continue;
            }

            // for every past neuron
            for (var pN = 0, pLen = prev.length; pN < pLen; pN++) {

                var p = prev[pN];
                var d = this._weightDeltaCalc(o, p);

                if (this.momentum) {
                    o.deltaW[pN] = (1 - this.alpha) * d + o.deltaW[pN] * this.alpha;
                } else {
                    o.deltaW[pN] = d;
                }

                o.w[pN] += o.deltaW[pN];
            }
        }
    },

    /**
     * Adjusts the weights of the network.
     * @private
     */
    _adjustHiddenWeights: function() {

        // For every layer
        for (var cL = this._layers.length - 2; cL > 0; cL--) {
            var curr = this._layers[cL];
            var prev = this._layers[cL - 1];

            // for every neuron
            for (var cN = 0, cLen = curr.length; cN < cLen; cN++) {
                var c = curr[cN];
                if (c.bias) {
                    continue;
                }

                // for every past neuron
                for (var pN = 0, pLen = prev.length; pN < pLen; pN++) {

                    var p = prev[pN];
                    var d = this._weightDeltaCalc(c, p);

                    if (this.momentum) {
                        c.deltaW[pN] = d + c.deltaW[pN] * this.alpha;
                    } else {
                        c.deltaW[pN] = d;
                    }

                    c.w[pN] += c.deltaW[pN];
                }
            }
        }

    },

    /**
     * Sums the inputs from the layer to the neuron.  Includes bias node
     * calculations
     * @param {Neuron[]} layer
     * @param {Neuron} neuron
     * @returns {Number}
     * @private
     */
    _sumInputs: function(layer, neuron) {
        var sum = 0;
        var w = neuron.w;

        for (var idx = 0, len = layer.length - 1; idx < len; idx++) {
            sum += w[idx] * layer[idx].output;
        }
        sum += w[len];

        return sum;
    },

    /**
     * Calculates the weight change delta
     * @param {Neuron} curr neuron from layer i
     * @param {Neuron} prev neuron from layer i - 1
     * @private
     */
    _weightDeltaCalc: function(curr, prev) {

        var d;
        if (prev.bias) {
            d = this.eta * curr.error;
        } else {
            d = this.eta * curr.error * prev.output;
        }
        return d;
    }
};

module.exports = NeuralNetwork;
},{"./lib/NetworkMath":"x8VlMK","./lib/NetworkStates":"xQWEPS","./lib/Neuron":18,"lodash":"fYW/7L"}],"WK3RJP":[function(require,module,exports){
var ANN = require('./NeuralNetwork');
var _ = require('lodash');
var NetworkMath = require('./lib/NetworkMath');
var NetworkStates = require('./lib/NetworkStates');


var RBFNetwork = function(configuration) {
    /**
     * @type {Array.<Number[]>}
     */
    this.initialCenters = [];
    /**
     * @type {number}
     */
    this.initialSigma = 1;

    /**
     * Calculates the sigma
     * @type {boolean}
     */
    this.calculateSigma = false;

    /**
     * The calculated sigma constant
     * @type {number}
     */
    this.rho = 0.5;

    if (configuration.initialCenters.length !== configuration.hiddenLayerNeuronCount) {
        throw new Error('Bad data: Hidden layer neuron count must equal initial centers');
    }

    ANN.apply(this, [configuration]);
    this._rbfInitialize();
};

RBFNetwork.prototype = _.assign(RBFNetwork.prototype, ANN.prototype);
RBFNetwork.prototype = _.assign(RBFNetwork.prototype, {

    getAverageDistance: function() {
        var dist = 0;
        var hidden = this._layers[1];
        for (var i = 0; i < hidden.length - 1; i++) {
            var h = hidden[i];
            var n = hidden[i + 1];
            dist += NetworkMath.lpNorm(h.center, n.center);
        }

        return dist / this._layers[1].length;
    },

    /**
     * The sigma calculation
     * @returns {number}
     */
    getCalculatedSigma: function() {
        return this.getAverageDistance() * this.rho;
    },

    /**
     * the rbf initialization.  This spreads the range through
     * @private
     */
    _rbfInitialize: function() {

        var hidden = this._layers[1];
        for (var i = 0; i < hidden.length; i++) {
            hidden[i].center = this.initialCenters[i];
        }

        var sigma = this.getCalculatedSigma();
        for (var i = 0; i < hidden.length; i++) {
            hidden[i].sigma = sigma;
        }
    },

    name: 'RBF',

    /**
     * The feed forward algorithm is different within
     * @private
     */
    _feedForward: function() {
        var inputs = this._getInputVector();

        var hidden = this._layers[1];
        for (var i = 0; i < hidden.length; i++) {
            var h = hidden[i];
            var norm = NetworkMath.lpNorm(h.center, inputs);
            h.output = NetworkMath.gaussian(norm, h.sigma);
        }

        var outputs = this._layers[2];
        for (var oIdx = 0; oIdx < outputs.length; oIdx++) {
            var o = outputs[oIdx];
            var sum = 0;

            for (var hIdx = 0; hIdx < hidden.length; hIdx++) {
                sum += o.w[hIdx] * hidden[hIdx].output;
            }

            o.output = sum;
        }
        this.state = NetworkStates
    },

    /**
     * The hidden layer does not need error calculation
     * @private
     */
    _backpropErrorHidden: function() {
        // Note:  There are no hidden calculations
    },

    _adjustHiddenWeights: function() {
        // Note: The center / sigma are the hidden weights
    },

    /**
     * Gets the input vector
     * @private
     */
    _getInputVector: function() {
        var a = [];
        for (var i = 0; i < this._inputs.length; i++) {
            a.push(this._inputs[i].output);
        }

        return a;
    }
});


/**
 * The center count and training data.  The configuration should be for an ANN
 * @param {Number} centerCount
 * @param {Array.<Number[]>} t
 * @param {{}} configuration
 */
RBFNetwork.create = function(t, configuration) {
    // t is in pairs.  input, output
    var centerCount = configuration.hiddenLayerNeuronCount;
    var step = Math.floor(t.length / centerCount);
    var halfStep = Math.floor(step / 2);
    var centers = [];

    for (var i = 0; i < centerCount; i++) {
        var idx = halfStep + step * i;
        if (idx % 2 === 1) {
            idx--;
        }

        centers.push(t[idx]);
    }

    configuration.initialCenters = centers;
    configuration.useBiasInput = false;
    return new RBFNetwork(configuration);
};

module.exports = RBFNetwork;
},{"./NeuralNetwork":"FF39dm","./lib/NetworkMath":"x8VlMK","./lib/NetworkStates":"xQWEPS","lodash":"fYW/7L"}],"RBFNetwork":[function(require,module,exports){
module.exports=require('WK3RJP');
},{}],"NetworkMath":[function(require,module,exports){
module.exports=require('x8VlMK');
},{}],"x8VlMK":[function(require,module,exports){
var _ = require('lodash');

/**
 * A required addition to the math library for the hyperbolicTangent activation function
 * @param {Number} x
 * @returns {Number}
 */
Math.tanh = function(x) {
    return 2 * logisticFunction(2 * x) - 1;
};

/**
 * The hyper tangent
 * @param {Number} x
 * @returns {Number}
 */
var hyperTangent = function(x) {
    return Math.tanh(x);
};

function dHyperTangent(x) {
    var t = Math.tanh(x);
    return NetworkMath.alpha * (1 - t * t);
}

/**
 * The logisticFunction function is 1 / (1 + e ^ (-x))
 * @param x
 */
function logisticFunction(x) {
    // Short cuts the logistic function.  Makes calculations go way faster
    if (x > NetworkMath.logisticMax / NetworkMath.alpha) {
        return .999;
    } else if (x < -NetworkMath.logisticMax / NetworkMath.alpha) {
        return 0.001;
    }
    return 1 / (1 + Math.pow(Math.E, -x * NetworkMath.alpha));
}


/**
 * The derivative of the logistic function
 * @param {Number} x
 * @returns {Number}
 */
function dLogisticFunction(x) {
    return NetworkMath.alpha * x * (1 - x);
}

/**
 * The guassian function
 * @returns {number}
 */
function gaussianFn(x, s) {
    s = s || NetworkMath.sigma;
    return Math.pow(Math.E, -(x * x / (2 * s * s)));
}

/**
 * The set of types for the activation functions
 * @name NetworkFunctionTypes
 */
var Types = {
    Sigmoid: 'sig',
    HyperbolicTangent: 'hbt',
    Linear: 'lin'
};

function delimitDataDisplay(value) {
    return Math.floor(value * 1000) / 1000;
}

/**
 * Takes in 2 arrays.  The arrays are used for the distance calculation
 * @param {Number[]} arr1
 * @param {Number[]} arr2
 * @name LPNorm
 */
function lpnorm(arr1, arr2) {
    var pow = arr1.length;
    var sum = 0;
    for (var i = 0; i < arr1.length; i++) {
        sum += Math.pow(arr1[i] - arr2[i], pow);
    }
    return Math.pow(sum, 1 / pow);
}

var NetworkMath = {
    /**
     * the Activation function based on type
     * @param type
     * @returns {Function}
     */
    activationFunction: function(type) {
        if (type === Types.Sigmoid) {
            return logisticFunction;
        } else if (type === Types.HyperbolicTangent) {
            return hyperTangent;
        } else if (type === Types.Linear) {
            return function(x) {
                return x;
            }
        }
    },

    /**
     * The dActivation function
     * @param type
     * @returns {Function}
     */
    dActivationFunction: function(type) {
        if (type === Types.Sigmoid) {
            return dLogisticFunction;
        } else if (type === Types.HyperbolicTangent) {
            return dHyperTangent;
        } else if (type === Types.Linear) {
            return function(x) {
                return 1;
            }
        }
    },

    /**
     * Makes the data not display so far out
     */
    delimitDataDisplay: delimitDataDisplay,

    /**
     * alpha
     */
    alpha: 1,

    /**
     * For shortcutting the function to return 0.999 or 0.001
     * The actual value used is logisticMax / alpha
     */
    logisticMax: 7,

    /**
     * The sigma in the RBF gaussian function
     */
    sigma: 5,

    /**
     * @type NetworkFunctionTypes
     */
    Types: Types,

    /**
     * @type LPNorm
     */
    lpNorm: lpnorm,

    /**
     * The gaussian function
     */
    gaussian: gaussianFn
};

module.exports = NetworkMath;
},{"lodash":"fYW/7L"}],"NetworkStates":[function(require,module,exports){
module.exports=require('xQWEPS');
},{}],"xQWEPS":[function(require,module,exports){
/**
 * The network states
 * @name NetworkStates
 */
var NetworkStates = {
    SetInputs: 'Set Inputs',
    FeedForward: 'Feeding Forward',
    BackPropOutput: 'Back Prop to Output',
    BackPropHidden: 'Back Prop to Hidden',
    WeightCalcOutput: 'Weight Calculation Output',
    WeightCalcHidden: 'Weight Calculation Hidden',
    Finished: 'Finished!'
};

module.exports = NetworkStates;

},{}],18:[function(require,module,exports){
var _ = require('lodash');
var NetworkUtil = require('./NetworkMath');

var toString = function() {
    var w = [];
    for (var i = 0; i < this.w.length; i++) {
        w.push(NetworkUtil.delimitDataDisplay(this.w[i]));
    }

    var dW = [];
    for (i = 0; i < this.deltaW.length; i++) {
        dW.push(NetworkUtil.delimitDataDisplay(this.deltaW[i]));
    }

    return 'Node(' + this.id + '): ' +
        [
            'i:', NetworkUtil.delimitDataDisplay(this.input),
            'o:', NetworkUtil.delimitDataDisplay(this.output),
            'w:', w,
            'dW:', dW,
            'e:', this.error
        ].join(' ');
};

/**
 * the representation of a neuron
 */
var Neuron = {
    id: '',
    bias: false,
    input: 0,
    output: 0,
    w: [], // The list of weights from the previous layer
    error: 0,
    deltaW: [], // step change of weights
    toString: toString,
    sigma: 0.05,
    center: [],
    activationFn: NetworkUtil.activationFunction(NetworkUtil.Types.Sigmoid),
    dActivationFn: NetworkUtil.dActivationFunction(NetworkUtil.Types.Sigmoid)
};

/**
 * @returns {Neuron}
 */
module.exports = function(id) {
    var n = _.cloneDeep(Neuron);
    if (id) {
        n.id = id;
    }

    return n;
};
},{"./NetworkMath":"x8VlMK","lodash":"fYW/7L"}],"xn5naf":[function(require,module,exports){
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
},{}],"truth-tables":[function(require,module,exports){
module.exports=require('xn5naf');
},{}],"NetworkExperiments":[function(require,module,exports){
module.exports=require('LHVMnS');
},{}],"LHVMnS":[function(require,module,exports){
var _ = require('lodash');

function average(arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum / arr.length;
}
/**
 * Takes the data set and splits it in half for a 5 / 2 test.
 * @param t
 */
function splitData(t) {
    var dataSet1 = [], dataSet2 = [], validation = [];
    var remainder = Math.floor(t.length * .1);
    var half = Math.floor((t.length - remainder) / 2);
    var tClone = _.clone(t);

    while (remainder) {
        var a = Math.floor(Math.random() * tClone.length);
        if (a % 2 === 1) {
            a--;
        }

        var input = tClone.splice(a, 1)[0];
        var output = tClone.splice(a, 1)[0];
        validation.push(input);
        validation.push(output);
        remainder--;
    }

    while (tClone.length) {
        var a = Math.floor(Math.random() * 100) % 2 === 0;
        var input = tClone.shift();
        var output = tClone.shift();

        if (a && dataSet1.length < half) {
            dataSet1.push(input);
            dataSet1.push(output);
        } else if (a) {
            dataSet2.push(input);
            dataSet2.push(output);
        }

        if (!a && dataSet2.length < half) {
            dataSet2.push(input);
            dataSet2.push(output);
        } else if (!a) {
            dataSet1.push(input);
            dataSet1.push(output);
        }
    }

    return [dataSet1, dataSet2, validation];
}



/**
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 */
function trainData(network, t) {
    for (var i = 0; i < t.length; i += 2) {
        var input = t[i];
        var expectedOutput = t[i + 1];

        network.train(input, expectedOutput);
    }
}

/**
 * Runs a random data point through the network with its
 * expected output
 * @name trainOnce
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 */
function trainOnce(network, t) {
    var i = Math.floor(Math.random() * t.length);

    if (i % 2 !== 0) {
        i--;
    }

    network.train(t[i], t[i + 1]);
}

/**
 * @name NetworkTrainer
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 * @param {Number} n
 */
function train(network, t, n) {
    for (var trains = 0; trains < n; trains++) {
        trainData(network, t);
    }
}

/**
 * Will perform a test and calculate the average error from perspective of to - ao
 * @param {NeuralNetwork} network
 * @param {Array.<Number[]>} t
 * @returns {Array.<Array.<Number[]>>} t
 */
function testData(network, t) {
    var tOut = [];
    var tExp = [];
    var tErr = [];

    for (var i = 0; i < t.length; i += 2) {
        var input = t[i];
        var expectedOutput = t[i + 1];

        var output = network.test(input);
        var outputs = [];
        var errors = [];
        var exp = [];
        for (var o = 0; o < output.length; o++) {
            outputs.push(output[o]);
            errors.push(expectedOutput[o] - output[o]);
            exp.push(expectedOutput[o]);
        }

        tOut.push(outputs);
        tErr.push(errors);
        tExp.push(exp);
    }

    return [tOut, tExp, tErr];
}

/**
 * Trains the network with random
 * @param {NeuralNetwork} network
 * @param t
 */
function randomTraining(network, t) {

    for (var i = 0, len = t.length; i < len; i++) {
        var r = Math.floor(Math.random() * len);
        if (r % 2 === 1) {
            r--;
        }

        network.train(t[r], t[r + 1]);
    }
    return i;
}

/**
 * Gets the training stats from the training data.
 * @param trainingData
 * @returns {Number[]} Accuracy, Error, Count  These are non averaged values
 */
function getStats(trainingData) {
    var tOut = trainingData[0];
    var tExp = trainingData[1];
    var tErr = trainingData[2];
    var accuracy = 0;
    var error = 0;

    // tOut, tExp, and tErr should all be the same length
    for (var i = 0; i < tOut.length; i++) {
        var outs = tOut[i];
        var exps = tExp[i];
        var errors = tErr[i];

        // The sub tests for each outs, exps, and errors should all be the same length
        for (var j = 0; j < outs.length; j++) {

            // NOTE: I know that there will only be one output
            accuracy += outs[j] / exps[j];
            error += Math.abs(errors[j]);
        }
    }

    return [accuracy, error, i];
}

var NetworkExperiments = {

    /**
     * @param {NeuralNetwork} network
     * @param {Array.<Number[]>} t
     * @param {Number} [precision]
     * @return {Number[]} avg accuracy, avg error, test input count
     */
    five2Training: function(network, t, precision) {
        var accuracy = 0;
        var error = 0;
        var tests = 0;
        precision = precision || 10000;

        for (var fiveTests = 0; fiveTests < 5; fiveTests++) {

            var datasets = splitData(t);

            network.reset();
            var stats = [];

            for (var i = 0, j = 1; i <= 1; i++, j--) {

                // quick 50 times through ds
                for (var k = 0; k < 50; k++) {
                    trainData(network, datasets[i]);
                }
                stats.push(getStats(testData(network, datasets[j])));
            }

            accuracy += stats[0][0] + stats[1][0];
            error += stats[0][1] + stats[1][1];
            tests += stats[0][2] + stats[1][2];
        }
        network.reset();

        // Returns the average accuracy, error, and the count of test points that
        // were tested
        return [accuracy / tests, error / tests, tests];
    },

    /**
     * The converging algorithm will work in this way.  It will attempt to feed through the test
     * data seeing if there are improvements.  If there are improvements based on a certain error
     * amount.  If the improvements are not beyond a certain delta then it will be considered
     * "converged"
     *
     * @param {NeuralNetwork} network
     * @param {Array.<Number[]>} t
     * @param {Number} delta
     */
    converge: function(network, t, delta) {

        var converged = false;
        var datasets = splitData(t);
        var previousValidation = [];
        var secondPrev = [];
        var tests = 0;

        while (!converged) {

            var max = network.name === 'mlp' ? 500 : 50;
            for (var k = 0; k < max; k++) {
                tests += randomTraining(network, datasets[0]);
                tests += randomTraining(network, datasets[1]);
            }

            var answers = getStats(testData(network, datasets[2]));


            if (previousValidation.length === 7 && secondPrev.length === 7) {
                var avg1 = average(previousValidation);
                var avg2 = average(secondPrev);
                var diff = Math.abs((avg1 - avg2) / avg2);
                if (diff < delta) {
                    converged = true;
                }

                secondPrev.shift();
            }

            previousValidation.push(answers[1]);
            if (previousValidation.length === 8) {
                secondPrev.push(previousValidation.shift());
            }
        }

        return [tests, answers];
    },

    /**
     * A different approach to be considered "Converged"  This one involves
     * finding the average differences lower than delta provided
     * @param {NeuralNetwork} network
     * @param {Array.<Number[]>} t
     * @param {Number} delta
     * @returns {Array}
     */
    converge2: function(network, t, delta) {

        var converged = false;
        var datasets = splitData(t);
        var runningDiff = [];
        var tests = 0;
        var prevVal;
        var prevMil = 1000000;

        while (!converged) {

            var max = network.name === 'mlp' ? 500 : 50;
            for (var k = 0; k < max; k++) {
                tests += randomTraining(network, datasets[0]);
                tests += randomTraining(network, datasets[1]);
            }

            var answers = getStats(testData(network, datasets[2]));
            if (runningDiff.length === 7) {
                var avg = average(runningDiff);
                if (avg < delta) {
                    converged = true;
                } else {

                    // Fail safe for convergence
                    if (prevMil < tests) {
                        delta += 0.05;
                        prevMil += 1000000;
                    }
                }

                runningDiff.shift();
            }

            if (prevVal) {
                runningDiff.push(Math.abs(prevVal - answers[1]));
            }
            prevVal = answers[1];
        }

        return [tests, answers];
    },

    /**
     * Use mse to determine if converged.
     * @param network
     * @param t
     * @param delta
     */
    converge3: function(network, t, delta) {
        var converged = false;
        var datasets = splitData(t);
        var runningDiff = [];
        var tests = 0;
        var prevVal;
        var prevMil = 1000000;

        while (!converged) {

            var max = network.name === 'mlp' ? 1 : 5;
            for (var k = 0; k < max; k++) {
                tests += randomTraining(network, datasets[0]);
                tests += randomTraining(network, datasets[1]);
            }

            var answers = getStats(testData(network, datasets[2]));
            if (runningDiff.length === 7) {
                var avg = average(runningDiff);
                if (avg < delta) {
                    converged = true;
                } else {

                    // Fail safe for convergence
                    if (prevMil < tests) {
                        delta += 1;
                        prevMil += 1000000;
                    }
                }

                runningDiff.shift();
            }

            if (prevVal) {
                runningDiff.push(Math.abs(prevVal - Math.sqrt(network._mse)));
            }
            prevVal = Math.sqrt(network._mse);

            if (isNaN(network._mse)) {
                converged = true;
            }
            network._mse = 0;
        }

        return [tests, answers];
    },

    /**
     * Tests a fixed number of trains
     * @param network
     * @param t
     * @param tests
     * @returns {Array}
     */
    fixedTests: function(network, t, testPoints) {

        var datasets = splitData(t);
        var tests = 0;
        network.reset();

        for (var k = 0; tests < testPoints; k++) {
            tests += randomTraining(network, datasets[0]);
            tests += randomTraining(network, datasets[1]);
        }

        var answers = getStats(testData(network, datasets[2]));
        return [tests, answers];
    },

    /**
     * @type trainOnce
     */
    trainOnce: trainOnce,

    /**
     * @type NetworkTrainer
     */
    train: train,

    /**
     * The manula training
     * @param input
     * @param output
     */
    manualTrain: function(network, input, output) {
        network.train(input, output);
    }
};

module.exports = NetworkExperiments;

},{"lodash":"fYW/7L"}],"lodash":[function(require,module,exports){
module.exports=require('fYW/7L');
},{}],"fYW/7L":[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * @license
 * Lo-Dash 2.2.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setImmediate', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria;

    // ensure a stable sort in V8 and other engines
    // http://code.google.com/p/v8/issues/detail?id=90
    if (ac !== bc) {
      if (ac > bc || typeof ac == 'undefined') {
        return 1;
      }
      if (ac < bc || typeof bc == 'undefined') {
        return -1;
      }
    }
    // The JS engine embedded in Adobe applications like InDesign has a buggy
    // `Array#sort` implementation that causes it, under certain circumstances,
    // to return the same value for `a` and `b`.
    // See https://github.com/jashkenas/underscore/pull/1247
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * A no-operation function.
   *
   * @private
   */
  function noop() {
    // no operation performed
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(objectProto.valueOf)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/valueOf|for [^\]]+/g, '.+?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = reNative.test(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        now = reNative.test(now = Date.now) && now || function() { return +new Date; },
        push = arrayRef.push,
        setImmediate = context.setImmediate,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        toString = objectProto.toString,
        unshift = arrayRef.unshift;

    var defineProperty = (function() {
      try {
        var o = {},
            func = reNative.test(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeBind = reNative.test(nativeBind = toString.bind) && nativeBind,
        nativeCreate = reNative.test(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random,
        nativeSlice = arrayRef.slice;

    /** Detect various environments */
    var isIeOpera = reNative.test(context.attachEvent),
        isV8 = nativeBind && !/\n|true/.test(nativeBind + isIeOpera);

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `createCallback`, `curry`, `debounce`,
     * `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`, `forEach`,
     * `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `functions`,
     * `groupBy`, `indexBy`, `initial`, `intersection`, `invert`, `invoke`, `keys`,
     * `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`, `once`, `pairs`,
     * `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`, `range`, `reject`,
     * `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`, `sortBy`, `splice`,
     * `tap`, `throttle`, `times`, `toArray`, `transform`, `union`, `uniq`, `unshift`,
     * `unzip`, `values`, `where`, `without`, `wrap`, and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if `Function#bind` exists and is inferred to be fast (all but V8).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.fastBind = nativeBind && !isV8;

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !reNative.test(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [deep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, deep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (deep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!deep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, deep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early if there is no `thisArg`
      if (typeof thisArg == 'undefined') {
        return func;
      }
      var bindData = func.__bindData__ || (support.funcNames && !func.name);
      if (typeof bindData == 'undefined') {
        var source = reThis && fnToString.call(func);
        if (!support.funcNames && source && !reFuncName.test(source)) {
          bindData = true;
        }
        if (support.funcNames || !bindData) {
          // checks if `func` references the `this` keyword and stores the result
          bindData = !support.funcDecomp || reThis.test(source);
          setBindData(func, bindData);
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData !== true && (bindData && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isArgArrays=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isArgArrays, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isArgArrays);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isArgArrays) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        if (hasOwnProperty.call(a, '__wrapped__ ') || hasOwnProperty.call(b, '__wrapped__')) {
          return baseIsEqual(a.__wrapped__ || a, b.__wrapped__ || b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB && !(
              isFunction(ctorA) && ctorA instanceof ctorA &&
              isFunction(ctorB) && ctorB instanceof ctorB
            )) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        length = a.length;
        size = b.length;

        // compare lengths to determine if a deep comparison is necessary
        result = size == a.length;
        if (!result && !isWhere) {
          return result;
        }
        // deep compare the contents, ignoring non-numeric properties
        while (size--) {
          var index = length,
              value = b[size];

          if (isWhere) {
            while (index--) {
              if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                break;
              }
            }
          } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
            break;
          }
        }
        return result;
      }
      // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
      // which, in this case, is more costly
      forIn(b, function(value, key, b) {
        if (hasOwnProperty.call(b, key)) {
          // count the number of properties.
          size++;
          // deep compare each property value.
          return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
        }
      });

      if (result && !isWhere) {
        // ensure both objects have the same number of properties
        forIn(a, function(value, key, a) {
          if (hasOwnProperty.call(a, key)) {
            // `size` will be `-1` if `a` has more properties than `b`
            return (result = --size > -1);
          }
        });
      }
      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        if (cache) {
          indexOf = cacheIndexOf;
          seen = cache;
        } else {
          isLarge = false;
          seen = callback ? seen : (releaseArray(seen), result);
        }
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new bound function.
     */
    function createBound(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32,
          key = func;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData) {
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        if (isPartialRight) {
          push.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        bindData[1] |= bitmask;
        return createBound.apply(null, bindData);
      }
      // use `Function#bind` if it exists and is fast
      // (in V8 `Function#bind` is slower except when partially applied)
      if (isBind && !(isBindKey || isCurry || isPartialRight) &&
          (support.fastBind || (nativeBind && isPartial))) {
        if (isPartial) {
          var args = [thisArg];
          push.apply(args, partialArgs);
        }
        var bound = isPartial
          ? nativeBind.apply(func, args)
          : nativeBind.call(func, thisArg);
      }
      else {
        bound = function() {
          // `Function#bind` spec
          // http://es5.github.io/#x15.3.4.5
          var args = arguments,
              thisBinding = isBind ? thisArg : this;

          if (isCurry || isPartial || isPartialRight) {
            args = nativeSlice.call(args);
            if (isPartial) {
              unshift.apply(args, partialArgs);
            }
            if (isPartialRight) {
              push.apply(args, partialRightArgs);
            }
            if (isCurry && args.length < arity) {
              bitmask |= 16 & ~32;
              return createBound(func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity);
            }
          }
          if (isBindKey) {
            func = thisBinding[key];
          }
          if (this instanceof bound) {
            // ensure `new bound` is an instance of `func`
            thisBinding = createObject(func.prototype);

            // mimic the constructor's `return` behavior
            // http://es5.github.io/#x13.2.2
            var result = func.apply(thisBinding, args);
            return isObject(result) ? result : thisBinding;
          }
          return func.apply(thisBinding, args);
        };
      }
      setBindData(bound, nativeSlice.call(arguments));
      return bound;
    }

    /**
     * Creates a new object with the specified `prototype`.
     *
     * @private
     * @param {Object} prototype The prototype object.
     * @returns {Object} Returns the new object.
     */
    function createObject(prototype) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      createObject = function(prototype) {
        if (isObject(prototype)) {
          noop.prototype = prototype;
          var result = new noop;
          noop.prototype = null;
        }
        return result || {};
      };
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {*} value The value to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'moe' }, { 'age': 40 });
     * // => { 'name': 'moe', 'age': 40 }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var food = { 'name': 'apple' };
     * defaults(food, { 'name': 'banana', 'type': 'fruit' });
     * // => { 'name': 'apple', 'type': 'fruit' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `deep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [deep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * var shallow = _.clone(stooges);
     * shallow[0] === stooges[0];
     * // => true
     *
     * var deep = _.clone(stooges, true);
     * deep[0] === stooges[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, deep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `deep` and `callback`
      if (typeof deep != 'boolean' && deep != null) {
        thisArg = callback;
        callback = deep;
        deep = false;
      }
      return baseClone(value, deep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * var deep = _.cloneDeep(stooges);
     * deep[0] === stooges[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var food = { 'name': 'apple' };
     * _.defaults(food, { 'name': 'banana', 'type': 'fruit' });
     * // => { 'name': 'apple', 'type': 'fruit' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * _.findKey({ 'a': 1, 'b': 2, 'c': 3, 'd': 4 }, function(num) {
     *   return num % 2 == 0;
     * });
     * // => 'b' (property order is not guaranteed across environments)
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * _.findLastKey({ 'a': 1, 'b': 2, 'c': 3, 'd': 4 }, function(num) {
     *   return num % 2 == 1;
     * });
     * // => returns `c`, assuming `_.findKey` returns `a`
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Dog(name) {
     *   this.name = name;
     * }
     *
     * Dog.prototype.bark = function() {
     *   console.log('Woof, woof!');
     * };
     *
     * _.forIn(new Dog('Dagny'), function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'bark' and 'name' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Dog(name) {
     *   this.name = name;
     * }
     *
     * Dog.prototype.bark = function() {
     *   console.log('Woof, woof!');
     * };
     *
     * _.forInRight(new Dog('Dagny'), function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'name' and 'bark' assuming `_.forIn ` logs 'bark' and 'name'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified object `property` exists and is a direct property,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to check.
     * @param {string} property The property to check for.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, property) {
      return object ? hasOwnProperty.call(object, property) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     *  _.invert({ 'first': 'moe', 'second': 'larry' });
     * // => { 'moe': 'first', 'larry': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false || toString.call(value) == boolClass;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value ? (typeof value == 'object' && toString.call(value) == dateClass) : false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value ? value.nodeType === 1 : false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var moe = { 'name': 'moe', 'age': 40 };
     * var copy = { 'name': 'moe', 'age': 40 };
     *
     * moe == copy;
     * // => false
     *
     * _.isEqual(moe, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' || toString.call(value) == numberClass;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Stooge(name, age) {
     *   this.name = name;
     *   this.age = age;
     * }
     *
     * _.isPlainObject(new Stooge('moe', 40));
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'name': 'moe', 'age': 40 });
     * // => true
     */
    var isPlainObject = function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = typeof valueOf == 'function' && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/moe/);
     * // => true
     */
    function isRegExp(value) {
      return value ? (typeof value == 'object' && toString.call(value) == regexpClass) : false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('moe');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' || toString.call(value) == stringClass;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'stooges': [
     *     { 'name': 'moe' },
     *     { 'name': 'larry' }
     *   ]
     * };
     *
     * var ages = {
     *   'stooges': [
     *     { 'age': 40 },
     *     { 'age': 50 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'stooges': [{ 'name': 'moe', 'age': 40 }, { 'name': 'larry', 'age': 50 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = nativeSlice.call(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'moe', 'age': 40 }, 'age');
     * // => { 'name': 'moe' }
     *
     * _.omit({ 'name': 'moe', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'moe' }
     */
    function omit(object, callback, thisArg) {
      var indexOf = getIndexOf(),
          isFunc = typeof callback == 'function',
          result = {};

      if (isFunc) {
        callback = lodash.createCallback(callback, thisArg, 3);
      } else {
        var props = baseFlatten(arguments, true, false, 1);
      }
      forIn(object, function(value, key, object) {
        if (isFunc
              ? !callback(value, key, object)
              : indexOf(props, key) < 0
            ) {
          result[key] = value;
        }
      });
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'moe': 30, 'larry': 40 });
     * // => [['moe', 30], ['larry', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'moe', '_userid': 'moe1' }, 'name');
     * // => { 'name': 'moe' }
     *
     * _.pick({ 'name': 'moe', '_userid': 'moe1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'moe' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its elements
     * through a callback, with each callback execution potentially mutating
     * the `accumulator` object. The callback is bound to `thisArg` and invoked
     * with four arguments; (accumulator, value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      callback = baseCreateCallback(callback, thisArg, 4);

      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = createObject(proto);
        }
      }
      (isArr ? forEach : forOwn)(object, function(value, index, object) {
        return callback(accumulator, value, index, object);
      });
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['moe', 'larry', 'curly'], 0, 2);
     * // => ['moe', 'curly']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'moe', 'age': 40 }, 'moe');
     * // => true
     *
     * _.contains('curly', 'ur');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(stooges, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(stooges, { 'age': 50 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(food, 'organic');
     * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
     *
     * // using "_.where" callback shorthand
     * _.filter(food, { 'type': 'fruit' });
     * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.find([1, 2, 3, 4], function(num) {
     *   return num % 2 == 0;
     * });
     * // => 2
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'banana', 'organic': true,  'type': 'fruit' },
     *   { 'name': 'beet',   'organic': false, 'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.find(food, { 'type': 'vegetable' });
     * // => { 'name': 'beet', 'organic': false, 'type': 'vegetable' }
     *
     * // using "_.pluck" callback shorthand
     * _.find(food, 'organic');
     * // => { 'name': 'banana', 'organic': true, 'type': 'fruit' }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(stooges, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = nativeSlice.call(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(stooges, 'name');
     * // => ['moe', 'larry']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * _.max(stooges, function(stooge) { return stooge.age; });
     * // => { 'name': 'larry', 'age': 50 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(stooges, 'age');
     * // => { 'name': 'larry', 'age': 50 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      if (!callback && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (!callback && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * _.min(stooges, function(stooge) { return stooge.age; });
     * // => { 'name': 'moe', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(stooges, 'age');
     * // => { 'name': 'moe', 'age': 40 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      if (!callback && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (!callback && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the `collection`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * _.pluck(stooges, 'name');
     * // => ['moe', 'larry']
     */
    function pluck(collection, property) {
      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = collection[index][property];
        }
      }
      return result || map(collection, property);
    }

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = baseCreateCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = baseCreateCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(food, 'organic');
     * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
     *
     * // using "_.where" callback shorthand
     * _.reject(food, { 'type': 'fruit' });
     * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions, like `_.map`,
     *  without using their `key` and `object` arguments as sources.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      var length = collection ? collection.length : 0;
      if (typeof length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[random(length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = random(++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('curly');
     * // => 5
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var food = [
     *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
     *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(food, 'organic');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(food, { 'type': 'meat' });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * // using "_.pluck" callback shorthand
     * _.sortBy(['banana', 'strawberry', 'apple'], 'length');
     * // => ['apple', 'banana', 'strawberry']
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      callback = lodash.createCallback(callback, thisArg, 3);
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        object.criteria = callback(value, key, collection);
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} properties The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var stooges = [
     *   { 'name': 'curly', 'age': 30, 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] },
     *   { 'name': 'moe', 'age': 40, 'quotes': ['Spread out!', 'You knucklehead!'] }
     * ];
     *
     * _.where(stooges, { 'age': 40 });
     * // => [{ 'name': 'moe', 'age': 40, 'quotes': ['Spread out!', 'You knucklehead!'] }]
     *
     * _.where(stooges, { 'quotes': ['Poifect!'] });
     * // => [{ 'name': 'curly', 'age': 30, 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [array] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          seen = baseFlatten(arguments, true, true, 1),
          result = [];

      var isLarge = length >= largeArraySize && indexOf === baseIndexOf;

      if (isLarge) {
        var cache = createCache(seen);
        if (cache) {
          indexOf = cacheIndexOf;
          seen = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(seen, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(seen);
      }
      return result;
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * _.findIndex(['apple', 'banana', 'beet'], function(food) {
     *   return /^b/.test(food);
     * });
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * _.findLastIndex(['apple', 'banana', 'beet'], function(food) {
     *   return /^b/.test(food);
     * });
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var food = [
     *   { 'name': 'banana', 'organic': true },
     *   { 'name': 'beet',   'organic': false },
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(food, 'organic');
     * // => [{ 'name': 'banana', 'organic': true }]
     *
     * var food = [
     *   { 'name': 'apple',  'type': 'fruit' },
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.first(food, { 'type': 'fruit' });
     * // => [{ 'name': 'apple', 'type': 'fruit' }, { 'name': 'banana', 'type': 'fruit' }]
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var stooges = [
     *   { 'name': 'curly', 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] },
     *   { 'name': 'moe', 'quotes': ['Spread out!', 'You knucklehead!'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(stooges, 'quotes');
     * // => ['Oh, a wise guy, eh?', 'Poifect!', 'Spread out!', 'You knucklehead!']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = !(thisArg && thisArg[isShallow] === array) ? isShallow : null;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var food = [
     *   { 'name': 'beet',   'organic': false },
     *   { 'name': 'carrot', 'organic': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(food, 'organic');
     * // => [{ 'name': 'beet',   'organic': false }]
     *
     * var food = [
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' },
     *   { 'name': 'carrot', 'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.initial(food, { 'type': 'vegetable' });
     * // => [{ 'name': 'banana', 'type': 'fruit' }]
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of composite values.
     * @example
     *
     * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
     * // => [1, 2]
     */
    function intersection(array) {
      var args = arguments,
          argsLength = args.length,
          argsIndex = -1,
          caches = getArray(),
          index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [],
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = args[argsIndex];
        caches[argsIndex] = indexOf === baseIndexOf &&
          (value ? value.length : 0) >= largeArraySize &&
          createCache(argsIndex ? args[argsIndex] : seen);
      }
      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var food = [
     *   { 'name': 'beet',   'organic': false },
     *   { 'name': 'carrot', 'organic': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.last(food, 'organic');
     * // => [{ 'name': 'carrot', 'organic': true }]
     *
     * var food = [
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' },
     *   { 'name': 'carrot', 'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.last(food, { 'type': 'vegetable' });
     * // => [{ 'name': 'beet', 'type': 'vegetable' }, { 'name': 'carrot', 'type': 'vegetable' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(10);
     * // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     *
     * _.range(1, 11);
     * // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     *
     * _.range(0, 30, 5);
     * // => [0, 5, 10, 15, 20, 25]
     *
     * _.range(0, -10, -1);
     * // => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines, like Chakra and V8, avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var food = [
     *   { 'name': 'banana', 'organic': true },
     *   { 'name': 'beet',   'organic': false },
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.rest(food, 'organic');
     * // => [{ 'name': 'beet', 'organic': false }]
     *
     * var food = [
     *   { 'name': 'apple',  'type': 'fruit' },
     *   { 'name': 'banana', 'type': 'fruit' },
     *   { 'name': 'beet',   'type': 'vegetable' }
     * ];
     *
     * // using "_.where" callback shorthand
     * _.rest(food, { 'type': 'fruit' });
     * // => [{ 'name': 'beet', 'type': 'vegetable' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of composite values.
     * @example
     *
     * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
     * // => [1, 2, 3, 101, 10]
     */
    function union(array) {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = !(thisArg && thisArg[isSorted] === array) ? isSorted : null;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return difference(array, nativeSlice.call(arguments, 1));
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['moe', 'larry'], [30, 40], [true, false]);
     * // => [['moe', 30, true], ['larry', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['moe', 'larry'], [30, 40]);
     * // => { 'moe': 30, 'larry': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'moe' }, 'hi');
     * func();
     * // => 'hi moe'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createBound(func, 17, nativeSlice.call(arguments, 2), null, thisArg)
        : createBound(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *  'label': 'docs',
     *  'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createBound(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'moe',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi moe'
     *
     * object.greet = function(greeting) {
     *   return greeting + ', ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hi, moe!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createBound(key, 19, nativeSlice.call(arguments, 2), null, object)
        : createBound(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'curly': 'jerome'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('curly');
     * // => 'Hiya Jerome!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(stooges, 'age__gt45');
     * // => [{ 'name': 'larry', 'age': 50 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return function(object) {
          return object[func];
        };
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createBound(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled);
          if (remaining <= 0) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          result = func.apply(thisArg, args);
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function() { console.log('deferred'); });
     * // returns from the function before 'deferred' is logged
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = nativeSlice.call(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }
    // use `setImmediate` if available in Node.js
    if (isV8 && moduleExports && typeof setImmediate == 'function') {
      defer = function(func) {
        if (!isFunction(func)) {
          throw new TypeError;
        }
        return setImmediate.apply(context, arguments);
      };
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * var log = _.bind(console.log, console);
     * _.delay(log, 1000, 'logged later');
     * // => 'logged later' (Appears after one second.)
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = nativeSlice.call(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * var data = {
     *   'moe': { 'name': 'moe', 'age': 40 },
     *   'curly': { 'name': 'curly', 'age': 60 }
     * };
     *
     * // modifying the result cache
     * var stooge = _.memoize(function(name) { return data[name]; }, _.identity);
     * stooge('curly');
     * // => { 'name': 'curly', 'age': 60 }
     *
     * stooge.cache.curly.name = 'jerome';
     * stooge('curly');
     * // => { 'name': 'jerome', 'age': 60 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('moe');
     * // => 'hi moe'
     */
    function partial(func) {
      return createBound(func, 16, nativeSlice.call(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createBound(func, 32, null, nativeSlice.call(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      var result = debounce(func, wait, debounceOptions);
      return result;
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var hello = function(name) { return 'hello ' + name; };
     * hello = _.wrap(hello, function(func) {
     *   return 'before, ' + func('moe') + ', after';
     * });
     * hello();
     * // => 'before, hello moe, after'
     */
    function wrap(value, wrapper) {
      if (!isFunction(wrapper)) {
        throw new TypeError;
      }
      return function() {
        var args = [value];
        push.apply(args, arguments);
        return wrapper.apply(this, args);
      };
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Moe, Larry & Curly');
     * // => 'Moe, Larry &amp; Curly'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var moe = { 'name': 'moe' };
     * moe === _.identity(moe);
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the `lodash` function and
     * chainable wrapper.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object of function properties to add to `lodash`.
     * @param {Object} object The object of function properties to add to `lodash`.
     * @example
     *
     * _.mixin({
     *   'capitalize': function(string) {
     *     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     *   }
     * });
     *
     * _.capitalize('moe');
     * // => 'Moe'
     *
     * _('moe').capitalize();
     * // => 'Moe'
     */
    function mixin(object, source) {
      var ctor = object,
          isFunc = !source || isFunction(ctor);

      if (!source) {
        ctor = lodashWrapper;
        source = object;
        object = lodash;
      }
      forEach(functions(source), function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (value && typeof value == 'object' && value === result) {
              return this;
            }
            result = new ctor(result);
            result.__chain__ = this.__chain__;
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox and Opera still follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      var rand = nativeRandom();
      return (floating || min % 1 || max % 1)
        ? nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max)
        : min + floor(rand * (max - min + 1));
    }

    /**
     * Resolves the value of `property` on `object`. If `property` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} property The property to get the value of.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, property) {
      if (object) {
        var value = object[property];
        return isFunction(value) ? object[property]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/#custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'moe' });
     * // => 'hello moe'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['moe', 'larry'] });
     * // => '<li>moe</li><li>larry</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'curly' });
     * // => 'hello curly'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'larry' });
     * // => 'hello larry!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% $.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['moe', 'larry'] }, { 'imports': { '$': jQuery } });
     * // => '<li>moe</li><li>larry</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text || (text = '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Moe, Larry &amp; Curly');
     * // => 'Moe, Larry & Curly'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 },
     *   { 'name': 'curly', 'age': 60 }
     * ];
     *
     * var youngest = _.chain(stooges)
     *     .sortBy('age')
     *     .map(function(stooge) { return stooge.name + ' is ' + stooge.age; })
     *     .first()
     *     .value();
     * // => 'moe is 40'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .filter(function(num) { return num % 2 == 0; })
     *  .tap(function(array) { console.log(array); })
     *  .map(function(num) { return num * num; })
     *  .value();
     * // => // [2, 4] (logged)
     * // => [4, 16]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var stooges = [
     *   { 'name': 'moe', 'age': 40 },
     *   { 'name': 'larry', 'age': 50 }
     * ];
     *
     * // without explicit chaining
     * _(stooges).first();
     * // => { 'name': 'moe', 'age': 40 }
     *
     * // with explicit chaining
     * _(stooges).chain()
     *   .first()
     *   .pick('age')
     *   .value()
     * // => { 'age': 40 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.countBy = countBy;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    forOwn(lodash, function(func, methodName) {
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName] = function() {
          var args = [this.__wrapped__],
              chainAll = this.__chain__;

          push.apply(args, arguments);
          var result = func.apply(lodash, args);
          return chainAll
            ? new lodashWrapper(result, chainAll)
            : result;
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.2.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers, like r.js, check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash was injected by a third-party script and not intended to be
    // loaded as a module. The global assignment can be reverted in the Lo-Dash
    // module by its `noConflict()` method.
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

},{}]},{},[3])
;