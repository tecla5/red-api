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

const {
    log,
    api,
    initNodes,
    should,
    request,
    sinon,
    when,
    prepareApp
} = require('./util')

describe('nodes api', function () {
    var app, stubbed;

    describe('enable/disable', function () {
        // passes
        it('returns 400 if settings are unavailable', function (done) {
            let {
                nodes,
                locales
            } = initNodes({

                settings: {
                    available: function () {
                        return false
                    }
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/123')
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        // passes
        it('returns 400 for invalid node payload', function (done) {
            let {
                nodes,
                locales
            } = initNodes({

                settings: {
                    available: function () {
                        return true
                    }
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/node-red/foo')
                .send({})
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('message', 'Invalid request');
                    done();
                });
        });

        // passes
        it('returns 400 for invalid module payload', function (done) {
            let {
                nodes,
                locales
            } = initNodes({

                settings: {
                    available: function () {
                        return true
                    }
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/foo')
                .send({})
                .expect(400)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('message', 'Invalid request');

                    done();
                });
        });

        // passes
        it('returns 404 for unknown node', function (done) {
            let {
                nodes,
                locales
            } = initNodes({

                settings: {
                    available: function () {
                        return true
                    }
                },
                nodes: {
                    getNodeInfo: function () {
                        return null
                    }
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/node-red/foo')
                .send({
                    enabled: false
                })
                .expect(404)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        // passes
        it('returns 404 for unknown module', function (done) {
            let {
                nodes,
                locales
            } = initNodes({

                settings: {
                    available: function () {
                        return true
                    }
                },
                nodes: {
                    getModuleInfo: function (id) {
                        return null
                    }
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/node-blue')
                .send({
                    enabled: false
                })
                .expect(404)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        // passes
        it('enables disabled node', function (done) {
            let {
                nodes,
                locales
            } = initNodes({
                settings: {
                    available: function () {
                        return true
                    }
                },
                nodes: {
                    getNodeInfo: function () {
                        return {
                            id: '123',
                            enabled: false
                        }
                    },
                    enableNode: function () {
                        return when.resolve({
                            id: '123',
                            enabled: true,
                            types: ['a']
                        });
                    }
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/node-red/foo')
                .send({
                    enabled: true
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id', '123');
                    res.body.should.have.property('enabled', true);

                    done();
                });
        });

        // passes
        it('disables enabled node', function (done) {
            let {
                nodes,
                locales
            } = initNodes({
                settings: {
                    available: function () {
                        return true
                    }
                },
                nodes: {
                    getNodeInfo: function () {
                        return {
                            id: '123',
                            enabled: true
                        }
                    },
                    disableNode: function () {
                        return when.resolve({
                            id: '123',
                            enabled: false,
                            types: ['a']
                        });
                    }
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/node-red/foo')
                .send({
                    enabled: false
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('id', '123');
                    res.body.should.have.property('enabled', false);

                    done();
                });
        });

        // passes
        describe('no-ops if already in the right state', function () {
            function run(state, done) {
                var enableNode = sinon.spy(function () {
                    return when.resolve({
                        id: '123',
                        enabled: true,
                        types: ['a']
                    })
                });
                var disableNode = sinon.spy(function () {
                    return when.resolve({
                        id: '123',
                        enabled: false,
                        types: ['a']
                    })
                });

                let {
                    nodes,
                    locales
                } = initNodes({
                    settings: {
                        available: function () {
                            return true
                        }
                    },
                    nodes: {
                        getNodeInfo: function () {
                            return {
                                id: '123',
                                enabled: state
                            }
                        },
                        enableNode: enableNode,
                        disableNode: disableNode
                    }
                });
                app = prepareApp({
                    nodes,
                    locales
                })
                request(app)
                    .put('/nodes/node-red/foo')
                    .send({
                        enabled: state
                    })
                    .expect(200)
                    .end(function (err, res) {
                        var enableNodeCalled = enableNode.called;
                        var disableNodeCalled = disableNode.called;
                        if (err) {
                            throw err;
                        }
                        enableNodeCalled.should.be.false();
                        disableNodeCalled.should.be.false();
                        res.body.should.have.property('id', '123');
                        res.body.should.have.property('enabled', state);

                        done();
                    });
            }
            it('already enabled', function (done) {
                run(true, done);
            });
            it('already disabled', function (done) {
                run(false, done);
            });
        });

        // passes
        describe('does not no-op if err on node', function () {
            function run(state, done) {
                var enableNode = sinon.spy(function () {
                    return when.resolve({
                        id: '123',
                        enabled: true,
                        types: ['a']
                    })
                });
                var disableNode = sinon.spy(function () {
                    return when.resolve({
                        id: '123',
                        enabled: false,
                        types: ['a']
                    })
                });

                let {
                    nodes,
                    locales
                } = initNodes({
                    settings: {
                        available: function () {
                            return true
                        }
                    },
                    nodes: {
                        getNodeInfo: function () {
                            return {
                                id: '123',
                                enabled: state,
                                err: 'foo'
                            }
                        },
                        enableNode: enableNode,
                        disableNode: disableNode
                    }
                });
                app = prepareApp({
                    nodes,
                    locales
                })
                // putSet with putNode
                request(app)
                    .put('/nodes/node-red/foo')
                    .send({
                        enabled: state
                    })
                    .expect(200)
                    .end(function (err, res) {
                        log('put /nodes/node-red/foo', {
                            err,
                            res,
                            state
                        })
                        var enableNodeCalled = enableNode.called;
                        var disableNodeCalled = disableNode.called;
                        if (err) {
                            throw err;
                        }
                        enableNodeCalled.should.be.equal(state);
                        disableNodeCalled.should.be.equal(!state);
                        res.body.should.have.property('id', '123');
                        res.body.should.have.property('enabled', state);

                        done();
                    });
            }
            it('already enabled', function (done) {
                run(true, done);
            });

            it('already disabled', function (done) {
                run(false, done);
            });
        });

        // passes
        it('enables disabled module', function (done) {
            var n1 = {
                id: '123',
                enabled: false,
                types: ['a']
            };
            var n2 = {
                id: '456',
                enabled: false,
                types: ['b']
            };
            var enableNode = sinon.stub();
            enableNode.onFirstCall().returns((function () {
                n1.enabled = true;
                return when.resolve(n1);
            })());
            enableNode.onSecondCall().returns((function () {
                n2.enabled = true;
                return when.resolve(n2);
            })());
            enableNode.returns(null);
            let {
                nodes,
                locales
            } = initNodes({
                settings: {
                    available: function () {
                        return true
                    }
                },
                nodes: {
                    getModuleInfo: function () {
                        return {
                            name: 'node-red',
                            nodes: [n1, n2]
                        }
                    },
                    enableNode: enableNode
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/node-red')
                .send({
                    enabled: true
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('name', 'node-red');
                    res.body.should.have.property('nodes');
                    res.body.nodes[0].should.have.property('enabled', true);
                    res.body.nodes[1].should.have.property('enabled', true);

                    done();
                });
        });

        // passes
        it('disables enabled module', function (done) {
            var n1 = {
                id: '123',
                enabled: true,
                types: ['a']
            };
            var n2 = {
                id: '456',
                enabled: true,
                types: ['b']
            };
            var disableNode = sinon.stub();
            disableNode.onFirstCall().returns((function () {
                n1.enabled = false;
                return when.resolve(n1);
            })());
            disableNode.onSecondCall().returns((function () {
                n2.enabled = false;
                return when.resolve(n2);
            })());
            disableNode.returns(null);
            let {
                nodes,
                locales
            } = initNodes({
                settings: {
                    available: function () {
                        return true
                    }
                },
                nodes: {
                    getModuleInfo: function () {
                        return {
                            name: 'node-red',
                            nodes: [n1, n2]
                        }
                    },
                    disableNode: disableNode
                }
            });
            app = prepareApp({
                nodes,
                locales
            })
            request(app)
                .put('/nodes/node-red')
                .send({
                    enabled: false
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('name', 'node-red');
                    res.body.should.have.property('nodes');
                    res.body.nodes[0].should.have.property('enabled', false);
                    res.body.nodes[1].should.have.property('enabled', false);

                    done();
                });
        });

        // passes
        describe('no-ops if a node in module already in the right state', function () {
            function run(state, done) {
                var node = {
                    id: '123',
                    enabled: state,
                    types: ['a']
                };
                var enableNode = sinon.spy(function (id) {
                    node.enabled = true;
                    return when.resolve(node);
                });
                var disableNode = sinon.spy(function (id) {
                    node.enabled = false;
                    return when.resolve(node);
                });

                let {
                    nodes,
                    locales
                } = initNodes({
                    settings: {
                        available: function () {
                            return true
                        }
                    },
                    nodes: {
                        getModuleInfo: function () {
                            return {
                                name: 'node-red',
                                nodes: [node]
                            };
                        },
                        enableNode: enableNode,
                        disableNode: disableNode
                    }
                });
                app = prepareApp({
                    nodes,
                    locales
                })
                request(app)
                    .put('/nodes/node-red')
                    .send({
                        enabled: state
                    })
                    .expect(200)
                    .end(function (err, res) {
                        var enableNodeCalled = enableNode.called;
                        var disableNodeCalled = disableNode.called;
                        if (err) {
                            throw err;
                        }
                        enableNodeCalled.should.be.false();
                        disableNodeCalled.should.be.false();
                        res.body.should.have.property('name', 'node-red');
                        res.body.should.have.property('nodes');
                        res.body.nodes[0].should.have.property('enabled', state);

                        done();
                    });
            }
            it('already enabled', function (done) {
                run(true, done);
            });
            it('already disabled', function (done) {
                run(false, done);
            });
        });

        // passes
        describe('does not no-op if err on a node in module', function () {
            function run(state, done) {
                var node = {
                    id: '123',
                    enabled: state,
                    types: ['a'],
                    err: 'foo'
                };
                var enableNode = sinon.spy(function (id) {
                    node.enabled = true;
                    return when.resolve(node);
                });
                var disableNode = sinon.spy(function (id) {
                    node.enabled = false;
                    return when.resolve(node);
                });
                let {
                    nodes,
                    locales
                } = initNodes({
                    settings: {
                        available: function () {
                            return true
                        }
                    },
                    nodes: {
                        getModuleInfo: function () {
                            return {
                                name: 'node-red',
                                nodes: [node]
                            };
                        },
                        enableNode: enableNode,
                        disableNode: disableNode
                    }
                });
                app = prepareApp({
                    nodes,
                    locales
                })
                request(app)
                    .put('/nodes/node-red')
                    .send({
                        enabled: state
                    })
                    .expect(200)
                    .end(function (err, res) {
                        var enableNodeCalled = enableNode.called;
                        var disableNodeCalled = disableNode.called;
                        if (err) {
                            throw err;
                        }
                        enableNodeCalled.should.be.equal(state);
                        disableNodeCalled.should.be.equal(!state);
                        res.body.should.have.property('name', 'node-red');
                        res.body.should.have.property('nodes');
                        res.body.nodes[0].should.have.property('enabled', state);

                        done();
                    });
            }
            it('already enabled', function (done) {
                run(true, done);
            });
            it('already disabled', function (done) {
                run(false, done);
            });
        });
    });
});
