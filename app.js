(function () {
  "use strict";

  const CONTENT = window.SD_CONTENT || {
    modules: [],
    caseStudies: [],
    tradeoffs: [],
    glossary: [],
    assessments: {},
  };

  const SECTION_LABELS = {
    problemStatement: "Problem statement",
    clarifyingQuestions: "Clarifying questions",
    functionalRequirements: "Functional requirements",
    nonFunctionalRequirements: "Non-functional requirements",
    capacityEstimates: "Capacity estimates",
    apiDesign: "API design",
    dataModel: "Data model",
    highLevelArchitecture: "High-level architecture",
    componentResponsibilities: "Component responsibilities",
    requestAndDataFlows: "Request and data flows",
    storageChoices: "Storage choices",
    cachingStrategy: "Caching strategy",
    partitioningStrategy: "Partitioning strategy",
    consistencyModel: "Consistency model",
    concurrencyHandling: "Concurrency handling",
    asynchronousWorkflows: "Asynchronous workflows",
    failureScenarios: "Failure scenarios",
    retryAndIdempotencyStrategy: "Retry and idempotency strategy",
    securityConsiderations: "Security considerations",
    observability: "Observability",
    scalingBottlenecks: "Scaling bottlenecks",
    tradeoffs: "Trade-offs",
    alternativeArchitectures: "Alternative architectures",
    mvpDesign: "MVP design",
    intermediateScaleDesign: "Intermediate-scale design",
    internetScaleDesign: "Internet-scale design",
    multiRegionEvolution: "Multi-region evolution",
    costConsiderations: "Cost considerations",
    commonInterviewMistakes: "Common interview mistakes",
    followUpQuestions: "Follow-up questions",
    architectureReviewChecklist: "Architecture review checklist",
    keyTakeaways: "Key takeaways",
  };

  const SECTION_GROUPS = [
    { label: "Scope", target: "problemStatement" },
    { label: "Scale", target: "capacityEstimates" },
    { label: "Architecture", target: "highLevelArchitecture" },
    { label: "Data", target: "dataModel" },
    { label: "Reliability", target: "failureScenarios" },
    { label: "Evolution", target: "mvpDesign" },
    { label: "Review", target: "architectureReviewChecklist" },
  ];

  const STORAGE = {
    theme: "sd-field-manual-theme",
    completed: "sd-field-manual-completed",
    bookmarks: "sd-field-manual-bookmarks",
    lastRoute: "sd-field-manual-last-route",
  };

  const state = {
    completed: readStorage(STORAGE.completed, []),
    bookmarks: readStorage(STORAGE.bookmarks, []),
    caseFilter: "all",
    practiceFilter: "all",
    searchFilter: "all",
    timer: null,
    timerRemaining: 0,
  };

  const contentEl = document.getElementById("lesson-content");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const bookmarkPageButton = document.getElementById("bookmark-page");
  const searchDialog = document.getElementById("search-dialog");
  const searchInput = document.getElementById("search-input");
  const searchResults = document.getElementById("search-results");
  const toastEl = document.getElementById("toast");
  let searchIndex = [];
  let toastTimeout;

  function readStorage(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The manual remains fully usable if storage is blocked.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(value) {
    return String(value ?? "topic")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "topic";
  }

  function asArray(value) {
    if (value == null || value === "") return [];
    return Array.isArray(value) ? value : [value];
  }

  function flattenText(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(flattenText).join(" ");
    return Object.entries(value)
      .filter(([key]) => !["id", "correctIndex"].includes(key))
      .map(([, nested]) => flattenText(nested))
      .join(" ");
  }

  function humanize(key) {
    return String(key)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/^./, (char) => char.toUpperCase());
  }

  function renderRich(value, options) {
    const config = options || {};
    if (value == null || value === "") return '<p class="muted">No additional detail required for this design.</p>';
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const text = escapeHtml(value);
      if (config.code) return `<div class="code-block"><div class="code-label">${escapeHtml(config.label || "Example")}</div><pre><code>${text}</code></pre></div>`;
      return `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
    }
    if (Array.isArray(value)) {
      if (!value.length) return "";
      if (value.every((item) => typeof item !== "object" || item == null)) {
        return `<ul class="bullet-list">${value.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      }
      return `<div class="detail-grid">${value.map((item) => {
        if (typeof item !== "object" || item == null) return `<div class="detail-cell">${renderRich(item)}</div>`;
        const title = item.title || item.name || item.criterion || item.step || item.actor || item.label;
        const body = Object.fromEntries(Object.entries(item).filter(([key]) => !["title", "name", "criterion", "step", "actor", "label", "id"].includes(key)));
        return `<div class="detail-cell${Object.keys(body).length > 3 ? " full" : ""}">${title ? `<h4>${escapeHtml(title)}</h4>` : ""}${renderRich(body)}</div>`;
      }).join("")}</div>`;
    }
    if (typeof value === "object") {
      const entries = Object.entries(value).filter(([, nested]) => nested != null && nested !== "");
      if (!entries.length) return "";
      return `<div class="detail-grid">${entries.map(([key, nested]) => {
        const codeLike = /code|payload|schema|request|response|config|sql|json|event/i.test(key) && typeof nested === "string";
        return `<div class="detail-cell${entries.length === 1 || codeLike ? " full" : ""}"><h4>${escapeHtml(humanize(key))}</h4>${codeLike ? renderRich(nested, { code: true, label: humanize(key) }) : renderRich(nested)}</div>`;
      }).join("")}</div>`;
    }
    return "";
  }

  function moduleCatalog() {
    const modules = asArray(CONTENT.modules).slice();
    if (CONTENT.framework && !modules.some((module) => module.id === (CONTENT.framework.id || "design-framework"))) {
      modules.push({
        id: CONTENT.framework.id || "design-framework",
        number: 7,
        title: CONTENT.framework.title || "A Reusable System Design Framework",
        summary: CONTENT.framework.summary || "A repeatable twenty-step method for turning ambiguity into an explicit, reviewable design.",
        estimatedMinutes: CONTENT.framework.estimatedMinutes || 120,
        objectives: CONTENT.framework.objectives || [],
        frameworkOnly: true,
      });
    }
    return modules
      .map((module) => module.id === CONTENT.framework?.id ? { ...module, frameworkOnly: true } : module)
      .sort((a, b) => Number(a.number || extractNumber(a.id)) - Number(b.number || extractNumber(b.id)));
  }

  function extractNumber(value) {
    const match = String(value || "").match(/\d+/);
    return match ? Number(match[0]) : 99;
  }

  function caseCatalog() {
    const merged = [
      ...asArray(CONTENT.caseStudies),
      ...asArray(CONTENT.ecommerceCases),
      ...asArray(CONTENT.generalCases),
    ];
    const seen = new Set();
    return merged.filter((item) => {
      const key = item && (item.id || item.title);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function assessmentCatalog() {
    const source = CONTENT.assessments || {};
    const aliases = {
      conceptual: source.conceptual || source.conceptQuestions || [],
      architecture: source.architecture || source.architectureExercises || [],
      interview: source.interview || source.interviewProblems || [],
      reviews: source.reviews || source.architectureReviews || [],
      ecommerce: source.ecommerce || source.ecommerceExercises || [],
      bottlenecks: source.bottlenecks || [],
      databaseChoices: source.databaseChoices || [],
      failureFirst: source.failureFirst || [],
    };
    return aliases;
  }

  function routeParts() {
    return (window.location.hash || "#/home").replace(/^#\/?/, "").split("/").filter(Boolean);
  }

  function currentRoute() {
    return window.location.hash || "#/home";
  }

  function navigate(route) {
    if (window.location.hash === route) renderRoute();
    else window.location.hash = route;
  }

  function showToast(message) {
    window.clearTimeout(toastTimeout);
    toastEl.textContent = message;
    toastEl.classList.add("visible");
    toastTimeout = window.setTimeout(() => toastEl.classList.remove("visible"), 2200);
  }

  function routeInfo(route) {
    const parts = route.replace(/^#\/?/, "").split("/").filter(Boolean);
    const type = parts[0] || "home";
    if (type === "module") {
      const moduleEntry = moduleCatalog().find((item) => item.id === parts[1]);
      return { title: moduleEntry?.title || "Module", type: "Lesson", route };
    }
    if (type === "case") {
      const caseStudy = caseCatalog().find((item) => item.id === parts[1]);
      return { title: caseStudy?.title || "Case study", type: "Case study", route };
    }
    if (type === "tradeoff") {
      const item = asArray(CONTENT.tradeoffs).find((tradeoff) => tradeoff.id === parts[1]);
      return { title: item?.title || "Decision", type: "Decision", route };
    }
    if (type === "exercise") {
      const catalog = assessmentCatalog();
      const item = asArray(catalog[parts[1]]).find((exercise) => exercise.id === parts[2]);
      return { title: item?.title || item?.question || "Exercise", type: "Practice", route };
    }
    const labels = {
      home: ["System Design: Zero to Hero", "Overview"],
      cases: ["Case Study Library", "Case studies"],
      tradeoffs: ["Architecture Decisions", "Decisions"],
      framework: ["Reusable Design Framework", "Framework"],
      practice: ["Practice Lab", "Practice"],
      glossary: ["System Design Glossary", "Reference"],
      leadership: ["Lead Engineer Playbook", "Leadership"],
      bookmarks: ["Saved References", "Saved"],
    };
    const match = labels[type] || ["Not found", "System Design"];
    return { title: match[0], type: match[1], route };
  }

  function buildSidebar() {
    const modules = moduleCatalog();
    const nav = document.getElementById("curriculum-nav");
    nav.innerHTML = `
      <section class="nav-section" data-nav-section="curriculum">
        <button class="nav-section-title" aria-expanded="true"><span>Curriculum</span><span>⌄</span></button>
        <div class="nav-list">
          <a class="nav-link" href="#/home" data-route-match="home"><span class="nav-index">00</span><span class="nav-label">Overview</span><span class="nav-status"></span></a>
          ${modules.map((module, index) => {
            const route = `#/module/${module.id}`;
            return `<a class="nav-link" href="${route}" data-route-match="module/${escapeHtml(module.id)}"><span class="nav-index">${String(module.number || index + 1).padStart(2, "0")}</span><span class="nav-label">${escapeHtml(module.title)}</span><span class="nav-status ${state.completed.includes(route) ? "complete" : ""}"></span></a>`;
          }).join("")}
        </div>
      </section>
      <section class="nav-section" data-nav-section="apply">
        <button class="nav-section-title" aria-expanded="true"><span>Apply & review</span><span>⌄</span></button>
        <div class="nav-list">
          ${navLink("cases", "08", "Case studies", "□")}
          ${navLink("tradeoffs", "09", "Architecture decisions", "⇄")}
          ${navLink("practice", "10", "Practice lab", "◎")}
          ${navLink("leadership", "11", "Lead engineer playbook", "△")}
          ${navLink("glossary", "12", "Glossary", "A–Z")}
        </div>
      </section>`;
    updateSidebarState();
  }

  function navLink(route, index, label, status) {
    return `<a class="nav-link" href="#/${route}" data-route-match="${route}"><span class="nav-index">${index}</span><span class="nav-label">${label}</span><span class="nav-status">${status}</span></a>`;
  }

  function updateSidebarState() {
    const routeKey = currentRoute().replace(/^#\//, "");
    document.querySelectorAll("[data-route-match]").forEach((link) => {
      const match = link.getAttribute("data-route-match");
      link.classList.toggle("active", routeKey === match || routeKey.startsWith(`${match}/`));
    });
    const total = moduleCatalog().length + caseCatalog().length + asArray(CONTENT.tradeoffs).length;
    const count = state.completed.filter((route) => /^#\/(module|case|tradeoff)\//.test(route) || route === "#/framework").length;
    const percent = total ? Math.min(100, Math.round((count / total) * 100)) : 0;
    document.getElementById("progress-percent").textContent = `${percent}%`;
    document.getElementById("progress-bar").style.width = `${percent}%`;
    document.getElementById("progress-copy").textContent = count ? `${count} of ${total} references completed on this device.` : "Start with the foundations, or jump to a design review.";
    document.getElementById("bookmark-count").textContent = String(state.bookmarks.length);
  }

  function buildSearchIndex() {
    const items = [];
    moduleCatalog().forEach((module) => {
      const route = module.frameworkOnly ? "#/framework" : `#/module/${module.id}`;
      items.push({ type: "module", title: module.title, description: module.summary || module.kicker || "Curriculum module", route, text: flattenText(module) });
      asArray(module.topics).forEach((topic) => {
        const title = topic.name || topic.title;
        if (!title) return;
        items.push({ type: "module", title, description: topic.definition || topic.problem || topic.summary || module.title, route: `${route}/${slugify(title)}`, text: flattenText(topic) });
      });
    });
    caseCatalog().forEach((item) => {
      items.push({ type: "case", title: item.title, description: item.summary || flattenText(item.sections?.problemStatement).slice(0, 160), route: `#/case/${item.id}`, text: flattenText(item) });
    });
    asArray(CONTENT.tradeoffs).forEach((item) => {
      items.push({ type: "tradeoff", title: item.title, description: item.guidance || item.decisionGuidance || "Architecture comparison", route: `#/tradeoff/${item.id}`, text: flattenText(item) });
    });
    asArray(CONTENT.glossary).forEach((item) => {
      const title = item.term || item.name || item.title;
      items.push({ type: "glossary", title, description: item.definition || item.description || "Glossary term", route: `#/glossary/${slugify(title)}`, text: flattenText(item) });
    });
    searchIndex = items;
  }

  function renderRoute() {
    stopTimer();
    const parts = routeParts();
    const type = parts[0] || "home";
    let html;
    if (type === "home") html = renderHome();
    else if (type === "module") html = renderModule(parts[1]);
    else if (type === "framework") html = renderFramework();
    else if (type === "cases") html = renderCaseLibrary();
    else if (type === "case") html = renderCaseStudy(parts[1]);
    else if (type === "tradeoffs") html = renderTradeoffLibrary();
    else if (type === "tradeoff") html = renderTradeoff(parts[1]);
    else if (type === "practice") html = renderPractice();
    else if (type === "exercise") html = renderExercise(parts[1], parts[2]);
    else if (type === "glossary") html = renderGlossary();
    else if (type === "leadership") html = renderLeadership();
    else if (type === "bookmarks") html = renderBookmarks();
    else html = renderNotFound();

    contentEl.innerHTML = html;
    const info = routeInfo(currentRoute());
    breadcrumbEl.textContent = `${info.type} / ${info.title}`;
    document.title = `${info.title} · System Design`;
    writeStorage(STORAGE.lastRoute, currentRoute());
    updateSidebarState();
    updateBookmarkButton();
    bindViewControls();
    document.body.classList.remove("nav-open");
    document.getElementById("menu-button").setAttribute("aria-expanded", "false");
    contentEl.focus({ preventScroll: true });

    const targetSlug = parts[2];
    if (targetSlug) {
      window.setTimeout(() => {
        const target = document.getElementById(targetSlug) || document.getElementById(`glossary-${targetSlug}`);
        if (target) {
          if (target.tagName === "DETAILS") target.open = true;
          target.scrollIntoView({ block: "start" });
        }
      }, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function renderHome() {
    const modules = moduleCatalog();
    const cases = caseCatalog();
    const assessments = assessmentCatalog();
    const exerciseCount = Object.values(assessments).reduce((total, items) => total + asArray(items).length, 0);
    const lastRoute = readStorage(STORAGE.lastRoute, "#/module/system-design-foundations");
    const resume = lastRoute === "#/home" ? (modules[0] ? `#/module/${modules[0].id}` : "#/cases") : lastRoute;
    return `
      <section class="hero">
        <div class="hero-grid">
          <div>
            <span class="eyebrow">Architecture field manual</span>
            <h1>Design systems that survive contact with reality.</h1>
            <p class="hero-lede">A zero-to-hero curriculum for engineers who already ship software—and want sharper judgment about scale, data, reliability, organizational constraints, and the trade-offs that shape durable platforms.</p>
            <div class="hero-actions">
              <a class="primary-button" href="${escapeHtml(resume)}">${state.completed.length ? "Resume learning" : "Start the curriculum"} <span aria-hidden="true">→</span></a>
              <a class="secondary-button" href="#/cases">Open a case study</a>
              <a class="text-button" href="#/framework">Use the 20-step framework</a>
            </div>
          </div>
          <aside class="hero-aside" aria-label="Platform summary">
            <span class="hero-aside-label">Coverage</span>
            <div class="hero-stat"><strong>${modules.length}</strong><span>progressive modules</span></div>
            <div class="hero-stat"><strong>${cases.length}</strong><span>end-to-end designs</span></div>
            <div class="hero-stat"><strong>${exerciseCount}+</strong><span>practice prompts</span></div>
          </aside>
        </div>
      </section>
      <section class="quick-stats" aria-label="Learning platform features">
        ${quickStat("20 steps", "Reusable design process")}
        ${quickStat(`${asArray(CONTENT.tradeoffs).length} decisions`, "Side-by-side trade-offs")}
        ${quickStat("32 checks", "Per case study")}
        ${quickStat("Local-first", "Progress stays on device")}
      </section>
      <section class="section-block">
        <div class="section-heading">
          <div><div class="section-kicker">01 — Curriculum</div><h2>Build judgment in layers.</h2></div>
          <p>Foundations move quickly into capacity, data, distributed failure, security, and a repeatable decision framework.</p>
        </div>
        <div class="module-grid">${modules.map(renderModuleCard).join("")}</div>
      </section>
      <section class="section-block">
        <div class="section-heading">
          <div><div class="section-kicker">02 — Choose a track</div><h2>Practice at the right altitude.</h2></div>
          <p>Use the sequence as a guide, then branch into the review or interview work that matches your immediate goal.</p>
        </div>
        <div class="pathway">
          ${pathwayStep("01", "Foundation", "Vocabulary, requirements, CAP, scale, building blocks")}
          ${pathwayStep("02", "Intermediate", "Capacity plans, data choices, async workflows")}
          ${pathwayStep("03", "Advanced", "Partial failure, consistency, region and recovery")}
          ${pathwayStep("04", "Lead", "Decision records, cost, ownership, review leadership")}
        </div>
      </section>
      <section class="section-block">
        <div class="section-heading">
          <div><div class="section-kicker">03 — Applied architecture</div><h2>Learn through concrete systems.</h2></div>
          <a class="text-button" href="#/cases">Explore all ${cases.length} case studies →</a>
        </div>
        <div class="case-grid">${cases.slice(0, 6).map(renderCaseCard).join("")}</div>
      </section>`;
  }

  function quickStat(value, label) {
    return `<div class="quick-stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  function pathwayStep(number, title, description) {
    return `<div class="pathway-step"><span>${number}</span><strong>${title}</strong><p>${description}</p></div>`;
  }

  function renderModuleCard(module, index) {
    const route = module.frameworkOnly ? "#/framework" : `#/module/${module.id}`;
    const topicCount = asArray(module.topics).length || asArray(CONTENT.framework?.steps).length;
    return `<article class="module-card">
      <span class="module-number">Module ${String(module.number || index + 1).padStart(2, "0")}</span>
      <h3>${escapeHtml(module.title)}</h3>
      <p>${escapeHtml(module.summary || module.kicker || "Architecture concepts and design judgment.")}</p>
      <div class="module-meta"><div class="meta-tags"><span class="tag">${topicCount} topics</span><span class="tag">${escapeHtml(durationLabel(module))}</span></div><span class="card-arrow" aria-hidden="true">→</span></div>
      <a class="card-link" href="${route}" aria-label="Open ${escapeHtml(module.title)}"></a>
    </article>`;
  }

  function durationLabel(item) {
    const raw = item.estimatedMinutes || item.durationMinutes || item.duration || 0;
    if (typeof raw === "string" && /[a-z]/i.test(raw)) return raw;
    const minutes = Number(raw);
    if (!minutes) return "Reference";
    return minutes >= 60 ? `${Math.round(minutes / 60)} hr` : `${minutes} min`;
  }

  function renderModule(id) {
    const moduleEntry = moduleCatalog().find((item) => item.id === id);
    if (!moduleEntry) return renderNotFound("Module not found");
    if (moduleEntry.frameworkOnly || moduleEntry.id === CONTENT.framework?.id) return renderFramework();
    const topics = asArray(moduleEntry.topics || moduleEntry.concepts || moduleEntry.components);
    const sections = topics.map((topic) => ({ id: slugify(topic.name || topic.title), label: topic.name || topic.title })).filter((item) => item.label);
    const route = `#/module/${moduleEntry.id}`;
    const moduleNumber = moduleEntry.number || extractNumber(moduleEntry.id);
    return `
      ${pageHero(`Module ${String(moduleNumber).padStart(2, "0")}`, moduleEntry.title, moduleEntry.summary || moduleEntry.kicker, route, moduleEntry.level || (moduleNumber > 4 ? "Advanced" : "Core"))}
      <div class="lesson-layout">
        <div class="lesson-main">
          ${summaryPanel([
            ["Scope", `${topics.length} core topics`],
            ["Time", durationLabel(moduleEntry)],
            ["Outcome", asArray(moduleEntry.objectives)[0] || "Make explicit, defensible architecture decisions"],
          ])}
          ${moduleEntry.objectives ? lessonSection("objectives", "What you should be able to do", renderRich(moduleEntry.objectives), "Start with outcomes, then use the topic cards as a reference.") : ""}
          <section class="lesson-section" id="topics">
            <h2>Concepts and building blocks</h2>
            <p>Open a topic for the mental model, decision boundary, and failure or operational implications.</p>
            <div class="concept-list">${topics.map(renderTopicCard).join("")}</div>
          </section>
          ${renderModuleExtras(moduleEntry)}
          ${renderQuiz(moduleEntry.quiz || moduleEntry.endQuiz || quizForModule(moduleNumber), moduleEntry.id)}
          ${moduleEntry.keyTakeaways || moduleEntry.takeaways ? lessonSection("takeaways", "Key takeaways", `<div class="callout takeaway"><strong>Carry these into your next design</strong>${renderRich(moduleEntry.keyTakeaways || moduleEntry.takeaways)}</div>`) : ""}
          ${lessonFooter(route)}
        </div>
        ${onThisPage([{ id: "objectives", label: "Objectives" }, { id: "topics", label: "Concepts" }, ...sections.slice(0, 8), { id: "takeaways", label: "Takeaways" }])}
      </div>`;
  }

  function pageHero(kicker, title, summary, route, level) {
    return `<header class="page-hero">
      <div><span class="eyebrow">${escapeHtml(kicker)}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(summary || "A practical system design reference for architecture decisions and reviews.")}</p></div>
      <div class="page-hero-actions"><span class="status-tag ${String(level).toLowerCase().includes("lead") ? "lead" : "advanced"}">${escapeHtml(level)}</span>${route ? `<button class="secondary-button" data-complete-route="${escapeHtml(route)}">${state.completed.includes(route) ? "Completed ✓" : "Mark complete"}</button>` : ""}</div>
    </header>`;
  }

  function summaryPanel(items) {
    return `<div class="summary-panel">${items.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>`;
  }

  function lessonSection(id, title, body, intro) {
    return `<section class="lesson-section" id="${escapeHtml(id)}"><h2>${escapeHtml(title)}</h2>${intro ? `<p>${escapeHtml(intro)}</p>` : ""}${body}</section>`;
  }

  function renderTopicCard(topic, index) {
    const title = topic.name || topic.title || `Topic ${index + 1}`;
    const subtitle = topic.definition || topic.problem || topic.summary || topic.intuition || "Open for decision guidance";
    const preferredOrder = [
      "definition", "problem", "intuition", "howItWorks", "practicalExample", "example", "typicalUseCases", "useCases", "useWhen",
      "whenToUse", "avoidWhen", "whenNotToUse", "tradeoffs", "advantages", "disadvantages", "failureModes", "scalingLimits", "operationalConsiderations",
      "operations", "technologies", "commonTechnologies", "misconceptions", "commonMisconceptions", "leadConsiderations",
    ];
    const excluded = new Set(["id", "name", "title", "summary", "definition", "diagram"]);
    const keys = [...preferredOrder, ...Object.keys(topic).filter((key) => !preferredOrder.includes(key))]
      .filter((key, position, all) => all.indexOf(key) === position && !excluded.has(key) && topic[key] != null && topic[key] !== "");
    return `<details class="concept-card" id="${slugify(title)}"${index === 0 ? " open" : ""}>
      <summary><span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(String(subtitle).slice(0, 190))}</span></span></summary>
      <div class="concept-body">
        ${topic.definition ? `<p class="concept-definition">${escapeHtml(topic.definition)}</p>` : ""}
        ${topic.diagram ? renderDiagram(topic.diagram, title) : ""}
        <div class="detail-grid">${keys.map((key) => `<div class="detail-cell${/example|howItWorks|problem|intuition/i.test(key) ? " full" : ""}"><h4>${escapeHtml(humanize(key))}</h4>${renderRich(topic[key])}</div>`).join("")}</div>
      </div>
    </details>`;
  }

  function renderModuleExtras(module) {
    const blocks = [];
    const matrices = module.decisionTables || module.decisionMatrices || module.decisionMatrix;
    if (matrices) blocks.push(lessonSection("decisions", "Decision matrices", renderMatrices(matrices), "Use criteria to constrain the decision before naming a technology."));
    const worked = module.workedExamples || module.examples || module.calculationExamples;
    if (worked) blocks.push(lessonSection("worked-examples", "Worked examples", renderExamples(worked), "Make assumptions explicit, show the math, then state which decision the estimate changes."));
    const templates = module.reusableTemplates || module.templates;
    if (templates) blocks.push(lessonSection("templates", "Reusable templates", renderRich(templates)));
    const diagrams = module.diagrams;
    if (diagrams) blocks.push(lessonSection("diagrams", "Architecture views", asArray(diagrams).map((diagram, index) => renderDiagram(diagram, diagram.title || `Architecture view ${index + 1}`)).join("")));
    const checklists = module.checklists || module.reviewChecklist;
    if (checklists) blocks.push(lessonSection("checklist", "Architecture review checklist", `<div class="callout takeaway"><strong>Review gate</strong>${renderRich(checklists)}</div>`));
    const exercises = module.exercises;
    if (exercises) blocks.push(lessonSection("exercises", "Apply the module", renderRich(exercises), "Write the decision and its rejected alternative, not just the chosen component."));
    return blocks.join("");
  }

  function renderMatrices(matrices) {
    return asArray(matrices).map((matrix) => {
      if (Array.isArray(matrix?.rows)) return renderTable(matrix.title || "Decision table", matrix.headers || matrix.columns || Object.keys(matrix.rows[0] || {}), matrix.rows);
      if (Array.isArray(matrix)) return renderRich(matrix);
      return `<div class="accordion"><details open><summary><strong>${escapeHtml(matrix.title || matrix.name || "Decision matrix")}</strong></summary><div class="concept-body">${renderRich(matrix.rows || matrix.criteria || matrix)}</div></details></div>`;
    }).join("");
  }

  function renderTable(title, headers, rows) {
    const normalizedHeaders = asArray(headers);
    return `<div class="table-wrap" aria-label="${escapeHtml(title)}"><table><thead><tr>${normalizedHeaders.map((header) => `<th>${escapeHtml(humanize(header))}</th>`).join("")}</tr></thead><tbody>${asArray(rows).map((row) => `<tr>${normalizedHeaders.map((header, columnIndex) => `<td>${escapeHtml(Array.isArray(row) ? flattenText(row[columnIndex] ?? "") : typeof row === "object" && row != null ? flattenText(row[header] ?? row[slugify(header)] ?? "") : row)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  function renderExamples(examples) {
    return asArray(examples).map((example, index) => {
      if (typeof example === "string") return `<div class="callout"><strong>Example ${index + 1}</strong><p>${escapeHtml(example)}</p></div>`;
      const title = example.title || example.name || example.scenario || `Worked example ${index + 1}`;
      const code = example.code || example.payload || example.schema || example.configuration;
      const rest = Object.fromEntries(Object.entries(example).filter(([key]) => !["title", "name", "scenario", "code", "payload", "schema", "configuration"].includes(key)));
      return `<details class="concept-card"${index === 0 ? " open" : ""}><summary><span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(flattenText(example.assumptions || example.summary || "Show the assumptions and the decision." ).slice(0, 150))}</span></span></summary><div class="concept-body">${renderRich(rest)}${code ? renderRich(code, { code: true, label: example.language || "Example" }) : ""}</div></details>`;
    }).join("");
  }

  function renderQuiz(quiz, moduleId) {
    const questions = asArray(quiz);
    if (!questions.length) return "";
    return lessonSection("quiz", "Knowledge check", `<form class="quiz" data-quiz="${escapeHtml(moduleId)}">${questions.map((question, index) => {
      const options = asArray(question.options || question.choices);
      const prompt = question.question || question.prompt || question.title;
      return `<fieldset class="quiz-question" data-correct="${Number(question.correctIndex ?? question.answerIndex ?? question.answer ?? -1)}"><legend>${index + 1}. ${escapeHtml(prompt)}</legend><div class="quiz-options">${options.map((option, optionIndex) => `<label class="quiz-option"><input type="radio" name="${escapeHtml(moduleId)}-${index}" value="${optionIndex}"><span>${escapeHtml(option)}</span></label>`).join("")}</div><div class="quiz-explanation">${escapeHtml(question.explanation || question.suggestedAnswer || "Compare your answer to the lesson's decision guidance.")}</div></fieldset>`;
    }).join("")}</form>`, "Choose the most defensible answer given the stated constraints.");
  }

  function quizForModule(moduleNumber) {
    return asArray(CONTENT.assessments?.crossModuleQuiz).filter((question) =>
      String(question.module || question.moduleId || "").startsWith(`Module ${moduleNumber}`)
    );
  }

  function onThisPage(items) {
    const unique = items.filter((item, index, all) => item.id && item.label && all.findIndex((candidate) => candidate.id === item.id) === index);
    return `<aside class="on-this-page"><strong>On this page</strong>${unique.map((item) => `<button type="button" data-scroll-id="${escapeHtml(item.id)}">${escapeHtml(item.label)}</button>`).join("")}</aside>`;
  }

  function lessonFooter(route) {
    const pages = [
      ...moduleCatalog().map((item) => ({ route: item.frameworkOnly ? "#/framework" : `#/module/${item.id}`, title: item.title })),
      { route: "#/cases", title: "Case Study Library" },
      ...caseCatalog().map((item) => ({ route: `#/case/${item.id}`, title: item.title })),
      { route: "#/tradeoffs", title: "Architecture Decisions" },
      ...asArray(CONTENT.tradeoffs).map((item) => ({ route: `#/tradeoff/${item.id}`, title: item.title })),
      { route: "#/practice", title: "Practice Lab" },
    ];
    const index = pages.findIndex((item) => item.route === route);
    const previous = index > 0 ? pages[index - 1] : null;
    const next = index >= 0 && index < pages.length - 1 ? pages[index + 1] : null;
    return `<nav class="lesson-footer" aria-label="Lesson navigation">
      ${previous ? `<a class="next-link" href="${previous.route}"><span>← Previous</span><strong>${escapeHtml(previous.title)}</strong></a>` : "<span></span>"}
      <button class="completion-button ${state.completed.includes(route) ? "complete" : ""}" data-complete-route="${escapeHtml(route)}" aria-label="${state.completed.includes(route) ? "Mark incomplete" : "Mark complete"}">${state.completed.includes(route) ? "✓" : "○"}</button>
      ${next ? `<a class="next-link" href="${next.route}"><span>Next →</span><strong>${escapeHtml(next.title)}</strong></a>` : "<span></span>"}
    </nav>`;
  }

  function renderFramework() {
    const framework = CONTENT.framework || {};
    const steps = asArray(framework.steps);
    const route = "#/framework";
    return `
      ${pageHero("Module 07 · Reusable process", framework.title || "A Reusable System Design Framework", framework.summary || "Twenty steps for moving from ambiguity to a design that is explicit, reviewable, and evolvable.", route, "Lead")}
      <div class="lesson-layout"><div class="lesson-main">
        ${summaryPanel([["Process", `${steps.length || 20} explicit steps`], ["Output", "A decision-ready design"], ["Leadership lens", "Assumptions, alternatives, ownership"]])}
        <section class="lesson-section"><h2>From ambiguity to an operating system</h2><p>The sequence is deliberately iterative. Revisit scale, data, and failure assumptions whenever a decision changes the risk profile.</p>
          <div class="framework-steps">${steps.map((step, index) => renderFrameworkStep(step, index)).join("") || `<div class="callout risk"><strong>Framework data unavailable</strong><p>The supporting content file did not load.</p></div>`}</div>
        </section>
        ${framework.examples ? lessonSection("examples", "Example responses", renderExamples(framework.examples)) : ""}
        ${framework.checklist ? lessonSection("checklist", "Final design check", renderRich(framework.checklist)) : ""}
        ${renderQuiz(quizForModule(7), "module-7")}
        ${lessonFooter(route)}
      </div>${onThisPage(steps.slice(0, 12).map((step, index) => ({ id: `step-${index + 1}`, label: `${index + 1}. ${step.name || step.title}` })))}</div>`;
  }

  function renderFrameworkStep(step, index) {
    const number = step.number || index + 1;
    const title = step.name || step.title || `Step ${number}`;
    const content = Object.fromEntries(Object.entries(step).filter(([key]) => !["number", "name", "title", "id"].includes(key)));
    return `<div class="framework-step" id="step-${number}"><div class="framework-number">${String(number).padStart(2, "0")}</div><details class="framework-content"${index < 2 ? " open" : ""}><summary><h3>${escapeHtml(title)}</h3></summary><div class="concept-definition">${renderRich(content)}</div></details></div>`;
  }

  function renderCaseLibrary() {
    const cases = caseCatalog();
    const filtered = cases.filter((item) => {
      if (state.caseFilter === "all") return true;
      if (state.caseFilter === "ecommerce") return /commerce/i.test(item.domain || item.category || "");
      if (state.caseFilter === "general") return !/commerce/i.test(item.domain || item.category || "");
      return String(item.difficulty || "").toLowerCase() === state.caseFilter;
    });
    const ecommerceCount = cases.filter((item) => /commerce/i.test(item.domain || item.category || "")).length;
    return `
      ${pageHero("Applied architecture", "Case Study Library", "Work through requirements, scale, APIs, data, failure, security, evolution, and cost across production-shaped systems.", null, `${cases.length} designs`)}
      <div class="filter-bar" aria-label="Case study filters">
        ${filterButton("case", "all", "All systems", state.caseFilter)}
        ${filterButton("case", "ecommerce", `E-commerce · ${ecommerceCount}`, state.caseFilter)}
        ${filterButton("case", "general", `General · ${cases.length - ecommerceCount}`, state.caseFilter)}
        ${filterButton("case", "lead", "Lead-level", state.caseFilter)}
        ${filterButton("case", "advanced", "Advanced", state.caseFilter)}
      </div>
      <div class="case-grid" id="case-grid">${filtered.map(renderCaseCard).join("")}</div>
      ${!filtered.length ? `<div class="empty-state"><strong>No matching systems.</strong><p>Choose another filter to restore the case study catalog.</p></div>` : ""}`;
  }

  function filterButton(kind, value, label, active) {
    return `<button class="filter-chip ${active === value ? "active" : ""}" data-${kind}-filter="${value}" aria-pressed="${active === value}">${escapeHtml(label)}</button>`;
  }

  function renderCaseCard(item) {
    const route = `#/case/${item.id}`;
    const ecommerce = /commerce/i.test(item.domain || item.category || "");
    return `<article class="case-card">
      <div class="case-card-top"><span class="status-tag ${String(item.difficulty || "advanced").toLowerCase().includes("lead") ? "lead" : "advanced"}">${escapeHtml(item.difficulty || "Advanced")}</span><span class="tag">${ecommerce ? "E-commerce" : "General"}</span></div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary || flattenText(item.sections?.problemStatement).slice(0, 170))}</p>
      <div class="module-meta"><div class="meta-tags"><span class="tag">32-part review</span><span class="tag">${asArray(item.technologies).slice(0, 1).map(escapeHtml).join("") || "Architecture"}</span></div><span class="card-arrow">→</span></div>
      <a class="card-link" href="${route}" aria-label="Open ${escapeHtml(item.title)} case study"></a>
    </article>`;
  }

  function renderCaseStudy(id) {
    const item = caseCatalog().find((caseStudy) => caseStudy.id === id);
    if (!item) return renderNotFound("Case study not found");
    const sections = item.sections || {};
    const orderedSections = Object.keys(SECTION_LABELS).map((key) => [key, sections[key]]);
    const route = `#/case/${item.id}`;
    return `
      ${pageHero(`${escapeHtml(item.domain || "General")} case study`, item.title, item.summary || flattenText(sections.problemStatement).slice(0, 260), route, item.difficulty || "Advanced")}
      <nav class="case-section-nav" aria-label="Case study sections">${SECTION_GROUPS.map((group) => `<button type="button" data-scroll-id="${group.target}">${group.label}</button>`).join("")}</nav>
      <div class="lesson-layout"><div class="lesson-main">
        ${summaryPanel([["Coverage", `${orderedSections.filter(([, value]) => value != null).length} / 32 review areas`], ["Scale", scaleSummary(item.scale)], ["Stack examples", asArray(item.technologies).slice(0, 3).join(" · ") || "Technology-neutral"]])}
        ${renderDiagram(item.diagram || inferDiagram(item), `${item.title} · high-level architecture`)}
        ${item.sequence ? renderSequence(item.sequence, `${item.title} · critical path`) : ""}
        ${renderEvolutionTabs(item)}
        <section class="lesson-section" id="case-review"><h2>End-to-end design review</h2><p>Expand each section. State assumptions and rejected alternatives as you adapt the design to a real organization.</p>
          <div class="case-study-sections">${orderedSections.map(([key, value], index) => renderCaseSection(key, value, index)).join("")}</div>
        </section>
        ${lessonFooter(route)}
      </div>${onThisPage(SECTION_GROUPS.map((group) => ({ id: group.target, label: group.label })))}</div>`;
  }

  function scaleSummary(scale) {
    if (!scale) return "State the workload assumptions";
    if (typeof scale === "string") return scale;
    const values = Object.values(scale).map(flattenText).filter(Boolean);
    return values.slice(0, 2).join(" · ") || "State the workload assumptions";
  }

  function inferDiagram(item) {
    const nodes = ["Clients", "Edge / Gateway", `${item.title} services`, "Data stores", "Async workers"];
    return { nodes };
  }

  function renderDiagram(diagram, title) {
    if (!diagram) return "";
    const rawNodes = asArray(diagram.nodes || diagram.components || diagram.flow || diagram);
    const nodes = rawNodes.slice(0, 8).map((node) => typeof node === "string" ? { label: node } : node);
    if (!nodes.length) return "";
    return `<figure class="architecture-diagram"><figcaption class="diagram-title"><strong>${escapeHtml(diagram.title || title || "Architecture view")}</strong><span>Conceptual · not deployment topology</span></figcaption><div class="diagram-flow">${nodes.map((node) => {
      const label = node.label || node.name || node.id || "Component";
      const detail = node.detail || node.kind || node.role || "";
      return `<div class="diagram-node ${diagramNodeClass(node, label)}"><strong>${escapeHtml(label)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}</div>`;
    }).join("")}</div>${diagram.flow && Array.isArray(diagram.flow) && typeof diagram.flow[0] === "object" ? `<div class="callout"><strong>Flow contracts</strong>${renderRich(diagram.flow)}</div>` : ""}</figure>`;
  }

  function diagramNodeClass(node, label) {
    const value = `${node.kind || ""} ${label}`.toLowerCase();
    if (/client|user|device|browser|mobile/.test(value)) return "client";
    if (/db|data|store|sql|redis|search|index|object/.test(value)) return "data";
    if (/queue|stream|kafka|event|async|worker/.test(value)) return "async";
    if (/auth|identity|security|waf|pci/.test(value)) return "security";
    return "service";
  }

  function renderSequence(sequence, title) {
    const steps = asArray(sequence);
    if (!steps.length) return "";
    return `<figure class="sequence-diagram"><figcaption class="diagram-title" style="padding:14px 14px 4px"><strong>${escapeHtml(title || "Critical request sequence")}</strong><span>${steps.length} steps</span></figcaption>${steps.map((step, index) => {
      const actor = typeof step === "string" ? `Step ${index + 1}` : step.actor || step.from || step.component || `Step ${index + 1}`;
      const action = typeof step === "string" ? step : step.action || step.message || step.description || flattenText(step);
      return `<div class="sequence-row"><div class="sequence-actor">${escapeHtml(actor)}</div><div class="sequence-arrow">→</div><div class="sequence-action">${escapeHtml(action)}</div></div>`;
    }).join("")}</figure>`;
  }

  function renderEvolutionTabs(item) {
    const phases = [
      ["mvp", "MVP", item.sections?.mvpDesign],
      ["intermediate", "Intermediate", item.sections?.intermediateScaleDesign],
      ["internet", "Internet scale", item.sections?.internetScaleDesign],
      ["regions", "Multi-region", item.sections?.multiRegionEvolution],
    ];
    const prefix = `evolution-${slugify(item.id)}`;
    return `<section class="lesson-section"><h2>Evolution path</h2><p>Advance only when a measured constraint, risk, or ownership boundary justifies the next step.</p><div class="tabs"><div class="tab-list" role="tablist" aria-label="${escapeHtml(item.title)} evolution phases">${phases.map(([id, label], index) => `<button type="button" class="tab-button" role="tab" aria-selected="${index === 0}" aria-controls="${prefix}-${id}">${label}</button>`).join("")}</div>${phases.map(([id, label, value], index) => `<div class="tab-panel" role="tabpanel" id="${prefix}-${id}"${index === 0 ? "" : " hidden"}><div class="callout tradeoff"><strong>${escapeHtml(label)} design</strong>${renderRich(value)}</div></div>`).join("")}</div></section>`;
  }

  function renderCaseSection(key, value, index) {
    const label = SECTION_LABELS[key] || humanize(key);
    const isRisk = /failure|bottleneck|mistake/.test(key);
    const isTakeaway = /takeaway|checklist/.test(key);
    return `<details class="concept-card case-study-section" id="${key}"${index < 2 ? " open" : ""}><summary><span><strong>${String(index + 1).padStart(2, "0")} · ${escapeHtml(label)}</strong><span>${escapeHtml(sectionSummary(value))}</span></span></summary><div class="concept-body"><div class="callout ${isRisk ? "risk" : isTakeaway ? "takeaway" : ""}">${renderRich(value)}</div></div></details>`;
  }

  function sectionSummary(value) {
    const text = flattenText(value).replace(/\s+/g, " ").trim();
    return text ? `${text.slice(0, 150)}${text.length > 150 ? "…" : ""}` : "Validate this area explicitly during the review.";
  }

  function renderTradeoffLibrary() {
    const tradeoffs = asArray(CONTENT.tradeoffs);
    return `
      ${pageHero("Architecture decisions", "Trade-offs, not trophies", "Compare alternatives against workload, consistency, ownership, operability, cost, and reversibility—not trend or résumé value.", null, `${tradeoffs.length} comparisons`)}
      <section class="section-block"><div class="section-heading"><div><div class="section-kicker">Decision catalog</div><h2>Choose with constraints.</h2></div><p>Each comparison includes operational complexity, cost implications, anti-patterns, and decision signals.</p></div>
        <div class="decision-grid">${tradeoffs.map(renderDecisionCard).join("")}</div>
      </section>`;
  }

  function tradeoffOptions(item) {
    if (item.optionA && item.optionB) return [item.optionA, item.optionB];
    const parts = String(item.title || "").split(/\s+(?:vs\.?|versus)\s+/i);
    return parts.length > 1 ? [parts[0], parts.slice(1).join(" vs ")] : [item.a || "Option A", item.b || "Option B"];
  }

  function renderDecisionCard(item) {
    const [a, b] = tradeoffOptions(item);
    return `<article class="decision-card"><span class="module-number">Decision</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(flattenText(item.guidance || item.decisionGuidance || item.criteria).slice(0, 170))}</p><div class="decision-split"><span class="decision-option">${escapeHtml(a)}</span><span class="decision-vs">VS</span><span class="decision-option">${escapeHtml(b)}</span></div><a class="card-link" href="#/tradeoff/${escapeHtml(item.id)}" aria-label="Compare ${escapeHtml(item.title)}"></a></article>`;
  }

  function renderTradeoff(id) {
    const item = asArray(CONTENT.tradeoffs).find((tradeoff) => tradeoff.id === id);
    if (!item) return renderNotFound("Decision comparison not found");
    const [a, b] = tradeoffOptions(item);
    const route = `#/tradeoff/${item.id}`;
    const fields = Object.fromEntries(Object.entries(item).filter(([key]) => !["id", "title", "optionA", "optionB", "a", "b"].includes(key)));
    return `
      ${pageHero("Architecture decision", item.title, flattenText(item.guidance || item.decisionGuidance || item.criteria).slice(0, 280), route, "Lead")}
      <div class="lesson-layout"><div class="lesson-main">
        ${summaryPanel([["Alternative A", a], ["Alternative B", b], ["Decision rule", "Match constraints; document reversibility"]])}
        <section class="lesson-section"><h2>Decision record</h2><p>Use the comparison as evidence. Record context, decision, rejected alternative, and consequences in an ADR.</p>${renderTradeoffFields(fields, a, b)}</section>
        ${lessonFooter(route)}
      </div>${onThisPage(Object.keys(fields).slice(0, 12).map((key) => ({ id: `decision-${slugify(key)}`, label: humanize(key) })))}</div>`;
  }

  function renderTradeoffFields(fields, a, b) {
    return Object.entries(fields).map(([key, value], index) => `<details class="concept-card" id="decision-${slugify(key)}"${index < 2 ? " open" : ""}><summary><span><strong>${escapeHtml(humanize(key))}</strong><span>${escapeHtml(sectionSummary(value))}</span></span></summary><div class="concept-body">${renderRich(value)}${/advantages|disadvantages|useCases/i.test(key) ? `<div class="callout tradeoff"><strong>Comparison lens</strong><p>Evaluate ${escapeHtml(a)} and ${escapeHtml(b)} against the same workload and ownership constraints.</p></div>` : ""}</div></details>`).join("");
  }

  function renderPractice() {
    const catalog = assessmentCatalog();
    const groups = [
      ["conceptual", "Concept checks", "Pressure-test definitions, consistency, scale, and failure semantics."],
      ["architecture", "Architecture exercises", "Turn constraints into a component, data, and failure design."],
      ["interview", "Interview simulations", "Run a complete design under a deliberate time box."],
      ["reviews", "Architecture critiques", "Find assumptions, hidden coupling, and operational risk."],
      ["ecommerce", "E-commerce drills", "Work through inventory, payment, promotion, and orchestration hazards."],
      ["bottlenecks", "Find the bottleneck", "Identify the first limiting resource and the signal that proves it."],
      ["databaseChoices", "Choose the data store", "Select storage from access patterns, consistency, and operations."],
      ["failureFirst", "What fails first?", "Trace dependency and regional failure before prescribing resilience."],
    ];
    const visibleGroups = state.practiceFilter === "all" ? groups : groups.filter(([key]) => key === state.practiceFilter);
    return `
      ${pageHero("Practice & assessment", "Practice Lab", "Move from recall to architecture judgment with scenarios, critique prompts, timed simulations, suggested answers, and evidence-based rubrics.", null, "4 tracks")}
      <div class="filter-bar">${filterButton("practice", "all", "All formats", state.practiceFilter)}${groups.map(([key, title]) => filterButton("practice", key, `${title} · ${asArray(catalog[key]).length}`, state.practiceFilter)).join("")}</div>
      ${visibleGroups.map(([key, title, description]) => `<section class="section-block"><div class="section-heading"><div><div class="section-kicker">${escapeHtml(key)}</div><h2>${escapeHtml(title)}</h2></div><p>${escapeHtml(description)}</p></div><div class="practice-grid">${asArray(catalog[key]).slice(0, state.practiceFilter === "all" ? 6 : 200).map((item) => renderPracticeCard(item, key)).join("")}</div></section>`).join("")}
      ${renderTimedSessions()}
      ${renderQuiz(CONTENT.assessments?.crossModuleQuiz, "cross-module")}`;
  }

  function renderPracticeCard(item, category) {
    const title = item.title || item.question || "Architecture exercise";
    return `<article class="practice-card"><span class="status-tag ${String(item.level || "advanced").toLowerCase().includes("lead") ? "lead" : "advanced"}">${escapeHtml(item.level || "Advanced")}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(flattenText(item.prompt || item.scenario || item.question).slice(0, 180))}</p><div class="module-meta"><div class="meta-tags"><span class="tag">${escapeHtml(item.durationMinutes || 20)} min</span>${asArray(item.tags).slice(0, 1).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div><span class="card-arrow">→</span></div><a class="card-link" href="#/exercise/${category}/${escapeHtml(item.id)}" aria-label="Open ${escapeHtml(title)}"></a></article>`;
  }

  function renderTimedSessions() {
    const sessions = asArray(CONTENT.assessments?.timedSessions);
    if (!sessions.length) return "";
    return `<section class="section-block"><div class="section-heading"><div><div class="section-kicker">Timed tracks</div><h2>Practice the clock.</h2></div><p>Use the phase budget to protect time for failure analysis and trade-offs.</p></div><div class="pathway">${sessions.slice(0, 4).map((session, index) => pathwayStep(String(index + 1).padStart(2, "0"), session.level || session.title, `${session.durationMinutes || session.minutes || 45} min · ${flattenText(session.focus || session.description).slice(0, 90)}`)).join("")}</div></section>`;
  }

  function renderExercise(category, id) {
    const catalog = assessmentCatalog();
    const item = asArray(catalog[category]).find((exercise) => exercise.id === id);
    if (!item) return renderNotFound("Exercise not found");
    const title = item.title || item.question || "Architecture exercise";
    const duration = Number(item.durationMinutes || 20);
    state.timerRemaining = duration * 60;
    return `
      <header class="page-hero"><div><span class="eyebrow">${escapeHtml(humanize(category))} · ${escapeHtml(item.level || "Advanced")}</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(flattenText(item.prompt || item.scenario || item.question).slice(0, 320))}</p></div><div class="page-hero-actions"><a class="secondary-button" href="#/practice">← Practice lab</a></div></header>
      <div class="exercise-shell section-block">
        <article class="exercise-prompt">
          <span class="section-kicker">The brief</span><h2>${escapeHtml(title)}</h2>
          ${renderRich(item.prompt || item.scenario || item.question)}
          ${item.constraints ? `<div class="callout tradeoff"><strong>Constraints</strong>${renderRich(item.constraints)}</div>` : ""}
          ${item.hints ? `<details class="answer-panel"><summary>Reveal progressive hints</summary><div class="answer-content">${renderRich(item.hints)}</div></details>` : ""}
          <details class="answer-panel"><summary>Compare with the suggested answer</summary><div class="answer-content">${renderRich(item.suggestedAnswer || item.answer || "State your assumptions, design, alternatives, failure modes, and evolution plan.")}</div></details>
        </article>
        <aside class="exercise-sidebar">
          <div class="timer-card"><h3>Design timer</h3><span class="timer-display" id="timer-display">${formatTime(state.timerRemaining)}</span><div class="hero-actions"><button class="primary-button" id="timer-start">Start</button><button class="secondary-button" id="timer-reset" data-duration="${duration}">Reset</button></div></div>
          <div class="rubric-card"><h3>Evaluation rubric</h3>${renderRich(item.rubric || ["Requirements and scale", "Data and consistency", "Failure and operations", "Trade-offs and evolution"])}</div>
        </aside>
      </div>`;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
    const seconds = Math.max(0, totalSeconds) % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function startTimer() {
    if (state.timer) return;
    const start = document.getElementById("timer-start");
    if (start) start.textContent = "Running";
    state.timer = window.setInterval(() => {
      state.timerRemaining -= 1;
      const display = document.getElementById("timer-display");
      if (display) display.textContent = formatTime(state.timerRemaining);
      if (state.timerRemaining <= 0) {
        stopTimer();
        showToast("Time. Spend two minutes summarizing the design and its sharpest trade-off.");
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timer) window.clearInterval(state.timer);
    state.timer = null;
  }

  function renderGlossary() {
    const terms = asArray(CONTENT.glossary);
    return `
      ${pageHero("Reference", "System Design Glossary", "Precise, review-ready definitions for the concepts that recur across distributed architecture decisions.", null, `${terms.length} terms`)}
      <div class="glossary-toolbar"><label class="sr-only" for="glossary-search">Filter glossary</label><input class="inline-search" id="glossary-search" placeholder="Filter terms…"><span class="tag" id="glossary-count">${terms.length} terms</span></div>
      <dl class="glossary-list" id="glossary-list">${terms.map(renderGlossaryItem).join("")}</dl>`;
  }

  function renderGlossaryItem(item) {
    const term = item.term || item.name || item.title;
    const related = item.relatedTopics || item.relatedTopicIds || item.related;
    return `<div class="glossary-item" id="glossary-${slugify(term)}" data-glossary-text="${escapeHtml(flattenText(item).toLowerCase())}"><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(item.definition || item.description || flattenText(item))}</dd>${related ? `<div class="meta-tags" style="margin-top:10px">${asArray(related).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}</div>`;
  }

  function renderLeadership() {
    const leadership = CONTENT.leadership || {};
    const principles = Array.isArray(leadership) ? leadership : asArray(leadership.principles);
    const entries = principles.length
      ? principles.map((item, index) => [item.id || `topic-${index}`, item])
      : Object.entries(leadership).filter(([key]) => !["id", "title", "summary"].includes(key));
    const leadershipAssets = leadership && typeof leadership === "object"
      ? Object.fromEntries(Object.entries(leadership).filter(([key]) => !["id", "title", "summary", "principles"].includes(key)))
      : {};
    return `
      ${pageHero("Lead engineer perspective", "Architecture is a leadership system", "Make assumptions visible, separate irreversible from reversible decisions, align boundaries with ownership, and translate technical risk into business choices.", null, "Lead")}
      <div class="lesson-layout"><div class="lesson-main">
        ${summaryPanel([["Primary tool", "Questions before components"], ["Decision artifact", "ADR with consequences"], ["Operating model", "Clear ownership and feedback"]])}
        <section class="lesson-section"><h2>Lead the decision, not the diagram</h2><p>A strong architecture review creates shared understanding of constraints, risk, ownership, and evolution. It is not a technology approval ceremony.</p><div class="concept-list">${entries.map(([key, value], index) => {
          const title = value?.title || value?.name || humanize(key);
          const body = value && typeof value === "object" ? Object.fromEntries(Object.entries(value).filter(([field]) => !["title", "name", "id"].includes(field))) : value;
          return `<details class="concept-card" id="lead-${slugify(key)}"${index === 0 ? " open" : ""}><summary><span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(sectionSummary(body))}</span></span></summary><div class="concept-body">${renderRich(body)}</div></details>`;
        }).join("")}</div></section>
        ${Object.keys(leadershipAssets).length ? lessonSection("leadership-assets", "Reusable leadership artifacts", renderRich(leadershipAssets), "Adapt these templates to the decision's risk and reversibility; do not turn them into ceremony.") : ""}
        ${asArray(CONTENT.examples).length ? lessonSection("technology-examples", "Practical contract and configuration examples", renderExamples(CONTENT.examples), "Technology examples make the principle concrete without turning the manual into a coding tutorial.") : ""}
      </div>${onThisPage(entries.slice(0, 12).map(([key, value]) => ({ id: `lead-${slugify(key)}`, label: value?.title || value?.name || humanize(key) })))}</div>`;
  }

  function renderBookmarks() {
    const bookmarks = state.bookmarks;
    return `
      ${pageHero("Local reference shelf", "Saved References", "Bookmarks are stored only in this browser. Use them to build a review packet or focused learning queue.", null, `${bookmarks.length} saved`)}
      <section class="section-block">${bookmarks.length ? `<div class="practice-grid">${bookmarks.map((bookmark) => `<article class="practice-card"><span class="tag">${escapeHtml(bookmark.type)}</span><h3>${escapeHtml(bookmark.title)}</h3><p>${escapeHtml(bookmark.route)}</p><div class="module-meta"><button class="text-button" data-remove-bookmark="${escapeHtml(bookmark.route)}">Remove</button><span class="card-arrow">→</span></div><a class="card-link" href="${escapeHtml(bookmark.route)}" aria-label="Open ${escapeHtml(bookmark.title)}"></a></article>`).join("")}</div>` : `<div class="empty-state"><strong>Your reference shelf is empty.</strong><p>Use the diamond in the header to save any lesson, decision, case study, or exercise.</p><a class="primary-button" style="margin-top:18px" href="#/cases">Browse case studies</a></div>`}</section>`;
  }

  function renderNotFound(title) {
    return `<div class="empty-state" style="margin-top:12vh"><strong>${escapeHtml(title || "Page not found")}</strong><p>The requested reference is not part of this manual.</p><a class="primary-button" style="margin-top:18px" href="#/home">Return to overview</a></div>`;
  }

  function toggleComplete(route) {
    const index = state.completed.indexOf(route);
    if (index >= 0) state.completed.splice(index, 1);
    else state.completed.push(route);
    writeStorage(STORAGE.completed, state.completed);
    showToast(index >= 0 ? "Marked as in progress." : "Marked complete on this device.");
    renderRoute();
    buildSidebar();
  }

  function updateBookmarkButton() {
    const saved = state.bookmarks.some((bookmark) => bookmark.route === currentRoute());
    bookmarkPageButton.classList.toggle("active", saved);
    bookmarkPageButton.textContent = saved ? "◆" : "◇";
    bookmarkPageButton.setAttribute("aria-label", saved ? "Remove bookmark" : "Bookmark this page");
  }

  function toggleBookmark() {
    const route = currentRoute();
    if (route === "#/home") return showToast("Open a lesson, case study, or exercise to save it.");
    const index = state.bookmarks.findIndex((bookmark) => bookmark.route === route);
    if (index >= 0) state.bookmarks.splice(index, 1);
    else {
      const info = routeInfo(route);
      state.bookmarks.push({ route, title: info.title, type: info.type, savedAt: new Date().toISOString() });
    }
    writeStorage(STORAGE.bookmarks, state.bookmarks);
    updateBookmarkButton();
    updateSidebarState();
    showToast(index >= 0 ? "Removed from saved references." : "Saved to this browser.");
  }

  function performSearch(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      searchResults.innerHTML = `<div class="search-empty"><span>⌘ K</span><p>Search across the complete curriculum.</p></div>`;
      return;
    }
    const tokens = normalized.split(/\s+/).filter(Boolean);
    const matches = searchIndex
      .filter((item) => state.searchFilter === "all" || item.type === state.searchFilter)
      .map((item) => {
        const haystack = `${item.title} ${item.description} ${item.text}`.toLowerCase();
        const score = tokens.reduce((total, token) => total + (item.title.toLowerCase().includes(token) ? 6 : haystack.includes(token) ? 1 : -20), 0);
        return { ...item, score };
      })
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24);
    searchResults.innerHTML = matches.length ? matches.map((item) => `<button type="button" class="search-result" data-search-route="${escapeHtml(item.route)}"><span class="search-result-type">${escapeHtml(item.type)}</span><span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p></span><span aria-hidden="true">↗</span></button>`).join("") : `<div class="search-empty"><span>0</span><p>No results. Try a component, quality attribute, or failure mode.</p></div>`;
  }

  function bindViewControls() {
    document.querySelectorAll("[data-complete-route]").forEach((button) => button.addEventListener("click", () => toggleComplete(button.getAttribute("data-complete-route"))));
    document.querySelectorAll("[data-case-filter]").forEach((button) => button.addEventListener("click", () => { state.caseFilter = button.dataset.caseFilter; renderRoute(); }));
    document.querySelectorAll("[data-practice-filter]").forEach((button) => button.addEventListener("click", () => { state.practiceFilter = button.dataset.practiceFilter; renderRoute(); }));
    document.querySelectorAll("[data-remove-bookmark]").forEach((button) => button.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation();
      state.bookmarks = state.bookmarks.filter((bookmark) => bookmark.route !== button.dataset.removeBookmark);
      writeStorage(STORAGE.bookmarks, state.bookmarks); renderRoute(); updateSidebarState();
    }));
    document.querySelectorAll("[data-scroll-id]").forEach((button) => button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.scrollId);
      if (!target) return;
      if (target.tagName === "DETAILS") target.open = true;
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }));
    document.querySelectorAll(".quiz-question input").forEach((input) => input.addEventListener("change", () => {
      const question = input.closest(".quiz-question");
      question.classList.add("answered");
      const correct = Number(question.dataset.correct);
      question.querySelectorAll(".quiz-option").forEach((option, index) => {
        option.style.borderColor = index === correct ? "var(--green)" : (input.checked && Number(input.value) === index && index !== correct ? "var(--danger)" : "var(--line)");
      });
    }));
    const glossarySearch = document.getElementById("glossary-search");
    if (glossarySearch) glossarySearch.addEventListener("input", () => {
      const query = glossarySearch.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll("[data-glossary-text]").forEach((item) => {
        const show = !query || item.dataset.glossaryText.includes(query);
        item.hidden = !show;
        if (show) visible += 1;
      });
      document.getElementById("glossary-count").textContent = `${visible} terms`;
    });
    document.querySelectorAll(".tab-button").forEach((button) => button.addEventListener("click", () => activateTab(button)));
    const timerStart = document.getElementById("timer-start");
    if (timerStart) timerStart.addEventListener("click", startTimer);
    const timerReset = document.getElementById("timer-reset");
    if (timerReset) timerReset.addEventListener("click", () => {
      stopTimer(); state.timerRemaining = Number(timerReset.dataset.duration) * 60;
      document.getElementById("timer-display").textContent = formatTime(state.timerRemaining);
      document.getElementById("timer-start").textContent = "Start";
    });
  }

  function activateTab(button) {
    const tabs = button.closest(".tabs");
    tabs.querySelectorAll(".tab-button").forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    tabs.querySelectorAll(".tab-panel").forEach((panel) => { panel.hidden = panel.id !== button.getAttribute("aria-controls"); });
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.getElementById("theme-toggle").setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  function setupGlobalEvents() {
    document.getElementById("skip-link").addEventListener("click", (event) => {
      event.preventDefault();
      contentEl.focus();
      contentEl.scrollIntoView({ block: "start" });
    });
    document.getElementById("menu-button").addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      document.getElementById("menu-button").setAttribute("aria-expanded", String(open));
    });
    const closeNavigation = () => {
      document.body.classList.remove("nav-open");
      document.getElementById("menu-button").setAttribute("aria-expanded", "false");
    };
    document.getElementById("sidebar-close").addEventListener("click", closeNavigation);
    document.getElementById("sidebar-scrim").addEventListener("click", closeNavigation);
    document.querySelectorAll(".sidebar-action[data-route]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
    document.addEventListener("click", (event) => {
      const sectionButton = event.target.closest(".nav-section-title");
      if (sectionButton) {
        const section = sectionButton.closest(".nav-section");
        const collapsed = section.classList.toggle("collapsed");
        sectionButton.setAttribute("aria-expanded", String(!collapsed));
      }
    });
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      writeStorage(STORAGE.theme, next);
    });
    bookmarkPageButton.addEventListener("click", toggleBookmark);
    document.getElementById("search-trigger").addEventListener("click", () => {
      if (!searchDialog.open) searchDialog.showModal();
      window.setTimeout(() => searchInput.focus(), 0);
    });
    document.getElementById("search-form").addEventListener("submit", (event) => event.preventDefault());
    document.getElementById("search-close").addEventListener("click", () => searchDialog.close());
    searchInput.addEventListener("input", () => performSearch(searchInput.value));
    document.getElementById("search-filters").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state.searchFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      performSearch(searchInput.value);
    });
    searchResults.addEventListener("click", (event) => {
      const button = event.target.closest("[data-search-route]");
      if (!button) return;
      searchDialog.close();
      navigate(button.dataset.searchRoute);
    });
    document.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); if (!searchDialog.open) searchDialog.showModal(); window.setTimeout(() => searchInput.focus(), 0);
      }
    });
    window.addEventListener("hashchange", renderRoute);
  }

  function init() {
    const preferredTheme = readStorage(STORAGE.theme, window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(preferredTheme);
    buildSidebar();
    buildSearchIndex();
    setupGlobalEvents();
    if (!window.location.hash) window.location.hash = "#/home";
    else renderRoute();
  }

  init();
})();
