
[![NPM version][npm-img]][npm-url]
[![Build status][travis-img]][travis-url]
[![Test coverage][coveralls-img]][coveralls-url]
[![License][license-img]][license-url]
[![Dependency status][david-img]][david-url]

### pg-then

* Use `postgresql` with `promise` api, based on [pg](https://github.com/brianc/node-postgres).

### Install

```bash
$ npm install pg
$ npm install pg-then
```

### Usage

* [Client pooling](https://github.com/brianc/node-postgres#client-pooling)

```js
const pg = require('pg-then')

const pool = pg.Pool('postgres://username:password@localhost/database')

pool
  .query('SELECT ...')
  .then(...)
  .catch(...)
```

* [Use QueryStream](https://github.com/brianc/node-pg-query-stream)

```js
pg.Pool(config)
  .stream('SELECT ...')
  .on('data', data => ...)
  .on('end', () => ...)
  .on('error', err => ...)
```

* [Client instance](https://github.com/brianc/node-postgres#client-instance)

```js
const pg = require('pg-then')

const client = pg.Client('postgres://username:password@localhost/database')

client
  .query('SELECT ...')
  .then(...)
  .catch(...)

// ...

client.end()
```

* Transactions

  _Note: only the `query` method is available in transactions. Streaming is not
  supported._

  ```js
  const pg = require('pg-then')

  const pool = pg.Pool('postgres://username:password@localhost/database')

  pool.transactional(tx => {
      return tx.query('UPDATE account SET value = value + 10 WHERE id = 42185')
        .then(() => {
          return tx.query('UPDATE account SET value = value - 10 WHERE id = 20985')
        })
    })
    .then(...)
    .catch(...)

  // or

  pool.transactional(tx => {
      const inc = tx.query('UPDATE account SET value = value + 10 WHERE id = 42185')
      const dec = tx.query('UPDATE account SET value = value - 10 WHERE id = 20985')
      return Promise.all([inc, dec])
    })
    .then(...)
    .catch(...)
  ```

### Extras

* [jadbox/pg-rxjs](https://github.com/jadbox/pg-rxjs) combining PostgreSQL and Rx for Node

### License
MIT

[npm-img]: https://img.shields.io/npm/v/pg-then.svg?style=flat-square
[npm-url]: https://npmjs.org/package/pg-then
[travis-img]: https://img.shields.io/travis/coderhaoxin/pg-then.svg?style=flat-square
[travis-url]: https://travis-ci.org/coderhaoxin/pg-then
[coveralls-img]: https://img.shields.io/coveralls/coderhaoxin/pg-then.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/coderhaoxin/pg-then?branch=master
[license-img]: https://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: http://opensource.org/licenses/MIT
[david-img]: https://img.shields.io/david/coderhaoxin/pg-then.svg?style=flat-square
[david-url]: https://david-dm.org/coderhaoxin/pg-then
