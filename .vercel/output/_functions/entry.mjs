import { r as renderers } from './chunks/internal_BsTt5pTQ.mjs';
import { c as createExports } from './chunks/entrypoint_BGwXZDxH.mjs';
import { manifest } from './manifest_DJnf8PMD.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/classic.astro.mjs');
const _page2 = () => import('./pages/ddragon.astro.mjs');
const _page3 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/classic.astro", _page1],
    ["src/pages/ddragon.astro", _page2],
    ["src/pages/index.astro", _page3]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "b515cc87-2e6d-4681-a163-4fd859bde334",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
