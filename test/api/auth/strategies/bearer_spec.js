var should = require('should');
var when = require('when');
var sinon = require('sinon');

var {
  Strategies,
  Users,
  Tokens,
  Clients
} = require('../');

var strategies, users, tokens

describe('Auth strategies', function () {
  before(function () {
    users = new Users() // config {users, passwords}
    tokens = new Tokens() // adminAuthSettings = {}, _storage
    strategies = new Strategies({
      log: {
        audit: function () {}
      },
      settings: {
        tokens,
        users
      }
    })
  });


  describe('Bearer Strategy', function () {
    it('Rejects invalid token', function (done) {
      var getToken = sinon.stub(tokens, 'get', function (token) {
        console.log('fake token resolve null')
        return when.resolve(null);
      });

      strategies.bearerStrategy('1234', function (err, user) {
        try {
          should.not.exist(err);
          user.should.be.false();
          done();
        } catch (e) {
          done(e);
        } finally {
          getToken.restore();
        }
      });
    });

    it('Accepts valid token', function (done) {
      var getToken = sinon.stub(tokens, 'get', function (token) {
        return when.resolve({
          user: 'user',
          scope: 'scope'
        });
      });

      var getUser = sinon.stub(users, 'get', function (username) {
        return when.resolve('aUser');
      });

      strategies.bearerStrategy('1234', function (err, user, opts) {
        try {
          should.not.exist(err);
          user.should.equal('aUser');
          opts.should.have.a.property('scope', 'scope');
          done();
        } catch (e) {
          done(e);
        } finally {
          getToken.restore();
          getUser.restore();
        }
      });
    });

    it('Fail if no user for token', function (done) {
      var getToken = sinon.stub(tokens, 'get', function (token) {
        return when.resolve({
          user: 'user',
          scope: 'scope'
        });
      });
      var getUser = sinon.stub(users, 'get', function (username) {
        return when.resolve(null);
      });

      strategies.bearerStrategy('1234', function (err, user, opts) {
        try {
          should.not.exist(err);
          user.should.equal(false);
          should.not.exist(opts);
          done();
        } catch (e) {
          done(e);
        } finally {
          getToken.restore();
          getUser.restore();
        }
      });
    });
  });
});
