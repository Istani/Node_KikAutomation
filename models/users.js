const { Model } = require("objection");
const Knex = require("knex");
const emoji = require("node-emoji");

const knex = Knex(require("../knexfile.js"));

Model.knex(knex);

class Obj extends Model {
  static get tableName() {
    return "users";
  }
  static get idColumn() {
    return "jid";
  }

  static get relationMappings() {
    const Messages = require("./messages.js");

    return {
      msg_in: {
        relation: Model.HasManyRelation,
        modelClass: Messages,
        join: {
          from: "users.jid",
          to: "messages.from"
        }
      }, 
      msg_out: {
        relation: Model.HasManyRelation,
        modelClass: Messages,
        join: {
          from: "users.jid",
          to: "messages.to"
        }
      }
    };
  }

  $beforeInsert() {
    this.$beforeUpdate();
    this.created_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
    this.displayName = emoji.unemojify(this.displayName);
  }
}

module.exports = Obj;
