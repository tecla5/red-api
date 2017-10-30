module.exports = class Base {
  constructor(runtime) {
    this.runtime = runtime
  }

  notYetImplemented(msg) {
    console.error('Not yet implemented', msg)
    throw msg
  }
}
