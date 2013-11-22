var dp = require('./data/project4_data/data-parser');
var args = process.argv;

dp[args[2]](ready);
function ready(data, numberOfInputs, numberOfOutputs) {
    for (var i = 0; i < 10; i++) {
        console.log(data[i]);
    }
}

function storeData(filename, data, callback) {
    fs.appendFile('./data/project4_data/results/' + filename + '.csv', data + '\n', function (err) {
        if (err) {
            console.log(err);
        } else {
            if (callback) {
                callback.apply();
            }
        }
    });
}