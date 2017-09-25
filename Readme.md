# Node Red API

Stand-alone NodeRed API extracted from [node-red](https://github.com/node-red/node-red/tree/master/red) application.

The goal of this module is to refactor and replace the "old school" API with a modern API, using classes, polymorphism and modern Javascript.

The `/legacy` folder contains the legacy API.
The `/new` folder contains the new refactored API, using latest Javascript syntax.

The `/api` and `/runtime` folders that form the API can be found under the `/red` folder in `node-red`.

The old (legacy) code uses callbacks for handling asynchronous flow. In time we want to transition to modern `async/await` constructs.

## New API

A new class-based API can be found in `src/new`

- `api`
- `runtime`

## Objective

The main objective is to make these classes work. Write tests to confirm the class struture works like the original code, keeping orinal functionality in the functions with minimal intrusion. Then step by step improve the code to use modern Javascript, using a Test Driven approach.

## Editor

The [Node-red editor]((https://github.com/tecla5/red-editor)) is extracted and refactored using a similar approach.

These two refactored modules should then be used by the [NodeRed Vue app](https://github.com/tecla5/nodered-vue).

## Rendering the Editor

Rendering of the HTML editor is currently done in `/api/ui.js` via [mustache templates](mustache.github.io/) using partials.

The code to display the editor using Mustache templates:

```js
var assetsDir = path.resolve(__dirname + '/../../assets')
var templateDir = path.resolve(baseDir, 'templates/new');


module.exports = class Ui {
  // ...
  _loadSharedPartials() {
    // ...
  }

  editor(req, res) {
      res.send(Mustache.render(editorTemplate, theme.context()));
  }
}
```

## Docs

The API and Runtime are documented in the `/docs` folder. Please help improve the docs!

## Building

### Development

Run `npm run build:dev` to run webpack with the `dev` configuration

### Production

Run `npm run build:prod` to run webpack with the `dev` configuration

## Testing

Acceptance tests are the same as in the original node-red project. They are written using `describe` and `it` syntax, common to [mocha](https://mochajs.org/)

The tests use [should](https://shouldjs.github.io/) for assertions and [sinon](http://sinonjs.org/) for test spies, stubs and mocks.

```js
var should = require("should");
var sinon = require("sinon");
```

The original test runner uses Grunt mocha and instanbul (test coverage).

```json
 grunt.loadNpmTasks('grunt-simple-mocha');
 grunt.loadNpmTasks('grunt-mocha-istanbul');
```

The original [Grunt test runner config](https://github.com/node-red/node-red/blob/master/Gruntfile.js#L32)

```js
  simplemocha: {
      options: {
          globals: ['expect'],
          timeout: 3000,
          ignoreLeaks: false,
          ui: 'bdd',
          reporter: 'spec'
      },
      all: { src: ['test/**/*_spec.js'] },
      core: { src: ["test/_spec.js","test/red/**/*_spec.js"]},
      nodes: { src: ["test/nodes/**/*_spec.js"]}
  },
  mocha_istanbul: {
      options: {
          globals: ['expect'],
          timeout: 3000,
          ignoreLeaks: false,
          ui: 'bdd',
          reportFormats: ['lcov'],
          print: 'both'
      },
      coverage: { src: ['test/**/*_spec.js'] }
  },
```

With the following `devDependencies`:

```json
"devDependencies": {
    "istanbul": "0.4.5",
    "mocha": "~3.4.2",
    "should": "^8.4.0",
    "sinon": "1.17.7",
    "supertest": "3.0.0"
}
```

### Ava tests

Ideally we would like the tests to be rewritten for Ava

Run `npm test` or `ava`

To run individual tests:

`ava test/api/comms_spec.js`
