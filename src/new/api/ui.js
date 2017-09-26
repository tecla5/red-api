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
var fs = require('fs');
var path = require('path');
var Mustache = require('mustache');

var theme = require('./theme');

var redNodes;

var assetsDir = path.resolve(__dirname + '/../../../assets')
var templateDir = path.resolve(assetsDir, 'templates/new');
var editorTemplate;

module.exports = class Ui {
    constructor(runtime) {
        redNodes = runtime.nodes;
        editorTemplate = fs.readFileSync(path.join(templateDir, 'index.mst'), 'utf8');
        Mustache.parse(editorTemplate);

        this.editorResources = express.static(assetsDir)
    }

    ensureSlash(req, res, next) {
        var parts = req.originalUrl.split('?');
        if (parts[0].slice(-1) != '/') {
            parts[0] += '/';
            var redirect = parts.join('?');
            res.redirect(301, redirect);
        } else {
            next();
        }
    }

    icon(req, res) {
        var icon = req.params.icon;
        var scope = req.params.scope;
        var module = scope ? scope + '/' + req.params.module : req.params.module;
        var iconPath = redNodes.getNodeIconPath(module, icon);
        res.sendFile(iconPath);
    }

    _loadSharedPartials() {
        var partials = {};
        let rootDir = './editor/templates'
        var recursiveReadSync = require('recursive-readdir-sync')
        var files = recursiveReadSync(rootDir)
        for (var i = 0, l = files.length; i < l; i++) {
            var file = files[i];

            if (file.match(/\.mst$/)) {
                var name = path.basename(file, '.mst');
                let contents = fs.readFileSync(file, 'utf8');
                partials[name] = contents
            }
        }

        return partials;
    }

    editor(req, res) {
        res.send(Mustache.render(editorTemplate, theme.context()));
    }
}
