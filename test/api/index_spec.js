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
var sinon = require('sinon');
var request = require('supertest');
var express = require('express');
var when = require('when');
var fs = require('fs');
var path = require('path');

var globals = require('.')

// FIX: using Api instance
var {
    Api
} = globals
var api

const {
    log
} = console

describe('api index', function () {
    var app;

    describe('disables editor', function () {
        before(function () {
            // FIX: using factory method (constructor) instead of legacy init
            api = Api.init({}, {
                settings: {
                    httpNodeRoot: true,
                    httpAdminRoot: true,
                    disableEditor: true,
                    exportNodeSettings: function () {}
                },
                events: {
                    on: function () {},
                    removeListener: function () {}
                },
                log: {
                    info: function () {},
                    _: function () {}
                },
                nodes: {
                    paletteEditorEnabled: function () {
                        return true
                    }
                }
            });
            app = api.adminApp;
        });

        it('does not serve the editor', function (done) {
            request(app)
                .get('/')
                .expect(404, done)
        });
        it('does not serve icons', function (done) {
            request(app)
                .get('/icons/default.png')
                .expect(404, done)
        });
        it('serves settings', function (done) {
            request(app)
                .get('/settings')
                .expect(200, done)
        });
    });

    // FIX: This is not pretty, with two before hooks and one after!
    // TOO messy!
    describe.only('can serve auth', function () {
        var mockList = [
            'ui', 'nodes', 'flows', 'library', 'info', 'locales', 'credentials'
        ]

        // FIX: This is really shit/hack!!!
        before(function () {
            // FIX: this is fucked up!
            // perhaps mock factory .init method and not constructor!

            mockList.forEach(function (m) {
                log('mockList: dynamic require - mock constructor of', {
                    m
                })
                let mock = require('../../src/new/api/' + m)
                // FIX: stub constructor with empty function
                // See: https://stackoverflow.com/questions/40271140/es2016-class-sinon-stub-constructor

                sinon.stub(mock.prototype, 'constructor', function () {})
                // sinon.stub(mock.prototype, 'constructor',
                //     function () {});
            });
        });

        after(function () {
            mockList.forEach(function (m) {
                log('mockList: dynamic require - restore', {
                    m
                })
                // FIX: super ugly!!!
                let mock = require('../../src/new/api/' + m)

                // mock.init.restore()
                let mocked = new mock()
                if (typeof mocked.restore === 'function') {
                    mocked.restore();
                }

            })
        });

        before(function () {
            api = Api.init({}, {
                settings: {
                    httpNodeRoot: true,
                    httpAdminRoot: true,
                    adminAuth: {
                        type: 'credentials',
                        users: [],
                        default: {
                            permissions: 'read'
                        }
                    }
                },
                storage: {
                    getSessions: function () {
                        return when.resolve({})
                    }
                },
                events: {
                    on: function () {},
                    removeListener: function () {}
                }
            });
            app = api.adminApp;
        });

        it('it now serves auth', function (done) {
            request(app)
                .get('/auth/login')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    res.body.type.should.equal('credentials');
                    done();
                });
        });
    });

    describe('editor warns if runtime not started', function () {
        var mockList = [
            'nodes', 'flows', 'library', 'info', 'theme', 'locales', 'credentials'
        ]
        before(function () {
            mockList.forEach(function (m) {
                let mock = require('../../src/new/api/' + m)

                // FIX: stub constructor with empty function
                sinon.stub(mock.prototype, 'constructor', function () {});
            });
        });
        after(function () {
            mockList.forEach(function (m) {
                let mock = require('../../src/new/api/' + m)
                new mock().restore();
            })
        });

        it('serves the editor', function (done) {
            var errorLog = sinon.spy();
            api = Api.init({}, {
                log: {
                    audit: function () {},
                    error: errorLog
                },
                settings: {
                    httpNodeRoot: true,
                    httpAdminRoot: true,
                    disableEditor: false
                },
                events: {
                    on: function () {},
                    removeListener: function () {}
                },
                isStarted: function () {
                    return false;
                } // <-----
            });

            app = api.adminApp;
            request(app)
                .get('/')
                .expect(503)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    res.text.should.eql('Not started');
                    errorLog.calledOnce.should.be.true();
                    done();
                });
        });

    });

    describe('enables editor', function () {

        var mockList = [
            'nodes', 'flows', 'library', 'info', 'theme', 'locales', 'credentials'
        ]
        before(function () {
            mockList.forEach(function (m) {
                let mock = require('../../src/new/api/' + m)
                // FIX: stub constructor with empty function
                sinon.stub(mock.prototype, "constructor", function () {});
            });
        });
        after(function () {
            mockList.forEach(function (m) {
                let mock = require('../../src/new/api/' + m)
                new mock().restore();
            })
        });

        before(function () {
            api = Api.init({}, {
                log: {
                    audit: function () {}
                },
                settings: {
                    httpNodeRoot: true,
                    httpAdminRoot: true,
                    disableEditor: false
                },
                events: {
                    on: function () {},
                    removeListener: function () {}
                },
                isStarted: function () {
                    return true;
                }
            });
            app = api.adminApp;
        });
        it('serves the editor', function (done) {
            request(app)
                .get('/')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    // Index page should probably mention Node-RED somewhere
                    res.text.indexOf('Node-RED').should.not.eql(-1);
                    done();
                });
        });
        it('serves icons', function (done) {
            request(app)
                .get('/icons/inject.png')
                .expect('Content-Type', /image\/png/)
                .expect(200, done)
        });
        it('serves settings', function (done) {
            request(app)
                .get('/settings')
                .expect(200, done)
        });
        it('handles page not there', function (done) {
            request(app)
                .get('/foo')
                .expect(404, done)
        });
    });
});
