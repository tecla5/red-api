/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

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
    strategies = new Strategies({
      log: {
        audit: function () {}
      }
    })
    users = new Users()
    tokens = new Tokens() // adminAuthSettings = {}, _storage
  });



  describe('Password Token Exchange', function () {
    var userAuthentication;
    afterEach(function () {
      if (userAuthentication) {
        userAuthentication.restore();
        userAuthentication = null;
      }
    });

    it('Handles authentication failure', function (done) {
      userAuthentication = sinon.stub(users, 'authenticate', function (username, password) {
        return when.resolve(null);
      });

      strategies.passwordTokenExchange({}, 'user', 'password', 'scope', function (err, token) {
        try {
          should.not.exist(err);
          token.should.be.false();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('Handles scope overreach', function (done) {
      userAuthentication = sinon.stub(users, 'authenticate', function (username, password) {
        return when.resolve({
          username: 'user',
          permissions: 'read'
        });
      });

      strategies.passwordTokenExchange({}, 'user', 'password', '*', function (err, token) {
        try {
          should.not.exist(err);
          token.should.be.false();
          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('Creates new token on authentication success', function (done) {
      userAuthentication = sinon.stub(users, 'authenticate', function (username, password) {
        console.log('fake authenticate', {
          username,
          password
        })
        return when.resolve({
          username: 'user',
          permissions: '*'
        });
      });
      var tokenDetails = {};

      // stub tokens.create response to resolve to: 123456
      // to ensure expectation is met, always same (fake) token
      var tokenCreate = sinon.stub(tokens, 'create', function (username, client, scope) {
        log('fake Token:create', {
          username,
          client
        })
        let accessToken = '123456'
        tokenDetails.username = username;
        tokenDetails.client = client;
        tokenDetails.scope = scope;
        log('returning fake token', accessToken)
        return when.resolve({
          accessToken
        });
      });

      // FAILS due to:
      //      users.authenticate(username, password)

      // NOT returning an authenticated user :()
      // could be due to Strategies constructor

      // perhaps not initializing users instance correctly?
      //      this.users = new Users()

      // should be
      //      new Users(config)
      // whatever config might/should be!?

      // conclusion: focus on users_spec first

      strategies.passwordTokenExchange({
        id: 'myclient'
      }, 'user', 'password', 'read', (err, token) => {
        try {
          console.log('auth token', {
            token
          })

          should.not.exist(err);
          token.should.equal('123456');
          tokenDetails.should.have.property('username', 'user');
          tokenDetails.should.have.property('client', 'myclient');
          tokenDetails.should.have.property('scope', 'read');
          done();
        } catch (e) {
          done(e);
        } finally {
          tokenCreate.restore();
        }
      });

    });
  });
});
