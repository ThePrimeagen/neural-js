var RxData = require('rx-data');
var filter = process.argv[2] || 'f.csv';
var dir = process.argv[3] || './data';

RxData.correlation(dir, filter, 0, 2).subscribe(function(res) {
    console.log([res[0], ': ', res[1]]);
});