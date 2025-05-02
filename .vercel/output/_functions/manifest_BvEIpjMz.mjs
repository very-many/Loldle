import 'kleur/colors';
import { h as decodeKey } from './chunks/astro/server_T7v3i2NQ.mjs';
import 'clsx';
import 'cookie';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_CxQSYi2-.mjs';
import 'es-module-lexer';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/jonas/OneDrive%20-%20bwedu/Loldle/","cacheDir":"file:///C:/Users/jonas/OneDrive%20-%20bwedu/Loldle/node_modules/.astro/","outDir":"file:///C:/Users/jonas/OneDrive%20-%20bwedu/Loldle/dist/","srcDir":"file:///C:/Users/jonas/OneDrive%20-%20bwedu/Loldle/src/","publicDir":"file:///C:/Users/jonas/OneDrive%20-%20bwedu/Loldle/public/","buildClientDir":"file:///C:/Users/jonas/OneDrive%20-%20bwedu/Loldle/dist/client/","buildServerDir":"file:///C:/Users/jonas/OneDrive%20-%20bwedu/Loldle/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"ddragon/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/ddragon","isIndex":false,"type":"page","pattern":"^\\/ddragon\\/?$","segments":[[{"content":"ddragon","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/ddragon.astro","pathname":"/ddragon","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/classic.C_5JarbX.css"},{"type":"inline","content":"[data-astro-cid-dq2priuy]{box-sizing:border-box}body{font:16px Arial}.autocomplete[data-astro-cid-dq2priuy]{position:relative;display:inline-block}input[data-astro-cid-dq2priuy]{border:1px solid transparent;background-color:#f1f1f1;padding:10px;font-size:16px}input[data-astro-cid-dq2priuy][type=text]{background-color:#f1f1f1;width:100%}input[data-astro-cid-dq2priuy][type=submit]{background-color:#1e90ff;color:#fff}.autocomplete-items[data-astro-cid-dq2priuy]{position:absolute;border:1px solid #d4d4d4;border-bottom:none;border-top:none;z-index:99;top:100%;left:0;right:0}.autocomplete-items[data-astro-cid-dq2priuy] div[data-astro-cid-dq2priuy]{padding:10px;cursor:pointer;background-color:#fff;border-bottom:1px solid #d4d4d4}.autocomplete-items[data-astro-cid-dq2priuy] div[data-astro-cid-dq2priuy]:hover{background-color:#e9e9e9}.autocomplete-active[data-astro-cid-dq2priuy]{background-color:#1e90ff!important;color:#fff}\n"}],"routeData":{"route":"/classic","isIndex":false,"type":"page","pattern":"^\\/classic\\/?$","segments":[[{"content":"classic","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/classic.astro","pathname":"/classic","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/jonas/OneDrive - bwedu/Loldle/src/pages/classic.astro",{"propagation":"none","containsHead":true}],["C:/Users/jonas/OneDrive - bwedu/Loldle/src/pages/ddragon.astro",{"propagation":"none","containsHead":true}],["C:/Users/jonas/OneDrive - bwedu/Loldle/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:src/pages/ddragon@_@astro":"pages/ddragon.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-page:src/pages/classic@_@astro":"pages/classic.astro.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-renderers":"renderers.mjs","C:/Users/jonas/OneDrive - bwedu/Loldle/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_DOKdOBlF.mjs","\u0000@astrojs-manifest":"manifest_BvEIpjMz.mjs","C:/Users/jonas/OneDrive - bwedu/Loldle/src/components/champSelect.astro?astro&type=script&index=0&lang.ts":"_astro/champSelect.astro_astro_type_script_index_0_lang.l0sNRNKZ.js","C:/Users/jonas/OneDrive - bwedu/Loldle/src/components/reset.astro?astro&type=script&index=0&lang.ts":"_astro/reset.astro_astro_type_script_index_0_lang.CWqtxTtH.js","C:/Users/jonas/OneDrive - bwedu/Loldle/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts":"_astro/ClientRouter.astro_astro_type_script_index_0_lang.BZs-2RF_.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["C:/Users/jonas/OneDrive - bwedu/Loldle/src/components/champSelect.astro?astro&type=script&index=0&lang.ts",""],["C:/Users/jonas/OneDrive - bwedu/Loldle/src/components/reset.astro?astro&type=script&index=0&lang.ts","const t=document.getElementById(\"Reset\");t?.addEventListener(\"click\",()=>{localStorage.removeItem(\"selectedChampionsClassic\");const e=new CustomEvent(\"reset\");window.dispatchEvent(e)});"]],"assets":["/_astro/classic.C_5JarbX.css","/favicon.svg","/_astro/ClientRouter.astro_astro_type_script_index_0_lang.BZs-2RF_.js","/ddragon/index.html","/index.html"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"I1hR5ddklsptxRhx+g8cCsnrMMzPpIATqtLe29DFhro="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
