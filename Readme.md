# Node Red API

Stand-alone NodeRed API extracted from [node-red](https://github.com/node-red/node-red/tree/master/red) application.

The `/api` and `/runtime` folders that form the API can be found under the `/red` folder in `node-red`.

The goal of this module is to refactor and replace the "old school" API with a modern API, using classes, polymorphism and modern Javascript.

The old (legacy) code uses callbacks for handling asynchronous flow. In time we want to transition to modern `async/await` constructs.

## New API

A new class-based API has been started in `src/new`

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
