/*
   Copyright 2025 Chris Wheeler and Jonathan Chua

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

/**
 * VERSION is Stardown's version. The value must match one of the regex patterns below;
 * use `npm run check-version` to validate the version's format. This variable exists
 * because the "version" properties in the manifests only support stable release versions.
 */
export const VERSION = 'v2.0.0-alpha.2503030152';
export const stableReleaseTagPattern = /^v\d+\.\d+\.\d+$/;
export const prereleaseTagPattern = /^v\d+\.\d+\.\d+-(?:alpha|beta)\.\d{10}$/; // the last 10 digits are YYMMDDhhmm in UTC
