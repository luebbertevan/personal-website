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

test("server-renders the approved single-panel About content", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Evan Luebbert/);
  assert.match(html, /passion first software engineer and designer/);
  assert.match(html, /Based in New York City/);
  assert.match(html, /Engineering is my superpower/);
  assert.match(html, /I embrace curiosity, explore creative solutions, and fill the gaps where software can make a difference\./);
  assert.match(html, /Everyone has used frustrating and poorly designed software\./);
  assert.match(html, /Being able to solve my own problems is a luxury\./);
  assert.match(html, /The ability to craft solutions for others is a privilege\./);
  assert.match(html, /Innovative solutions for noble causes/);
  assert.match(html, /obsessing over strategy games/);
  assert.match(html, /Working on something interesting\? Send me an email or find me on LinkedIn\./);
  assert.doesNotMatch(html, />Approach</);
  assert.match(html, /<span>Software Engineer<\/span>/);
  assert.match(html, /Evan Luebbert smiling outdoors\./);
  assert.match(html, /<title>Evan Luebbert<\/title>/);
  assert.match(html, /\/og\.png/);
  assert.doesNotMatch(html, /Placeholder personal copy/i);
  assert.doesNotMatch(html, /Signal Spine/i);
  assert.doesNotMatch(html, /Portfolio Prototype|Dynamic Route Online|Index \/ Home|Scroll \/|Arrows \/|Pointer \//i);
});

