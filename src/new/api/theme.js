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

var express = require('express');
var util = require('util');
var path = require('path');
var fs = require('fs');
var clone = require('clone');

var defaultContext = {
    page: {
        title: 'Node-RED',
        favicon: 'favicon.ico',
        tabicon: 'red/images/node-red-icon-black.svg'
    },
    header: {
        title: 'Node-RED',
        image: 'red/images/node-red.png'
    },
    asset: {
        red: (process.env.NODE_ENV == 'development') ? 'red/red.js' : 'red/red.min.js',
        main: (process.env.NODE_ENV == 'development') ? 'red/main.js' : 'red/main.min.js',

    }
};

const {
    log
} = console

class Theme {
    constructor(runtime = {}) {
        var settings = runtime.settings || {};
        // FIX: avoid override of method with same name
        // this._settings = settings

        let themeContext = clone(defaultContext);
        if (runtime.version) {
            themeContext.version = runtime.version();
        }
        this.themeContext = themeContext
        this.theme = settings.editorTheme || {};
        this.themeSettings = {}
    }

    app() {
        var i;
        var url;

        let {
            theme,
            themeApp,
            themeSettings,
            themeContext
        } = this
        themeSettings = themeSettings || {}

        themeApp = express();

        if (theme.page) {

            themeContext.page.css = serveFilesFromTheme(
                theme.page.css,
                themeApp,
                '/css/')
            themeContext.page.scripts = serveFilesFromTheme(
                theme.page.scripts,
                themeApp,
                '/scripts/')

            if (theme.page.favicon) {
                url = serveFile(themeApp, '/favicon/', theme.page.favicon)
                if (url) {
                    themeContext.page.favicon = url;
                }
            }

            if (theme.page.tabicon) {
                url = serveFile(themeApp, '/tabicon/', theme.page.tabicon)
                if (url) {
                    themeContext.page.tabicon = url;
                }
            }

            themeContext.page.title = theme.page.title || themeContext.page.title;
        }

        if (theme.header) {

            themeContext.header.title = theme.header.title || themeContext.header.title;

            if (theme.header.hasOwnProperty('url')) {
                themeContext.header.url = theme.header.url;
            }

            if (theme.header.hasOwnProperty('image')) {
                if (theme.header.image) {
                    url = serveFile(themeApp, '/header/', theme.header.image);
                    if (url) {
                        themeContext.header.image = url;
                    }
                } else {
                    themeContext.header.image = null;
                }
            }
        }

        log({
            theme,
            themeSettings,
            deployButton: theme.deployButton
        })
        if (theme.deployButton) {
            if (theme.deployButton.type == 'simple') {
                themeSettings.deployButton = {
                    type: 'simple'
                }
                if (theme.deployButton.label) {
                    themeSettings.deployButton.label = theme.deployButton.label;
                }
                if (theme.deployButton.icon) {
                    url = serveFile(themeApp, '/deploy/', theme.deployButton.icon);
                    if (url) {
                        themeSettings.deployButton.icon = url;
                    }
                }
            }
        }

        if (theme.hasOwnProperty('userMenu')) {
            themeSettings.userMenu = theme.userMenu;
        }

        if (theme.login) {
            if (theme.login.image) {
                url = serveFile(themeApp, '/login/', theme.login.image);
                if (url) {
                    themeContext.login = {
                        image: url
                    }
                }
            }
        }

        if (theme.hasOwnProperty('menu')) {
            themeSettings.menu = theme.menu;
        }

        if (theme.hasOwnProperty('palette')) {
            themeSettings.palette = theme.palette;
        }
        return themeApp;
    }

    context() {
        return this.themeContext;
    }

    settings() {
        return this.themeSettings;
    }

    serveFile(baseUrl, file) {
        return serveFile(this.themeApp, baseUrl, file);
    }
}


function serveFile(app, baseUrl, file) {
    try {
        var stats = fs.statSync(file);
        var url = baseUrl + path.basename(file);
        //console.log(url,'->',file);
        app.get(url, function (req, res) {
            res.sendFile(file);
        });
        return 'theme' + url;
    } catch (err) {
        //TODO: log filenotfound
        return null;
    }
}

function serveFilesFromTheme(themeValue, themeApp, directory) {
    var result = [];
    if (themeValue) {
        var array = themeValue;
        if (!util.isArray(array)) {
            array = [array];
        }

        for (var i = 0; i < array.length; i++) {
            var url = serveFile(themeApp, directory, array[i]);
            if (url) {
                result.push(url);
            }
        }
    }
    return result
}

Theme.init = function (runtime) {
    return new Theme(runtime)
}

module.exports = Theme
