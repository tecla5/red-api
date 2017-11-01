var api = require('../')
var {
  Nodes,
  Locales,
  // locales
} = api

const {
  log
} = console

function initNodes(runtime) {
  let locales, nodes
  log('initNodes')

  runtime.log = {
    audit: function (e) {}, //console.log(e)},
    _: function () {},
    info: function () {},
    warn: function () {}
  }
  runtime.events = {
    emit: function () {}
  }
  locales = new Locales(runtime)

  nodes = new Nodes(runtime);

  log('initNodes', {
    nodes,
    locales
  })
  return {
    nodes,
    locales
  }
}

const {
  prepareApp
} = require('./prepare-app')

var should = require('should');
var request = require('supertest');
var sinon = require('sinon');
var when = require('when');

module.exports = {
  log,
  api,
  initNodes,
  should,
  request,
  sinon,
  when,
  prepareApp
}
