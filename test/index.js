'use strict';

const assert = require('assert');
const pg = require('..');

const config = 'postgres://hx@localhost/hx';

describe('## pg-then', function() {
  describe('# Pool', function() {
    let pool = pg.Pool(config);

    it('query', function() {
      return pool.query('SELECT 1 AS count')
        .then(function(result) {
          assert.equal(result.rowCount, 1);
          assert.equal(result.rows[0].count, 1);
        });
    });

    it('query', function() {
      return pool.query('SELECT 1 AS count')
        .then(function(result) {
          assert.equal(result.rowCount, 1);
          assert.equal(result.rows[0].count, 1);
        });
    });
  });

  describe('# Client', function() {
    let client = pg.Client(config);

    it('query', function() {
      return client.query('SELECT 1 AS count')
        .then(function(result) {
          assert.equal(result.rowCount, 1);
          assert.equal(result.rows[0].count, 1);
        });
    });

    it('query', function() {
      return client.query('SELECT 1 AS count')
        .then(function(result) {
          assert.equal(result.rowCount, 1);
          assert.equal(result.rows[0].count, 1);
        });
    });

    it('query', function() {
      function query(sql, delay) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            client.query(sql)
              .then(resolve, reject);
          }, delay);
        });
      }

      return Promise.all([
        client.query('SELECT 1 AS count, pg_sleep(0.3)'),
        client.query('SELECT 1 AS count'),
        query('SELECT 1 AS count, pg_sleep(0.3)', 500),
        query('SELECT 1 AS count', 500),
        query('SELECT 1 AS count, pg_sleep(0.3)', 1000),
        query('SELECT 1 AS count', 1000)
      ])
      .then(function(results) {
        assert.equal(results.length, 6);
        assert.equal(client._clients.length, 1);

        results.forEach(function(result) {
          assert.equal(result.rows[0].count, 1);
        });

        client.release(true);

        return new Promise(function(resolve) {
          setTimeout(resolve, 100);
        });
      })
      .then(function() {
        assert.equal(client._clients.length, 0);
      });
    });
  });

  describe('# error', function() {
    it('pool connect error', function(done) {
      pg.Pool('postgres://xx@localhost/xx')
        .query('SELECT 1 AS count')
        .catch(function(error) {
          assert.ok(error instanceof Error);
          done();
        });
    });

    it('client connect error', function(done) {
      pg.Client('postgres://xx@localhost/xx')
        .query('SELECT 1 AS count')
        .catch(function(error) {
          assert.ok(error instanceof Error);
          done();
        });
    });

    it('pool query error', function(done) {
      pg.Pool(config)
        .query('SYNTAX ERROR')
        .catch(function(error) {
          assert.ok(error instanceof Error);
          done();
        });
    });

    it('client query error', function(done) {
      pg.Client(config)
        .query('SYNTAX ERROR')
        .catch(function(error) {
          assert.ok(error instanceof Error);
          done();
        });
    });
  });
});
