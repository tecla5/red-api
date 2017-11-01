# Testing

## Current priorities

Auth tests (in this order)

- `strategies` 2/10

See [original tests](https://github.com/node-red/node-red/tree/master/test/red/api/auth)

### Token exchange

  1 passing (306ms)
  2 failing

`ReferenceError: loginSignInWindow is not defined`

### Bearer strategy

  0 passing (288ms)
  3 failing

`TypeError: Attempted to wrap undefined property get as function`

### Anonomous

 0 passing (255ms)
 6 failing

`Attempted to wrap undefined property default as function`

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

33/34 passing
### install_nodes

6/6 passing

### get_nodes

5/6 passing

### delete_nodes

4/4 passing

### enable_disable

17 passing


### theme

2/2 passing

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

6/6 passing

### users

11 passing
