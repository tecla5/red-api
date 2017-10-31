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
var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var when = require('when');
var bodyParser = require('body-parser');

const api = require('.');
var {
    Info,
    Theme,
    theme,
    // info
} = api

const {
    log
} = console

log({
    theme
})

// IMPORTANT:
// Original spec:
// https://github.com/node-red/node-red/blob/master/test/red/api/info_spec.js
describe('info api', function () {
    describe('settings handler', function () {
        let app, info, stubbed

        function prepareApp() {
            if (!stubbed) {
                // FIX: stubbing info.theme affects router output ;)
                sinon.stub(info.theme, 'settings', function () {
                    return {
                        test: 456
                    };
                });
                stubbed = true

                app = express();
                app.use(bodyParser.json());
                app.get('/settings', info.settings.bind(info));
            }
        }

        before(done => {
            done()
        })

        after(function () {
            if (info.theme.settings.restore) {
                info.theme.settings.restore();
            }
        });

        it('returns the filtered settings', function (done) {
            info = Info.init({
                settings: {
                    foo: 123,
                    httpNodeRoot: 'testHttpNodeRoot',
                    version: 'testVersion',
                    paletteCategories: ['red', 'blue', 'green'],
                    exportNodeSettings: function (obj) {
                        obj.testNodeSetting = 'helloWorld';
                    }
                },
                nodes: {
                    paletteEditorEnabled: function () {
                        return true;
                    }
                }
            });
            prepareApp()
            request(app)
                .get('/settings')
                .expect(200)
                .end(assertSettings);

            function assertSettings(err, res) {
                if (err) {
                    return done(err);
                }
                let body = res.body
                body.should.have.property('httpNodeRoot', 'testHttpNodeRoot');
                body.should.have.property('version', 'testVersion');
                body.should.have.property('paletteCategories', ['red', 'blue', 'green']);
                body.should.have.property('editorTheme', {
                    test: 456
                });
                body.should.have.property('testNodeSetting', 'helloWorld');
                body.should.not.have.property('foo', 123);

                done();
            }
        });
        it.skip('overrides palette editable if runtime says it is disabled', function (done) {
            info = Info.init({
                settings: {
                    httpNodeRoot: 'testHttpNodeRoot',
                    version: 'testVersion',
                    paletteCategories: ['red', 'blue', 'green'],
                    exportNodeSettings: function () {}
                },
                nodes: {
                    paletteEditorEnabled: function () {
                        return false;
                    }
                }
            });
            prepareApp()
            request(app)
                .get('/settings')
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    res.body.should.have.property('httpNodeRoot', 'testHttpNodeRoot');
                    res.body.should.have.property('version', 'testVersion');
                    res.body.should.have.property('paletteCategories', ['red', 'blue', 'green']);
                    res.body.should.have.property('editorTheme');
                    res.body.editorTheme.should.have.property('test', 456);

                    // Fails since runtime.nodes.paletteEditorEnabled()
                    //   returns true (in Info.settings route)
                    res.body.editorTheme.should.have.property('palette', {
                        editable: false
                    });
                    done();
                });
        })
    });

});
