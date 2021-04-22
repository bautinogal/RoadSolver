const fs = require('fs');
const path = require('path');
const outputFolder = path.join(__dirname, './output');

console.log("");
console.log(`Reading file...`);
console.log("");

const file = JSON.parse(fs.readFileSync(path.join(outputFolder, './result.json')));
const branches = file.output.posibleRoutesBranches;

console.log(`Branches COUNT: ${branches.length}`);
console.log("");
var highestCost = -9999999999;
var lowestCost = 9999999999;
var bestBranch = null;
var worstBranch = null;

var differentTotals = [];

branches.forEach(branch => {
  if (!differentTotals.includes(branch.cost.total)) differentTotals.push(branch.cost.total);
  if (branch.cost.total < lowestCost) {
    lowestCost = branch.cost.total;
    bestBranch = branch;
  };
  if(branch.cost.total > highestCost) {
    highestCost = branch.cost.total;
    worstBranch = branch;
  };
});

console.log(`Different Totals: `);
console.log(differentTotals);
console.log("");

console.log(`BEST branch: `);
console.log(bestBranch);
console.log("");

console.log(`WORST branch: `);
console.log(worstBranch)
console.log("");