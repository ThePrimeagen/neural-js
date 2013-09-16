var d3 = require('d3');
var _ = require('lodash');

function delimitDataDisplay(value, to) {
    to = to || 100000;
    return Math.floor(value * to) / to;
}

/**
 * Takes in a selector and an artifical neural network
 * @param {String} selector
 * @constructor
 */
var D3Visualizer = function(selector) {
    this.host = d3.select(selector);
    this.width = 1500;
    this.height = 1000;
};

/**
 * The D3 Visualizer
 * @type {{}}
 */
D3Visualizer.prototype = {

    /**
     * Takes the host element and pumps in the current state of the artifical neural network.
     * @private
     */
    _initialize: function() {

        if (this._svg) {
            this._svg.remove();
        }

        this._svg = this.host.append('svg');
        this._svg.attr('width', this.width + 'px').attr('height', this.height + 'px');
    },

    /**
     * Takes in a serialized ANN for display
     * @param serializedANN
     */
    update: function(serializedANN) {
        this._initialize();

        var w = this.width;
        var h = this.height;
        var r = 30;
        var title = serializedANN[0];
        var layerWidth = w / (serializedANN.length - 1);
        var xAdjust = layerWidth / 2 - r;

        this._text([title + ' : ExpectedOutput: ' + serializedANN[1]], {
            x: w / 2,
            'text-anchor': 'middle',
            'font-size': '20px',
            y: 15
        });

        for (var i = 2; i < serializedANN.length; i++) {
            var layer = serializedANN[i];
            var nextLayer = serializedANN[i + 1];
            var neurons = layer.neurons;
            var neuronHeights = h / (neurons.length);

            // Draws the circles
            for (var cIdx = 0; cIdx < neurons.length; cIdx++) {
                var x = layerWidth * (i - 1) + xAdjust;
                var y = neuronHeights * cIdx + (neuronHeights / 2 - r);
                var n = neurons[cIdx];
                var color = 'white';

                if (n.bias) {
                    color = '#ccc';
                } else if (n.id.indexOf('Input') >= 0) {
                    color = '#015C65';
                } else if (n.id.indexOf('Output') >= 0) {
                    color = '#FF7800';
                }
                var options = {
                    cx: x,
                    cy: y,
                    r: r,
                    stroke: 'black',
                    'stroke-width': '2',
                    fill: color
                };

                this._circle(options);

                var info = [
                    'Input: ' + delimitDataDisplay(n.input),
                    'Output: ' + delimitDataDisplay(n.output),
                    'Error: ' + n.error
                ];

                //draws the lines and connection weights
                if (nextLayer) {
                    var nextNs = nextLayer.neurons;
                    var nextNeuronsHeight = h / (nextNs.length);
                    var w = [], dW = [];

                    for (var nIdx = 0; nIdx < nextNs.length; nIdx++) {

                        if (nextNs[nIdx].bias) {
                            continue;
                        }

                        var x2 = layerWidth * i + xAdjust;
                        var y2 = nextNeuronsHeight * nIdx + (nextNeuronsHeight / 2 - r);
                        var options = {
                            x1: x, y1: y,
                            x2: x2, y2: y2,
                            stroke: '#aaa',
                            'stroke-width': '2'
                        };

                        this._line(options);

                        w.push(delimitDataDisplay(nextNs[nIdx].w[cIdx]));
                        dW.push(delimitDataDisplay(nextNs[nIdx].deltaW[cIdx]));
                    }

                    info.push('Weights: ' + w.join('::'));
                    info.push('Delta Weights: ' + dW.join('::'));
                } // end next layer

                // Positions the text to the right of the neuron
                this._text(info, {
                    x: x + r * 2,
                    y: y - r
                });

            } // end neurons in current layer
        } // end serialize to d3
    },

    /**
     * Appends circle
     * @param options
     * @private
     */
    _circle: function(options) {
        var circle = this._svg.append('circle');
        this._mapAttributes(circle, options);

        return circle;
    },

    /**
     * Appends line
     * @param options
     * @private
     */
    _line: function(options) {
        var line = this._svg.append('line');
        this._mapAttributes(line, options);

        return line;
    },

    /**
     * Appends line
     * @param {String[]} lines
     * @param {{}} options
     * @private
     */
    _text: function(lines, options) {
        _.assign({
            'font-size': '15px'
        }, options);

        var text = this._svg.append('text');
        var lHeight = 20;
        var x = options.x;
        var y = options.y;

        this._mapAttributes(text, options);

        for (var i = 0; i < lines.length; i++) {
            text.append('tspan')
                .attr('x', x)
                .attr('y', y + i * lHeight)
                .text(lines[i]);
        }
        return text;
    },
    /**
     * Maps attributes to an svg element
     * @param {D3Element} svgEl
     * @param {{}} options
     * @private
     */
    _mapAttributes: function(svgEl, options) {
        for (var k in options) {
            svgEl.attr(k, options[k]);
        }
    }
};


module.exports = D3Visualizer;