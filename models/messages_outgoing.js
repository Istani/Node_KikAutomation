const { Model } = require("objection");
const Knex = require("knex");
const emoji = require("node-emoji");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Obj extends Model {
  static get tableName() {
    return "messages_outgoing";
  }
  static get idColumn() {
    return "created_at, from, to";
  }

  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    this.message = emoji.unemojify(this.message);
  }
}

module.exports = Obj;
