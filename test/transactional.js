'use strict'

const assert = require('assert')
const pg = require('../')

const config = 'postgres://hx@localhost/hx'

describe('transactional', () => {
  before(() => {
    return pg.Pool(config).query('CREATE TABLE account (id int, amount int)')
  })

  after(() => {
    return pg.Pool(config).query('DROP TABLE account')
  })

  beforeEach(() => {
    let pool = pg.Pool(config)
    return pool.query('TRUNCATE account')
    .then(() => {
      return pool.query('INSERT INTO account (id, amount) VALUES (1, 100), (2, 100)')
    })
  })

  describe('pg.Pool', () => {
    it('handles a simple query', () => {
      return pg.Pool(config)
      .transactional(tx => {
        return tx.query('SELECT 1 AS count')
      })
      .then((result) => {
        assert.equal(result.rowCount, 1)
        assert.equal(result.rows[0].count, 1)
      })
    })

    it('runs two updates in a transaction', () => {
      let pool = pg.Pool(config)
      return pool
      .transactional(tx => {
        let inc = tx.query('UPDATE account SET amount = amount + 10 WHERE id = 1')
        let dec = tx.query('UPDATE account SET amount = amount - 10 WHERE id = 2')
        return Promise.all([inc, dec])
      })
      .then((result) => {
        return pool.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 110)
        assert.equal(result.rows[1].amount, 90)
      })
    })

    it('properly rolls back on exception', () => {
      let pool = pg.Pool(config)
      return pool
      .transactional(tx => {
        let inc = tx.query('UPDATE account SET amount = amount + 10 WHERE id = 1')
        let dec = tx.query('UPDATE account SET amount = amount - 10 WHERE id = 3')
        return Promise.all([inc, dec])
        .then(res => {
          for (let r of res) {
            if (res.rowCount != 1) {
              throw new Error('One or more accounts was not updated')
            }
          }
        })
      })
      .catch((err) => {
        return pool.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        // Make sure the accounts did not change
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 100)
        assert.equal(result.rows[1].amount, 100)
      })
    })

    it('properly rolls back on rollback', () => {
      let pool = pg.Pool(config)
      return pool
      .transactional(tx => {
        let inc = tx.query('UPDATE account SET amount = amount + 10 WHERE id = 1')
        let dec = tx.query('UPDATE account SET amount = amount - 10 WHERE id = 3')
        return Promise.all([inc, dec])
        .then(res => {
          for (let r of res) {
            if (res.rowCount != 1) {
              return tx.rollback()
            }
          }
        })
      })
      .then((result) => {
        return pool.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        // Make sure the accounts did not change
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 100)
        assert.equal(result.rows[1].amount, 100)
      })
    })

    it('uses parameters', () => {
      let pool = pg.Pool(config)
      return pool
      .transactional(tx => {
        let amount = 10
        let account1 = 1
        let account2 = 2
        let inc = tx.query('UPDATE account SET amount = amount + $1 WHERE id = $2', [amount, account1])
        let dec = tx.query('UPDATE account SET amount = amount - $1 WHERE id = $2', [amount, account2])
        return Promise.all([inc, dec])
      })
      .then((result) => {
        return pool.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 110)
        assert.equal(result.rows[1].amount, 90)
      })
    })
  })

  describe('pg.Client', () => {
    let client = null

    beforeEach(() => {
      client = pg.Client(config)
    })
    afterEach(() => {
      client.end()
      client = null
    })

    it('handles a simple query', () => {
      return client
      .transactional(tx => {
        return tx.query('SELECT 1 AS count')
      })
      .then((result) => {
        assert.equal(result.rowCount, 1)
        assert.equal(result.rows[0].count, 1)
      })
      .then(() => client.end())
    })

    it('runs two updates in a transaction', () => {
      return client
      .transactional(tx => {
        let inc = tx.query('UPDATE account SET amount = amount + 10 WHERE id = 1')
        let dec = tx.query('UPDATE account SET amount = amount - 10 WHERE id = 2')
        return Promise.all([inc, dec])
      })
      .then((result) => {
        return client.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 110)
        assert.equal(result.rows[1].amount, 90)
      })
      .then(() => client.end())
    })

    it('properly rolls back on exception', () => {
      return client
      .transactional(tx => {
        let inc = tx.query('UPDATE account SET amount = amount + 10 WHERE id = 1')
        let dec = tx.query('UPDATE account SET amount = amount - 10 WHERE id = 3')
        return Promise.all([inc, dec])
        .then(res => {
          for (let r of res) {
            if (res.rowCount != 1) {
              throw new Error('One or more accounts was not updated')
            }
          }
        })
      })
      .catch((err) => {
        return client.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        // Make sure the accounts did not change
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 100)
        assert.equal(result.rows[1].amount, 100)
      })
    })

    it('properly rolls back on rollback', () => {
      return client
      .transactional(tx => {
        let inc = tx.query('UPDATE account SET amount = amount + 10 WHERE id = 1')
        let dec = tx.query('UPDATE account SET amount = amount - 10 WHERE id = 3')
        return Promise.all([inc, dec])
        .then(res => {
          for (let r of res) {
            if (res.rowCount != 1) {
              return tx.rollback()
            }
          }
        })
      })
      .then((result) => {
        return client.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        // Make sure the accounts did not change
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 100)
        assert.equal(result.rows[1].amount, 100)
      })
    })

    it('uses parameters', () => {
      return client
      .transactional(tx => {
        let amount = 10
        let account1 = 1
        let account2 = 2
        let inc = tx.query('UPDATE account SET amount = amount + $1 WHERE id = $2', [amount, account1])
        let dec = tx.query('UPDATE account SET amount = amount - $1 WHERE id = $2', [amount, account2])
        return Promise.all([inc, dec])
      })
      .then((result) => {
        return client.query('SELECT id, amount FROM account ORDER BY id ASC')
      })
      .then((result) => {
        assert.equal(result.rowCount, 2)
        assert.equal(result.rows[0].amount, 110)
        assert.equal(result.rows[1].amount, 90)
      })
    })
  })
})
