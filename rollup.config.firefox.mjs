/*
   Copyright 2024 Chris Wheeler and Jonathan Chua

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
import copy from "rollup-plugin-copy"; // https://www.npmjs.com/package/rollup-plugin-copy
import del from "rollup-plugin-delete"; // https://www.npmjs.com/package/rollup-plugin-delete

// This is a Rollup configuration file for building the Firefox extension. It first
// copies all the necessary files from `src` to the `firefox` directory, then replaces
// all imports with the code the imports correspond to. Lastly, it deletes all files in
// the `firefox` directory that were imported into other files there and are no longer
// needed.
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
    if (!filename.endsWith(".js")) {
        return contents;
    }

    return contents
        .toString()
        .replace(
            // Remove all `browser` imports because firefox/browserSpecific.js doesn't
            // define `browser` because Firefox already has a global `browser` variable.
            /(import \{.*?)browser,?(.*?\} from ['"])/,
            "$1$2",
        )
        .replace(
            // Comment out `window.onload = setUpListeners` because although Chrome
            // needs it, in Firefox it causes a "Clipboard write is not allowed" error
            // on some sites despite not preventing clipboard writes.
            /window\.onload = setUpListeners/,
            "// window.onload = setUpListeners",
        );
}

export default [
    {
        input: "firefox/background.js",
        output: {
            file: "firefox/background.js",
            format: "iife", // immediately-invoked function expression
        },
        plugins: [
            copy({
                // Copy all files and folders to the firefox folder except the
                // browserSpecific.js that is for testing. There are multiple targets
                // because the tranform function must only be called on JavaScript
                // files.
                targets: [
                    {
                        // copy the images folder and html & css files
                        src: ["src/images", "src/**/*.html", "src/**/*.css"],
                        dest: "firefox",
                    },
                    {
                        // copy js files and transform them
                        src: ["src/**/*.js", "!src/browserSpecific.js"],
                        dest: "firefox",
                        transform: transform,
                    },
                ],
                flatten: false, // don't combine all nested folders into one flat folder
                hook: "buildStart", // run the copy before the build starts
            }),
        ],
    },
    {
        input: "firefox/content.js",
        output: {
            file: "firefox/content.js",
            format: "iife", // immediately-invoked function expression
        },
    },
    {
        input: "firefox/popup.js",
        output: {
            file: "firefox/popup.js",
            format: "iife", // immediately-invoked function expression
        },
    },
    {
        input: "firefox/sidebar.js",
        output: {
            file: "firefox/sidebar.js",
            format: "iife", // immediately-invoked function expression
        },
    },
    {
        input: "firefox/settings.js",
        output: {
            file: "firefox/settings.js",
            format: "iife", // immediately-invoked function expression
        },
        plugins: [
            del({
                // Delete all files in the `firefox` directory that were imported into
                // other files there and are no longer needed.
                targets: [
                    "firefox/*", // delete all files except the ones below

                    "!firefox/images",

                    "!firefox/manifest.json",

                    "!firefox/**/*.html",
                    "!firefox/**/*.css",

                    "!firefox/browserSpecific.js",
                    "!firefox/background.js",
                    "!firefox/content.js",
                    "!firefox/popup.js",
                    "!firefox/sidebar.js",
                    "!firefox/settings.js",
                    "!firefox/text-fragment-utils.js",
                    "!firefox/fragment-generation-utils.js",
                ],
                hook: "buildEnd", // run the delete after the build ends
            }),
        ],
    },
];
