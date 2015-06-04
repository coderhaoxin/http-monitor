'use strict';

const pg = require('pg');
const slice = [].slice;

exports.Client = Client;
exports.Pool = Pool;

/**
 * Pool
 */
function Pool(config) {
  if (!(this instanceof Pool)) {
    return new Pool(config);
  }

  this.config = config;
}

Pool.prototype.connect = function() {
  if (this.connection) {
    return Promise.resolve(this.connection);
  }

  if (this._connect) {
    return this._connect;
  }

  let self = this;

  this._connect = new Promise(function(resolve, reject) {
    pg.connect(self.config, function(error, client, done) {
      if (error) {
        return reject(error);
      }

      self._client = client;
      self._done = done;

      delete self._connect;

      resolve();
    });
  });

  return this._connect;
};

Pool.prototype.query = function() {
  let args = slice.call(arguments);
  let self = this;

  return this.connect().then(function() {
    return new Promise(function(resolve, reject) {
      let cb = function(error, result) {
        self._done();

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };
      args.push(cb);

      self._client.query.apply(self._client, args);
    });
  });
};

/**
 * Client
 */
function Client(config) {
  if (!(this instanceof Client)) {
    return new Client(config);
  }

  this.config = config;
}

Client.prototype.connect = function() {
  if (this.connection) {
    return Promise.resolve(this.connection);
  }

  if (this._connect) {
    return this._connect;
  }

  let self = this;

  this._connect = new Promise(function(resolve, reject) {
    self._client = new pg.Client(self.config);
    self._client.connect(function(error) {
      if (error) {
        return reject(error);
      }
      delete self._connect;
      resolve();
    });
  });

  return this._connect;
};

Client.prototype.query = function() {
  let args = slice.call(arguments);
  let self = this;

  return this.connect().then(function() {
    return new Promise(function(resolve, reject) {
      let cb = function(error, result) {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };
      args.push(cb);

      self._client.query.apply(self._client, args);
    });
  });
};

Client.prototype.end = function() {
  this._client.end();
};
