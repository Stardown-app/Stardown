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

// This is a Rollup configuration file for building the Chrome extension. It first
// copies all the necessary files from `src` to the `chrome` directory, then replaces
// all imports with the code the imports correspond to. Lastly, it deletes all files in
// the `chrome` directory that were imported into other files there and are no longer
// needed.
//
// Each time this runs, any existing files with the same names as those copied are
// overwritten.

export default [
    {
        input: 'chrome/background.js',
        output: {
            file: 'chrome/background.js',
            format: 'iife', // immediately-invoked function expression
        },
        plugins: [
            copy({
                targets: [
                    {
                        src: [
                            // Copy everything from `src` to `chrome` except the
                            // config.js that is for testing.
                            'src/*',
                            '!src/config.js',
                        ],
                        dest: 'chrome',
                    },
                ],
                hook: 'buildStart', // Run the copy before the build starts.
            }),
        ]
    },
    {
        input: 'chrome/content.js',
        output: {
            file: 'chrome/content.js',
            format: 'iife', // immediately-invoked function expression
        },
    },
    {
        input: 'chrome/settings.js',
        output: {
            file: 'chrome/settings.js',
            format: 'iife', // immediately-invoked function expression
        },
        plugins: [
            del({
                // Delete all files in the `chrome` directory that were imported into
                // other files there and are no longer needed.
                targets: [
                    'chrome/*', // Delete all files except the ones below.
                    '!chrome/*.json',
                    '!chrome/*.html',
                    '!chrome/images',
                    '!chrome/config.js',
                    '!chrome/background.js',
                    '!chrome/content.js',
                    '!chrome/popup.js',
                    '!chrome/sidebar.js',
                    '!chrome/settings.js',
                    '!chrome/text-fragment-utils.js',
                    '!chrome/fragment-generation-utils.js',
                ],
                hook: 'buildEnd', // Run the delete after the build ends.
            })
        ]
    }
];
