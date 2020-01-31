const fs = require("fs");
var envpath = __dirname + "/.env";
var config = require("dotenv").config({ path: envpath });

console.log("Comming Soon?");

/*
// https://www.npmjs.com/package/kik-node-api
const KikClient = require("kik-node-api");

Kik = new KikClient({
  username: "iamsubmiss",
  password: "pokemon11",
  promptCaptchas: true,
  trackUserInfo: true,
  trackFriendInfo: false,cd ..
});

Kik.connect();
Kik.on("authenticated", () => {
  console.log("Authenticated");
});

Kik.on("receivedgroupmsg", (group, sender, msg) => {
  console.log(group, sender, msg);
});
Kik.on("receivedgroupimg", (group, sender, img) => {
  console.log(group, sender, msg);
});

Kik.on("receivedprivatemsg", (sender, msg) => {
  console.log(sender, msg);
  Kik.sendPrivateMessage(sender.jid, msg, (delivered, read) => {
    if (delivered) {
      console.log("Delivered");
    } else if (read) {
      console.log("Read");
    }
  });
});
Kik.on("receivedprivateimg", (sender, msg, img) => {
  console.log(sender, msg, img);
});
*/
