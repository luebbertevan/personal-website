import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the approved four-chapter About content", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Evan Luebbert/);
  assert.match(html, /passion first software engineer and designer/);
  assert.match(html, /Based in New York City/);
  assert.match(html, /Engineering provides the unique opportunity/);
  assert.match(html, /Approach/);
  assert.match(html, /Interests/);
  assert.match(html, /Contact/);
  assert.match(html, /<span>Software Engineer<\/span>/);
  assert.match(html, /Evan Luebbert smiling outdoors\./);
  assert.match(html, /<title>Evan Luebbert<\/title>/);
  assert.match(html, /\/og\.png/);
  assert.doesNotMatch(html, /Placeholder personal copy/i);
  assert.doesNotMatch(html, /Signal Spine/i);
  assert.doesNotMatch(html, /Portfolio Prototype|Dynamic Route Online|Index \/ Home|Scroll \/|Arrows \/|Pointer \//i);
});

test("Home navigation, contact actions, and public assets are wired correctly", async () => {
  const [source, pageSource, css, globalCss, headshot, resume, socialImage] = await Promise.all([
    readFile(new URL("../app/signal-prototype-v4.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/images/evan-luebbert-headshot.webp", import.meta.url)),
    readFile(new URL("../public/documents/evan-luebbert-resume-2026.pdf", import.meta.url)),
    readFile(new URL("../public/og.png", import.meta.url)),
  ]);

  assert.match(source, /label:\s*"HOME",\s*chapters:\s*4,/);
  assert.match(source, /\['INTRODUCTION', 'APPROACH', 'INTERESTS', 'CONTACT'\]/);
  assert.match(pageSource, /<strong>Evan Luebbert<\/strong>\s*<span>Software Engineer<\/span>/);
  assert.match(source, /02 \/ APPROACH/);
  assert.match(source, /<h2>Approach<\/h2>/);
  assert.match(source, /<p className=\{styles\.eyebrow\}>SOFTWARE ENGINEER<\/p>\s*<h1>Evan<br \/>Luebbert<\/h1>/);
  assert.match(css, /\.homeProject \.chapterRail \{ grid-template-columns: repeat\(4, 1fr\); \}/);
  assert.match(globalCss, /\.site-identity strong \{[^}]*font-size: clamp\(46px, 2\.9vw, 60px\);/s);
  assert.match(globalCss, /\.site-identity span \{[^}]*font-size: clamp\(24px, 1\.44vw, 28px\);/s);
  assert.match(globalCss, /animation: identity-name-reveal 480ms[^;]*500ms both;/);
  assert.match(globalCss, /animation: identity-title-reveal 480ms[^;]*700ms both;/);
  assert.match(globalCss, /\.site-identity span \{[^}]*border: 1px solid rgba\(var\(--accent-rgb\), 0\.58\);[^}]*text-shadow: 0 0 14px/s);
  assert.match(pageSource, /className="site-root" data-site-root/);
  assert.match(source, /siteRoot\?\.style\.setProperty\("--accent-rgb", value\);/);
  assert.doesNotMatch(source, /<i>0[012]<\/i>/);
  assert.match(css, /\.waypoint button \{[^}]*grid-template-columns: 1fr;[^}]*rgba\(5, 5, 7, 0\.76\);/s);
  assert.match(css, /padding-right: clamp\(24px, 2\.2vw, 38px\);/);
  assert.match(source, /const HOME_INTRO_DURATION = 4;/);
  assert.match(source, /const HOME_CHROME_REVEAL_START = 4\.15;/);
  assert.match(source, /const HOME_OPENING_DURATION = 4\.75;/);
  assert.match(source, /navigationCommandRef\.current = \{ type: "step", value: dominantDelta > 0 \? 1 : -1 \};/);
  assert.match(source, /ref=\{emailRef\}>luebbertevan@gmail\.com<\/strong>/);
  assert.match(source, /onClick=\{copyEmail\}/);
  assert.match(source, /href="mailto:luebbertevan@gmail\.com"/);
  assert.match(source, /href="https:\/\/www\.linkedin\.com\/in\/evan-luebbert\/"\s+target="_blank"/);
  assert.match(source, /href="https:\/\/github\.com\/luebbertevan"\s+target="_blank"/);
  assert.match(source, /href="\/documents\/evan-luebbert-resume-2026\.pdf"\s+download="Evan-Luebbert-Resume-2026\.pdf"/);

  assert.equal(headshot.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(headshot.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(resume.subarray(0, 4).toString("ascii"), "%PDF");
  assert.deepEqual([...socialImage.subarray(1, 4)], [80, 78, 71]);
  assert.doesNotMatch(source, /SIGNAL SPINE|PORTFOLIO PROTOTYPE|DYNAMIC ROUTE ONLINE|SCROLL · ARROWS · CLICK TABS/);

  assert.ok(projectRoot);
});
