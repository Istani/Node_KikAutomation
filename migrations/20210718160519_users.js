
exports.up = function(knex) {
  return knex.schema.createTable("users", function(t) {
    //t.timestamps(false, false);
    t.string("created_at", 50);
    t.string("updated_at", 50);

    t.string("jid", 50);
    t.string("username", 255);
    t.string("displayName", 255);
    t.string("pic",255);
    
    t.primary(["jid"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("messages");
};
