var rxData = require('rx-data');
var fs = require('fs');

var MLP = 'MLP';
var RBF = 'RBF';
var ANFIS = 'ANFIS';
var n = [20, 40, 60, 80, 100];
var l = [1, 2];
var files = ['op', 'lr'];


function readyMLP() {
    if (err) {
        console.log('ERR!!: ' + err);
    } else {

        var lines = res.split('\n');
        var precision = lines[0].split(',');
        var recall = lines[1].split(',');
        var avgPrec = 0, avgRec = 0;
        for (var i = 0; i < precision.length; i++) {
            avgPrec += precision[i];
            avgRec += recall[i];
        }

        avgPrec /= i;
        avgRec /= i;

        fs.appendFile('correlation/' + name + '.csv', function() {});
    }
}

function readFile(name, callback) {
    fs.readFile(name, function(err, res) {
        callback(res);
    });
}
