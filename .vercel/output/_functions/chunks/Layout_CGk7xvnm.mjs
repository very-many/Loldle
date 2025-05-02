import { c as createComponent, a as createAstro, b as addAttribute, r as renderHead, d as renderSlot, e as renderTemplate } from './astro/server_8xJNLLM3.mjs';
import 'kleur/colors';
import 'clsx';
/* empty css                           */

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body class="bg-gray-950" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "C:/Users/jonas/OneDrive - bwedu/Loldle/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
