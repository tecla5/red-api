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
const expect = require('chai').expect;

var when = require('when');
var sinon = require('sinon');

var tokens
var {
    Tokens
} = require('../');

const {
    log
} = console

describe('Tokens', function () {
    describe('#init', function () {
        it('loads sessions', function (done) {
            tokens = Tokens.init({})
            done()
        });
    });


    describe('#get', function () {
        it('returns a valid token', function (done) {
            tokens = Tokens.init({}, {
                getSessions() {
                    return when.resolve({
                        '1234': {
                            'user': 'fred',
                            'expires': Date.now() + 1000
                        }
                    });
                }
            })
            // FAILS
            // because the 2nd argument to Tokens.init with getSessions()
            // is not being set and used internally in Tokens

            // NOTE: should be using this.storage.getSessions() to return sessions to lookup in!

            tokens.get('1234').then(token => {
                log('get:1234', {
                    token
                })
                try {
                    expect(token).to.not.be.a('null')
                    expect(token).have.a.property('user', 'fred');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('returns null for an invalid token', function (done) {
            tokens = Tokens.init({}, {
                getSessions() {
                    return when.resolve({});
                }
            })
            tokens.get('1234').then(function (token) {
                try {
                    should.not.exist(token);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });

        it('returns null for an expired token', function (done) {
            var saveSessions = sinon.stub().returns(when.resolve());
            var expiryTime = Date.now() + 50;
            tokens = Tokens.init({}, {
                getSessions() {
                    return when.resolve({
                        '1234': {
                            'user': 'fred',
                            'expires': expiryTime
                        }
                    });
                },
                saveSessions: saveSessions
            })
            tokens.get('1234').then((token) => {
                try {
                    should.exist(token);
                    setTimeout(() => {
                        tokens.get('1234').then((token) => {
                            try {
                                should.not.exist(token);
                                saveSessions.calledOnce.should.be.true();
                                done();
                            } catch (err) {
                                done(err);
                            }
                        });
                    }, 100);
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    describe('#create', () => {
        it('creates a token', (done) => {
            var savedSession;
            tokens = Tokens.init({
                sessionExpiryTime: 10
            }, {
                getSessions: function () {
                    return when.resolve({});
                },
                saveSessions: function (sess) {
                    savedSession = sess;
                    return when.resolve();
                }
            });
            var expectedExpiryTime = Date.now() + 10000;


            tokens.create('user', 'client', 'scope').then(token => {
                try {
                    should.exist(savedSession);
                    var sessionKeys = Object.keys(savedSession);
                    sessionKeys.should.have.lengthOf(1);

                    token.should.have.a.property('accessToken', sessionKeys[0]);
                    savedSession[sessionKeys[0]].should.have.a.property('user', 'user');
                    savedSession[sessionKeys[0]].should.have.a.property('client', 'client');
                    savedSession[sessionKeys[0]].should.have.a.property('scope', 'scope');
                    savedSession[sessionKeys[0]].should.have.a.property('expires');
                    savedSession[sessionKeys[0]].expires.should.be.within(expectedExpiryTime - 200, expectedExpiryTime + 200);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    describe('#revoke', function () {
        it('revokes a token', function (done) {
            var savedSession;
            tokens = Tokens.init({}, {
                getSessions: function () {
                    return when.resolve({
                        '1234': {
                            'user': 'fred',
                            'expires': Date.now() + 1000
                        }
                    });
                },
                saveSessions: function (sess) {
                    savedSession = sess;
                    return when.resolve();
                }
            })
            tokens.revoke('1234').then(() => {
                try {
                    savedSession.should.not.have.a.property('1234');
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

});
