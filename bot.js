const fs = require("fs");
var envpath = __dirname + "/.env";
var config = require("dotenv").config({ path: envpath });

//console.log("Comming Soon?");
const Debug = require("sk_colorfullog");
const debug = new Debug();

// https://www.npmjs.com/package/kik-node-api
const KikClient = require("kik-node-api");
const { nextTick } = require("process");

const Messages = require("./models/messages.js");
const Users = require("./models/users.js");

var CronJob = require('cron').CronJob;
var job = new CronJob('0 */15 * * * *', function() {
  debug.log('You will see this message every 15 minutes',"console");
}, null, true, 'Europe/Berlin');
job.start();

var Queue = require('better-queue');
var q = new Queue(async function (input, cb) {
  await input();
  cb(null, true);

}, { batchSize: 1, afterProcessDelay: 2000 });

var count_users=0;
var count_pictures=0;

var admin_user="";
var logined_user="";

if (fs.existsSync("sessions")) {
  fs.rmdirSync("sessions", { recursive: true, force: true });
}

var Kik = new KikClient({
  promptCaptchas: false,
  trackUserInfo: false,
  trackFriendInfo: false,
  device: {

  },
  logger: {
    file: ["warning", "error", "info", "raw"],
    console: ["warning", "error", "info"]
  }
});

Kik.authenticate(process.env.KIK_Username, process.env.KIK_Passwort);

Kik.on("authenticated", () => {
  debug.log("Authenticated", "API");
  
  //file --mime-type -b 
  SendImageBack();

  q.push(() => {
    Kik.getUserInfo(process.env.KIK_Username, false, (users) => {
      logined_user=users[0].jid;
      debug.log("Set Logined User to: " + logined_user, "APP");
      checkUsers(logined_user);
    });
  });

  q.push(() => {
    Kik.getUserInfo("dickygirl69", false, (users) => {
      admin_user=users[0].jid;
      SendMessageBack(admin_user,"Status - Users: " + count_users + " Picture: " + count_pictures);
      debug.log("Set Admin User to: " + admin_user, "APP");
      checkUsers(admin_user);
    });
  });
});

Kik.on("receivedgroupmsg", async (group, sender, msg) => {
  debug.log(sender + ": " + msg, "receivedgroupmsg");
  await Messages.query().insert({"from": group, "to": logined_user, "message":sender+": "+msg});
  checkUsers(sender);
});
Kik.on("receivedgroupimg", async (group, sender, img) => {
  debug.log(sender + " send "+img+"!", "receivedgroupimg");
  SendImageBack(group,Kik);
  await Messages.query().insert({"from": group, "to": logined_user, "message":sender+': <img src="'+img+'">'});
  checkUsers(sender);
});

Kik.on("receivedprivatemsg", async (sender, msg) => {
  debug.log(sender + ": " + msg, "receivedprivatemsg");
  await Messages.query().insert({"from": sender, "to": logined_user, "message":msg});
  checkUsers(sender);
});
Kik.on("receivedprivateimg", async (sender, img) => {
  debug.log(sender + " send "+img+"!", "receivedprivateimg");
  SendImageBack(sender, Kik);
  if (admin_user!=sender) {
    //SendMessageBack(admin_user, "Form "+sender+": ");
    q.push(() => {
      Kik.sendImage(admin_user, __dirname + "/" + img);
    });
    
    await Messages.query().insert({"from": logined_user, "to": admin_user, "message":'<img src="'+img+'">'});
  }
  await Messages.query().insert({"from": sender, "to": logined_user, "message":'<img src="'+img+'">'});
  checkUsers(sender);
});

async function SendMessageBack(sender, msg) {
  await Messages.query().insert({"from": logined_user, "to": sender, "message":msg});
  q.push(() => {
    Kik.sendMessage(sender, msg);
  });
}
async function SendImageBack(sender, client) {
  const path_class=require("path");
  var folder_struct = {};

  var img_folder = path_class.join("images");
  count_users=0;
  count_pictures=0;
  if (!fs.existsSync(img_folder)) {
    return;
  }
  fs.readdirSync(img_folder).forEach(file => {  // istani
    var tmp1 = path_class.join(img_folder ,file);
    if (typeof folder_struct[file] == "undefined") folder_struct[file] = {};
    fs.readdirSync(tmp1).forEach(file2 => { // private
      var tmp2 = path_class.join(tmp1, file2);
      if (typeof folder_struct[file][file2] == "undefined") folder_struct[file][file2] = {};
      fs.readdirSync(tmp2).forEach(file3 => { // user
        count_users++;
        var tmp3 = path_class.join(tmp2, file3);
        if (typeof folder_struct[file][file2][file3] == "undefined") folder_struct[file][file2][file3] = {};
        fs.readdirSync(tmp3).forEach(file4 => { // file
          count_pictures++
          folder_struct[file][file2][file3][file4] = "";
        });
      });
    });
  });
  var pics = [];
  for (var a in folder_struct) {
    var path = path_class.join("images", a);
    for (var t in folder_struct[a]) {
      var path2 = path_class.join(path, t);
      for (var u in folder_struct[a][t]) {
        var path3 = path_class.join(path2, u);
        if (typeof sender != "undefined") {
          if (u != sender) {
            for (var f in folder_struct[a][t][u]) {
              pics.push(path_class.join(path3, f));
            }
          }
        } else {
          for (var f in folder_struct[a][t][u]) {
            pics.push(path_class.join(path3, f));
          }
        }
      }
    }
  }
  //CheckImages(pics);
  var randompic = pics[Math.floor(Math.random() * pics.length)];
  var pic_path = randompic;
  if (typeof sender != "undefined" && typeof pic_path != "undefined") {
    //SendMessageBack(sender.jid, "Random Dirty Picture Roulett", (delivered, read) => {});
      q.push(() => {
        client.sendImage(sender, pic_path, false, false);
      });
      debug.log("Send " + pic_path + " to " + sender, "SENDEDPRIVATEIMG");
      await Messages.query().insert({"from": logined_user, "to": sender, "message":'<img src="./'+pic_path+'">'});
  }
}

const execSync = require('child_process').execSync;
function CheckImages(pics) {
  for (var idx in pics) {
    // ToDo: Find a solution for windows!
    var mimeType = execSync('file --mime-type -b "' + pics[idx] + '"').toString();
    var ptype = mimeType.trim();
    switch (ptype) {
      case 'video/mp4':
        var tmp_file = pics[idx].replace("images", "videos");
        debug.error("Stupid File: " + tmp_file, "USER");
        var tmp_str = tmp_file.split("/", 4);
        var tmp_path = tmp_str.join("/");
        fs.mkdirSync(tmp_path, { recursive: true });
        fs.renameSync(pics[idx], tmp_file);
        break;
      case 'image/jpeg':
        // Everything is good!
        break;
      default:
        debug.log("File? " + ptype, "USER");
    }
  }
}

async function checkUsers(jid) {
  const u = await Users.query().where("jid",jid);
  q.push(() => {
    Kik.getUserInfo(jid, false, async (users) => {
      if (u.length==0) {
        debug.log("Added new User: "+jid, "APP");
        await Users.query().insert(users[0]);
      } else {
        await Users.query().patch(users[0]).where("jid", users[0].jid);
      }
    });
  });
}