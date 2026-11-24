![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# @seneca/telemetry

[![npm version](https://img.shields.io/npm/v/@seneca/telemetry.svg)](https://npmjs.com/package/@seneca/telemetry)
[![build](https://github.com/senecajs/seneca-telemetry/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-telemetry/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-telemetry/badge.svg)](https://snyk.io/test/github/senecajs/seneca-telemetry)
[![Coverage Status](https://coveralls.io/repos/github/senecajs/seneca-telemetry/badge.svg?branch=main)](https://coveralls.io/github/senecajs/seneca-telemetry?branch=main)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

Requires Seneca 4 and Node.js 24 or later.

```sh
npm install seneca@^4 @seneca/telemetry
```

## Quick Example

```js
const seneca = require('seneca')()
  .use('@seneca/telemetry', { active: true })

// ... act some messages, then:
const out = await seneca.post('sys:telemetry,get:msg', { pat: 'a:1' })
```

## Messages

* `sys:telemetry,set:active` with `active` (a boolean): switch recording
  on or off. The option `active` (default `false`) sets the initial state.
* `sys:telemetry,get:msg` with `pat` (a pattern string such as `a:1`): the
  recorded calls of each action of that pattern (`msg`: call times `c`,
  durations `d` in milliseconds, message ids `m`), duration statistics per
  action (`aggd`: mean `mn`, median `md`, lowest `lo`, highest `hi`), and
  the trace of each transaction that called it (`trace`, entries with
  `k: 1` for the start and `k: 2` for the end of a call, and `e: 1` when
  the call failed).

## More Examples

See [test/](test/) for more usage examples.

## Motivation

A [Seneca.js](http://senecajs.org) plugin.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-telemetry/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

See [source](https://github.com/senecajs/seneca-telemetry) for API details.

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

```sh
npm run test
```

## Background

Part of the [Senecajs org](https://github.com/senecajs/).
