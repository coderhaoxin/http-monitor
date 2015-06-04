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
          client.end();
        });
    });

    it('query', function() {
      return client.query('SELECT 1 AS count')
        .then(function(result) {
          assert.equal(result.rowCount, 1);
          assert.equal(result.rows[0].count, 1);
          client.end();
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
