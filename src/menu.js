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

export const pageItem = {
    id: 'page',
    title: 'Copy markdown link to here',
    contexts: ['page', 'editable'],
};

export const selectionItem = {
    id: 'selection',
    title: 'Copy markdown of selection',
    contexts: ['selection'],
};

export const linkItem = {
    id: 'link',
    title: 'Copy markdown of link',
    contexts: ['link'],
};

export const imageItem = {
    id: 'image',
    title: 'Copy markdown of image',
    contexts: ['image'],
};

export const videoItem = {
    id: 'video',
    title: 'Copy markdown of video',
    contexts: ['video'],
};

export const audioItem = {
    id: 'audio',
    title: 'Copy markdown of audio',
    contexts: ['audio'],
};

export const markdownTableItem = {
    id: 'markdownTable',
    title: 'Copy markdown of table',
    contexts: ['selection'],
};

export const tsvTableItem = {
    id: 'tsvTable',
    title: 'Copy TSV of table',
    contexts: ['selection'],
};

export const csvTableItem = {
    id: 'csvTable',
    title: 'Copy CSV of table',
    contexts: ['selection'],
};

export const htmlTableItem = {
    id: 'htmlTable',
    title: 'Copy HTML of table',
    contexts: ['selection'],
};
