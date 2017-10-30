# Testing

## Status

- `comms` Uncaught Error: socket hang up
- `credentials` 3/3 all pass :)
- `flow` 11/11 all pass :)
- `flows` 11/11 all pass :)
- `index` -> `Route.get` error (see below)
- `info` -> `Route.get` error
- `library` -> `Route.get` error
- `locales` TODO (no tests defined)
- `nodes` -> `Route.get` error (see below)
- `theme`
- `ui`

### Route.get error

FIX: Looks like `var api = require('.')` fails!!!

`info_spec.js` error:

```bash
$ mocha test/api/info_spec.js
/flows route { flRead: [Function],
  flGet: [Function: get],
  errorHandler: [Function: bound errorHandler] }
/red-engine/packages/red-api/node_modules/express/lib/router/route.js:202
        throw new Error(msg);
        ^

Error: Route.get() requires a callback function but got a [object Undefined]
...
at new Api (/red-engine/packages/red-api/src/new/api/index.js:179:16)
at Object.<anonymous> (/red-engine/packages/red-api/test/api/index.js:31:13)
```

`library_spec`

```bash
$ mocha test/api/library_spec.js
/flows route { flRead: [Function],
  flGet: [Function: get],
  errorHandler: [Function: bound errorHandler] }
/red-engine/packages/red-api/node_modules/express/lib/router/route.js:202
        throw new Error(msg);
        ^

Error: Route.get() requires a callback function but got a [object Undefined]
...
(/red-engine/packages/red-api/test/api/library_spec.js:26:13)
```

... Fix this error and fix most!
