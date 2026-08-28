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
  assert.match(html, /I build software<\/span>\s+<span[^>]*>I believe in\.<\/span>/);
  assert.doesNotMatch(html, /passion first software engineer and designer/);
  assert.match(html, /NYC · Open to full-time and freelance work\./);
  assert.match(html, /Software engineering and design is my superpower/);
  assert.match(html, /I embrace curiosity, explore creative solutions, and fill the gaps where software can make a difference\./);
  assert.match(html, /Everyone has used frustrating and poorly designed software\./);
  assert.match(html, /Being able to solve my own problems is a luxury\./);
  assert.match(html, /The ability to craft solutions for others is a privilege\./);
  assert.match(
    html,
    /Full-stack applications for complicated workflows.*Intuitive and satisfying interfaces delivering polished UX.*Innovative technology for projects with a positive impact.*Data-heavy tools and visualizations.*Software where reliability and trust matter/,
  );
  assert.match(html, /playing tabletop RPGs, and obsessing over strategy games/);
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

  assert.match(source, /label:\s*"ABOUT",\s*description:\s*"What I build and why\.",\s*chapters:\s*1,/);
  assert.match(source, /label:\s*"FOSTY"[\s\S]*label:\s*"CRUX VISION"[\s\S]*label:\s*"VAL"[\s\S]*label:\s*"INHERITANCE"/);
  assert.match(source, /destinations\.map\(\(destination, index\) => \([\s\S]*styles\.waypointDescription[\s\S]*destination\.description/);
  assert.match(source, /querySelectorAll<HTMLElement>\("\[data-destination-panel\]"\)\)\s*\.sort\(\(a, b\) => Number\(a\.dataset\.destinationPanel\) - Number\(b\.dataset\.destinationPanel\)\)/);
  assert.match(source, /styles\.valProject}`} data-destination-panel="3"/);
  assert.match(source, /styles\.inheritanceProject}`} data-destination-panel="4"/);
  assert.match(css, /\.waypoint \{[^}]*width: min\(310px, 30vw\);[^}]*gap: 10px;/s);
  assert.match(css, /\.waypointDescription \{[^}]*max-height: 0;[^}]*opacity: 0;[^}]*font-family: var\(--font-geist-sans\), sans-serif;[^}]*font-size: clamp\(14px, 0\.9vw, 16px\);[^}]*line-height: 1\.35;/s);
  assert.match(css, /\.waypoint button:hover \.waypointDescription,\s*\.waypoint button:focus-visible \.waypointDescription \{[^}]*max-height: 70px;[^}]*opacity: 1;/s);
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
  assert.match(source, /<span className=\{styles\.introductionTitleLine\}>I build software<\/span>\{\" \"\}\s*<span className=\{styles\.introductionTitleLine\}>I believe in\.<\/span>/);
  assert.match(css, /\.introductionTitleLine \{\s*display: inline-block;\s*white-space: nowrap;\s*\}/);
  assert.doesNotMatch(source, /styles\.introductionSubtitle/);
  assert.match(source, /className=\{styles\.aboutLayout\}[\s\S]*className=\{styles\.aboutMain\}[\s\S]*className=\{styles\.availability\}[\s\S]*className=\{styles\.aboutApproach\}[\s\S]*className=\{styles\.aboutInterests\}[\s\S]*className=\{styles\.aboutSidebar\}[\s\S]*className=\{styles\.personalNote\}[\s\S]*className=\{styles\.aboutContact\}/);
  assert.match(css, /\.aboutMain \{[^}]*grid-area: main;[^}]*align-content: start;/s);
  assert.match(css, /\.aboutSidebar \{[^}]*grid-area: sidebar;[^}]*align-content: start;/s);
  assert.match(css, /\.headshot \{[^}]*position: relative;[^}]*width: 100%;/s);
  assert.match(css, /\.aboutContact \{[^}]*grid-template-columns: 1fr;[^}]*gap: 8px;/s);
  assert.match(css, /\.aboutSinglePanel \{[^}]*--about-body-size: clamp\(18px, 1\.12vw, 25px\);[^}]*--about-approach-size: var\(--about-body-size\);[^}]*--about-intro-title-size: clamp\(42px, 3vw, 60px\);[^}]*--about-section-label-size: clamp\(14px, 1vw, 20px\);/s);
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
  assert.match(css, /--surface-background: rgba\(5, 5, 7, 0\.65\);/);
  assert.match(css, /\.project \{[^}]*top: clamp\(112px, 12vh, 168px\);[^}]*bottom: clamp\(24px, 4vh, 52px\);/s);
  assert.match(css, /\.project \{[^}]*width: 58vw;/s);
  assert.match(css, /@media \(min-width: 861px\) \{[\s\S]*\.project \{[^}]*top: var\(--dynamic-panel-top, clamp\(112px, 12vh, 168px\)\);[^}]*bottom: auto;[^}]*height: var\(--dynamic-panel-height,/s);
  assert.match(css, /@media \(min-width: 861px\) \{[\s\S]*\.homeProject \{[^}]*width: min\(980px, 58vw\);/s);
  assert.match(css, /\.chapter \{[^}]*top: 0;[^}]*right: max\(12px, calc\(clamp\(32px, 3vw, 52px\) - 15px\)\);[^}]*left: clamp\(32px, 3vw, 52px\);[^}]*padding-right: 15px;[^}]*transform: translate3d\(var\(--chapter-shift\), 0, 0\);/s);
  assert.match(css, /\.projectMeta span:last-child \{ text-align: right; \}/);
  assert.match(css, /\.chapterRail li \{[^}]*height: 100%;/s);
  assert.match(css, /\.chapterRail button,\s*\.chapterRail > li > span \{[^}]*width: 100%;[^}]*height: 100%;/s);
  assert.match(css, /\.routeControls button \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.pause \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.approachCopy \{[^}]*width: 100%;[^}]*max-width: none;/s);
  assert.match(css, /@media \(min-width: 1400px\) and \(min-height: 900px\) \{[\s\S]*\.availability,[\s\S]*\.approachCopy \{[^}]*width: 100%;[^}]*max-width: none;/s);
  assert.match(css, /@media \(min-width: 1400px\) and \(min-height: 900px\) \{[\s\S]*\.shell \{ --chapter-rail-height: 72px; \}[\s\S]*\.chapterRail \{ font-size: 15px; \}/s);
  assert.match(css, /@media \(min-width: 1400px\) and \(min-height: 900px\) \{[\s\S]*\.aboutSinglePanel \{[^}]*--about-body-size: 19\.2px;[^}]*--about-intro-title-size: 48px;[^}]*--about-section-label-size: 16px;/s);
  assert.match(css, /@media \(min-width: 861px\) and \(max-height: 900px\) \{/);
  assert.match(source, /const HOME_OPENING_DURATION = 4\.75;/);
  assert.match(source, /const PARTICLE_ARRIVAL_START = 0\.38;/);
  assert.match(source, /const PARTICLE_ARRIVAL_END = 0\.70;/);
  assert.match(source, /const PANEL_ARRIVAL_START = 0\.80;/);
  assert.match(source, /const PANEL_ARRIVAL_END = 0\.985;/);
  assert.match(source, /particleTransitionProgress = homeOpeningT;/);
  assert.match(source, /chapterShifts\[0\] = 18 \* \(1 - homeOpeningT\);/);
  assert.doesNotMatch(source, /addEventListener\("wheel"|dominantDelta|const wheel =/);
  assert.match(source, /<span ref=\{emailRef\}>luebbertevan@gmail\.com<\/span>/);
  assert.match(source, /onClick=\{copyEmail\}/);
  assert.doesNotMatch(source, /href="mailto:luebbertevan@gmail\.com"/);
  assert.match(source, /href="https:\/\/www\.linkedin\.com\/in\/evan-luebbert\/"\s+target="_blank"/);
  assert.match(source, /href="https:\/\/github\.com\/luebbertevan"\s+target="_blank"/);
  assert.match(source, /href="\/documents\/evan-luebbert-resume-2026\.pdf"\s+download="Evan-Luebbert-Resume-2026\.pdf"/);
  assert.match(source, />Resume <i aria-hidden="true">↓<\/i><\/a>/);
  assert.doesNotMatch(source, /Résumé/);
  assert.doesNotMatch(source, /className=\{styles\.homeInterests\}|className=\{styles\.homeContact\}|aria-label="About sequence"/);

  assert.equal(headshot.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(headshot.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(resume.subarray(0, 4).toString("ascii"), "%PDF");
  assert.deepEqual([...socialImage.subarray(1, 4)], [80, 78, 71]);
  assert.doesNotMatch(source, /SIGNAL SPINE|PORTFOLIO PROTOTYPE|DYNAMIC ROUTE ONLINE|SCROLL · ARROWS · CLICK TABS/);

  assert.ok(projectRoot);
});

test("Fosty replaces both example projects with the Origin chapter", async () => {
  const response = await render();
  const html = await response.text();
  const [source, css] = await Promise.all([
    readFile(new URL("../app/signal-prototype-v4.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /Fosty/);
  assert.match(html, /fostered 34 kittens through Colorado Kitty Coalition/);
  assert.match(html, /Built for animals in need and the people devoted to helping them\./);
  assert.match(html, /I was inspired to create Fosty, a custom platform to organize foster communication and record keeping\./);
  assert.match(html, /We need you!/);
  assert.match(source, /<blockquote className=\{styles\.fostyQuote\}>“We need you!”<\/blockquote>/);
  assert.match(css, /\.fostyQuote \{[^}]*border-left: 2px solid rgba\(var\(--accent-rgb\), 0\.78\);/s);
  assert.doesNotMatch(html, /FOSTY \/ CASE STUDY|01 OF 05 \/ ORIGIN|BEFORE FOSTY|THE RESPONSE/);
  assert.doesNotMatch(html, /Signal Atlas|Velvet Circuit|EXAMPLE PROJECT/);
  assert.match(source, /label:\s*"FOSTY",\s*description:\s*"An operations platform for animal rescue foster care\.",\s*chapters:\s*5,/);
  assert.match(source, /cssColor:\s*\[236, 72, 153\]/);
  assert.equal((source.match(/<article[^>]+data-destination-panel="/g) ?? []).length, 5);
  assert.match(source, /onClick=\{\(\) => navigateToChapter\(4\)\}>OUTCOME<\/button>/);
  assert.match(html, /I am actively rolling out Fosty with Colorado Kitty Coalition as my pilot partner\./);
  assert.match(html, /The next benchmark is full adoption by CKC/);
  assert.match(html, /Fosty represents who I am as a designer and engineer\./);
  assert.match(html, /The future of Fosty/);
  assert.match(html, /Providing relief to rescues everywhere\./);
  assert.match(css, /\.fostyOutcomeLayout \{[^}]*display: grid;/s);
  assert.match(source, /<span>FOSTY<\/span>\s*<span>OUTCOME<\/span>/);
  assert.match(source, /className=\{styles\.fostyChapterHeading\}>\s*<h2>The future of Fosty<\/h2>/);
  assert.match(source, /<h2 className=\{styles\.fostyOutcomeSubtitle\}>Providing relief to rescues everywhere\.<\/h2>/);
  assert.match(source, /className=\{styles\.fostyCopy\}/);
  assert.match(css, /\.project h2\.fostyStatement,\s*\.project h2\.fostyOutcomeSubtitle \{/s);
  assert.match(css, /\.project h2\.fostyOutcomeSubtitle \{[^}]*color: rgba\(247, 244, 241, 0\.92\);/s);
  assert.doesNotMatch(source, /PILOT ROLLOUT|NEXT BENCHMARK|fostyOutcomeProgress|fostyOutcomeNarrative|fostyOutcomeClosing/);
  assert.match(source, /href="https:\/\/www\.fosty\.us\/"/);
  assert.match(source, />Demo Fosty <i aria-hidden="true">↗<\/i><\/a>/);
  assert.match(source, /href="https:\/\/www\.cokittycoalition\.com\/"/);
  assert.match(css, /\.fostyProject \{[\s\S]*--fosty-body-size:/);
  assert.match(css, /\.chapterRail\.fostyChapterRail \{\s*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);/s);
  assert.match(css, /@media \(min-width: 2048px\) and \(min-height: 1152px\) \{\s*\.fostyProject \{[^}]*width: 58vw;/s);
  assert.match(css, /\.fostyCopy \{[^}]*width: 100%;[^}]*max-width: none;/s);
  assert.match(css, /\.fostyCopy p \{[^}]*color: var\(--body-text-color\);/s);
  assert.match(css, /\.fostyTechnologyTags li \{[^}]*color: var\(--secondary-text-color\);/s);
  assert.match(css, /\.project h2\.fostyStatement,\s*\.project h2\.fostyOutcomeSubtitle \{[^}]*width: 100%;[^}]*max-width: none;[^}]*color: rgb\(var\(--accent-rgb\)\);/s);
  assert.match(source, /className=\{`\$\{styles\.minimalContactLinks\} \$\{styles\.fostyLinks\}`\}/);
  assert.match(source, /data-about-reference-label/);
  assert.match(source, /data-about-reference-title/);
  assert.match(source, /data-about-reference-link/);
  assert.match(source, /--about-reference-label-size/);
  assert.match(source, /--about-reference-title-size/);
  assert.match(source, /--about-reference-link-size/);
  assert.match(css, /\.fostyOrigin \.projectMeta \{\s*font-size: var\(--about-reference-label-size\);/s);
  assert.match(css, /\.fostyHeading \.cardLabel \{[^}]*font-size: var\(--about-reference-label-size\);/s);
  assert.match(css, /\.fostyDate \{[^}]*font-size: var\(--about-reference-label-size\);/s);
  assert.match(css, /\.fostyHeading h1 \{[^}]*font-size: var\(--about-reference-title-size\);/s);
  assert.match(css, /\.project h2\.fostyStatement,\s*\.project h2\.fostyOutcomeSubtitle \{[^}]*font-size: calc\(var\(--fosty-body-size\) \* 1\.5\);/s);
  assert.match(css, /\.minimalContactLinks\.fostyLinks a \{\s*font-size: var\(--about-reference-link-size\);/s);
  assert.match(source, /const aboutScale = shouldScaleAboutPanel && aboutPanel && fostyPanel/);
  assert.match(source, /const getTargetPanelHeight = \(destinationIndex: number, chapterIndex: number\)/);
  assert.match(source, /measuredPanelHeight = getChapterContentHeight\(chapter\) \+ chapterRailHeight \+ contentBreathingRoom/);
  assert.match(source, /panel\.style\.setProperty\("--dynamic-panel-height"/);
});

test("Val renders the text-only Experience, Contributions, and Production chapters with the approved accent and copy", async () => {
  const response = await render();
  const html = await response.text();
  const [source, css] = await Promise.all([
    readFile(new URL("../app/signal-prototype-v4.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.module.css", import.meta.url), "utf8"),
  ]);
  const valArticle = source.slice(
    source.indexOf('<article className={`${styles.project} ${styles.valProject}`}'),
    source.indexOf('<div className={styles.routeControls}'),
  );

  assert.match(source, /label:\s*"VAL",\s*description:\s*"Product ownership and full stack development for a live recovery care platform\.",\s*chapters:\s*3,/);
  assert.match(source, /cssColor:\s*\[214, 40, 40\]/);
  assert.match(source, /shaderColor:\s*\[0\.839, 0\.157, 0\.157\]/);
  assert.match(html, /FULL-STACK ENGINEER \(CONTRACT\)/);
  assert.match(html, /MARCH 2026 TO JUNE 2026/);
  assert.match(html, /Owning a recovery platform from product decisions to production releases/);
  assert.match(source, /At <a href="https:\/\/val\.care\/"[^>]*>Val<\/a>, I shaped and shipped a live recovery and post-discharge platform/);
  assert.match(html, /I worked closely with the founders and technical leadership in a small early-stage team\./);
  assert.match(html, /I was drawn to Val because it offered the responsibility and freedom of early-stage product development and a mission that inspired me\./);
  assert.match(html, /This experience is a strong demonstration of how I work as a software engineer\./);
  assert.match(html, /owned features from idea through release, moved across the full stack, and took responsibility for delivering reliable software to production\./);
  assert.doesNotMatch(html, /owned features from idea through production/);
  assert.match(source, /aria-label="Val case study chapters"[\s\S]*>EXPERIENCE<\/button>[\s\S]*>CONTRIBUTIONS<\/button>[\s\S]*>PRODUCTION<\/button>/);
  assert.doesNotMatch(valArticle, /<img|<video|<figure/);
  assert.match(valArticle, /className=\{styles\.valTitleRow\}[\s\S]*<h1>Val<\/h1>[\s\S]*className=\{styles\.valDate\}>MARCH 2026 TO JUNE 2026<\/p>/);
  assert.match(html, /Product decisions and full-stack delivery/);
  assert.match(html, /Working on an early product requires moving between new features, user experience, production issues, and technical foundations\./);
  assert.match(html, /PRODUCT JUDGMENT/);
  assert.match(html, /USER EXPERIENCE/);
  assert.match(html, /FULL-STACK DELIVERY/);
  assert.match(html, /Bringing meeting discovery into Val/);
  assert.match(html, /aggregated more than 5,500 meetings from 19 regional AA and NA sources/);
  assert.match(html, /I am a high agency, high impact engineer/);
  assert.match(html, /Carrying changes safely into production/);
  assert.match(html, /Building a regression-testing foundation/);
  assert.match(html, /I established an end-to-end regression suite in Playwright and integrated it with GitLab CI/);
  assert.match(html, /Row-Level Security policies, grants, and ownership issues/);
  assert.match(html, /Git-SHA-versioned backend containers/);
  assert.match(source, /aria-label="Val technology"/);
  assert.doesNotMatch(html, /Accountable for the software after it shipped/);
  assert.match(css, /\.project h2\.valStatement \{[^}]*width: 100%;[^}]*max-width: none;/s);
  assert.match(css, /\.valTitleRow \{[^}]*display: flex;[^}]*align-items: baseline;[^}]*justify-content: space-between;/s);
  assert.match(css, /\.valDate \{[^}]*flex: 0 0 auto;[^}]*margin: 0;[^}]*font-size: var\(--about-reference-label-size\);/s);
  assert.match(css, /\.valBody \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
  assert.doesNotMatch(css, /\.valBody \{[^}]*border-top:/s);
  assert.match(css, /\.valContributionsLayout,[\s\S]*\.valFeatureCopy \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
  assert.match(css, /\.project h2\.valContributionsTitle \{[^}]*font-size: clamp\(30px, 3\.2vw, 46px\);/s);
  assert.match(css, /\.valContributionsHeader \+ \.valTextSection \{[^}]*padding-top: 0;[^}]*border-top: 0;/s);
  assert.doesNotMatch(valArticle, /column-count|grid-template-columns:\s*repeat\([^)]*\)/);
  assert.match(css, /\.chapterRail\.valChapterRail \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); \}/);
});

test("Inheritance renders the experience, challenge, engineering, and impact chapters with project media", async () => {
  const response = await render();
  const html = await response.text();
  const [source, css, video, poster, amassImage, walkingVideo, walkingPoster] = await Promise.all([
    readFile(new URL("../app/signal-prototype-v4.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.module.css", import.meta.url), "utf8"),
    readFile(new URL("../public/videos/inheritance-motion-collection.mp4", import.meta.url)),
    readFile(new URL("../public/images/inheritance-motion-collection-poster.webp", import.meta.url)),
    readFile(new URL("../public/images/inheritance-amass-diversity.webp", import.meta.url)),
    readFile(new URL("../public/videos/inheritance-walking-comparison.mp4", import.meta.url)),
    readFile(new URL("../public/images/inheritance-walking-comparison-poster.webp", import.meta.url)),
  ]);

  assert.match(source, /label:\s*"INHERITANCE",\s*description:\s*"A motion capture retargeting pipeline for ML training datasets\.",\s*chapters:\s*4,/);
  assert.match(html, /Motion Data for Machine Learning/);
  assert.match(html, /The Motion Data Bottleneck/);
  assert.match(html, /Archive of Motion Capture/);
  assert.match(html, /as Surface Shapes/);
  assert.match(html, /Accelerating the Data Roadmap/);
  assert.match(html, /FROM MOTION CAPTURE TO PHYSICAL AI/);
  assert.match(html, /TURNING RESEARCH INTO IMPACT/);
  assert.match(html, /delivered measurable value to Inheritance/);
  assert.match(source, /href="https:\/\/amass\.is\.tue\.mpg\.de\/"/);
  assert.match(source, /processed <strong>11,265 motions<\/strong> from 344 subjects/);
  assert.match(source, /more than 65 hours/);
  assert.match(source, /roughly <strong>three months<\/strong>/);
  assert.match(source, /and <strong>\$70,000<\/strong>/);
  assert.match(html, /Inheritance operated under the name/);
  assert.match(source, /href="https:\/\/kikitora\.com\/"/);
  assert.match(source, /href="https:\/\/www\.inheritance\.ai\/"/);
  assert.match(source, /At <a href="https:\/\/www\.inheritance\.ai\/"[^>]*>Inheritance<\/a>, I built/);
  assert.doesNotMatch(source, /Visit Inheritance|inheritanceLinks/);
  assert.match(source, /src="\/videos\/inheritance-motion-collection\.mp4"/);
  assert.match(source, /poster="\/images\/inheritance-motion-collection-poster\.webp"/);
  assert.match(source, /muted\s+loop\s+playsInline/);
  assert.match(html, /A sample of retargeted motion capture animations\./);
  assert.match(source, /onClick=\{openInheritanceVideo\}/);
  assert.match(source, /inheritanceVideoExpanded && portalTarget && createPortal\(/);
  assert.match(source, /aria-label=\{`Expanded \$\{expandedInheritanceVideo\.label\} video`\}/);
  assert.match(css, /\.inheritanceShowcase \{[^}]*grid-template-columns: clamp\(156px, 20%, 202px\) minmax\(0, 1fr\);/s);
  assert.match(css, /\.inheritanceMetrics \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*grid-template-rows: repeat\(3, minmax\(0, 1fr\)\);/s);
  assert.match(css, /\.inheritanceMetrics dt \{[^}]*font-size: clamp\(22px, 1\.65vw, 30px\);/s);
  assert.match(css, /\.inheritanceMetrics dd strong \{[^}]*font-size: clamp\(11px, 0\.82vw, 14px\);/s);
  assert.match(source, /<dt>11,265<\/dt><dd><strong>NEW MOTIONS AVAILABLE<\/strong><\/dd>/);
  assert.match(source, /<dt>3 MONTHS<\/dt><dd><strong>DATA GENERATION SAVED<\/strong><\/dd>/);
  assert.match(source, /<dt>\$70K<\/dt><dd><strong>MOTION CAPTURE VALUE<\/strong><\/dd>/);
  assert.match(source, /onClick=\{\(\) => navigateToChapter\(3\)\}>IMPACT<\/button>/);
  assert.match(source, /<strong>11,265 animations<\/strong>/);
  assert.match(source, /<strong>344 subjects<\/strong>/);
  assert.match(source, /approximately <strong>three months<\/strong>/);
  assert.match(source, /roughly\{" "\}\s*<strong>\$70,000<\/strong>/);
  assert.doesNotMatch(source, /<strong>approximately 90%<\/strong>/);
  assert.doesNotMatch(source, /inheritanceImpactEvidence|inheritanceImpactMetrics|inheritanceImpactFigure/);
  assert.match(css, /\.chapterRail\.inheritanceChapterRail \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  assert.match(css, /\.inheritanceImpactLead strong \{[^}]*color: rgb\(var\(--accent-rgb\)\);/s);
  assert.match(css, /\.inheritanceIntro strong \{[^}]*color: rgb\(var\(--accent-rgb\)\);/s);
  assert.doesNotMatch(css, /\.inheritanceImpactHeader \{[^}]*grid-template-columns:/s);
  assert.match(css, /\.inheritanceImpactMission \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.doesNotMatch(css, /\.inheritanceImpactConclusion \{[^}]*background:/s);
  assert.match(css, /\.inheritanceStory \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
  assert.match(css, /\.inheritanceExperience \{[^}]*overflow-x: hidden;[^}]*overflow-y: auto;/s);
  assert.match(css, /\.inheritanceIntro p \{[^}]*width: 100%;[^}]*max-width: none;/s);
  assert.match(css, /\.inheritanceIntro p,\s*\.inheritanceStory p \{[^}]*color: var\(--body-text-color\);/s);
  assert.match(source, /src="\/images\/inheritance-amass-diversity\.webp"/);
  assert.match(html, /THE MOTION AND BODY DIVERSITY REPRESENTED IN AMASS\./);
  assert.match(source, /onClick=\{\(\) => setInheritanceImageExpanded\(true\)\}/);
  assert.match(source, /inheritanceImageExpanded && portalTarget && createPortal\(/);
  assert.match(source, /aria-label="Expanded AMASS motion and body diversity image"/);
  assert.match(css, /\.inheritanceAmassRow \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(300px, 0\.9fr\);/s);
  assert.match(css, /\.inheritanceAmassFigure \{[^}]*width: 100%;/s);
  assert.match(css, /\.shell \{[^}]*--case-study-body-size: clamp\(15px, 0\.92vw, 20px\);/s);
  assert.match(css, /\.inheritanceProject \{[^}]*--inheritance-body-size: var\(--case-study-body-size\);/s);
  assert.match(css, /@media \(min-width: 2048px\) and \(min-height: 1152px\) \{[\s\S]*\.shell \{ --case-study-body-size: clamp\(20px, 1vw, 30px\); \}/s);
  assert.match(css, /@media \(max-width: 860px\) \{\s*\.shell \{[^}]*--case-study-body-size: 13px;/s);
  assert.doesNotMatch(css, /font-size: calc\(var\(--inheritance-body-size\) \* 1\.08\);/);
  assert.match(source, />CHALLENGE<\/button>/);
  assert.match(source, />ENGINEERING<\/button>/);
  assert.match(html, /Rebuilding Motion in 3D/);
  assert.match(html, /AMASS offers thousands of motions, but making them usable required a complex engineering solution\./);
  assert.match(html, /Each frame contained rotations for 52 SMPL-H joints plus the movement of the root joint\./);
  assert.match(html, /The pipeline for each animation:/);
  assert.doesNotMatch(html, /For each animation, the pipeline:/);
  assert.match(css, /\.inheritancePipeline \{[^}]*grid-template-columns: minmax\(0, 2fr\) minmax\(0, 3fr\);/s);
  assert.match(css, /\.inheritancePipelineSteps li::before \{[^}]*content: counter\(pipeline-step\);[^}]*font-size: 0\.95em;/s);
  assert.match(html, /RECONCILING REST POSES/);
  assert.match(html, /BALANCING PROPORTIONS AND MOTION/);
  assert.match(html, /TRANSLATING THREE ROTATION SYSTEMS/);
  assert.match(css, /\.inheritancePipeline h3,\s*\.inheritanceHighlightsLabel,/s);
  assert.doesNotMatch(css, /\.inheritanceHighlightsLabel \{/);
  assert.match(css, /\.inheritanceHighlightGrid h4 \{[^}]*font-size: var\(--about-reference-label-size\);/s);
  assert.match(css, /\.inheritanceRotationHighlight \{[^}]*grid-column: 1 \/ -1;[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
  assert.match(source, /src:\s*"\/videos\/inheritance-walking-comparison\.mp4"/);
  assert.match(source, /poster:\s*"\/images\/inheritance-walking-comparison-poster\.webp"/);
  assert.match(source, /onClick=\{\(\) => openInheritanceVideo\(inheritanceWalkingVideo\)\}/);
  assert.match(html, /AMASS MOTION, REBUILT ON A PRODUCTION ARMATURE\./);
  assert.match(css, /\.inheritanceEngineeringHero \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.match(css, /\.inheritanceEngineeringIntro p,\s*\.inheritancePipeline p,\s*\.inheritancePipelineSteps li,\s*\.inheritanceHighlightGrid p \{[^}]*color: var\(--body-text-color\);/s);
  assert.doesNotMatch(css, /\.inheritanceEngineeringIntro p:first-of-type \{/);
  assert.match(css, /@media \(max-width: 860px\) \{[\s\S]*\.inheritanceEngineeringHero \{[^}]*grid-template-columns: 1fr;/s);
  assert.match(css, /\.chapterRail\.inheritanceChapterRail \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  assert.equal(video.subarray(4, 8).toString("ascii"), "ftyp");
  assert.equal(walkingVideo.subarray(4, 8).toString("ascii"), "ftyp");
  assert.equal(poster.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(poster.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(amassImage.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(amassImage.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(walkingPoster.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(walkingPoster.subarray(8, 12).toString("ascii"), "WEBP");
});

test("Crux Vision renders all five case-study chapters with expandable media", async () => {
  const response = await render();
  const html = await response.text();
  const [
    source,
    css,
    video,
    poster,
    movementVideo,
    movementPoster,
    comparisonVideo,
    comparisonPoster,
    originScreenshot,
    trailLegend,
    rangeScreenshot,
    calibrationOverview,
    confidenceControls,
    continuitySmoothing,
  ] = await Promise.all([
    readFile(new URL("../app/signal-prototype-v4.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.module.css", import.meta.url), "utf8"),
    readFile(new URL("../public/videos/crux-vision-origin-overlay.mp4", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-origin-overlay-poster.webp", import.meta.url)),
    readFile(new URL("../public/videos/crux-vision-movement-review.mp4", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-movement-review-poster.webp", import.meta.url)),
    readFile(new URL("../public/videos/crux-vision-fail-vs-success.mp4", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-fail-vs-success-poster.webp", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-find-the-move.webp", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-trail-legend.webp", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-analyze-range.webp", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-calibration-overview.webp", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-confidence-controls.webp", import.meta.url)),
    readFile(new URL("../public/images/crux-vision-continuity-smoothing.webp", import.meta.url)),
  ]);

  assert.match(html, /Crux Vision is a movement-review tool I created to turn climbing footage into a workspace/);
  assert.match(html, /Sometimes that means missing the bigger picture/);
  assert.match(html, /technical theory represented visually/);
  assert.match(html, /Crux Vision cannot replace the intuition and experience of a climber/);
  assert.match(html, /It complements the practice of analyzing movement and technique/);
  assert.match(html, /microscope for video analysis/);
  assert.match(source, /label:\s*"CRUX VISION",\s*description:\s*"A video analysis tool for understanding climbing movement\.",\s*chapters:\s*5,/);
  assert.match(source, /cssColor:\s*\[143, 230, 96\]/);
  assert.match(source, /src="\/videos\/crux-vision-origin-overlay\.mp4"/);
  assert.match(source, /poster="\/images\/crux-vision-origin-overlay-poster\.webp"/);
  assert.match(source, /src="\/images\/crux-vision-find-the-move\.webp"/);
  assert.match(html, /Public beta/);
  assert.doesNotMatch(html, /Try the public beta/);
  assert.match(source, /href="https:\/\/crux-vision-rebuild\.vercel\.app\/"/);
  assert.match(source, /href="https:\/\/github\.com\/luebbertevan\/crux-vision"/);
  assert.equal((source.match(/data-future-chapter disabled/g) ?? []).length, 0);
  assert.match(html, /Review the crux/);
  assert.match(html, /ISOLATE THE CRUX/);
  assert.match(html, /REVIEW WITH PRECISION/);
  assert.match(html, /FOCUS THE INVESTIGATION/);
  assert.match(source, /onClick=\{\(\) => navigateToChapter\(1\)\}>MOVEMENT REVIEW<\/button>/);
  assert.match(source, /src="\/videos\/crux-vision-movement-review\.mp4"/);
  assert.match(source, /cruxMovementMedia\[0\]/);
  assert.match(html, /Movement made visible/);
  assert.match(html, /READING THE TRAILS/);
  assert.match(html, /Crux Vision gave that theory a visible form/);
  assert.match(source, /onClick=\{\(\) => navigateToChapter\(2\)\}>VISUAL OVERLAY<\/button>/);
  assert.match(source, /src="\/videos\/crux-vision-fail-vs-success\.mp4"/);
  assert.match(source, /src="\/images\/crux-vision-trail-legend\.webp"/);
  assert.match(html, /Building visuals from video/);
  assert.match(html, /keeping the analysis focused and reducing processing time/);
  assert.match(html, /drawing the overlay as results arrive so the climber can begin reviewing the movement/);
  assert.match(html, /unusual body positions the model was not trained for/);
  assert.match(html, /MediaPipe output with missing data or detection errors/);
  assert.match(html, /PRESERVING UNCERTAINTY/);
  assert.match(html, /Crux Vision shows an honest gap instead of inventing a continuous path/);
  assert.match(html, /TECHNICAL HIGHLIGHTS/);
  assert.match(html, /Progressive, on-device pose analysis in a module worker/);
  assert.match(html, /MediaPipe Pose/);
  assert.match(html, /MediaBunny/);
  assert.match(html, /CONTINUITY IS A TRADEOFF/);
  assert.match(html, /higher confidence cutoffs and tighter motion limits/);
  assert.match(html, /lower confidence cutoffs and looser motion limits/);
  assert.match(html, /CALIBRATION BY ITERATION/);
  assert.match(html, /Calibration is an iterative process rather than a search for one universally correct filter/);
  assert.match(html, /SMOOTHING RECORDED MOVEMENT/);
  assert.match(html, /One Euro filter/);
  assert.match(html, /centered offline smoother/);
  assert.match(html, /CONFIDENCE BY SCOPE/);
  assert.match(html, /MediaPipe attaches two confidence signals to each detected joint/);
  assert.match(html, /CONTINUITY AND PLAUSIBILITY/);
  assert.match(html, /LIMITATIONS/);
  assert.match(html, /Camera movement can distort trails/);
  assert.doesNotMatch(html, /CALIBRATED BY LOOKING|BOUNDARIES/);
  assert.doesNotMatch(html, /70 milliseconds|MediaPipe Full the quality default/);
  assert.match(source, /cruxEngineeringMedia\[0\]/);
  assert.match(source, /crux-vision-calibration-overview\.webp/);
  assert.match(source, /crux-vision-confidence-controls\.webp/);
  assert.match(source, /crux-vision-continuity-smoothing\.webp/);
  assert.doesNotMatch(source, /<figcaption>\s*<strong>COMPARE DERIVED VIEWS/);
  assert.doesNotMatch(source, /<figcaption>\s*<strong>CONFIDENCE THRESHOLDS/);
  assert.doesNotMatch(source, /<figcaption>\s*<strong>CONTINUITY CONTROLS/);
  assert.match(source, /onClick=\{\(\) => navigateToChapter\(3\)\}>ENGINEERING<\/button>/);
  assert.match(html, /An open investigation/);
  assert.match(html, /Other sports and movement disciplines could benefit from the same concept/);
  assert.match(html, /NEW VISUAL LENSES/);
  assert.match(html, /COMPARE ATTEMPTS/);
  assert.match(html, /Crux Vision will never pretend to know the correct way to move/);
  assert.match(source, /onClick=\{copyOutlookEmail\}/);
  assert.match(source, /ref=\{outlookEmailRef\}>luebbertevan@gmail\.com<\/span>/);
  assert.match(source, /onClick=\{\(\) => navigateToChapter\(4\)\}>OUTLOOK<\/button>/);
  assert.match(css, /\.cruxMovementIntro \{[^}]*grid-template-columns:/s);
  assert.match(css, /\.cruxMovementLayout \{[^}]*gap: clamp\(12px, 1\.4vh, 16px\);/s);
  assert.match(css, /\.cruxMovementIntroColumn \{[^}]*gap: clamp\(10px, 1\.2vh, 14px\);/s);
  assert.match(css, /\.cruxMovementFeature \{[^}]*grid-template-columns:/s);
  assert.match(css, /\.cruxComparisonVideoFrame \{[^}]*aspect-ratio: 1676 \/ 922;/s);
  assert.match(css, /\.cruxVisualSupport,\s*\.cruxTrailReading \{[^}]*grid-template-columns:/s);
  assert.match(css, /\.cruxEngineeringOverview \{[^}]*grid-template-columns:/s);
  assert.match(css, /\.cruxTechnology \{[^}]*width: 100%;/s);
  assert.match(css, /\.cruxEngineeringHighlights \{[^}]*font-size: var\(--crux-body-size\);/s);
  assert.match(css, /\.cruxEngineeringHighlights \{[^}]*color: var\(--body-text-color\);/s);
  assert.match(css, /\.cruxTechnology \.fostyTechnologyTags li \{[^}]*font-size: calc\(var\(--crux-body-size\) \* 0\.86\);/s);
  assert.match(css, /\.cruxEngineeringCopy section,\s*\.cruxEngineeringDetails \{[^}]*align-content: start;[^}]*align-self: start;/s);
  assert.match(css, /\.cruxQualityProfiles span \{[^}]*font-size: var\(--crux-body-size\);/s);
  assert.match(css, /\.cruxQualityTrack i \{[^}]*width: 100%;/s);
  assert.match(css, /\.cruxQualityProfiles \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/s);
  assert.match(css, /\.cruxCalibrationIntro > div \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
  assert.match(css, /\.cruxCalibrationRow \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 2fr\);/s);
  assert.match(css, /\.cruxCalibrationGrid \{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(0, 2fr\);/s);
  assert.match(css, /\.cruxCalibrationFinalText \{[^}]*display: grid;[^}]*align-content: start;/s);
  assert.match(css, /\.cruxCalibrationScreenshot \{ aspect-ratio: auto; \}/s);
  assert.match(css, /\.cruxCalibrationScreenshot img \{[^}]*height: auto;[^}]*object-fit: contain;/s);
  assert.match(css, /\.cruxCalibrationSection h3 \{[^}]*white-space: nowrap;/s);
  assert.match(css, /\.cruxCalibrationSection \{[^}]*align-content: start;[^}]*align-self: start;/s);
  assert.match(css, /\.cruxBody \{[^}]*grid-template-columns: minmax\(0, 1\.62fr\) minmax\(210px, 0\.82fr\);/s);
  assert.match(source, /className=\{styles\.cruxNarrative\} tabIndex=\{0\}/);
  assert.match(css, /\.cruxNarrative \{[^}]*overflow-y: auto;/s);
  assert.match(css, /\.cruxNarrative \{[^}]*row-gap: clamp\(8px, 0\.9vh, 12px\);/s);
  assert.match(css, /\.cruxStoryScroll p:last-child \{[^}]*padding-bottom: clamp\(40px, 5vh, 52px\);/s);
  assert.match(css, /\.cruxMediaColumn \{[^}]*grid-template-rows: minmax\(0, 1fr\) auto;/s);
  assert.match(css, /\.chapterRail\.cruxChapterRail \{\s*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);/s);
  assert.match(css, /\.cruxOutlookVision,\s*\.cruxOutlookFuture,\s*\.cruxOutlookClosing \{[^}]*grid-template-columns: minmax\(0, 1fr\);/s);
  assert.match(css, /\.cruxOutlookVision,\s*\.cruxOutlookFuture,\s*\.cruxOutlookClosing \{[^}]*gap: clamp\(11px, 1\.25vh, 16px\);/s);
  assert.doesNotMatch(source, /MOVEMENT OVERLAY · LIVE POSE|toggleCruxVideo|cruxVideoPaused/);
  assert.doesNotMatch(source, /className=\{styles\.cruxLead\}/);
  assert.match(css, /\.cruxProject \{[\s\S]*?width: min\(980px, 58vw\);/s);
  assert.match(css, /\.mediaLightbox\.cruxVideoLightbox > video \{[^}]*width: 100%;[^}]*height: 100%;/s);
  assert.equal(video.subarray(4, 8).toString("ascii"), "ftyp");
  assert.equal(poster.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(poster.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(movementVideo.subarray(4, 8).toString("ascii"), "ftyp");
  assert.equal(movementPoster.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(comparisonVideo.subarray(4, 8).toString("ascii"), "ftyp");
  assert.equal(comparisonPoster.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(comparisonPoster.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(originScreenshot.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(originScreenshot.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(trailLegend.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(trailLegend.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(rangeScreenshot.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(calibrationOverview.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(calibrationOverview.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(confidenceControls.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(confidenceControls.subarray(8, 12).toString("ascii"), "WEBP");
  assert.equal(continuitySmoothing.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(continuitySmoothing.subarray(8, 12).toString("ascii"), "WEBP");
});

test("Phase 1 provides dedicated mobile navigation, viewport-first content, and two-state media", async () => {
  const [source, css, globalCss, shaderSource] = await Promise.all([
    readFile(new URL("../app/signal-prototype-v4.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/signal-prototype.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(source, /className=\{styles\.mobileHeader\}/);
  assert.match(source, /className=\{styles\.mobileDock\}/);
  assert.match(source, /<div className=\{styles\.mobileIdentityLockup\}>\s*<strong>EVAN LUEBBERT<\/strong>\s*<i aria-hidden="true" \/>\s*<span>\{activeDestination\.label\}<\/span>/);
  assert.match(source, /className=\{styles\.mobileRoutePicker\}[\s\S]*?<strong>\{activeChapterLabel\}<\/strong>/s);
  assert.doesNotMatch(source, /className=\{styles\.mobileRouteDivider\}/);
  assert.match(source, /mobileOverlay === "projects"/);
  assert.match(source, /data-mobile-project-menu-open=\{mobileOverlay === "projects" \? "" : undefined\}/);
  assert.match(source, /className=\{`\$\{styles\.mobileOverlay\} \$\{styles\.mobileProjectOverlay\}`\}/);
  assert.match(source, /mobileOverlay === "chapters"/);
  assert.match(source, /Current chapter: \$\{activeChapterLabel\} in \$\{activeDestination\.label\}/);
  assert.doesNotMatch(source, /current project, chapter, and progress/i);
  assert.match(source, /chapterLabels: \["ORIGIN", "PRODUCT", "DESIGN", "ENGINEERING", "OUTCOME"\]/);
  assert.match(source, /const MOBILE_DESTINATION_TRAVEL = 34;/);
  assert.match(source, /const MOBILE_CHAPTER_TRAVEL = 8;/);
  assert.match(source, /const MOBILE_DESTINATION_DURATION = DESTINATION_DURATION;/);
  assert.match(source, /const MOBILE_CHAPTER_DURATION = 1\.55;/);
  assert.match(source, /const MOBILE_HOME_OPENING_DURATION = 2\.15;/);
  assert.match(source, /let destinationTravel = isMobileViewport \? MOBILE_DESTINATION_TRAVEL : DESTINATION_TRAVEL;/);
  assert.match(source, /let chapterTravel = isMobileViewport \? MOBILE_CHAPTER_TRAVEL : CHAPTER_TRAVEL;/);
  assert.match(source, /strandAnchor\.set\(isMobileViewport \? 0 : -0\.54 \* height \/ width, 0\);/);
  assert.match(source, /const cameraRoll = isMobileViewport \? rawCameraRoll \* 0\.38 : rawCameraRoll;/);
  assert.match(source, /uMobileComposition: \{ value: isMobileViewport \? 1 : 0 \}/);
  assert.match(source, /const correctedTop = panelRect\.top - \(isMobileViewport \? renderedEntryShift : 0\);/);
  assert.match(source, /const updatePanelBounds = \(destinationIndex = currentDestination\)/);
  assert.match(source, /const horizontalParticleGap = 8 \/ width;/);
  assert.match(source, /const verticalParticleGap = 8 \/ height;/);
  assert.match(source, /updatePanelBounds\(activeDestinationForUi\);/);
  assert.match(source, /currentDestination = transition\.targetDestination;[\s\S]*?updatePanelBounds\(currentDestination\);/);
  assert.match(source, /const panelResizeObserver = new ResizeObserver\(\(\) => updatePanelBounds\(\)\);/);
  assert.match(source, /panelBundles\.forEach\(\(\{ panel \}\) => panelResizeObserver\.observe\(panel\)\);/);
  assert.match(source, /const contentResizeObserver = new ResizeObserver/);
  assert.match(source, /const getMeasurableChildren = \(element: HTMLElement\): HTMLElement\[\] =>/);
  assert.match(source, /getComputedStyle\(child\)\.display === "contents"\s*\? getMeasurableChildren\(child\)/);
  assert.match(source, /const contentBottom = getMeasurableChildren\(chapter\)\.reduce/);
  assert.match(source, /getMeasurableChildren\(chapter\)\.forEach\(\(child\) => contentResizeObserver\.observe\(child\)\)/);
  assert.match(source, /transition\.panelHeightTo >= transition\.panelHeightFrom/);
  assert.match(source, /mobileViewportQuery\.addEventListener\("change", handleMobileViewportChange\);/);
  assert.match(source, /siteRoot\?\.toggleAttribute\("data-live-mobile-transition", isMobileViewport\);/);
  assert.match(source, /isMobileViewport \? 0\.9 : 1\.15/);
  assert.match(source, /panelBundles\[currentDestination\]\?\.chapters\[targetChapter\]\?\.scrollTo\(\{ top: 0 \}\)/);
  assert.match(source, /<span className=\{styles\.expandIcon\} aria-hidden="true">⛶<\/span>/);
  assert.match(css, /\.productScreenshot > \.expandIcon,\s*\.expandIcon \{[^}]*min-width: 28px;[^}]*min-height: 28px;[^}]*padding: 0;[^}]*font-size: 26px;/s);
  assert.match(css, /@media \(max-width: 860px\) \{[\s\S]*?\.productScreenshot > \.expandIcon,\s*\.expandIcon \{[^}]*min-width: 30px;[^}]*min-height: 30px;[^}]*font-size: 30px;/s);
  assert.doesNotMatch(source, />EXPAND\s/);
  assert.match(source, /createPortal\(/);
  assert.equal([...source.matchAll(/className=\{styles\.mobileIdentityLockup\}/g)].length, 2);
  assert.match(source, /<strong>EVAN LUEBBERT<\/strong>\s*<i aria-hidden="true" \/>\s*<span>SOFTWARE ENGINEER<\/span>/);
  assert.match(source, /className=\{styles\.mobileUtilityLinks\}/);
  assert.match(source, /className=\{styles\.mobileVisualControl\}/);
  assert.match(source, /<i aria-hidden="true">\{paused \? "▶" : "Ⅱ"\}<\/i>/);

  assert.match(css, /Phase 1 mobile composition/);
  assert.match(css, /@media \(max-width: 860px\) \{[\s\S]*\.waypoint,[\s\S]*\.chapterRail \{\s*display: none;/s);
  assert.match(css, /\.project,[\s\S]*\.homeProject \{[\s\S]*top: calc\(max\(8px, env\(safe-area-inset-top\)\) \+ 54px\);[\s\S]*bottom: calc\(max\(8px, env\(safe-area-inset-bottom\)\) \+ 60px\);/s);
  assert.match(css, /\.mediaLightbox \{\s*position: fixed;\s*z-index: 100;/s);
  assert.match(css, /\.productScreenshot img \{\s*max-height: min\(58svh, 500px\);\s*object-fit: cover;/s);
  assert.match(css, /\.chapter p:not\(\.cardLabel\) \{\s*font-size: 17px;\s*line-height: 1\.52;/s);
  assert.match(css, /\.chapter figcaption \{\s*font-size: 16px;/s);
  assert.match(css, /\.chapter \.cardLabel,[\s\S]*?\.inheritanceMetrics dd strong \{\s*font-size: 13px;/s);
  assert.match(css, /\.mobileIdentityLockup strong \{[^}]*font-family: var\(--font-geist-mono\), monospace;[^}]*font-size: 13px;[^}]*letter-spacing: 0\.08em;/s);
  assert.match(css, /\.mobileIdentityLockup > span \{[^}]*font-size: 13px;[^}]*letter-spacing: 0\.08em;[^}]*text-transform: uppercase;/s);
  assert.match(css, /\.mobileProjectIndex \{[^}]*margin: 12px 10px 0;/s);
  assert.match(css, /\.mobileUtilityLinks a \{[^}]*font-size: 17px;/s);
  assert.match(css, /\.mobileMenuFooter \{[^}]*margin: auto 10px 0;/s);
  assert.match(css, /\.mobileProjectOverlay \{\s*background: transparent;\s*backdrop-filter: none;\s*\}/);
  assert.match(css, /\.shell\[data-mobile-project-menu-open\] \.project \{\s*visibility: hidden;\s*\}/);
  assert.match(css, /\.mobileMenu \{[^}]*var\(--surface-background\);[^}]*backdrop-filter: none;/s);
  assert.match(css, /\.mobileMenuHeader \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.mobileHeader \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.mobileDock \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.mobileChapterSheet \{[^}]*background: var\(--surface-background\);/s);
  assert.match(css, /\.mobileMenuHeader > button span \{[^}]*width: 100%;[^}]*height: 100%;[^}]*place-items: center;[^}]*line-height: 1;[^}]*transform: translateY\(-1px\);/s);
  assert.match(css, /\.mobileDock {[^}]*min-height: 52px;[^}]*grid-template-columns: 48px minmax\(0, 1fr\) 48px;/s);
  assert.match(css, /\.mobileDock \.mobileRoutePicker \{\s*display: flex;[^}]*padding: 0 12px;[^}]*align-items: center;/s);
  assert.match(css, /\.mobileRoutePicker strong \{[^}]*font-size: 17px;[^}]*letter-spacing: 0\.1em;/s);
  assert.doesNotMatch(css, /\.mobileRouteDivider/);
  assert.match(css, /@media \(min-width: 861px\) \{[\s\S]*?\.homeProject \.homeIntroduction \{[\s\S]*?overflow-y: auto;/s);
  assert.match(css, /@media \(min-width: 861px\) \{[\s\S]*?\.fostyLayout \{\s*flex: none;\s*grid-template-rows: auto auto auto;/s);
  assert.match(css, /@media \(min-width: 861px\) and \(max-width: 1399px\), \(min-width: 861px\) and \(max-height: 900px\) \{\s*\.project \{\s*--content-panel-scale: 1;\s*\}\s*\}/s);
  assert.match(css, /@media \(min-width: 861px\) and \(max-width: 1200px\) \{[\s\S]*?\.cruxBody,[\s\S]*?grid-template-columns: 1fr;/s);
  assert.match(css, /@media \(min-width: 861px\) and \(max-width: 1160px\) \{[\s\S]*?\.inheritanceShowcase,[\s\S]*?grid-template-columns: 1fr;/s);
  assert.match(css, /@media \(min-width: 861px\) and \(max-width: 1040px\) \{[\s\S]*?\.fostyLayout,[\s\S]*?grid-template-columns: 1fr;/s);
  assert.match(css, /rgba\(5, 5, 7, 0\.82\);/);
  assert.match(css, /\.aboutSinglePanel \{\s*--about-body-size: 17px;\s*--about-approach-size: 17px;\s*--about-intro-title-size: clamp\(28px, 8\.2vw, 34px\);/s);
  assert.match(css, /\.project \{[^}]*container-type: inline-size;[^}]*container-name: project-panel;/s);
  assert.match(css, /\.aboutLayout \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) clamp\(68px, 20vw, 84px\);\s*grid-template-areas:\s*"title portrait"\s*"availability portrait"\s*"approach approach"\s*"interests interests"\s*"note note"\s*"contact contact";/s);
  assert.match(css, /\.aboutMain,\s*\.aboutSidebar \{\s*display: contents;/s);
  assert.match(css, /\.headshot \{\s*grid-area: portrait;\s*width: 100%;/s);
  assert.match(css, /@container project-panel \(max-width: 700px\) \{[\s\S]*?font-size: clamp\(38px, 8cqw, 52px\);[\s\S]*?--about-intro-title-size: clamp\(30px, 5\.2cqw, 34px\);[\s\S]*?"meta portrait"\s*"title portrait"\s*"availability availability"[\s\S]*?transform: translateY\(6px\);/s);
  assert.doesNotMatch(css, /@container project-panel \(max-width: 700px\) \{[\s\S]*?\.introductionTitleLine \{ display: block; \}/s);
  assert.match(css, /@container project-panel \(min-width: 701px\) \{[\s\S]*?--about-intro-title-size: clamp\(34px, 5cqw, 42px\);[\s\S]*?clamp\(84px, 11cqw, 104px\);/s);
  assert.match(globalCss, /animation: mobile-identity-exit 360ms ease 1\.78s forwards;/);
  assert.match(globalCss, /\.site-root\[data-live-mobile-transition\] \.site-identity \{[^}]*visibility: hidden;[^}]*animation: none;/s);
  assert.match(globalCss, /top: calc\(env\(safe-area-inset-top\) \+ 24px\);/);
  assert.doesNotMatch(globalCss, /@media \(max-width: 860px\) \{[\s\S]*?\.site-identity \{[^}]*top: 50%;/s);
  assert.match(shaderSource, /screenPosition\.x \+= uProjectPresence \* 0\.54 \* \(1\.0 - uMobileComposition\);/);
  assert.match(shaderSource, /float cameraLead = clamp\(uScrollVelocity \* 0\.075, -0\.75, 0\.75\) \* \(1\.0 - uMobileComposition\);/);
  assert.match(shaderSource, /uPointer\.y \* 0\.035 \* \(1\.0 - uMobileComposition\)/);
});
