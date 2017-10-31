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
var Theme = require('./theme');
var util = require('util');
var runtime;
var settings;

const {
    log
} = console

class Info {
    constructor(runtime = {}) {
        this.runtime = runtime;

        this._settings = runtime.settings
        this.theme = Theme.init(runtime)
    }

    // route handler for /settings
    settings(req, res) {
        const {
            _settings,
            runtime,
            theme
        } = this
        log('route: settings', req)

        let settings = _settings

        var safeSettings = {
            httpNodeRoot: _settings.httpNodeRoot || '/',
            version: _settings.version,
            user: req.user
        }

        var themeSettings = theme.settings();
        if (themeSettings) {
            safeSettings.editorTheme = themeSettings;
        }

        if (util.isArray(settings.paletteCategories)) {
            safeSettings.paletteCategories = settings.paletteCategories;
        }

        if (settings.flowFilePretty) {
            safeSettings.flowFilePretty = settings.flowFilePretty;
        }

        const paletteEditorEnabled = runtime.nodes.paletteEditorEnabled()
        // console.log('should be false', {
        //     paletteEditorEnabled
        // })
        if (!paletteEditorEnabled) {
            safeSettings.editorTheme = safeSettings.editorTheme || {};
            console.log('set editorTheme.palette', {
                palette: safeSettings.editorTheme.palette
            })
            safeSettings.editorTheme.palette = safeSettings.editorTheme.palette || {};
            safeSettings.editorTheme.palette.editable = false;
        }

        settings.exportNodeSettings(safeSettings);

        res.json(safeSettings);
    }
}

Info.init = function (runtime) {
    return new Info(runtime)
}

module.exports = Info
