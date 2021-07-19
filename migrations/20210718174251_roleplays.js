
exports.up = function(knex) {
  return knex.schema.createTable("roleplays", function(t) {
    //t.timestamps(false, false);
    t.string("created_at", 50);
    t.string("updated_at", 50);

    t.string("name", 255);
    t.string("sex", 1);
    t.string("age", 3);
    t.string("orientation",6);
    t.string("location", 255);

    t.text("message");

    t.boolean("used").defaultTo(false);
    
    t.primary(["name"]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable("roleplays");
};