test("About navigation, contact actions, and public assets are wired correctly", async () => {
  const [source, pageSource, css, globalCss, headshot, resume, socialImage] = await Promise.all([
    readFile(new URL("../app/signal-prototype-v4.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../public/images/evan-luebbert-headshot.webp", import.meta.url)),
    readFile(new URL("../public/documents/evan-luebbert-resume-2026.pdf", import.meta.url)),
    readFile(new URL("../public/og.png", import.meta.url)),
  ]);

  assert.match(source, /label:\s*"ABOUT",\s*chapters:\s*1,/);
  assert.doesNotMatch(source, /\['INTRODUCTION', 'INTERESTS', 'CONTACT'\]/);
  assert.match(pageSource, /<strong>Evan Luebbert<\/strong>\s*<span>Software Engineer<\/span>/);
  assert.doesNotMatch(source, /<span>ABOUT<\/span><span>APPROACH<\/span>/);
  assert.doesNotMatch(source, /<span>PROFILE<\/span>/);
  assert.doesNotMatch(source, /<h2>Approach<\/h2>/);
  assert.doesNotMatch(source, /styles\.eyebrow|0[1-4] \//);
  assert.doesNotMatch(source, /data-chapter-index[^>]*><span>/);
  assert.match(css, /\.aboutLayout \{[^}]*--portrait-width: clamp\(146px, 12vw, 260px\);[^}]*grid-template-areas:/s);
  assert.match(source, /width="480"\s+height="600"/);
  assert.doesNotMatch(source, /<h1>Evan<br \/>Luebbert<\/h1>/);
  assert.match(source, /<h1 className=\{styles\.introductionTitle\}>I’m a passion first software engineer and designer\.<\/h1>/);
  assert.match(source, /<p className=\{styles\.introductionSubtitle\}>I build software I believe in\.<\/p>/);
  assert.match(css, /\.introductionTitle,\s*\.introductionSubtitle \{[^}]*white-space: nowrap;/s);
  assert.match(source, /className=\{styles\.aboutLayout\}[\s\S]*className=\{styles\.aboutMain\}[\s\S]*className=\{styles\.availability\}[\s\S]*className=\{styles\.aboutApproach\}[\s\S]*className=\{styles\.aboutInterests\}[\s\S]*className=\{styles\.aboutSidebar\}[\s\S]*className=\{styles\.personalNote\}[\s\S]*className=\{styles\.aboutContact\}/);
  assert.match(css, /\.aboutMain \{[^}]*grid-area: main;[^}]*align-content: start;/s);
  assert.match(css, /\.aboutSidebar \{[^}]*grid-area: sidebar;[^}]*align-content: start;/s);
  assert.match(css, /\.headshot \{[^}]*position: relative;[^}]*width: 100%;/s);
  assert.match(css, /\.aboutContact \{[^}]*grid-template-columns: 1fr;[^}]*gap: 8px;/s);
  assert.match(css, /\.aboutSinglePanel \{[^}]*--about-body-size: clamp\(18px, 1\.12vw, 25px\);[^}]*--about-approach-size: var\(--about-body-size\);[^}]*--about-intro-title-size: clamp\(21px, 1\.5vw, 30px\);[^}]*--about-section-label-size: clamp\(14px, 1vw, 20px\);/s);
  assert.match(css, /\.aboutInterests \.interestList \{\s*grid-template-columns: 1fr;/s);
  assert.match(css, /\.minimalContactLinks a,[\s\S]*\.minimalContactLinks button \{[^}]*font-size: var\(--about-body-size\);/s);
  assert.match(css, /\.minimalContactLinks i \{[^}]*font-size: 1em;/s);
  assert.match(globalCss, /\.site-identity strong \{[^}]*font-size: clamp\(52px, 3\.25vw, 68px\);/s);
  assert.match(globalCss, /\.site-identity span \{[^}]*font-size: clamp\(24px, 1\.44vw, 28px\);/s);
  assert.match(globalCss, /animation: identity-name-reveal 480ms[^;]*1s both;/);
  assert.match(globalCss, /animation: identity-title-reveal 480ms[^;]*1\.5s both;/);
  assert.match(globalCss, /\.site-identity span \{[^}]*color-mix\(in srgb, rgb\(var\(--accent-rgb\)\) 72%, white 28%\);[^}]*text-shadow: 0 1px 3px rgba\(3, 3, 5, 0\.92\);/s);
  assert.doesNotMatch(globalCss, /border-bottom: 2px solid rgba\(var\(--accent-rgb\), 0\.9\)|box-shadow: 0 10px 18px -12px/);
  assert.match(pageSource, /className="site-root" data-site-root/);
  assert.match(source, /siteRoot\?\.style\.setProperty\("--accent-rgb", value\);/);
  assert.doesNotMatch(source, /<i>0[012]<\/i>/);
  assert.match(css, /--surface-background: rgba\(5, 5, 7, 0\.76\);/);
  assert.match(css, /\.project \{[^}]*top: clamp\(112px, 12vh, 168px\);[^}]*bottom: clamp\(24px, 4vh, 52px\);/s);
  assert.match(css, /\.project \{[^}]*width: 58vw;/s);
  assert.match(css, /@media \(min-width: 861px\) \{[\s\S]*\.homeProject \{[^}]*top: clamp\(112px, 12vh, 168px\);[^}]*bottom: auto;[^}]*width: min\(980px, 58vw\);/s);
  assert.match(css, /\.chapter \{[^}]*top: 0;[^}]*right: clamp\(32px, 3vw, 52px\);[^}]*left: clamp\(32px, 3vw, 52px\);[^}]*transform: translate3d\(var\(--chapter-shift\), 0, 0\);/s);
  assert.match(css, /\.projectMeta span:last-child \{ text-align: right; \}/);
  assert.match(css, /\.chapterRail li \{[^}]*height: 100%;/s);
  assert.match(css, /\.chapterRail button \{[^}]*width: 100%;[^}]*height: 100%;/s);
  assert.match(css, /\.routeControls button \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.pause \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.approachCopy \{[^}]*max-width: 58ch;/s);
  assert.match(css, /@media \(min-width: 1400px\) and \(min-height: 900px\) \{[\s\S]*\.availability,[\s\S]*\.approachCopy \{[^}]*width: 100%;[^}]*max-width: none;/s);
  assert.match(css, /@media \(min-width: 1400px\) and \(min-height: 900px\) \{[\s\S]*\.shell \{ --chapter-rail-height: 72px; \}[\s\S]*\.chapterRail \{ font-size: 15px; \}/s);
  assert.match(css, /@media \(min-width: 1400px\) and \(min-height: 900px\) \{[\s\S]*\.aboutSinglePanel \{[^}]*--about-body-size: 19\.2px;[^}]*--about-intro-title-size: 24px;[^}]*--about-section-label-size: 16px;/s);
  assert.match(css, /@media \(min-width: 861px\) and \(max-height: 900px\) \{/);
  assert.match(source, /const HOME_OPENING_DURATION = 4\.75;/);
  assert.match(source, /const PARTICLE_ARRIVAL_START = 0\.38;/);
  assert.match(source, /const PARTICLE_ARRIVAL_END = 0\.70;/);
  assert.match(source, /const PANEL_ARRIVAL_START = 0\.80;/);
  assert.match(source, /const PANEL_ARRIVAL_END = 0\.985;/);
  assert.match(source, /particleTransitionProgress = homeOpeningT;/);
  assert.match(source, /chapterShifts\[0\] = 18 \* \(1 - homeOpeningT\);/);
  assert.match(source, /navigationCommandRef\.current = \{ type: "step", value: dominantDelta > 0 \? 1 : -1 \};/);
  assert.match(source, /<span ref=\{emailRef\}>luebbertevan@gmail\.com<\/span>/);
  assert.match(source, /onClick=\{copyEmail\}/);
  assert.doesNotMatch(source, /href="mailto:luebbertevan@gmail\.com"/);
  assert.match(source, /href="https:\/\/www\.linkedin\.com\/in\/evan-luebbert\/"\s+target="_blank"/);
  assert.match(source, /href="https:\/\/github\.com\/luebbertevan"\s+target="_blank"/);
  assert.match(source, /href="\/documents\/evan-luebbert-resume-2026\.pdf"\s+download="Evan-Luebbert-Resume-2026\.pdf"/);
  assert.doesNotMatch(source, /className=\{styles\.homeInterests\}|className=\{styles\.homeContact\}|aria-label="About sequence"/);

  assert.equal(headshot.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(headshot.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(resume.subarray(0, 4).toString("ascii"), "%PDF");
  assert.deepEqual([...socialImage.subarray(1, 4)], [80, 78, 71]);
  assert.doesNotMatch(source, /SIGNAL SPINE|PORTFOLIO PROTOTYPE|DYNAMIC ROUTE ONLINE|SCROLL · ARROWS · CLICK TABS/);

  assert.ok(projectRoot);
});
