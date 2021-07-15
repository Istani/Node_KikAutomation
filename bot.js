const fs = require("fs");
var envpath = __dirname + "/.env";
var config = require("dotenv").config({ path: envpath });

//console.log("Comming Soon?");
const Debug = require("sk_colorfullog");
const debug = new Debug();

// https://www.npmjs.com/package/kik-node-api
const KikClient = require("kik-node-api");
const { nextTick } = require("process");

var count_users=0;
var count_pictures=0;

if (fs.existsSync("sessions")) {
  fs.rmdirSync("sessions", { recursive: true, force: true });
}

var Kik = new KikClient({
  username: process.env.KIK_Username,
  password: process.env.KIK_Passwort,
  promptCaptchas: false,
  trackUserInfo: false,
  trackFriendInfo: false,
  device: {

  },
  logger: {
    file: ["warning", "error", "info", "raw"],
    console: ["error"]
  }
});

Kik.connect();
//Kik.authenticate(process.env.KIK_Username, process.env.KIK_Passwort)
Kik.on("authenticated", () => {
  debug.log("Authenticated", "API");
  
  setTimeout(
    () => {
      Kik.getUserInfo("dickygirl69", false, (users) => {
        //console.log(users);
        Kik.sendMessage(users[0].jid,"Status - Users: " + count_users + " Picture: " + count_pictures);
      });
    }, 10000
  )
  
});

Kik.on("receivedgroupmsg", (group, sender, msg) => {
  debug.log(sender.jid + ": " + msg, "receivedgroupmsg");
});
Kik.on("receivedgroupimg", (group, sender, img) => {
  debug.log(sender.jid + " send an Image!", "receivedgroupimg");
  SendImageBack(sender,Kik);
});

Kik.on("receivedprivatemsg", (sender, msg) => {
  debug.log(sender.jid + ": " + msg, "receivedprivatemsg");

});
Kik.on("receivedprivateimg", (sender, msg, img) => {
  debug.log(sender.jid + " send an Image!", "receivedprivateimg");
  SendImageBack(sender, Kik);
});

function SendImageBack(sender, client) {
  const path_class=require("path");
  var folder_struct = {};

  var img_folder = path_class.join("images");
  count_users=0;
  count_pictures=0;
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
          if (u != sender.jid) {
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
  CheckImages(pics);
  var randompic = pics[Math.floor(Math.random() * pics.length)];
  var pic_path = randompic;
  if (typeof sender != "undefined" && typeof pic_path != "undefined") {
    //Kik.sendMessage(sender.jid, "Random Dirty Picture Roulett", (delivered, read) => {});
    client.sendImage(sender.jid, pic_path, false, false);
    debug.log("Send " + pic_path + " to " + sender.jid);
  }
  
}

const execSync = require('child_process').execSync;
function CheckImages(pics) {
  for (var idx in pics) {
    var mimeType = execSync('file --mime-type -b "' + pics[idx] + '"').toString();
    var ptype = mimeType.trim();
    switch (ptype) {
      case 'video/mp4':
        var tmp_file = pics[idx].replace("images", "videos").replace(".jpeg", ".avi");
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

//file --mime-type -b 
SendImageBack();
