
'use strict'

const PassThrough = require('stream').PassThrough
const QueryStream = require('pg-query-stream')
const pg = require('pg')
const slice = [].slice

module.exports = {
  Client,
  Pool,
  pg
}

/**
 * Pool
 */

function Pool(config) {
  if (!(this instanceof Pool)) {
    return new Pool(config)
  }

  this.config = config
}

Pool.prototype.connect = function() {
  return new Promise((resolve, reject) => {
    pg.connect(this.config, (error, client, done) => {
      if (error) {
        done(error)
        reject(error)
        return
      }

      resolve({ client, done })
    })
  })
}

Pool.prototype.query = function() {
  const args = slice.call(arguments)

  return this.connect().then((pool) => {
    return new Promise((resolve, reject) => {
      const cb = (error, result) => {
        pool.done()

        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }

      args.push(cb)

      pool.client.query.apply(pool.client, args)
    })
  })
}

Pool.prototype.stream = function(text, value, options) {
  const stream = new PassThrough({
    objectMode: true
  })

  this.connect().then(pool => {
    const query = new QueryStream(text, value, options)
    const source = pool.client.query(query)
    source.on('end', cleanup)
    source.on('error', onError)
    source.on('close', cleanup)
    source.pipe(stream)

    function onError(err) {
      stream.emit('error', err)
      cleanup()
    }

    function cleanup() {
      pool.done()

      source.removeListener('end', cleanup)
      source.removeListener('error', onError)
      source.removeListener('close', cleanup)
    }
  }).catch(err => stream.emit('error', err))

  return stream
}

/**
 * Client
 */
function Client(config) {
  if (!(this instanceof Client)) {
    return new Client(config)
  }

  this._client = new pg.Client(config)
  this._client.connect((error) => {
    if (error) {
      throw error
    }
  })
}

Client.prototype.query = function() {
  const args = slice.call(arguments)

  return new Promise((resolve, reject) => {
    const cb = (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    }

    args.push(cb)

    this._client.query.apply(this._client, args)
  })
}

Client.prototype.stream = function(text, value, options) {
  const stream = new PassThrough({
    objectMode: true
  })

  const query = new QueryStream(text, value, options)
  const source = this._client.query(query)
  source.on('end', cleanup)
  source.on('error', onError)
  source.on('close', cleanup)
  source.pipe(stream)

  function onError(err) {
    stream.emit('error', err)
    cleanup()
  }

  function cleanup() {
    source.removeListener('end', cleanup)
    source.removeListener('error', onError)
    source.removeListener('close', cleanup)
  }

  return stream
}

Client.prototype.end = function() {
  this._client.end()
}
