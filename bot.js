const fs = require("fs");
var envpath = __dirname + "/.env";
var config = require("dotenv").config({ path: envpath });

//console.log("Comming Soon?");
const Debug = require("sk_colorfullog");
const debug = new Debug();

// https://www.npmjs.com/package/kik-node-api
const KikClient = require("kik-node-api");
const { nextTick } = require("process");

if (fs.existsSync("sessions")) {
  fs.rmdirSync("sessions", { recursive: true, force: true });
}

function start(user) {
  console.log(account_list[user]);

  var Kik = new KikClient({
    username: account_list[user],
    password: process.env.KIK_Passwort,
    promptCaptchas: false,
    trackUserInfo: false,
    trackFriendInfo: false,
    device: {
        
    },
    logger: {
      file: ["warning", "error", "info", "raw"],
      console: ["warning", "error", "info", "raw"]
    }
  });

  Kik.connect();
  //Kik.authenticate(process.env.KIK_Username, process.env.KIK_Passwort)
  Kik.on("authenticated", () => {
    debug.log("Authenticated","API");
  });

  Kik.on("receivedgroupmsg", (group, sender, msg) => {
    debug.log(sender.jid + ": " + msg,"receivedgroupmsg");
  });
  Kik.on("receivedgroupimg", (group, sender, img) => {
    debug.log(sender.jid + " send an Image!","receivedgroupimg");
		setTimeout(() => {SendImageBack(sender);}, 20000);
  });

  Kik.on("receivedprivatemsg", (sender, msg) => {
    debug.log(sender.jid + ": " + msg,"receivedprivatemsg");
    
  });
  Kik.on("receivedprivateimg", (sender, msg, img) => {
    debug.log(sender.jid + " send an Image!","receivedprivateimg");
    SendImageBack(sender, Kik);
  });
}

var account_list=[];
account_list.push("iamsubmiss");
//account_list.push("dickygirl69");
//account_list.push("sinep_sdrawkcab");

setTimeout(() => {start(0);}, 1000);
//setTimeout(() => {start(1);}, 5000);
//setTimeout(() => {start(2);}, 9000);

function SendImageBack(sender, client) {
  var folder_struct={};

  var img_folder="images";
  fs.readdirSync(img_folder).forEach(file => {  // istani
    var tmp1=img_folder+"/"+file;
    if(typeof folder_struct[file]=="undefined") folder_struct[file]={};
    fs.readdirSync(tmp1).forEach(file2 => { // private
      var tmp2=tmp1+"/"+file2;
      if(typeof folder_struct[file][file2]=="undefined") folder_struct[file][file2]={};
      fs.readdirSync(tmp2).forEach(file3 => { // user
        var tmp3=tmp2+"/"+file3;
        if(typeof folder_struct[file][file2][file3]=="undefined") folder_struct[file][file2][file3]={};
        fs.readdirSync(tmp3).forEach(file4 => { // file
          folder_struct[file][file2][file3][file4]="";
        });
      }); 
    }); 
  });
  var pics=[];
  for (var a in folder_struct) {
    var path="images/"+a;
    for (var t in folder_struct[a]) {
      var path2=path+"/"+t;
      for (var u in folder_struct[a][t]) {
        var path3=path2+"/"+u;        
          if (typeof sender != "undefined") {
            if (u!=sender.jid) {
              for (var f in folder_struct[a][t][u]) {
                pics.push(path3+"/"+f);
              }
            }
          } else {
            for (var f in folder_struct[a][t][u]) {
              pics.push(path3+"/"+f);
            }
          }
        }
      }
    }
  CheckImages(pics);
  var randompic=pics[Math.floor(Math.random() * pics.length)];
  var pic_path=randompic;
  if (typeof sender != "undefined") {
    //Kik.sendMessage(sender.jid, "Random Dirty Picture Roulett", (delivered, read) => {});
    client.sendImage(sender.jid, pic_path, false, false);
  }
  debug.log("Send " + pic_path);
}

const execSync = require('child_process').execSync;
function CheckImages(pics) {
  for (var idx in pics) {
    var mimeType = execSync('file --mime-type -b "' + pics[idx] + '"').toString();
    var ptype = mimeType.trim();
    switch (ptype) {
      case 'video/mp4':
        var tmp_file=pics[idx].replace("images", "videos").replace(".jpeg", ".avi");
        debug.error("Stupid File: " +tmp_file,"USER");
        var tmp_str=tmp_file.split("/",4);
        var tmp_path=tmp_str.join("/");
        fs.mkdirSync(tmp_path, {recursive: true});
        fs.renameSync( pics[idx], tmp_file);
        break;
      case 'image/jpeg':
        // Everything is good!
        break;
      default:
        debug.log("File? " +ptype,"USER");
    }
  }
}

//file --mime-type -b 
SendImageBack();
