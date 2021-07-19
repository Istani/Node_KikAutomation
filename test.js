const Messages_outgoing = require("./models/messages_outgoing.js");

async function main() {
  var msg={
    "from": "iamsubmiss_vtd@talk.kik.com",
    //"to": "thenerdytrap_nou@talk.kik.com",
    //"to": "jcsmith8085_mat@talk.kik.com",
    "to":"",
    "message":"no"
  }
  await Messages_outgoing.query().insert(msg);
  process.exit(0);
}
main();
