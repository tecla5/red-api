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
const {
    expect,
    assert
} = require('chai')
var when = require('when');
var sinon = require('sinon');

var users
var {
    Users
} = require('../');

const {
    log
} = console

describe('Users', function () {
    describe('Initalised with a credentials object, no anon', function () {
        before(function () {
            users = Users.init({
                type: 'credentials',
                users: {
                    username: 'fred',
                    password: '$2a$08$LpYMefvGZ3MjAfZGzcoyR.1BcfHh4wy4NpbN.cEny5aHnWOqjKOXK',
                    // 'password' -> require('bcryptjs').hashSync('password', 8);
                    permissions: '*'
                }
            });
        });

        describe('#get', function () {
            it('returns known user', function (done) {
                users.get('fred').then(user => {
                    log('get user: fred', {
                        user
                    })
                    if (!user) {
                        done('users.get:fred FAILS - ensure proper before setup')
                    }
                    try {
                        expect(user).to.have.a.property('username', 'fred');
                        expect(user).to.have.a.property('permissions', '*');
                        expect(user).to.not.have.a.property('password');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });

            it('returns null for unknown user', function (done) {
                users.get('barney').then(function (user) {
                    try {
                        should.not.exist(user);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });

        describe('#default', function () {
            it('returns null for default user', function (done) {
                users.default().then(function (user) {
                    try {
                        should.not.exist(user);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });

        describe('#authenticate', function () {
            it('authenticates a known user', function (done) {
                users.authenticate('fred', 'password').then(user => {
                    log('authenticates a known user', {
                        user
                    })
                    if (!user) {
                        done(new Error('user not authenticated'))
                        return
                    }

                    try {
                        if (user) {
                            expect(user).to.have.a.property('username', 'fred');
                            expect(user).to.have.a.property('permissions', '*');
                            expect(user).to.not.have.a.property('password');
                        }
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
            it('rejects invalid password for a known user', function (done) {
                users.authenticate('fred', 'wrong').then((user) => {
                    try {
                        should.not.exist(user);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });

            it('rejects invalid user', function (done) {
                users.authenticate('barney', 'wrong').then((user) => {
                    try {
                        should.not.exist(user);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });
    });

    describe('Initalised with a credentials object including anon', function () {
        before(function () {
            users = Users.init({
                type: 'credentials',
                users: [],
                default: {
                    permissions: '*'
                }
            });
        });
        describe('#default', function () {
            it('returns default user', function (done) {
                users.default().then((user) => {
                    try {
                        user.should.have.a.property('anonymous', true);
                        user.should.have.a.property('permissions', '*');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });
    });

    describe('Initialised with a credentials object with user functions', function () {
        var authUsername = '';
        var authPassword = '';
        before(function () {
            users = Users.init({
                type: 'credentials',
                users: function (username) {
                    return when.resolve({
                        'username': 'dave',
                        'permissions': 'read'
                    });
                },
                authenticate: function (username, password) {
                    authUsername = username;
                    authPassword = password;
                    return when.resolve({
                        'username': 'pete',
                        'permissions': 'write'
                    });
                }
            });
        });

        describe('#get', function () {
            it('delegates get user', function (done) {
                users.get('dave').then((user) => {
                    try {
                        user.should.have.a.property('username', 'dave');
                        user.should.have.a.property('permissions', 'read');
                        user.should.not.have.a.property('password');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
            it('delegates authenticate user', function (done) {
                users.authenticate('pete', 'secret').then((user) => {
                    try {
                        user.should.have.a.property('username', 'pete');
                        user.should.have.a.property('permissions', 'write');
                        user.should.not.have.a.property('password');
                        authUsername.should.equal('pete');
                        authPassword.should.equal('secret');
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });
    });

    describe('Initialised with bad settings to test else cases', function () {
        before(function () {
            users = Users.init({
                type: 'foo',
                users: {
                    username: 'fred',
                    password: '$2a$08$LpYMefvGZ3MjAfZGzcoyR.1BcfHh4wy4NpbN.cEny5aHnWOqjKOXK',
                    permissions: '*'
                }
            });
        });
        describe('#get', function () {
            it('should fail to return user fred', function (done) {
                users.get('fred').then(user => {
                    expect(user).to.be.undefined
                    done();
                });
            });
        });
    });

    describe('Initialised with default set as function', function () {
        before(function () {
            users = Users.init({
                type: 'credentials',
                default: function () {
                    return ('Done');
                }
            });
        });
        describe('#default', function () {
            it('handles api.default being a function', function (done) {
                users.should.have.property('default').which.is.a.Function;
                (users.default()).should.equal('Done');
                done();
            });
        });
    });
});
