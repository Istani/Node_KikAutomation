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
const Roleplays = require("./models/roleplays.js");
const Messages_outgoing = require("./models/messages_outgoing.js");

var CronJob = require('cron').CronJob;
var job = new CronJob('0 */16 * * * *', async function() {
  debug.log("Search new Game","PictureRoulette");
  //await Roleplays.query().insert({"name": "Istani"});
  var list_possibles=await Roleplays.query().where("used", false).orderBy("sex").orderBy("age").orderBy("updated_at");
  if (list_possibles.length>0) {
    var receiver = list_possibles[0];
    Kik.getUserInfo(receiver.name, false, async (users) => {
      var user=users[0].jid;
      debug.log("Start with: " + user, "PictureRoulette");
      checkUsers(jid);
      receiver.used=true;
      await Roleplays.query().patch(receiver).where("name", receiver.name);
    });
  }
}, null, true, 'Europe/Berlin');
job.start();

// ToDo: Why outgoing?
var job2 = new CronJob('0 * * * * *', async function() {
  var list_msgs=await Messages_outgoing.query().where("from", logined_user);
  if (list_msgs.length>0) {
    var message=list_msgs[0];
    SendMessageBack(message.to,message.message);
    debug.log("Send to "+message.to + ": "+message.message,"sendedprivatemsg");
    await Messages_outgoing.query().delete().where(message);
  }
}, null, true, 'Europe/Berlin');
job2.start();


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
    console: ["error"]
  }
});

Kik.authenticate(process.env.KIK_Username, process.env.KIK_Passwort);

Kik.on("authenticated", () => {
  debug.log("Authenticated", "API");
  
  //file --mime-type -b 
  SendImageBack();

  q.push(() => {
    Kik.getUserInfo("dickygirl69", false, (users) => {
      admin_user=users[0].jid;
      SendMessageBack(admin_user,"Status - Users: " + count_users + " Picture: " + count_pictures);
      debug.log("Set Admin User to: " + admin_user, "APP");
      checkUsers(admin_user);
    });
  });

  q.push(() => {
    Kik.getUserInfo(process.env.KIK_Username, false, (users) => {
      logined_user=users[0].jid;
      debug.log("Set Logined User to: " + logined_user, "APP");
      checkUsers(logined_user);
    });
  });
});

Kik.on("receivedgroupmsg", async (group, sender, msg) => {
  debug.log(sender + ": " + msg, "receivedgroupmsg");
  var tmp=await Messages.query().insert({"from": group, "to": logined_user, "message":sender+": "+msg});
  sendMsg(tmp);
  checkUsers(sender);
});
Kik.on("receivedgroupimg", async (group, sender, img) => {
  debug.log(sender + " send "+img+"!", "receivedgroupimg");
  SendImageBack(group,Kik);
  var tmp=await Messages.query().insert({"from": group, "to": logined_user, "message":sender+': <img src="'+img+'">'});
  sendMsg(tmp);
  checkUsers(sender);
});

Kik.on("receivedprivatemsg", async (sender, msg) => {
  debug.log(sender + ": " + msg, "receivedprivatemsg");
  var tmp=await Messages.query().insert({"from": sender, "to": logined_user, "message":msg});
  sendMsg(tmp);
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
  var tmp = await Messages.query().insert({"from": sender, "to": logined_user, "message":'<img src="'+img+'">'});
  sendMsg(tmp);
  checkUsers(sender);
});

async function SendMessageBack(sender, msg) {
  
  q.push(async () => {
    var tmp=await Messages.query().insert({"from": logined_user, "to": sender, "message":msg});
    sendMsg(tmp);
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
  CheckImages(pics);
  var randompic = pics[Math.floor(Math.random() * pics.length)];
  var pic_path = randompic;
  if (typeof sender != "undefined" && typeof pic_path != "undefined") {
    //SendMessageBack(sender.jid, "Random Dirty Picture Roulett", (delivered, read) => {});
      q.push(() => {
        client.sendImage(sender, pic_path, false, false);
      });
      debug.log("Send " + pic_path + " to " + sender, "SENDEDPRIVATEIMG");
      var tmp=await Messages.query().insert({"from": logined_user, "to": sender, "message":'<img src="./'+pic_path+'">'});
      sendMsg(tmp);
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
        var greetings="Excuse me. I am sorry to use your time, but i want to start a game! PictureRoulette - You send a funny, sexy picture of yourself and get back a random picture from someone else (for everyone you send)... (well don't have to be yourself but i would prefer it) There are currently "+count_users+" Players with "+count_pictures+" Pictures (Inclueding myself) It's all anonymous and of course there is a kind of bot included in this... So it could take some time before i answer to your questions or texts...";
        SendMessageBack(jid,greetings);
      } else {
        await Users.query().patch(users[0]).where("jid", users[0].jid);
      }
    });
  });
}

async function sendMsg(msg) {
  io.emit("msg",msg);
}

const express = require('express');
const exphbs = require("express-handlebars");
const app = express();
var hbs = exphbs.create({
  helpers: {},
  defaultLayout: "main",
  extname: ".hbs",
  allowProtoPropertiesByDefault: true
});
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

const server = require('http').createServer(app);

var io = require("socket.io")(server, {
  cors: {
    origin: "*"
  }
});
io.on("connection", async function(socket) {
  debug.log("Incomming Connection", "socket");
  var msgs = await Messages.query().where("to", logined_user).orWhere("from",logined_user);
  socket.emit("login",logined_user);
  socket.emit("msgs",msgs);
  socket.on("disconnect", function() {});
});

app.use(express.static("public"));
app.use('/images', express.static(__dirname + '/images'));
app.use('/videos', express.static(__dirname + '/videos'));
app.use(function(req, res, next) {

  if (fs.existsSync("./tmp/req.json") == false) {
    //fs.writeFileSync("./tmp/req.json", JSON.stringify(req));
  }
  if (fs.existsSync("./tmp/res.json") == false) {
    //fs.writeFileSync("./tmp/res.json", JSON.stringify(res));
  }
  console.log("REQ:", __dirname +req.url);
  
  next();
});

app.get("/", async function(req, res, next) {
  res.render("main", {} );
});

server.listen(3000, () => console.log("Webinterface running! Port: " + 3000));
