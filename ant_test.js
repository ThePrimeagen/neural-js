var dp = require('./data/project4_data/data-parser');
var args = process.argv;

dp[args[2]](ready);
function ready(data, numberOfInputs, numberOfOutputs) {
    for (var i = 0; i < 10; i++) {
        console.log(data[i]);
    }
}
