const { Model } = require("objection");
const Knex = require("knex");
const emoji = require("node-emoji");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Obj extends Model {
  static get tableName() {
    return "roleplays";
  }
  static get idColumn() {
    return "name";
  }

  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    this.name = emoji.unemojify(this.name);
    this.message = emoji.unemojify(this.message);
    this.location = emoji.unemojify(this.location);
  }
}

module.exports = Obj;
