
'use strict'

const assert = require('assert')
const pg = require('../')

const config = 'postgres://hx@localhost/hx'

describe('## pg-then', () => {
  describe('# Pool', () => {

    it('invalid db uri', (done) => {
      pg.Pool('postgres://hx@localhost:3333/hx')
        .connect()
        .catch((err) => {
          assert.ok(err.code, 'ECONNREFUSED')
          done()
        })
    })

    it('invalid query', (done) => {
      pg.Pool(config)
        .query('invalid sql')
        .catch((err) => {
          assert.ok(err.message.startsWith('syntax error'))
          done()
        })
    })

    it('query', () => {
      return pg.Pool(config)
        .query('SELECT 1 AS count')
        .then((result) => {
          assert.equal(result.rowCount, 1)
          assert.equal(result.rows[0].count, 1)
        })
    })

    it('stream', done => {
      let rows = 0
      return pg.Pool(config)
        .stream('SELECT 1 AS count')
        .on('data', data => {
          rows++
          assert(rows === 1)
        })
        .on('end', () => done())
        .on('error', err => done(err))
    })
  })

  describe('# Client', () => {
    let client

    it('new client', (done) => {
      client = pg.Client(config)

      setTimeout(done, 1000)
    })

    it('invalid query', (done) => {
      client.query('invalid sql')
        .catch((err) => {
          assert.ok(err.message.startsWith('syntax error'))
          done()
        })
    })

    it('query', () => {
      return client.query('SELECT 1 AS count')
        .then((result) => {
          assert.equal(result.rowCount, 1)
          assert.equal(result.rows[0].count, 1)
          client.end()
        })
    })

    it('stream', done => {
      let rows = 0
      return client
        .stream('SELECT 1 AS count')
        .on('data', data => {
          rows++
          assert(rows === 1)
        })
        .on('end', () => done())
        .on('error', err => done(err))
    })
  })
})
