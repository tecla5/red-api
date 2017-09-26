const globals = require('../new/globals')
const {
  api,
  runtime
} = globals

const {
  Api,
  Comms,
  Credentials,
  Flow,
  Flows,
  Info,
  Library,
  Locales,
  Nodes,
  Theme,
  Ui,

  // auth
  Auth,
  Clients,
  Permissions,
  Strategies,
  Tokens,
  Users
} = api

module.exports = {
  // FIX: not sure this is correct
  instance: new Api(runtime),
  Api,
  Comms,
  Credentials,
  Flow,
  Flows,
  Info,
  Library,
  Locales,
  Nodes,
  Theme,
  Ui,
  Auth,

  // auth
  Clients,
  Permissions,
  Strategies,
  Tokens,
  Users,

  // ... create and export default instances!
  // clients: new Clients(runtime),
  // users: new Users(runtime),
  // // FIX: more for auth

  // comms: new Comms(runtime),
  // credentials: new Credentials(runtime),
  // flow: new Flow(runtime),
  // flows: new Flows(runtime),
  info: new Info(runtime),
  // library: new Library(runtime),
  // locales: new Locales(runtime),
  nodes: new Nodes(runtime),
  // ui: new Ui(runtime),
  theme: new Theme(runtime),

  // FIX: more?
}
