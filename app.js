process.chdir(__dirname);
const package_info = require("./package.json");
var software = package_info.name + " (V " + package_info.version + ")";
console.log(software);
console.log("=".repeat(software.length));

const fs = require("fs");
var envpath = __dirname + "/.env";
var config = require("dotenv").config({ path: envpath });
var config_example = "";
if (fs.existsSync(".env")) {
  for (var attributename in config.parsed) {
    config_example += attributename + "=\r\n";
  }
  fs.writeFileSync(".env.example", config_example);
}

const { spawn } = require("child_process");

const roleplay = spawn("node", ["roleplay_qqt_ir.js"]);
const bot = spawn("node", ["bot.js"]);

roleplay.stdout.on("data", data => {
  console.log(`roleplay: ${data}`);
});

roleplay.stderr.on("data", data => {
  console.error(`roleplay: ${data}`);
});

roleplay.on("close", code => {
  process.exit(1);
});

bot.stdout.on("data", data => {
  console.log(`bot: ${data}`);
});

bot.stderr.on("data", data => {
  console.error(`bot: ${data}`);
});

bot.on("close", code => {
  //process.exit(1);
});
