var express = require('express');
var path = require('path');
var fs = require('fs');
var app = express();

app.get('/data/store/:filename/:data', function(req, res) {
    fs.appendFile('data/' + req.params.filename + '.csv', req.params.data + '\n', function (err) {
        if (err) {
            console.log(req.params.data + '\n ');
        }
        res.end();
    });
});

app.use(express.static(path.join(__dirname, '/static')))
    .listen('3000');
