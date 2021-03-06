# Node Red API

Stand-alone NodeRed API extracted from [node-red](https://github.com/node-red/node-red/tree/master/red) application.

## Community

- [Slack](https://nodered.org/slack/)
- [Github organisation](https://github.com/node-red)

## Pre-requisites

Make sure you have the latest version of Node installed (version 8.5+)

See [Install node via package manager](https://nodejs.org/en/download/package-manager/)

## Getting started

Install all dependencies (see `package.json`)

`$ npm i`

Install [mocha](mochajs.org/) test runner as a global Node module (makes mocha binary available from CLI/terminal)

`npm i mocha -g`

Run a test such as:

`$ mocha test/api/flows_spec.js`

## Linking inter-dependent projects

During development it is *highly* recommended to `npm link` the main node-red depedencies, such as `red-runtime`:

- `git clone` [red-api](https://github.com/tecla5/red-api) repo
- `git clone` [red-runtime](https://github.com/tecla5/red-runtime) repo
- run `$ npm link` in your local `red-runtime` root folder to link it in your local package registry
- run `npm link red-runtime` in your clone of `red-api`

```bash
✔ ~/repos/tecla5/red-runtime [master|✔]
21:54 $ npm link
// ...

✔ ~/repos/tecla5/red-runtime [master|✔]
21:54 $ npm link

✔ ~/repos/tecla5/red-runtime [master|✚ 1]
22:00 $ npm link red-api
/Users/kristianmandrup/repos/tecla5/red-runtime/node_modules/red-api -> /usr/local/lib/node_modules/red-api -> /Users/kristianmandrup/repos/tecla5/red-api

✔ ~/repos/tecla5/red-api [master|✚ 1]
21:59 $ npm link red-runtime
/Users/kristianmandrup/repos/tecla5/red-api/node_modules/red-runtime -> /usr/local/lib/node_modules/red-runtime -> /Users/kristianmandrup/repos/tecla5/red-runtime
```

## Lerna project

A better approach would be to create a [lerna project](lernajs.io/) with both `red-api` and `red-runtime` included as packages and have lerna link them for you.

See [red-ui](https://github.com/tecla5/red-ui) for a sample lerna project using this approach.

```bash
lerna.json
/packages
    /red-api
        /node_modules
            /red-runtime (symbolic link)
        /src
        /test
        ...

    /red-runtime
        /node_modules
            /red-api (symbolic link)
        /src
        /test
        ...
```

## Refactoring

The goal of this module is to refactor and replace the "old school" API with a modern API, using classes, polymorphism and modern Javascript.

The `/legacy` folder contains the legacy API.
The `/new` folder contains the new refactored API, using latest Javascript syntax.

The old (legacy) code uses callbacks for handling asynchronous flow. In time we want to transition to modern `async/await` constructs.

The main objective is to make the refactored classes work like in the original.

Write unit tests to confirm the class struture works like the original code, keeping orinal functionality in the functions with minimal intrusion. Then step by step improve the code to use modern Javascript, using a Test Driven approach.

### Strategy

The best and easiest strategy would be to start with the simplest classes with least dependencies and then gradually build from there.

Many of the tests in `test/api/auth` are already passing and these classes are pretty isolated and should be pretty easy to completely refactor to modern Javascript.

### Sample test refatoring

The `comms_spec.js` is a good example. Here we use the new class factory method `Users.init` to create a `users` instance. Same goes for `Comms`.
We define the instance vars `let users, comms` in the top scope of the test so they are available for all the tests (ie. `it` scopes) within.

```js
let users, comms
before(function (done) {
    users = Users.init()

    sinon.stub(users, 'default', function () {
        return when.resolve(null);
    });
    server = http.createServer(function (req, res) {
        app(req, res)
    });
    comms = Comms.init(server, {
```

## New API

A new class-based API can be found in `src/new`

### API classes

See `src/new/api` folder

- `Api` main API
- `Comms` central communications bus
- `Credentials` user credentials
- `Flow` single flow node
- `Flows` collection of flow nodes
- `Info` editor user settings
- `Library` flow container
- `Locales` localization
- `Nodes` collection of nodes
- `Theme` themes
- `Ui` User Interface, loading mustache templates to render UI with editor

#### Authentication classes

See `src/new/api/auth` folder

- `Auth` main Authentication class, containing instances of other core classes in Auth
- `Clients` application clients (editor, admin, ...)
- `Permissions` authentication permission rules
- `Strategies` authentication strategies
- `Tokens` user tokens
- `Users` user

### Roadmap 1.0

The official [Node-red Roadmap 1.0](https://nodered.org/blog/2017/07/17/roadmap-to-1-dot-0) has a similar objective of splitting the main project into 3 modules.

## Editor

The [Node-red editor](https://github.com/tecla5/red-editor) is extracted and refactored using a similar approach.

These two refactored modules should then be used by the [NodeRed Vue app](https://github.com/tecla5/nodered-vue).

## Runtime

The [Node-red runtime](https://github.com/tecla5/red-runtime) is extracted and refactored using a similar approach. The runtime uses the Editor and the API and "binds it all together".

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

The original test runner uses:

- [grunt](https://gruntjs.com/) for runner tasks including builds
- [mocha](https://mochajs.org/) for testing
- [istanbul](https://istanbul.js.org/) for test coverage

### Grunt example

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

### Run mocha and instanbul

The `package.json` has been set up with scripts:

Run tests: `npm test` or simply `mocha`

Run Istanbul test coverage: `npm run test:coverage`

See `test/mocha.opts` for mocha options, as described in [mocha usage](https://mochajs.org/#usage)

To run a single mocha test `test/new/red_spec.js`:

`mocha test/new/red_spec.js`

You can also supply extra options and described in [mocha usage](https://mochajs.org/#usage) such as `mocha test/new/red_spec.js --globals expect`

It is highly advisable to start making a simple test run and work, then continue from there with each test file until all the test suite can run.

### Test architecture

The legacy mocha tests can be found in `/test` under `test/api` and `test/runtime` respectively. The folders:

The folders `test/new` and `test/legacy` contains special global test cases.

`_spec.js` tests *is checking if all .js files have a corresponding _spec.js test file.*
That is, it checks if all `.js` files in source have a matching `_spec.js` file under `/test`.

`red_spec.js` checks the build and externals such as `package.json`

#### Referencing src classes in tests

Note that the `/test/api/index.js` file should be used to import all the necessary src files, classes and variables needed to test the api.

#### Missing dev dependencies

Note that currently not all the `devDependencies` needed to run the mocha tests have been added. Please consult the original *node-red* `devDependencies` entry in `package.json`.

## Ava tests

Ideally we would like the tests to be rewritten for Ava

Run `npm run test:ava` or simply `ava`

To run individual tests:

`ava test/api/comms_spec.js`
