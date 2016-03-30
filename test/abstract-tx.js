'use strict'

const assert = require('assert')
const pg = require('../')

describe('## pg-then', () => {
  describe('# transactional', () => {
    it('calls BEGIN and COMMIT on a resolved promise', () => {
      let query = (str) => {
        query[str] = true
        return Promise.resolve({})
      }

      let done = () => {
        done.called = true
      }

      let work = (client) => {
        return Promise.resolve()
      }

      return pg.transactional(query, done, work)
        .then(
          () => {
            assert.equal(query.BEGIN, true, 'BEGIN called')
            assert.equal(query.COMMIT, true, 'COMMIT called')
            assert.equal(query.ROLLBACK, undefined, 'ROLLBACK not called')
            assert.equal(done.called, true, 'The done function was called')
          },
          () => assert.fail('Transactional should resolve if work resolves')
        )
    })

    it('calls BEGIN and ROLLBACK on a rejected promise', () => {
      let query = (str) => {
        query[str] = true
        return Promise.resolve({})
      }

      let done = () => {
        done.called = true
      }

      let work = (client) => {
        return Promise.reject(new Error('Rejected'))
      }

      return pg.transactional(query, done, work)
        .then(
          () => assert.fail('Transactional should reject if work rejects'),
          () => {
            assert.equal(query.BEGIN, true, 'BEGIN called')
            assert.equal(query.COMMIT, undefined, 'COMMIT not called')
            assert.equal(query.ROLLBACK, true, 'ROLLBACK called')
            assert.equal(done.called, true, 'The done function was called')
          }
        )
    })

    it('handles an exception being thrown in the work callback', () => {
      let query = (str) => {
        query[str] = true
        return Promise.resolve({})
      }

      let done = () => {
        done.called = true
      }

      let work = (client) => {
        throw new Error('Rejected')
      }

      return pg.transactional(query, done, work)
        .then(() => assert.fail('Transactional should reject if work rejects'))
        .catch(() => {
          assert.equal(query.BEGIN, true, 'BEGIN called')
          assert.equal(query.COMMIT, undefined, 'COMMIT not called')
          assert.equal(query.ROLLBACK, true, 'ROLLBACK called')
          assert.equal(done.called, true, 'The done function was called')
        })
    })

    it('does not call COMMIT if COMMIT has already been called', () => {
      let query = (str) => {
        query[str] = true
        return Promise.resolve({})
      }

      let done = () => {
        done.called = true
      }

      let work = (client) => {
        return client.query('SELECT 1')
          .then(() => client.commit())
      }

      return pg.transactional(query, done, work)
        .then(() => {
          assert.equal(query.BEGIN, 1, 'BEGIN called')
          assert.equal(query.COMMIT, 1, 'COMMIT called exactly once')
        })
    })

    it('does not call COMMIT if ROLLBACK has already been called', () => {
      let query = (str) => {
        query[str] = true
        return Promise.resolve({})
      }

      let done = () => {
        done.called = true
      }

      let work = (client) => {
        return client.query('SELECT 1')
          .then(() => client.rollback())
      }

      return pg.transactional(query, done, work)
        .then(() => {
          assert.equal(query.BEGIN, 1, 'BEGIN called')
          assert.equal(query.COMMIT, undefined, 'COMMIT not called')
          assert.equal(query.ROLLBACK, 1, 'ROLLBACK called exactly once')
        })
    })

    it('does not call ROLLBACK if ROLLBACK has already been called', () => {
      let query = (str) => {
        query[str] = true
        return Promise.resolve({})
      }

      let done = () => {
        done.called = true
      }

      let work = (client) => {
        return client.query('SELECT 1')
          .then(() => client.rollback())
          .then(() => Promise.reject(new Error('Rejected')))
      }

      return pg.transactional(query, done, work)
        .catch(() => {
          assert.equal(query.BEGIN, 1, 'BEGIN called')
          assert.equal(query.ROLLBACK, 1, 'ROLLBACK called exactly once')
        })
    })

    it('does not call ROLLBACK if COMMIT has already been called', () => {
      let query = (str) => {
        query[str] = true
        return Promise.resolve({})
      }

      let done = () => {
        done.called = true
      }

      let work = (client) => {
        return client.query('SELECT 1')
          .then(() => client.commit())
          .then(() => Promise.reject(new Error('Rejected')))
      }

      return pg.transactional(query, done, work)
        .catch(() => {
          assert.equal(query.BEGIN, 1, 'BEGIN called')
          assert.equal(query.COMMIT, 1, 'COMMIT called exactly once')
          assert.equal(query.ROLLBACK, undefined, 'ROLLBACK not called')
        })
    })
  })
})
