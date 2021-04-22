const fs = require('fs');
const path = require('path');
const inputFolder = path.join(__dirname, './input');
const outputFolder = path.join(__dirname, './output');
const solver = require('./solver');

const getOutput = async () => {
  try {
    var result = {};
    result.input = {};
    result.input.distanceMatrix = JSON.parse(fs.readFileSync(path.join(inputFolder, './distanceMatrix.json')));
    result.input.services = JSON.parse(fs.readFileSync(path.join(inputFolder, './services.json')));
    result.input.resources = JSON.parse(fs.readFileSync(path.join(inputFolder, './resources.json')));
    result.output = await solver(result.input);
    return result;
  } catch (err) {
    console.log(err);
    throw "Failed to get output!";
  }

};

getOutput()
  .then(res => {
    const resultPath = path.join(outputFolder, './result.json');
    console.log(`Saving result at: ${resultPath}`);
    fs.writeFile(resultPath, JSON.stringify(res), err => {
      if (err) console.log(err);
      else {
        var stats = fs.statSync(resultPath);
        var fileSizeInBytes = stats.size;
        // Convert the file size to megabytes (optional)
        var fileSizeInMegabytes = fileSizeInBytes / (1024*1024);
        console.log(`Route was succesfully saved at: ${resultPath}. Size:${fileSizeInMegabytes}Mb`);
      }
    });
  })
  .catch(err => console.log(err));



