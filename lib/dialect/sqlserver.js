'use strict';

var util = require('util');
var assert = require('assert');
var _ = require('lodash');

var SqlServer = function() {
  this.output = [];
  this.params = [];
  this._hasAddedAColumn = false;
};

var Postgres = require(__dirname + '/postgres');

util.inherits(SqlServer, Postgres);

SqlServer.prototype._myClass = SqlServer;

SqlServer.prototype._getParameterValue = function(value) {
  if ('string' === typeof value) {
    return this._quoteString(value);
  } else {
    return SqlServer.super_.prototype._getParameterValue.call(this, value);
  }
};

SqlServer.prototype._getParameterPlaceholder = function(index, value) {
  /* jshint unused: false */
  return '@' + (index-1);
};

SqlServer.prototype._quoteString = function(word) {
  return "'" + word.replace("'", "''") + "'";
};

SqlServer.prototype.quote = function(word) {
  return '[' + word + ']';
};

SqlServer.prototype.visitQuery = function(queryNode) {
  // TODO: Gah, this support for offset and limit is a huge hack.
  // This really needs a lot of changes to the node-sql core to make it nicer.
  var oldNodes = [].concat(queryNode.nodes);

  var limits = _.remove(queryNode.nodes, function(node) { return node.type === 'LIMIT'; });
  var offsets = _.remove(queryNode.nodes, function(node) { return node.type === 'OFFSET'; });

  if (limits.length || offsets.length) {
    var select = "ROW_NUMBER() OVER (" + (this._orderBy ? this.visit(this._orderBy) : "(ORDER BY (SELECT 0))") +  ") as _row_num";
    queryNode.select(select);
  }

  var sql = SqlServer.super_.prototype.visitQuery.call(this, queryNode);

  queryNode.nodes = oldNodes;

  if (limits.length || offsets.length) {
    _.remove(queryNode._select.nodes, function(node) { return node.type === 'TEXT' && node.text === select; })

    sql = ["SELECT _t.* FROM (" + sql.join(" ") + ") as _t WHERE"];

    var firstRow = offsets.length ? offsets[0].count + 1 : 1;
    var lastRow = limits.length ? limits[0].count - 1 + firstRow : undefined;

    if (lastRow !== undefined) {
      sql.push("_row_num BETWEEN " + firstRow + " AND " + lastRow);
    } else {
      sql.push("_row_num >= " + firstRow);
    }
  }

  return sql;
};

module.exports = SqlServer;
