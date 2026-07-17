import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const contentFiles = [
  "content/modules-foundations.js",
  "content/modules-advanced.js",
  "content/framework-tradeoffs.js",
  "content/cases-ecommerce.js",
  "content/cases-general.js",
  "content/assessments.js",
];

const caseSectionKeys = [
  "problemStatement",
  "clarifyingQuestions",
  "functionalRequirements",
  "nonFunctionalRequirements",
  "capacityEstimates",
  "apiDesign",
  "dataModel",
  "highLevelArchitecture",
  "componentResponsibilities",
  "requestAndDataFlows",
  "storageChoices",
  "cachingStrategy",
  "partitioningStrategy",
  "consistencyModel",
  "concurrencyHandling",
  "asynchronousWorkflows",
  "failureScenarios",
  "retryAndIdempotencyStrategy",
  "securityConsiderations",
  "observability",
  "scalingBottlenecks",
  "tradeoffs",
  "alternativeArchitectures",
  "mvpDesign",
  "intermediateScaleDesign",
  "internetScaleDesign",
  "multiRegionEvolution",
  "costConsiderations",
  "commonInterviewMistakes",
  "followUpQuestions",
  "architectureReviewChecklist",
  "keyTakeaways",
];

function flatten(value) {
  if (value == null) return "";
  if (typeof value !== "object") return String(value);
  return Object.values(value).map(flatten).join(" ");
}

async function loadContent() {
  const context = vm.createContext({ window: {} });
  for (const file of contentFiles) {
    const source = await readFile(new URL(file, root), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return context.window.SD_CONTENT;
}

function uniqueCases(content) {
  const merged = [
    ...(content.caseStudies || []),
    ...(content.ecommerceCases || []),
    ...(content.generalCases || []),
  ];
  return [...new Map(merged.map((item) => [item.id, item])).values()];
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("standalone entry point is complete and dependency-free", async () => {
  const [html, css, app] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("styles.css", root), "utf8"),
    readFile(new URL("app.js", root), "utf8"),
  ]);

  assert.match(html, /<title>System Design: Zero to Hero<\/title>/);
  assert.match(html, /id="curriculum-nav"/);
  assert.match(html, /id="search-dialog"/);
  assert.match(html, /content\/cases-ecommerce\.js/);
  assert.match(html, /content\/assessments\.js/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(html, /type="module"/);
  assert.match(css, /@media \(max-width: 860px\)/);
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(app, /localStorage/);
  assert.match(app, /renderCaseStudy/);
  assert.match(app, /performSearch/);
  await Promise.all(contentFiles.map((file) => access(new URL(file, root))));
});

test("curriculum and decision references meet requested coverage", async () => {
  const content = await loadContent();
  assert.ok(content.modules.length >= 7, `expected 7 modules, got ${content.modules.length}`);
  assert.equal(content.framework.steps.length, 20);
  assert.equal(content.tradeoffs.length, 15);
  assert.ok(content.glossary.length >= 75, `expected at least 75 glossary terms, got ${content.glossary.length}`);

  const foundation = content.modules.find((module) => /foundation/i.test(module.title));
  const foundationTopics = new Set((foundation?.topics || []).map((topic) => topic.name));
  for (const required of [
    "CAP theorem",
    "PACELC",
    "Vertical versus horizontal scaling",
    "Stateless versus stateful systems",
    "Synchronous versus asynchronous communication",
  ]) {
    assert.ok(foundationTopics.has(required), `missing foundation topic: ${required}`);
  }

  const allSources = await Promise.all(contentFiles.map((file) => readFile(new URL(file, root), "utf8")));
  assert.doesNotMatch(allSources.join("\n"), /content coming soon|lorem ipsum|\bTODO\b|\bTBD\b/i);
});

test("all 41 case studies include the complete 32-part review", async () => {
  const content = await loadContent();
  const cases = uniqueCases(content);
  assert.ok(cases.length >= 41, `expected at least 41 case studies, got ${cases.length}`);
  assert.ok(cases.filter((item) => /commerce/i.test(item.domain || item.category || "")).length >= 17);

  for (const item of cases) {
    assert.ok(item.id && item.title && item.summary, `case metadata missing: ${item.id || item.title}`);
    assert.ok(Array.isArray(item.diagram?.nodes) && item.diagram.nodes.length >= 3, `diagram incomplete: ${item.id}`);
    assert.ok(Array.isArray(item.sequence) && item.sequence.length >= 3, `sequence incomplete: ${item.id}`);
    for (const key of caseSectionKeys) {
      assert.ok(key in item.sections, `${item.id} missing ${key}`);
      assert.ok(flatten(item.sections[key]).trim().length >= 20, `${item.id}.${key} is too shallow`);
    }
  }
});

test("practice library exceeds every requested minimum", async () => {
  const content = await loadContent();
  const assessments = content.assessments || {};
  const counts = {
    conceptual: (assessments.conceptual || assessments.conceptQuestions || []).length,
    architecture: (assessments.architecture || assessments.architectureExercises || []).length,
    interview: (assessments.interview || assessments.interviewProblems || []).length,
    reviews: (assessments.reviews || assessments.architectureReviews || []).length,
    ecommerce: (assessments.ecommerce || assessments.ecommerceExercises || []).length,
  };
  assert.ok(counts.conceptual >= 30, `conceptual: ${counts.conceptual}`);
  assert.ok(counts.architecture >= 20, `architecture: ${counts.architecture}`);
  assert.ok(counts.interview >= 15, `interview: ${counts.interview}`);
  assert.ok(counts.reviews >= 10, `reviews: ${counts.reviews}`);
  assert.ok(counts.ecommerce >= 10, `ecommerce: ${counts.ecommerce}`);
  assert.ok((assessments.timedSessions || []).length >= 4);
});

test("hosted wrapper renders final metadata and the standalone manual", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>System Design: Zero to Hero<\/title>/i);
  assert.match(html, /manual\/index\.html/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});
