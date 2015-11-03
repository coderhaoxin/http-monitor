'use strict';

let pg = require('pg');
let slice = [].slice;

exports.Client = Client;
exports.Pool = Pool;
exports.pg = pg;

/**
 * Pool
 */
function Pool(config) {
  if (!(this instanceof Pool)) {
    return new Pool(config);
  }

  this.config = config;
}

Pool.prototype.connect = function () {
  if (this.connection) {
    return Promise.resolve(this.connection);
  }

  if (this._connect) {
    return this._connect;
  }

  let self = this;

  this._connect = new Promise(function (resolve, reject) {
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
}

Pool.prototype.query = function() {
  let args = slice.call(arguments);
  let self = this;

  return this.connect().then(function () {
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

  this._client = new pg.Client(config);
  this._client.connect(function(error) {
    if (error) {
      throw error;
    }
  });
}

Client.prototype.query = function() {
  let args = slice.call(arguments);
  let self = this;

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
};

Client.prototype.end = function() {
  this._client.end();
};
