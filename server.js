var express = require('express');
var path = require('path');

var app = express()
    .use(express.static(path.join(__dirname, '/static')))
    .listen('3000');
