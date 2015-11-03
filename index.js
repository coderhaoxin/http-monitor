'use strict';

const pg = require('pg');
const slice = [].slice;

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
  this._clients = [];
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
      self._clients.push(self._client);
      setImmediate(function() {
        self.release();
      });

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

Client.prototype.release = function(force) {
  let self = this;

  if (force && this._client) {
    this._client.end();
  }

  this._clients.forEach(function(client, index) {
    if (force || client.queryQueue.length === 0) {
      client.end();
      self._clients.splice(index, 1);
    }
  });
};
