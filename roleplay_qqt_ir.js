const fs = require("fs");
var envpath = __dirname + "/.env";
var config = require("dotenv").config({ path: envpath });


const Debug = require("sk_colorfullog");
const debug = new Debug();
debug.log("test","moin");
const request = require("request");
//

var repeat_time = 0;
var last_post_id = 0;

var data = [];
try {
  data = require("./tmp/profiles.json");
} catch (e) {
  console.log(e);
  process.exit(1);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function RollePlayRequest() {
  var post = false;
  var url = "https://kikroleplay.com/api/send";
  last_post_id++;
  if (last_post_id >= data.length) {
    last_post_id = 0;
  }
  request.post(
    {
      url: url,
      //qs: { do: "send", data: data[last_post_id] },
    },
    function (error, response, body) {
      if (error) {
        console.error(error);
        setTimeout(() => {
          RollePlayRequest();
        }, 1000);
        return;
      }
      //console.log(body);
      fs.writeFileSync("tmp/response.json", JSON.stringify(response, null, 2));
      process.exit(1);

      if (body.startsWith('<div class="alert alert-success">Your post has been successfully sent.')) {
        post = true;
        repeat_time -= 5 + getRandomInt(10);
      } else {
        repeat_time += 10 + getRandomInt(20);
      }

      // Min Max

      if (repeat_time < 300) {
        repeat_time = getRandomInt(2) * 60;
      }
      if (repeat_time > 30 * 60) {
        repeat_time = getRandomInt(30) * 60;
      }

      if (post) {
        console.log(data[last_post_id].user, "Successfully", "Next in " + repeat_time + " Seconds");
      } else {
        //console.log(data[last_post_id].user, "Failed", "Next in " + repeat_time + " Seconds", "\n\r" + body);
        console.log(body);
      }
      setTimeout(() => {
        RollePlayRequest();
      }, repeat_time * 1000);
    }
  );
}

RollePlayRequest();
