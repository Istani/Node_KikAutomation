
exports.up = function(knex) {
  return knex.schema.createTable("messages", function(t) {
    //t.timestamps(false, false);
    t.string("created_at", 50);
    t.string("updated_at", 50);


    t.string("from", 50);
    t.string("to", 50);
    t.text("message");
    
    t.primary(["created_at", "from", "to"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("messages");
};
