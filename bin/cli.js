#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require('fs');
const zip = require("../lib/gitzip.js");
const {execSync} = require('child_process');

function TemplateEngine(tpl, data) {
  var re = /\[([^\]]+)?\]/, match;
  while(match = re.exec(tpl)) {
    tpl = tpl.replace(match[0], data[match[1]])
  }
  return tpl;
}

var yargonaut = require("yargonaut")
  .style("blue")
  .font("Small Slant")
  .helpStyle("green")
  .errorsStyle("red");

var chalk = yargonaut.chalk();
const cwd = process.cwd();
var argv = require("yargs")
  .usage("\nUsage: gitzip [options]")
  .example("gitzip -s . -d .")
  .option("source", {
    alias: "s",
    default: ".",
    describe: "path of the folder to archive"
  })
  .option("destination", {
    alias: "d",
    default: '.',
    describe: "the output zip file directory"
  })
  .option("name", {
    alias: "n",
    default: '[name]-[version].zip',
    describe: "the output zip file name format"
  })
  .option("exclude", {
    alias: "x",
    type: "array",
    describe: "excludes the file/folder based on pattern"
  })
  .option("include", {
    alias: "i",
    type: "array",
    describe:
      "includes the file/folder based on pattern, include has more priority than exclude"
  })
  .help("help")
  .wrap(null)
  .strict()
  .alias("help", "h").argv;
const packageJson = JSON.parse(fs.readFileSync(path.resolve(cwd,'package.json')).toString())

const now = new Date()
const dt = now.toISOString().split('T')

const date = dt[0]
const time = dt[1].substring(0,8).split(':').join("\ua789")
const idx = packageJson.name.indexOf('/')
const packageName = packageJson.name.indexOf('@')!== -1 && idx !== -1 ? packageJson.name.substring(idx+1) : packageJson.name
const data = {
  name: packageJson.productName || packageName,
  productName: packageJson.productName,
  version: packageJson.version,
  date: date,
  time: time,
  hash:  execSync('git rev-parse --short HEAD', {encoding: 'utf8'})
}
const filename = TemplateEngine(argv.name, data)
const outputPath = path.resolve(cwd, argv.destination,filename);

const options = {
  source: argv.source,
  destination: outputPath
};
if (argv.exclude) {
  options.ignore = argv.exclude;
}
if (argv.include) {
  options.include = argv.include;
}
console.info(
  chalk.yellow(`Archiving "${options.source}" to "${options.destination}"`)
);

zip(options)
  .then(function() {
    console.log(chalk.green(`Zip file ready at ${outputPath}`));
  })
  .catch(function(err) {
    console.log(chalk.red(err.message));
    process.exit(1);
  });
