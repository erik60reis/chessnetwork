'use strict';

var tslib_es6 = require('../lib/@rollup_plugin-typescript@11.1.5_rollup@4.8.0_tslib@2.6.2_typescript@5.2.2/lib/tslib/tslib.es6.cjs');
var url = require('./url.cjs');

function patchUrlMappings(mappings, { patchFetch = true, patchWebSocket = true, patchXhr = true, patchSrcAttributes = false } = {}) {
    // Bail out if we're not in a browser
    if (typeof window === 'undefined')
        return;
    if (patchFetch) {
        const fetchImpl = window.fetch;
        // fetch is a duplex, but this is consistent
        window.fetch = function (input, init) {
            // If fetch has Request as input, we need to resolve any stream
            // before we create a new request with the mapped url
            if (input instanceof Request) {
                const newUrl = attemptRemap({ url: url.absoluteURL(input.url), mappings });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _a = (init !== null && init !== void 0 ? init : {}), newInit = tslib_es6.__rest(_a, ["url"]);
                Object.keys(Request.prototype).forEach((value) => {
                    if (value === 'url')
                        return;
                    try {
                        // @ts-expect-error
                        newInit[value] = input[value];
                    }
                    catch (ex) {
                        console.warn(`Remapping fetch request key "${value}" failed`, ex);
                    }
                });
                return new Promise((resolve, reject) => {
                    try {
                        input.blob().then((blob) => {
                            if (input.method.toUpperCase() !== 'HEAD' && input.method.toUpperCase() !== 'GET' && blob.size > 0) {
                                newInit.body = blob;
                            }
                            resolve(fetchImpl(new Request(newUrl, newInit)));
                        });
                    }
                    catch (ex) {
                        reject(ex);
                    }
                });
            }
            // Assuming a generic url or string
            const remapped = attemptRemap({ url: input instanceof URL ? input : url.absoluteURL(input), mappings });
            return fetchImpl(remapped, init);
        };
    }
    if (patchWebSocket) {
        class WebSocketProxy extends WebSocket {
            constructor(url$1, protocols) {
                const remapped = attemptRemap({ url: url$1 instanceof URL ? url$1 : url.absoluteURL(url$1), mappings });
                super(remapped, protocols);
            }
        }
        window.WebSocket = WebSocketProxy;
    }
    if (patchXhr) {
        const openImpl = XMLHttpRequest.prototype.open;
        // @ts-expect-error - the ts interface exports two 'open' methods
        XMLHttpRequest.prototype.open = function (method, url$1, async, username, password) {
            const remapped = attemptRemap({ url: url.absoluteURL(url$1), mappings });
            openImpl.apply(this, [method, remapped, async, username, password]);
        };
    }
    if (patchSrcAttributes) {
        const callback = function (mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    attemptSetNodeSrc(mutation.target, mappings);
                }
                else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => recursivelyRemapChildNodes(node, mappings));
                }
            }
        };
        const observer = new MutationObserver(callback);
        const config = {
            attributeFilter: ['src'],
            childList: true,
            subtree: true,
        };
        observer.observe(window.document, config);
        window.document.querySelectorAll('[src]').forEach((node) => {
            attemptSetNodeSrc(node, mappings);
        });
    }
}
function recursivelyRemapChildNodes(node, mappings) {
    if (node.hasChildNodes()) {
        node.childNodes.forEach((child) => {
            attemptSetNodeSrc(child, mappings);
            recursivelyRemapChildNodes(child, mappings);
        });
    }
}
function attemptSetNodeSrc(node, mappings) {
    var _a;
    if (node instanceof HTMLElement && node.hasAttribute('src')) {
        const url$1 = url.absoluteURL((_a = node.getAttribute('src')) !== null && _a !== void 0 ? _a : '');
        if (url$1.host === window.location.host)
            return;
        node.setAttribute('src', attemptRemap({ url: url$1, mappings }).toString());
    }
}
function attemptRemap({ url: url$1, mappings }) {
    for (const mapping of mappings) {
        const mapped = url.matchAndRewriteURL({
            originalURL: url$1,
            prefix: mapping.prefix,
            target: mapping.target,
            prefixHost: window.location.host,
        });
        if (mapped != null && (mapped === null || mapped === void 0 ? void 0 : mapped.toString()) !== url$1.toString()) {
            return mapped;
        }
    }
    return url$1;
}

exports.attemptRemap = attemptRemap;
exports.patchUrlMappings = patchUrlMappings;