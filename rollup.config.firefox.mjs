/*
   Copyright 2024 Chris Wheeler

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// https://rollupjs.org/
import copy from 'rollup-plugin-copy'; // https://www.npmjs.com/package/rollup-plugin-copy
import del from 'rollup-plugin-delete'; // https://www.npmjs.com/package/rollup-plugin-delete

// This is a Rollup configuration file for building the Firefox extension. It first
// copies all the necessary files from `src` to the `firefox` directory, then replaces
// all imports in background.js, content.js, and options.js with the code the imports
// correspond to. Lastly, it deletes all files in the `firefox` directory that were
// imported into other files there and are no longer needed.
//
// Each time this runs, any existing files with the same names as those copied are
// overwritten.

/**
 * transform changes a js file to make it compatible with Firefox.
 * @param {Buffer} contents - a file's contents.
 * @param {string} filename - a file's name.
 * @returns {any}
 */
function transform(contents, filename) {
    if (!filename.endsWith('.js')) {
        return contents;
    }

    return contents
        .toString()
        .replace(
            // Remove all `browser` imports because firefox/config.js doesn't define
            // `browser` because Firefox already has a global `browser` variable.
            /(import \{.*?)browser,?(.*?\} from ['"])/,
            '$1$2',
        ).replace(
            // Comment out `window.onload = setUpListeners` because although Chrome
            // needs it, in Firefox it causes a "Clipboard write is not allowed" error
            // on some sites despite not preventing clipboard writes.
            /window\.onload = setUpListeners/,
            '// window.onload = setUpListeners',
        );
}

export default [
    {
        input: 'firefox/background.js',
        output: {
            file: 'firefox/background.js',
            format: 'iife', // immediately-invoked function expression
        },
        plugins: [
            copy({
                // Copy all files and folders to the firefox folder except the test
                // config.js. There are multiple targets because the tranform function
                // cannot run on folders.
                targets: [
                    {
                        // copy the images folder
                        src: ['src/images'],
                        dest: 'firefox',
                    },
                    {
                        // copy js files in the converters folder
                        src: ['src/converters/*'],
                        dest: 'firefox/converters',
                        transform: transform,
                    },
                    {
                        // copy js files in the generators folder
                        src: ['src/generators/*'],
                        dest: 'firefox/generators',
                        transform: transform,
                    },
                    {
                        src: [
                            // copy js files that are directly in the src folder
                            'src/*.js',
                            '!src/config.js',
                        ],
                        dest: 'firefox',
                        transform: transform,
                    },
                ],
                hook: 'buildStart', // Run the copy before the build starts.
            }),
        ]
    },
    {
        input: 'firefox/content.js',
        output: {
            file: 'firefox/content.js',
            format: 'iife', // immediately-invoked function expression
        },
    },
    {
        input: 'firefox/options.js',
        output: {
            file: 'firefox/options.js',
            format: 'iife', // immediately-invoked function expression
        },
        plugins: [
            del({
                // Delete all files in the `firefox` directory that were imported into
                // other files there and are no longer needed.
                targets: [
                    'firefox/*', // Delete all files except the ones below.
                    '!firefox/images',
                    '!firefox/background.js',
                    '!firefox/config.js',
                    '!firefox/content.js',
                    '!firefox/fragment-generation-utils.js',
                    '!firefox/manifest.json',
                    '!firefox/options.html',
                    '!firefox/options.js',
                    '!firefox/text-fragment-utils.js',
                ],
                hook: 'buildEnd', // Run the delete after the build ends.
            })
        ]
    }
];
