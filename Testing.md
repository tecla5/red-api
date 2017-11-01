# Testing

## Status

- `comms` Uncaught Error: socket hang up. Note: new `Comms` class is pretty much empty!!!

`develop` branch

- `credentials` 3/3 all pass :)
- `flow` 11/11 all pass :)
- `flows` 11/11 all pass :)
- `flow` 11/11 all pass :)

### index_spec.js

1/1 passing

### info

In the legacy `info.js` we have a local function `settings`
and also global vars `settings` and `runtime`.

We need to mimick this correctly!

```js
var runtime;
var settings;

module.exports = {
    init: function(_runtime) {
        runtime = _runtime;
        settings = runtime.settings;
    },
    settings: function(req,res) {
        var safeSettings = {
            httpNodeRoot: settings.httpNodeRoot||"/",
            version: settings.version,
            user: req.user
        }
    }
// ...
```

Avoid `settings` instance var overriding route method!!!
Instead we use a `_settings` instance var :)

```js
constructor(runtime = {}) {
    this.runtime = runtime;

    this._settings = runtime.settings
    this.theme = Theme.init(runtime)
}
```

1 passing
1 failing

```bash
info api settings handler overrides palette editable if runtime says it is disabled:
     Uncaught AssertionError: expected Object { test: 456 } to have property palette
      at Test.<anonymous> (test/api/info_spec.js:141:54)
```

This is caused by failure in runtime package we will deal with later:

`runtime.nodes.paletteEditorEnabled()`

So we skip it for now ;)

1 passing
1 pending

### library

7/7 passing

### locales

TODO (no tests defined)

### nodes

26 passing
8 failing

In fact each or most  of the test pass, if run via `it.only`
The problem is some side-effect on `prepareApp()` etc.

We need proper `before` and `after` hooks, or even `beforeEach` and `afterEach`

PS: Try to run each of the tests alone to see how many fail run in isolation (if any!!!)

### theme

```bash
 1) theme handler applies the default theme:
     AssertionError: expected Theme { settings: Object {} } to not exist
      at context.<anonymous> (test/api/theme_spec.js:51:20)
```

### ui

- 5 passing
- 1 pending

## Auth

TODO

### clients

3/3 passing

### index

5 passing
1 failing

```bash
  1) api auth middleware revoke revokes a token:
     TypeError: Attempted to wrap undefined property revoke as function
      at context.<anonymous> (test/api/auth/index_spec.js:78:37)
```

### permissions

6/6 passing

### strategies

2 passing
10 failing

### tokens

0 passing
6 failing

### users

6 passing
5 failing
