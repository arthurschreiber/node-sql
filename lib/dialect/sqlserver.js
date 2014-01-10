'use strict';

var util = require('util');
var assert = require('assert');

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

module.exports = SqlServer;
