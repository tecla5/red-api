# Testing

## Status

- `comms` Uncaught Error: socket hang up. Noe: new `Comms` class is pretty much empty!!!

`develop` branch

- `credentials` 3/3 all pass :)
- `flow` 11/11 all pass :)
- `flows` 11/11 all pass :)
- `flow` 11/11 all pass :)

### index_spec.js

```bash
     Error: Route.get() requires a callback function but got a [object Object]
      at new Api (src/new/api/index.js:186:16)
```

### info

```bash
Attempted to wrap object property settings as function
 at prepareApp test/api/info_spec.js:40:19
```

### library

```bash
TypeError: Cannot read property 'getAll' of undefined
      at context.<anonymous> (test/api/library_spec.js:109:47)
```

### locales

TODO (no tests defined)

### nodes

```bash
     TypeError: Cannot read property 'getAll' of undefined
      at Context.<anonymous> (test/api/nodes_spec.js:53:33)
```

### theme

```bash
 1) theme handler applies the default theme:
     AssertionError: expected Theme { settings: Object {} } to not exist
      at context.<anonymous> (test/api/theme_spec.js:51:20)
```

### ui

- 5 passing
- 1 pending

