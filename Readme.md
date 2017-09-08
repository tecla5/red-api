# Node Red API

Stand-alone NodeRed API extracted from `node-red` application.

The goal of this module is to refacto and replace the "old school" API with a modern API, using classes, polymorphism and modern Javascript etc.

For now we will avoid using ES6 modules until natively supported in NodeJS.

## New API

A new class-based API has been started in `src/new/api`.
Same approach should be used for `runtime`!

## Editor

The Node-red editor should be extracted and refactored using a similar approach. These two (refactoed) modules should then be used by the NodeRed Vue app.

## Docs

The API and Runtime are documented in the `docs` folder. Please help improve the docs!
