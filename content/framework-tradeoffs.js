(function () {
  "use strict";

  const content = (window.SD_CONTENT = window.SD_CONTENT || {});
  content.modules = content.modules || [];
  content.caseStudies = content.caseStudies || [];
  content.tradeoffs = content.tradeoffs || [];
  content.glossary = content.glossary || [];
  content.assessments = content.assessments || {};

  content.framework = {
    id: "module-7",
    number: 7,
    title: "A Reusable System Design Framework",
    duration: "4-6 hours",
    summary:
      "A twenty-step decision process for turning an ambiguous prompt into an operable architecture, with explicit evidence, risks, and evolution paths.",
    outcome:
      "Produce a design another team can implement, operate, challenge, and evolve—not merely a diagram that survives an interview.",
    objectives: [
      "Convert an ambiguous prompt into prioritized, quantified requirements and explicit assumptions.",
      "Connect APIs, data, workflows, failure behavior, security, and operations into one coherent design.",
      "Compare viable alternatives using business, reliability, cost, reversibility, and organizational criteria.",
      "Present an incremental architecture with owned risks, validation steps, and evolution triggers."
    ],
    steps: [
      {
        number: 1,
        id: "clarify-problem",
        name: "Clarify the problem",
        questions: [
          "What business outcome are we changing, and how will success be measured?",
          "What is explicitly in scope, out of scope, or constrained by a deadline?",
          "Which terms are ambiguous, and which assumptions need an owner?",
          "Is this a greenfield design, a migration, or an evolution of a live system?"
        ],
        outputs: [
          "A one-paragraph problem statement",
          "A scope boundary and assumption log",
          "Measurable success and failure criteria"
        ],
        commonMistakes:
          "Starting with components, silently inventing requirements, or treating the stated solution as the underlying problem.",
        exampleResponse:
          "We are reducing checkout abandonment caused by slow and unreliable order submission. Phase one covers US web and mobile checkout; catalog browsing and fulfillment optimization are out of scope. Success means p99 submission under 2 seconds and no acknowledged order loss.",
        leadConsiderations:
          "Separate irreversible decisions from hypotheses. Name the business owner for disputed assumptions and time-box discovery so ambiguity does not become architecture-by-delay."
      },
      {
        number: 2,
        id: "users-use-cases",
        name: "Identify users and use cases",
        questions: [
          "Who initiates, receives, operates, and audits the system?",
          "What are the top user journeys and exceptional journeys?",
          "Which actors are human, service, batch, partner, or administrator?",
          "Which use cases drive value versus merely add completeness?"
        ],
        outputs: [
          "Prioritized actors and journeys",
          "Happy-path and exception-flow inventory",
          "Journey ownership map"
        ],
        commonMistakes:
          "Listing features without actors, ignoring operators and auditors, or optimizing a rare flow before the revenue-critical path.",
        exampleResponse:
          "Buyers place and inspect orders; customer-service agents investigate them; warehouse systems consume fulfillment requests; finance reconciles captured payments. Guest and signed-in checkout are P0, agent override is P1, and bulk ordering is deferred.",
        leadConsiderations:
          "Use journey value and risk to force prioritization. A low-volume compliance or recovery journey may deserve P0 even when it is not customer-facing."
      },
      {
        number: 3,
        id: "functional-requirements",
        name: "Define functional requirements",
        questions: [
          "What must users be able to create, read, change, or trigger?",
          "What invariants must every workflow preserve?",
          "Which business rules belong to this system rather than an upstream service?",
          "What is the minimum coherent slice for the first release?"
        ],
        outputs: [
          "Prioritized, testable capabilities",
          "Domain invariants and acceptance examples",
          "Explicit deferred requirements"
        ],
        commonMistakes:
          "Mixing quality attributes into feature lists, omitting negative behavior, or describing implementation instead of externally observable behavior.",
        exampleResponse:
          "The service validates a priced cart, creates at most one order per idempotency key, returns order status, and emits an order-accepted event. Split shipment and backorder workflows are deferred.",
        leadConsiderations:
          "Express invariants in language product, legal, and engineering can all validate. Tie P0 capabilities to contract and integration tests."
      },
      {
        number: 4,
        id: "non-functional-requirements",
        name: "Define non-functional requirements",
        questions: [
          "Which latency percentile, throughput, availability, durability, and freshness targets matter?",
          "What recovery, security, privacy, compliance, and residency obligations apply?",
          "Where may the system degrade, queue, or reject work?",
          "Which targets are user promises, internal objectives, or current measurements?"
        ],
        outputs: [
          "Quantified quality-attribute scenarios",
          "SLI/SLO candidates and error budget",
          "Compliance and recovery constraints"
        ],
        commonMistakes:
          "Saying 'fast' or 'highly available,' treating averages as tail latency, and assigning every path the same criticality.",
        exampleResponse:
          "Order submission targets 99.95% monthly availability, p95 below 800 ms and p99 below 2 seconds at peak. Acknowledged orders have RPO 0; status projections may lag 30 seconds; promotional recommendations may fail open.",
        leadConsiderations:
          "Demand a cost or business rationale for each nine of availability. Differentiate end-to-end SLOs from component targets and budget latency and reliability across dependencies."
      },
      {
        number: 5,
        id: "estimate-scale",
        name: "Estimate scale",
        questions: [
          "What are average, peak, burst, and seasonal request rates?",
          "How many active entities exist, how quickly do they grow, and how large are they?",
          "What are the read/write mix, fan-out, retention, and geographic distribution?",
          "Which assumptions dominate the answer?"
        ],
        outputs: [
          "Order-of-magnitude traffic, storage, and bandwidth model",
          "Peak and growth multipliers",
          "Sensitivity table for dominant assumptions"
        ],
        commonMistakes:
          "Using daily averages for provisioning, presenting false precision, forgetting replicas and indexes, or estimating without connecting numbers to decisions.",
        exampleResponse:
          "At 12 million orders/month, 4× holiday peak, and 30% of daily traffic in the busiest hour, peak creation is roughly 450 requests/second before retry headroom. Five years of 8 KB core order data is about 5.8 TB raw; replicas, indexes, and audit events push planning capacity above 20 TB.",
        leadConsiderations:
          "Show ranges and sensitivity, not decorative arithmetic. Revisit estimates when an architecture introduces amplification such as fan-out, retries, replication, or derived views."
      },
      {
        number: 6,
        id: "define-apis",
        name: "Define APIs and contracts",
        questions: [
          "Which resource or event contracts express the domain boundary?",
          "What are idempotency, pagination, versioning, and error semantics?",
          "Which operations are synchronous, asynchronous, or long-running?",
          "How will consumers evolve independently?"
        ],
        outputs: [
          "API and event contract sketches",
          "Compatibility and versioning rules",
          "Error, timeout, and idempotency semantics"
        ],
        commonMistakes:
          "Leaking database tables, using verbs as resources, unspecified retry behavior, and defining only successful responses.",
        exampleResponse:
          "POST /v1/orders accepts an Idempotency-Key and an immutable pricedCartVersion. It returns 201 with Location when committed, the original response for a repeated key and payload, 409 when the same key is reused with a different payload, and RFC 9457 errors for validation failures.",
        leadConsiderations:
          "Treat contracts as long-lived products. Review semantic compatibility, data classification, ownership, and deprecation before debating serialization format."
      },
      {
        number: 7,
        id: "define-data-model",
        name: "Define the data model",
        questions: [
          "What are the aggregates, identifiers, invariants, and lifecycle states?",
          "Which access patterns and joins must be efficient?",
          "Which data is authoritative, derived, cached, or externally owned?",
          "What must be retained, erased, audited, or versioned?"
        ],
        outputs: [
          "Logical entities and relationships",
          "Access-pattern-to-index map",
          "Source-of-truth and lifecycle classification"
        ],
        commonMistakes:
          "Choosing a database before modeling access patterns, sharing mutable records across domains, and treating derived data as a second source of truth.",
        exampleResponse:
          "Order is the consistency boundary; OrderLine stores a snapshot of SKU, price, and tax rather than joining mutable catalog data. Payment and fulfillment references are external IDs. A version column protects state transitions, and the event log supports audit and reconciliation.",
        leadConsiderations:
          "Make ownership explicit at field level when domains overlap. Model deletion, legal hold, schema evolution, and replay safety before data volume makes them expensive."
      },
      {
        number: 8,
        id: "high-level-architecture",
        name: "Design the high-level architecture",
        questions: [
          "What are the trust, failure, scaling, and ownership boundaries?",
          "Which components are stateful, stateless, synchronous, or asynchronous?",
          "Where do external systems enter, and where is data authoritative?",
          "What is the simplest topology that meets the quantified requirements?"
        ],
        outputs: [
          "Context and container diagrams",
          "Responsibilities and dependency directions",
          "Trust zones and critical path"
        ],
        commonMistakes:
          "Drawing a cloud-service catalog, adding a service per noun, hiding third-party dependencies, or omitting data and failure paths.",
        exampleResponse:
          "Clients enter through an API gateway to a stateless order API. PostgreSQL owns order state; a transactional outbox publishes through Kafka to inventory, payment, and notification consumers. Redis accelerates idempotency lookups but is not authoritative.",
        leadConsiderations:
          "Prefer boundaries that align change cadence, data ownership, and team accountability. Every box should have an owner, an SLO contribution, and a reason to exist."
      },
      {
        number: 9,
        id: "core-workflows",
        name: "Identify core workflows",
        questions: [
          "What happens from ingress to durable outcome on the critical path?",
          "Where are validation, authorization, state transitions, and side effects performed?",
          "Which steps can be parallel, deferred, retried, or compensated?",
          "What does the caller observe at each boundary?"
        ],
        outputs: [
          "Sequence diagrams for primary and recovery paths",
          "State-transition definitions",
          "Latency and consistency boundaries"
        ],
        commonMistakes:
          "Showing components without messages, omitting races and timeouts, or assuming a request either fully succeeds or fully fails.",
        exampleResponse:
          "The API validates the cart version, reserves the idempotency key, commits Order=PENDING plus an outbox record, then returns. The orchestrator requests inventory and payment; successful replies move the order to CONFIRMED, while expiry or permanent rejection triggers compensation.",
        leadConsiderations:
          "Walk the timeline under duplication, delay, reordering, and a crash after each state change. A recovery sequence is part of the design, not an operational footnote."
      },
      {
        number: 10,
        id: "select-storage",
        name: "Select storage technologies",
        questions: [
          "Which consistency, query, transaction, retention, and throughput properties are required?",
          "Can the current platform operate this technology reliably?",
          "What are the hot-key, partition, index, backup, and restore limits?",
          "Would one primary store plus projections be simpler than polyglot persistence?"
        ],
        outputs: [
          "Storage decision matrix",
          "Schema, partition, index, and retention plan",
          "Recovery and operational ownership plan"
        ],
        commonMistakes:
          "Selecting by popularity, assuming NoSQL means infinite scale, ignoring restore time, or introducing multiple stores without a consistency model.",
        exampleResponse:
          "PostgreSQL is the order source of truth because multi-row invariants and operational queries matter more than write scale. Object storage holds immutable exports, OpenSearch serves customer-service search, and both are asynchronously rebuilt from owned data.",
        leadConsiderations:
          "Optimize for the hardest invariant and the organization's operating capability. Record exit triggers so a provisional choice does not become permanent folklore."
      },
      {
        number: 11,
        id: "add-caching",
        name: "Add caching",
        questions: [
          "Which measured latency or load problem does a cache solve?",
          "What is the key, value, TTL, cardinality, and invalidation mechanism?",
          "How stale may data be, and what happens on a cold or failed cache?",
          "How will stampedes, hot keys, eviction, and tenant isolation be handled?"
        ],
        outputs: [
          "Cache policy and consistency contract",
          "Capacity and hit-rate hypothesis",
          "Fallback and stampede-control plan"
        ],
        commonMistakes:
          "Caching by default, calling TTL an invalidation strategy, caching authorization incorrectly, or allowing cache loss to overload the source.",
        exampleResponse:
          "Product summaries use cache-aside with versioned keys and a five-minute jittered TTL. Catalog events evict changed SKUs. Request coalescing limits misses, and the service sheds optional enrichment if Redis fails rather than multiplying database traffic.",
        leadConsiderations:
          "Define staleness in product terms and include cache-loss load in capacity tests. A cache is a distributed data copy with failure modes, not free memory."
      },
      {
        number: 12,
        id: "async-processing",
        name: "Add asynchronous processing",
        questions: [
          "Which work can complete after the user-visible response?",
          "Is the abstraction a work queue, an ordered event stream, or a durable log?",
          "What are delivery, ordering, replay, retention, and backpressure semantics?",
          "Who owns poison messages and consumer lag?"
        ],
        outputs: [
          "Command and event taxonomy",
          "Partitioning, consumer, retry, and DLQ design",
          "Lag and replay operational plan"
        ],
        commonMistakes:
          "Using events to hide tight coupling, claiming exactly-once business effects, unbounded retries, or no ownership for replay and dead letters.",
        exampleResponse:
          "OrderAccepted is an immutable fact keyed by orderId. Twelve Kafka partitions preserve per-order order while supporting parallel consumers. Consumers deduplicate by eventId, retry transient failures with bounded backoff, and route permanent schema or domain failures to an owned quarantine topic.",
        leadConsiderations:
          "Async changes the product consistency model and support model. Require event ownership, schema compatibility, lag SLOs, replay procedures, and a costed retention policy."
      },
      {
        number: 13,
        id: "handle-consistency",
        name: "Handle consistency",
        questions: [
          "Which invariants require a single atomic boundary?",
          "Where is eventual consistency acceptable, and for how long?",
          "How are concurrent writes detected or serialized?",
          "How do users and operators observe pending, stale, or conflicting state?"
        ],
        outputs: [
          "Invariant and consistency matrix",
          "Concurrency-control strategy",
          "Reconciliation and user-state semantics"
        ],
        commonMistakes:
          "Choosing consistency globally, relying on timestamps for causality, using distributed locks without fencing, or hiding pending states from clients.",
        exampleResponse:
          "Order state transitions are strongly consistent within one database transaction and protected by optimistic version checks. Inventory availability is a projection that may lag two seconds; checkout uses an authoritative reservation command and shows PENDING while the saga resolves.",
        leadConsiderations:
          "Translate consistency into business loss and user experience. Reduce the number of invariants spanning owners before reaching for consensus or distributed transactions."
      },
      {
        number: 14,
        id: "failure-scenarios",
        name: "Handle failure scenarios",
        questions: [
          "What happens when each dependency is slow, unavailable, partitioned, or returns corrupt data?",
          "Where can work be lost, duplicated, reordered, or stuck?",
          "What are timeout, retry, fallback, load-shed, and compensation policies?",
          "How is recovery tested and who makes the failover decision?"
        ],
        outputs: [
          "Failure-mode and effects analysis",
          "Timeout/retry/degradation matrix",
          "Runbooks and recovery test plan"
        ],
        commonMistakes:
          "Adding retries without budgets, treating failover as instantaneous, ignoring gray failure, and designing backup without proving restore.",
        exampleResponse:
          "A payment timeout leaves the order PAYMENT_PENDING; the orchestrator polls by stable authorization reference before retrying. Inventory reservations expire after ten minutes. Notifications fail independently. Reconciliation finds states older than the workflow SLO and repairs or escalates them.",
        leadConsiderations:
          "Use a shared retry budget and capacity model to prevent amplification. Prioritize failure exercises by blast radius, detectability, and recovery difficulty—not novelty."
      },
      {
        number: 15,
        id: "add-security",
        name: "Add security",
        questions: [
          "Who may perform each action on which resource and tenant?",
          "Where do identities, secrets, PII, payment data, and trust boundaries flow?",
          "What abuse cases, supply-chain threats, and privileged paths exist?",
          "Which controls prevent, detect, and support response?"
        ],
        outputs: [
          "Threat model and data-flow classification",
          "Authentication/authorization and encryption controls",
          "Audit, key rotation, and incident requirements"
        ],
        commonMistakes:
          "Equating authentication with authorization, trusting network location, logging sensitive payloads, or bolting security on after boundaries are fixed.",
        exampleResponse:
          "OIDC authenticates customers; the API authorizes every order by subject and tenant. Payment tokens cross a narrowly scoped PCI boundary, never the order store. Service identities use short-lived workload credentials, sensitive fields use managed keys, and privileged actions produce immutable audit events.",
        leadConsiderations:
          "Threat-model during decomposition because trust boundaries shape architecture. Assign control owners and verify that incident responders can reconstruct material actions without exposing regulated data."
      },
      {
        number: 16,
        id: "add-observability",
        name: "Add observability",
        questions: [
          "Which SLIs reveal user impact and which signals diagnose causes?",
          "Can one business transaction be correlated across sync and async boundaries?",
          "What cardinality, sampling, retention, and privacy limits apply?",
          "Which alerts are actionable and tied to an owner and runbook?"
        ],
        outputs: [
          "SLIs, SLOs, dashboards, and burn-rate alerts",
          "Logging, metrics, trace, and correlation conventions",
          "Runbooks and telemetry budget"
        ],
        commonMistakes:
          "Monitoring infrastructure instead of outcomes, alerting on every anomaly, uncontrolled metric cardinality, and losing trace context at queues.",
        exampleResponse:
          "The primary SLI is valid order submissions completed within two seconds; a second SLI measures sagas resolved within five minutes. orderId and trace context propagate in event headers, payloads are redacted, and multi-window burn-rate alerts page the order owner.",
        leadConsiderations:
          "Observability is a designed interface for operating the system. Budget telemetry cost, standardize semantic fields, and require dashboards and runbooks in the definition of done."
      },
      {
        number: 17,
        id: "identify-bottlenecks",
        name: "Identify bottlenecks",
        questions: [
          "Which resource saturates first at expected peak and at 10× scale?",
          "Where do queues, locks, hot partitions, fan-out, and external quotas accumulate?",
          "What is the overload behavior and stable maximum throughput?",
          "Which bottleneck is evidenced versus hypothetical?"
        ],
        outputs: [
          "Constraint and saturation map",
          "Load-test hypotheses and capacity thresholds",
          "Scale-up, scale-out, and load-shed triggers"
        ],
        commonMistakes:
          "Assuming stateless means infinitely scalable, optimizing CPU while a serialized dependency dominates, or testing only steady happy-path load.",
        exampleResponse:
          "The first likely limit is a hot merchant partition in the promotion store, followed by payment-provider quota. Tests will include skewed keys, retry storms, cold caches, and provider slowdown; admission control preserves checkout while optional recommendations shed load.",
        leadConsiderations:
          "Model coordinated overload, not isolated component benchmarks. Keep headroom and scaling triggers tied to measured saturation and dependency quotas."
      },
      {
        number: 18,
        id: "discuss-tradeoffs",
        name: "Discuss trade-offs",
        questions: [
          "Which options were considered against the same weighted criteria?",
          "What do we gain, lose, pay, and make harder to reverse?",
          "Which uncertainty could change the choice?",
          "What evidence or threshold should trigger a revisit?"
        ],
        outputs: [
          "Decision matrix and recommendation",
          "ADR with consequences",
          "Validation and revisit triggers"
        ],
        commonMistakes:
          "Listing generic pros and cons, presenting a favorite tool as inevitable, hiding organizational cost, or omitting the rejected alternatives.",
        exampleResponse:
          "We choose a modular monolith for the first two domains because one team owns both and transaction boundaries are still moving. Separate schemas and module APIs preserve an extraction path. We revisit when independent release cadence or measured contention exceeds the coordination cost.",
        leadConsiderations:
          "Frame decisions around business outcomes, operability, reversibility, and team capability. Record dissent and uncertainty without turning an ADR into a consensus transcript."
      },
      {
        number: 19,
        id: "future-evolution",
        name: "Plan future evolution",
        questions: [
          "What is the next credible scale, geography, product, or compliance boundary?",
          "Which seams preserve options without paying full complexity now?",
          "How will data and traffic migrate safely?",
          "What measurable triggers justify each stage?"
        ],
        outputs: [
          "MVP-to-scale evolution roadmap",
          "Migration, rollback, and compatibility strategy",
          "Trigger metrics and option-preserving seams"
        ],
        commonMistakes:
          "Building the hypothetical end state immediately, offering a roadmap without migration mechanics, or promising a rewrite as the scaling plan.",
        exampleResponse:
          "Start in one region with a PostgreSQL primary and read replica. Partition archival tables when storage reaches 5 TB; extract search from the transactional path when query load exceeds 20% of database capacity; add warm-region recovery after restore tests miss the two-hour RTO.",
        leadConsiderations:
          "Fund migrations as product work, including dual-read/write observability and rollback. Preserve options at low cost, but require evidence before exercising them."
      },
      {
        number: 20,
        id: "summarize-design",
        name: "Summarize the final design",
        questions: [
          "What are the three decisions that most shape the system?",
          "How does the design satisfy the critical requirements and invariants?",
          "What are the top risks, open questions, and validation actions?",
          "What should builders, operators, and executives each remember?"
        ],
        outputs: [
          "One-page architecture narrative",
          "Decision, risk, and action summary",
          "Audience-specific communication artifacts"
        ],
        commonMistakes:
          "Reciting every component, claiming all requirements are solved, omitting decisions still open, or giving every audience the same level of detail.",
        exampleResponse:
          "The design commits orders transactionally in PostgreSQL, publishes integration facts through an outbox, and resolves inventory/payment with an observable saga. This protects order durability and isolates optional failures. The principal risks are payment quota and reconciliation latency; load and recovery tests are release gates.",
        leadConsiderations:
          "Lead with outcomes and decisions, then evidence and consequences. Make uncertainty visible and end with named owners and dates for unresolved risk."
      }
    ],
    exercises: [
      {
        title: "Turn a slogan into a design brief",
        type: "requirements",
        prompt:
          "A sponsor asks for a 'real-time, globally available customer preference platform.' Produce a one-page clarification brief with users, journeys, quantified quality scenarios, assumptions, exclusions, and the three questions most likely to change the architecture.",
        suggestedAnswer:
          "Separate preference writes from downstream propagation; clarify regions, residency, acceptable propagation delay, conflict policy, peak writes, read locality, offline behavior, and which preferences are legally sensitive. A defensible draft might require locally served reads, p99 writes under one second, propagation within 30 seconds, regional RPO 0 for acknowledged consent, and explicit home-region ownership rather than an undefined global multi-writer promise."
      },
      {
        title: "Review an architecture under partial failure",
        type: "architecture critique",
        prompt:
          "A checkout API synchronously calls pricing, promotion, inventory, payment, order, fraud, email, and analytics services, each with three retries and a five-second timeout. Use the framework to identify the first design changes and evidence you need.",
        suggestedAnswer:
          "Quantify the user deadline and dependency latency budget, keep price validation, authoritative inventory reservation, payment, and durable order intent on a deliberately managed workflow, and remove notification/analytics from the request path. Use one bounded retry owner, idempotency keys, an order state machine, outbox-backed events, compensation and reconciliation. Load-test provider slowdown and retry amplification before selecting timeouts."
      },
      {
        title: "Design an evidence-based evolution path",
        type: "evolution",
        prompt:
          "A two-team modular monolith handles 500 requests/second. Leadership expects growth but has no forecast and requests 20 microservices and active-active regions. Propose stages and triggers.",
        suggestedAnswer:
          "Keep modules and owned schemas, establish SLOs, trace load and restore behavior, and remove measured bottlenecks first. Extract a module only when release, fault, compliance, ownership, or asymmetric scaling pressure is sustained. Add a second region after a quantified RTO, residency, or latency need and after backup/restore and single-region zone resilience are proven. Each stage includes migration, rollback, cost, and operating ownership."
      }
    ],
    quiz: [
      {
        question: "What should happen before selecting a database?",
        options: ["Choose the market leader", "Model invariants and access patterns", "Add a cache", "Estimate pod count"],
        answer: 1,
        explanation: "The hardest invariant, access patterns, consistency boundary, lifecycle, and operating capability determine an appropriate store."
      },
      {
        question: "Which is the strongest reason to make work asynchronous?",
        options: ["Events are fashionable", "The work needs burst buffering or can finish after the response", "HTTP is insecure", "The database supports JSON"],
        answer: 1,
        explanation: "Async is justified by product timing and decoupling needs, while adding delivery, ordering, lag, replay, and recovery responsibilities."
      },
      {
        question: "What makes a trade-off discussion decision-ready?",
        options: ["A long list of pros", "One expert's preference", "Options scored against shared criteria with consequences and revisit triggers", "A cloud reference diagram"],
        answer: 2,
        explanation: "Shared criteria, evidence, consequences, uncertainty, and triggers make the choice reviewable and revisitable."
      },
      {
        question: "Why model a crash after every durable side effect?",
        options: ["To estimate CPU", "To expose atomicity gaps, duplicates, and recovery states", "To choose a CSS framework", "To avoid monitoring"],
        answer: 1,
        explanation: "Partial failure between state changes is where distributed workflows lose work or repeat external effects."
      },
      {
        question: "What is the best architecture evolution trigger?",
        options: ["A hypothetical future", "A vendor announcement", "A measured threshold tied to a requirement and funded owner", "A larger diagram"],
        answer: 2,
        explanation: "A measured threshold connects added complexity to business value and ensures someone can operate the next stage."
      }
    ],
    takeaways: [
      "Begin with the business decision, critical journeys, and quantified quality scenarios; components come later.",
      "Design primary, duplicate, timeout, overload, recovery, and disaster paths as one system.",
      "Name one authority for each invariant and an explicit freshness and repair contract for every derived copy.",
      "Compare alternatives with the same criteria, including cost, organizational fit, and reversibility.",
      "Ship the smallest coherent stage and attach evidence-based triggers, migration mechanics, and owners to future complexity."
    ]
  };

  content.framework.topics = content.framework.steps;
  if (!content.modules.some((module) => module.id === content.framework.id)) {
    content.modules.push(content.framework);
  }

  content.tradeoffs = [
    {
      id: "monolith-vs-microservices",
      title: "Monolith vs microservices",
      optionA: "Modular monolith",
      optionB: "Microservices",
      criteria: [
        "Team and domain autonomy",
        "Independent scaling and deployment",
        "Transaction boundaries",
        "Operational maturity",
        "Change coupling"
      ],
      advantagesA: [
        "One deployable, call stack, and transaction boundary simplify delivery and debugging",
        "Refactoring across immature domain boundaries is inexpensive",
        "Lower platform and on-call overhead"
      ],
      advantagesB: [
        "Independent ownership, deployment, and scaling for genuinely autonomous domains",
        "Fault and technology boundaries can match different business needs",
        "Smaller release blast radius when contracts and operations are mature"
      ],
      disadvantagesA: [
        "Build, release, and runtime coupling grows without enforced modules",
        "One hot capability can force scaling the entire process",
        "A weak ownership model becomes a shared-code bottleneck"
      ],
      disadvantagesB: [
        "Network failure, eventual consistency, versioning, and distributed diagnostics become routine",
        "Platform, security, and on-call cost multiply",
        "Poor boundaries produce a distributed monolith"
      ],
      operationalComplexity:
        "A modular monolith needs disciplined module boundaries and one production playbook. Microservices need service discovery, contract governance, deployment automation, distributed tracing, per-service SLOs, and coordinated incident response.",
      costImplications:
        "A monolith usually has lower fixed cost and better resource density. Microservices can reduce marginal cost for uneven scaling, but add clusters, pipelines, telemetry, network traffic, and cognitive load.",
      useCasesA: [
        "One or a few teams with changing domain boundaries",
        "Transactional workflows and early product discovery",
        "Systems whose components share similar scaling and availability needs"
      ],
      useCasesB: [
        "Stable bounded contexts owned by independent teams",
        "Components with materially different scale, security, or release cadence",
        "Organizations with strong platform and SRE capabilities"
      ],
      guidance:
        "Default to a well-modularized deployable until independent release, scale, fault, or compliance requirements exceed the coordination cost. Extract along proven data and ownership boundaries, not nouns on a diagram.",
      antiPatterns: [
        "A service per table or endpoint",
        "Shared database writes across services",
        "A monolith with no dependency rules",
        "Choosing microservices to avoid internal modularity"
      ],
      decisionSignals: [
        "Prefer the monolith when boundary churn and cross-domain transactions dominate",
        "Prefer services when teams can own data and operations end to end",
        "Extract when measured deployment or scaling contention pays for distribution"
      ]
    },
    {
      id: "rest-vs-graphql-vs-grpc",
      title: "REST vs GraphQL vs gRPC",
      options: ["REST", "GraphQL", "gRPC"],
      optionA: "REST",
      optionB: "GraphQL / gRPC",
      criteria: [
        "Client diversity and query flexibility",
        "Latency and payload efficiency",
        "Caching and observability",
        "Schema and tooling maturity",
        "Browser and partner interoperability"
      ],
      advantagesA: [
        "Broad HTTP support, visible resource semantics, and straightforward gateway caching",
        "Good fit for public APIs and coarse business operations",
        "Operational behavior is familiar across teams and vendors"
      ],
      advantagesB: [
        "GraphQL lets product clients select and compose graph-shaped data through a typed schema",
        "gRPC provides compact contracts, streaming, deadlines, and generated clients for service-to-service calls",
        "Both make schema contracts central to tooling"
      ],
      disadvantagesA: [
        "Multiple round trips or endpoint proliferation for highly variable views",
        "JSON and generic HTTP conventions are less efficient for high-rate internal calls",
        "Loose specifications can drift without contract governance"
      ],
      disadvantagesB: [
        "GraphQL introduces resolver fan-out, field-level authorization, query-cost, and cache complexity",
        "gRPC has weaker direct browser and external-partner ergonomics and needs compatible proxies",
        "Generated clients and schema evolution require disciplined ownership"
      ],
      operationalComplexity:
        "REST relies on endpoint/version governance. GraphQL needs query limits, persisted operations, resolver tracing, and federation ownership when used. gRPC needs protobuf compatibility, deadline propagation, reflection or tooling, and HTTP/2-aware infrastructure.",
      costImplications:
        "REST often minimizes platform cost. GraphQL may cut client requests but can amplify backend work. gRPC can reduce bandwidth and CPU at high volume while adding contract and edge translation infrastructure.",
      useCasesA: [
        "Public resource and action APIs",
        "HTTP cacheable reads and conventional CRUD-style operations",
        "Partner integrations requiring ubiquitous tooling"
      ],
      useCasesB: [
        "GraphQL for multi-client product views with variable nested data",
        "gRPC for controlled low-latency internal calls and streaming",
        "Typed ecosystems with strong schema governance"
      ],
      guidance:
        "Choose per boundary: REST is the safe external default, GraphQL is a client-facing aggregation product, and gRPC is an efficient internal RPC protocol. Do not force one protocol across every edge.",
      antiPatterns: [
        "GraphQL as a transparent database query interface",
        "Chatty REST pretending local calls have no cost",
        "gRPC without deadlines or compatibility rules",
        "Exposing internal protobuf models as public domain contracts"
      ],
      decisionSignals: [
        "Variable client data shapes favor GraphQL",
        "High-rate controlled internal calls favor gRPC",
        "Long-lived public interoperability and HTTP caching favor REST"
      ]
    },
    {
      id: "sync-vs-async",
      title: "Synchronous vs asynchronous communication",
      optionA: "Synchronous",
      optionB: "Asynchronous",
      criteria: [
        "Required response immediacy",
        "Temporal coupling",
        "Delivery and ordering semantics",
        "Workflow duration",
        "Failure recovery and user experience"
      ],
      advantagesA: [
        "Immediate result with a simple request-response mental model",
        "Errors and validation can be returned directly",
        "Natural for queries and short commands that need a definitive answer"
      ],
      advantagesB: [
        "Buffers bursts and decouples producer availability from consumer availability",
        "Supports fan-out, long-running work, replay, and independent consumption",
        "Moves optional work off critical latency paths"
      ],
      disadvantagesA: [
        "Availability and tail latency multiply across dependency chains",
        "Retries can amplify load and duplicate side effects",
        "Long call chains couple releases and capacity"
      ],
      disadvantagesB: [
        "Users observe pending and eventual states",
        "Duplicates, ordering, backpressure, poison messages, and replay must be designed",
        "Diagnosis crosses time and process boundaries"
      ],
      operationalComplexity:
        "Synchronous systems need strict timeout, retry, circuit-breaker, and dependency SLO policies. Asynchronous systems need brokers, lag monitoring, schema governance, replay controls, DLQ ownership, and reconciliation.",
      costImplications:
        "Synchronous calls avoid broker cost but can overprovision for bursts. Asynchronous buffering improves utilization yet adds broker storage, network, consumers, and operational labor.",
      useCasesA: [
        "Interactive validation and reads",
        "Commands whose result gates the next user action",
        "Small bounded workflows with reliable dependencies"
      ],
      useCasesB: [
        "Notifications, indexing, analytics, and integration events",
        "Long-running or bursty workflows",
        "Fan-out to independently owned consumers"
      ],
      guidance:
        "Keep only the minimum user-decision path synchronous. Make acceptance versus completion explicit, and use durable async handoff for work whose delay is acceptable.",
      antiPatterns: [
        "Fire-and-forget network calls",
        "Unbounded synchronous call chains",
        "Events that are disguised RPC commands with one consumer",
        "Returning success before work is durably accepted"
      ],
      decisionSignals: [
        "A caller needing an immediate authoritative result favors sync",
        "Burst absorption, fan-out, or long duration favors async",
        "Mixed workflows often commit intent synchronously and complete asynchronously"
      ]
    },
    {
      id: "kafka-vs-message-queues",
      title: "Kafka vs traditional message queues",
      optionA: "Kafka-style event log",
      optionB: "Traditional message queue",
      criteria: [
        "Replay and retention",
        "Consumption model",
        "Ordering scope",
        "Routing and per-message control",
        "Throughput and operational fit"
      ],
      advantagesA: [
        "Retained ordered partitions let independent consumer groups replay at their own pace",
        "High sequential throughput and durable event history",
        "Strong fit for event integration, CDC, and streaming pipelines"
      ],
      advantagesB: [
        "Natural competing-consumer work distribution and acknowledgment",
        "Flexible routing, delay, priority, and per-message dead-letter patterns in many brokers",
        "Simple semantics for commands that should be handled once by one worker"
      ],
      disadvantagesA: [
        "Partition keys constrain ordering and parallelism",
        "Consumer offset, retention, compaction, and reprocessing require expertise",
        "Per-message priority and complex routing are not its core model"
      ],
      disadvantagesB: [
        "Consumed messages are commonly removed, limiting independent replay",
        "Adding consumers can change work distribution rather than create a new view",
        "Large retained histories and stream joins are awkward"
      ],
      operationalComplexity:
        "Kafka requires partition planning, broker capacity, lag and rebalance management, schema compatibility, and replay controls. Queues require visibility/ack timeout tuning, routing topology, redrive policy, and poison-message operations.",
      costImplications:
        "Kafka pays for replicated retained storage and steady cluster capacity but amortizes high throughput. Managed queues price requests and transfer simply at moderate scale; large payload or request volume can become expensive.",
      useCasesA: [
        "Domain events consumed by multiple teams",
        "CDC, audit streams, analytics, and state projections",
        "High-throughput ordered processing by key"
      ],
      useCasesB: [
        "Background jobs and commands",
        "Task dispatch with retry, delay, or priority",
        "One-of-N worker consumption"
      ],
      guidance:
        "Choose a log when durable history and independent replay are requirements; choose a queue when the message represents work to be claimed. Many platforms need both, with an explicit bridge rather than semantic ambiguity.",
      antiPatterns: [
        "Kafka as a generic task scheduler",
        "A queue used as the only audit history",
        "One partition for global order without throughput analysis",
        "Infinite retry blocking a partition or queue"
      ],
      decisionSignals: [
        "Multiple independent views and replay favor Kafka",
        "Per-task ownership, delay, and priority favor queues",
        "Select based on semantics before benchmark throughput"
      ]
    },
    {
      id: "sql-vs-nosql",
      title: "SQL vs NoSQL",
      optionA: "Relational SQL",
      optionB: "NoSQL family",
      criteria: [
        "Transaction and consistency boundaries",
        "Access-pattern stability",
        "Relationship and query complexity",
        "Scale and partition model",
        "Schema evolution and operability"
      ],
      advantagesA: [
        "Declarative joins, constraints, mature transactions, and flexible querying",
        "Strong fit for interrelated data and business invariants",
        "Broad tooling for migration, backup, analytics, and operations"
      ],
      advantagesB: [
        "Purpose-built models for key-value, document, graph, column-family, or time-series access",
        "Some products provide predictable horizontal scale and geographic distribution",
        "Aggregate-shaped storage can reduce joins on known paths"
      ],
      disadvantagesA: [
        "Write scaling and global distribution require deliberate partitioning or specialized products",
        "Poor schemas and unbounded joins still fail at scale",
        "Rigid coordination can slow very high-volume append workloads"
      ],
      disadvantagesB: [
        "Cross-aggregate joins, transactions, and ad hoc queries may move into application code",
        "Denormalized copies require repair and evolution strategies",
        "The label hides databases with very different guarantees"
      ],
      operationalComplexity:
        "Relational operations center on indexes, vacuum/maintenance, replicas, connection limits, and migrations. NoSQL operations depend on the chosen model: partition heat, capacity modes, compaction, secondary-index limits, and consistency tuning are common concerns.",
      costImplications:
        "SQL often consolidates workloads efficiently until sharding complexity appears. Managed NoSQL can align cost with access volume, but denormalization, indexes, scans, and cross-region replication create amplification.",
      useCasesA: [
        "Orders, payments, ledgers, and administrative systems",
        "Evolving queries over related entities",
        "Workflows needing multi-row integrity"
      ],
      useCasesB: [
        "High-scale key lookups, flexible documents, relationship traversal, metrics, or wide-column workloads",
        "Stable access patterns with deliberate denormalization",
        "Globally distributed data where a chosen product's model matches requirements"
      ],
      guidance:
        "Start from invariants and access patterns, then select a specific database—not a category. Relational is a strong default; add a purpose-built store only where its benefit exceeds consistency and operational cost.",
      antiPatterns: [
        "NoSQL because the schema may change",
        "SQL without indexes or query budgets",
        "One database technology for every workload",
        "Dual writes to keep stores aligned"
      ],
      decisionSignals: [
        "Cross-entity invariants and evolving queries favor SQL",
        "Stable aggregate access and extreme partitioned scale may favor a specific NoSQL store",
        "Prefer projections over multiple authoritative stores"
      ]
    },
    {
      id: "cache-strategies",
      title: "Cache-aside vs write-through vs write-behind",
      options: ["Cache-aside", "Write-through", "Write-behind"],
      optionA: "Cache-aside",
      optionB: "Write-through / write-behind",
      criteria: [
        "Read and write ratio",
        "Allowed staleness and loss",
        "Write latency",
        "Invalidation authority",
        "Failure and recovery semantics"
      ],
      advantagesA: [
        "Application controls what is cached and source-of-truth writes stay direct",
        "Only requested data occupies the cache",
        "Cache failure can fall back to the authoritative store"
      ],
      advantagesB: [
        "Write-through keeps cache populated and aligns successful writes with the backing store",
        "Write-behind absorbs write bursts and lowers foreground write latency",
        "Centralized cache policy can simplify callers"
      ],
      disadvantagesA: [
        "Misses add latency and simultaneous misses can stampede",
        "Invalidation races can reinsert stale values",
        "First reads and cold starts load the source"
      ],
      disadvantagesB: [
        "Write-through adds cache latency and may cache unread data",
        "Write-behind risks data loss, reordering, and complex conflict recovery",
        "The cache becomes a critical write-path dependency"
      ],
      operationalComplexity:
        "Cache-aside needs TTL/invalidation, coalescing, and source protection. Write-through needs atomic or ordered cache/store handling. Write-behind needs a durable queue, drain monitoring, deduplication, replay, and explicit durability semantics.",
      costImplications:
        "Cache-aside uses memory efficiently but can spike source cost on misses. Write-through spends memory on all writes. Write-behind can batch backing-store work but requires durable buffering and larger recovery capacity.",
      useCasesA: [
        "Read-heavy product, profile, and configuration data",
        "Data where bounded staleness is acceptable",
        "Systems whose database remains authoritative"
      ],
      useCasesB: [
        "Write-through for frequently reread values requiring immediate cache population",
        "Write-behind for loss-tolerant counters, telemetry, or durable-buffered aggregates",
        "Platforms with centralized cache ownership"
      ],
      guidance:
        "Cache-aside is the conservative default. Use write-through when consistent cache population justifies write-path coupling; use write-behind only when delayed durability is explicitly acceptable or protected by a durable log.",
      antiPatterns: [
        "TTL presented as a correctness mechanism",
        "Write-behind for money or inventory without durable recovery",
        "Unversioned delete-then-fill races",
        "No capacity test for total cache loss"
      ],
      decisionSignals: [
        "Sparse hot reads favor cache-aside",
        "Immediate read-after-write cache hits may favor write-through",
        "Burst smoothing with acceptable delayed persistence may favor write-behind"
      ]
    },
    {
      id: "strong-vs-eventual-consistency",
      title: "Strong vs eventual consistency",
      optionA: "Strong consistency",
      optionB: "Eventual consistency",
      criteria: [
        "Business invariants and loss exposure",
        "Latency and availability under partition",
        "Geographic distribution",
        "Conflict behavior",
        "User-visible staleness"
      ],
      advantagesA: [
        "Clients reason over one current order of committed state",
        "Simplifies invariant enforcement and conflict detection",
        "Reduces compensating business logic for critical records"
      ],
      advantagesB: [
        "Allows replicas and services to progress with weaker coordination",
        "Supports low-latency local reads and high availability for many workloads",
        "Fits projections, feeds, analytics, and asynchronously derived views"
      ],
      disadvantagesA: [
        "Coordination adds latency and may reduce availability during partitions",
        "Global consensus is expensive and physically constrained",
        "Broad transaction boundaries increase contention"
      ],
      disadvantagesB: [
        "Stale reads, conflicts, and temporary invariant violations become product states",
        "Reconciliation and support tooling are required",
        "Users may observe non-monotonic or surprising results without session guarantees"
      ],
      operationalComplexity:
        "Strong systems need quorum/leader health, contention analysis, and clear failover semantics. Eventual systems need lag SLIs, conflict policy, versioning, reconciliation, and visibility of pending or stale state.",
      costImplications:
        "Strong cross-region writes pay coordination latency and replication cost. Eventual designs can use local capacity efficiently but shift cost into duplicate storage, repair, support, and business compensation.",
      useCasesA: [
        "Ledger postings, unique allocations, inventory reservations, and access-control changes",
        "State transitions where conflicting acceptance creates material loss",
        "Small consistency boundaries"
      ],
      useCasesB: [
        "Search indexes, recommendations, feeds, analytics, and catalog projections",
        "Geo-distributed reads tolerant of bounded staleness",
        "Derived state recoverable from an authority"
      ],
      guidance:
        "Choose consistency per invariant, operation, and view. Keep authoritative transitions strongly consistent where loss demands it; publish asynchronously to tolerant projections and communicate their freshness.",
      antiPatterns: [
        "One consistency label for the entire system",
        "Eventual consistency without a convergence mechanism",
        "Global locks for convenience",
        "Strong reads from a cache that is not authoritative"
      ],
      decisionSignals: [
        "Irreversible acceptance and uniqueness favor strong consistency",
        "Recoverable derived views favor eventual consistency",
        "Quantify staleness and conflict cost before choosing"
      ]
    },
    {
      id: "orchestration-vs-choreography",
      title: "Orchestration vs choreography",
      optionA: "Orchestration",
      optionB: "Choreography",
      criteria: [
        "Workflow visibility and control",
        "Participant autonomy",
        "Change frequency",
        "Compensation complexity",
        "Audit and timeout requirements"
      ],
      advantagesA: [
        "One workflow owner makes state, timeout, compensation, and progress visible",
        "Complex branches and long-running recovery are explicit",
        "Business operations can expose a coherent status"
      ],
      advantagesB: [
        "Producers publish facts without a central workflow service knowing every consumer",
        "Simple reactions and fan-out preserve local autonomy",
        "New consumers can subscribe without changing the producer"
      ],
      disadvantagesA: [
        "The orchestrator can accumulate domain logic and coupling",
        "Availability and ownership of the coordinator matter",
        "Poorly designed workflows become centralized distributed monoliths"
      ],
      disadvantagesB: [
        "End-to-end state and causal chains are difficult to see",
        "Cycles, event storms, and accidental coupling emerge",
        "Compensation and global timeout ownership become ambiguous"
      ],
      operationalComplexity:
        "Orchestration needs durable workflow state, timers, versioned definitions, and recovery tooling. Choreography needs event lineage, schema governance, cycle detection, consumer discovery, and end-to-end correlation.",
      costImplications:
        "Orchestration adds workflow infrastructure but can reduce incident investigation and reconciliation effort. Choreography lowers central platform coupling for simple flows but complex interactions raise telemetry and coordination cost.",
      useCasesA: [
        "Checkout, order fulfillment, returns, and onboarding sagas",
        "Workflows with deadlines, compensation, or human steps",
        "Regulated processes needing one audit narrative"
      ],
      useCasesB: [
        "Independent reactions to stable domain facts",
        "Notifications, projections, analytics, and cache invalidation",
        "Open-ended fan-out with no global completion condition"
      ],
      guidance:
        "Orchestrate business processes that have a lifecycle owner; choreograph independent consequences of domain facts. Hybrid designs commonly orchestrate the critical saga and broadcast facts to optional consumers.",
      antiPatterns: [
        "A god orchestrator owning participant internals",
        "Circular event chains",
        "Commands mislabeled as facts",
        "No owner for saga timeout or compensation"
      ],
      decisionSignals: [
        "A global completion state or deadline favors orchestration",
        "Independent optional reactions favor choreography",
        "Complex compensation should have an explicit owner"
      ]
    },
    {
      id: "batch-vs-streaming",
      title: "Batch vs streaming",
      optionA: "Batch",
      optionB: "Streaming",
      criteria: [
        "Freshness requirement",
        "Data volume and arrival shape",
        "State and event-time semantics",
        "Reprocessing needs",
        "Operational maturity"
      ],
      advantagesA: [
        "Finite inputs, repeatable snapshots, and straightforward reconciliation",
        "Efficient bulk I/O and simpler backfills",
        "Lower always-on operational burden"
      ],
      advantagesB: [
        "Low-latency incremental results and continuous reactions",
        "Naturally processes append-only event flows",
        "Can smooth work and avoid full recomputation"
      ],
      disadvantagesA: [
        "Results are stale until the next run",
        "Large windows create resource spikes and long recovery times",
        "Late failure may repeat substantial work"
      ],
      disadvantagesB: [
        "Event time, watermarks, late data, state stores, and replay add complexity",
        "Always-on operations and schema compatibility are required",
        "Corrections can be difficult without a retained source log"
      ],
      operationalComplexity:
        "Batch needs scheduling, checkpointing, dependency and backfill management. Streaming needs lag, partition, watermark, state, replay, and exactly-once-or-idempotent processing controls.",
      costImplications:
        "Batch can exploit transient bulk compute but may repeatedly scan data. Streaming pays for continuously provisioned processors and retained logs while reducing recomputation and freshness delay.",
      useCasesA: [
        "Daily finance close, archival, large backfills, and periodic model training",
        "Workloads with hourly or daily freshness",
        "Snapshot-based reconciliation"
      ],
      useCasesB: [
        "Fraud signals, inventory projections, telemetry, and near-real-time personalization",
        "Continuous CDC and operational alerts",
        "Incremental aggregates with seconds-to-minutes freshness"
      ],
      guidance:
        "Let the business freshness budget decide. Prefer batch when its latency is acceptable; stream only the paths whose value exceeds the added state and operational complexity, while retaining a backfill path.",
      antiPatterns: [
        "Streaming because data arrives continuously",
        "A batch job whose runtime exceeds its interval",
        "No replayable source or backfill method",
        "Confusing processing time with event time"
      ],
      decisionSignals: [
        "Freshness measured in hours favors batch",
        "Actionable seconds-to-minutes signals favor streaming",
        "Correctable systems often combine streaming with batch reconciliation"
      ]
    },
    {
      id: "serverless-vs-containers",
      title: "Serverless vs containers",
      optionA: "Serverless functions",
      optionB: "Containers",
      criteria: [
        "Traffic shape and execution duration",
        "Runtime and network control",
        "Startup latency",
        "Portability and platform ownership",
        "Unit economics"
      ],
      advantagesA: [
        "Fine-grained managed scaling and pay-per-use for intermittent work",
        "Little host or cluster management",
        "Strong event integrations and rapid deployment of bounded handlers"
      ],
      advantagesB: [
        "Predictable runtime, process, networking, and resource control",
        "Suitable for steady traffic, long-lived services, streaming, and custom dependencies",
        "Portable packaging across managed container and Kubernetes platforms"
      ],
      disadvantagesA: [
        "Cold starts, duration/concurrency limits, vendor integration, and constrained execution models",
        "Connection storms and per-invocation costs at sustained load",
        "Distributed functions can fragment ownership and observability"
      ],
      disadvantagesB: [
        "Teams or a platform must manage images, scheduling, patching, capacity, and scaling",
        "Idle capacity and slow scaling can waste resources",
        "Kubernetes in particular has significant control-plane and skills overhead"
      ],
      operationalComplexity:
        "Serverless shifts infrastructure work to quotas, IAM, concurrency, event retries, and provider diagnostics. Containers require image supply-chain security, orchestration, autoscaling, networking, probes, and cluster or service operations.",
      costImplications:
        "Serverless is attractive for low-duty-cycle or bursty work; sustained high volume can cost more per compute unit. Containers improve steady-load utilization but include idle headroom and platform labor.",
      useCasesA: [
        "Event handlers, schedulers, sporadic APIs, and lightweight data transforms",
        "Teams wanting managed scale within platform constraints",
        "Bursty workloads with short execution"
      ],
      useCasesB: [
        "Steady APIs, Kafka consumers, custom runtimes, and long-lived connections",
        "Workloads needing resource or networking control",
        "Organizations with a capable container platform"
      ],
      guidance:
        "Choose from traffic shape, runtime constraints, and total ownership cost. Managed container services are often a useful middle ground; Kubernetes is an organizational platform decision, not an application library.",
      antiPatterns: [
        "A function per code method",
        "Kubernetes for one simple service",
        "Serverless with uncontrolled fan-out or database connections",
        "Ignoring platform engineering labor in cost comparisons"
      ],
      decisionSignals: [
        "Bursty short events favor serverless",
        "Steady, long-running, or streaming processes favor containers",
        "Specialized runtime/network needs favor containers"
      ]
    },
    {
      id: "single-vs-multi-region",
      title: "Single-region vs multi-region",
      optionA: "Single-region",
      optionB: "Multi-region",
      criteria: [
        "RTO and RPO",
        "User geography and latency",
        "Residency and sovereignty",
        "Write consistency",
        "Operational readiness"
      ],
      advantagesA: [
        "Simple consistency, networking, deployment, and incident response",
        "Lower data-transfer and duplicate-capacity cost",
        "Easier capacity, security, and compliance reasoning"
      ],
      advantagesB: [
        "Regional latency, residency, and resilience options",
        "A regional failure need not be a total outage",
        "Capacity can be placed near users and partners"
      ],
      disadvantagesA: [
        "A regional outage can breach recovery targets",
        "Distant users pay network latency",
        "Residency requirements may be impossible"
      ],
      disadvantagesB: [
        "Replication lag, split brain, routing, failover, and data ownership become hard problems",
        "Testing and operating every region multiplies work",
        "Cross-region writes are latency-bound and expensive"
      ],
      operationalComplexity:
        "Single-region needs tested backup/restore and zone failure handling. Multi-region adds global routing, replication monitoring, failover authority, regional capacity, configuration parity, data-residency controls, and game days.",
      costImplications:
        "Single-region minimizes fixed and transfer cost. Multi-region duplicates compute and state, incurs replication/egress charges, and demands more operations; passive capacity still must be kept deployable and tested.",
      useCasesA: [
        "Most regional products with achievable backup-based recovery",
        "Early stages and systems without residency constraints",
        "Strong write consistency centered in one geography"
      ],
      useCasesB: [
        "Global latency-sensitive products",
        "Strict regional-resilience or residency obligations",
        "Businesses whose outage loss justifies duplicate capacity"
      ],
      guidance:
        "Start multi-zone in one region and prove restore and failover. Add regions only for quantified latency, residency, or business-continuity requirements, with an explicit authority and conflict model.",
      antiPatterns: [
        "Multi-region as a checkbox",
        "DNS failover without data readiness",
        "A passive region never exercised at production scale",
        "Active writes without conflict ownership"
      ],
      decisionSignals: [
        "If tested single-region recovery meets RTO/RPO, prefer it",
        "Residency or regional-outage tolerance can require multiple regions",
        "Fund ongoing failover tests before claiming resilience"
      ]
    },
    {
      id: "active-active-vs-active-passive",
      title: "Active-active vs active-passive",
      optionA: "Active-active",
      optionB: "Active-passive",
      criteria: [
        "Failover time",
        "Write conflict model",
        "Capacity utilization",
        "Operational symmetry",
        "Data locality"
      ],
      advantagesA: [
        "All sites serve traffic, reducing idle capacity and improving local latency",
        "Failure can be absorbed through routing when remaining capacity is sufficient",
        "Continuous use exposes regional drift sooner"
      ],
      advantagesB: [
        "One writer or active site simplifies consistency and conflict handling",
        "Failure domains and recovery authority are clearer",
        "Lower coordination complexity for stateful systems"
      ],
      disadvantagesA: [
        "Concurrent writes, replication lag, conflict resolution, and split brain are unavoidable design topics",
        "A shared dependency can defeat regional independence",
        "Both sides need headroom for shifted traffic"
      ],
      disadvantagesB: [
        "Failover includes detection, promotion, routing, and cache warmup delay",
        "Passive environments drift when not exercised",
        "Reserved standby capacity may sit underused"
      ],
      operationalComplexity:
        "Active-active needs deterministic ownership or conflict policy, global traffic management, cell isolation, and continuous replication health. Active-passive needs promotion fencing, data-loss checks, capacity warmup, DNS/routing procedures, and regular failover drills.",
      costImplications:
        "Both require duplicate regional infrastructure. Active-active uses capacity but retains failover headroom; active-passive may use cheaper warm standby but pays idle capacity and periodic full-scale testing.",
      useCasesA: [
        "Read-heavy global products with region-owned writes",
        "Partitionable tenants or users with deterministic home regions",
        "Services tolerant of conflict-aware data models"
      ],
      useCasesB: [
        "Transactional systems requiring one write authority",
        "Disaster recovery with minutes-to-hours RTO",
        "Teams without mature multi-writer operations"
      ],
      guidance:
        "Prefer active-passive for stateful authority unless the business needs local active writes and the domain has a credible ownership or conflict model. Active-active application servers over a single-region database are not active-active resilience.",
      antiPatterns: [
        "Last-write-wins for financial or inventory invariants",
        "No fencing after passive promotion",
        "Routing traffic to a region whose data is behind",
        "Counting shared control planes as independent"
      ],
      decisionSignals: [
        "Single-writer invariants favor active-passive",
        "Region-owned aggregates can make active-active tractable",
        "RTO shorter than safe promotion may justify active-active investment"
      ]
    },
    {
      id: "shared-db-vs-db-per-service",
      title: "Shared database vs database per service",
      optionA: "Shared database",
      optionB: "Database per service",
      criteria: [
        "Data ownership",
        "Cross-domain transactions and queries",
        "Deployment autonomy",
        "Governance and platform capability",
        "Migration cost"
      ],
      advantagesA: [
        "Simple joins, reporting, transactions, and shared operational tooling",
        "Lower fixed infrastructure cost",
        "Practical for modules under one lifecycle and owner"
      ],
      advantagesB: [
        "Schema and storage lifecycle belong to one service",
        "Independent deployment, scaling, retention, and technology choices",
        "Failures and migrations can be isolated by domain"
      ],
      disadvantagesA: [
        "Any consumer can bypass contracts and couple to schemas",
        "Migration, load, and incident blast radius are shared",
        "Ownership and authorization become ambiguous"
      ],
      disadvantagesB: [
        "Cross-domain joins move to APIs, events, or analytical stores",
        "Atomic changes across services need workflow patterns",
        "More databases increase backup, patch, cost, and expertise needs"
      ],
      operationalComplexity:
        "A shared database needs strict schema ownership, grants, workload isolation, and migration coordination. Per-service databases need fleet automation, discovery, backup policy, CDC/event integration, and cross-domain reporting architecture.",
      costImplications:
        "Shared clusters consolidate idle capacity but create noisy-neighbor risk. Per-service stores add minimum instance, license, telemetry, and administration costs; managed/serverless tiers may reduce the floor.",
      useCasesA: [
        "Modules owned and released together",
        "Transactional workflows inside one bounded context",
        "Small teams with limited data-platform capacity"
      ],
      useCasesB: [
        "Independently owned bounded contexts",
        "Services with different scale, retention, or compliance needs",
        "Organizations with automated database operations"
      ],
      guidance:
        "Data ownership matters more than physical servers. A shared engine can host owner-isolated schemas; independent services should never write one another's tables. Split physically when autonomy or isolation justifies fleet cost.",
      antiPatterns: [
        "Cross-service foreign keys and direct writes",
        "One database per tiny service by policy",
        "Reporting queries on production authorities",
        "Dual writes during extraction without reconciliation"
      ],
      decisionSignals: [
        "One owner and transaction boundary can share storage",
        "Independent lifecycle and compliance favor isolated databases",
        "Enforce logical ownership before physical decomposition"
      ]
    },
    {
      id: "event-sourcing-vs-crud",
      title: "Event sourcing vs CRUD",
      optionA: "Event sourcing",
      optionB: "State-oriented CRUD",
      criteria: [
        "Audit and temporal requirements",
        "Domain behavior complexity",
        "Projection and replay needs",
        "Schema evolution",
        "Team expertise"
      ],
      advantagesA: [
        "Immutable domain decisions preserve history and enable temporal reconstruction",
        "Multiple projections can be built and rebuilt from authoritative events",
        "Optimistic concurrency maps naturally to aggregate versions"
      ],
      advantagesB: [
        "Current state is direct to query, update, back up, and reason about",
        "Mature relational patterns and tools support most business systems",
        "Lower cognitive and operational overhead"
      ],
      disadvantagesA: [
        "Event versioning, upcasting, projection lag, replay side effects, and debugging require discipline",
        "Cross-aggregate queries require projections",
        "Deleting regulated data from immutable history is difficult"
      ],
      disadvantagesB: [
        "History requires explicit audit modeling",
        "Reconstructing why state changed may be impossible",
        "Many downstream views can pressure the transaction model"
      ],
      operationalComplexity:
        "Event sourcing needs an event store, snapshot policy, projection fleet, replay controls, schema evolution, and side-effect isolation. CRUD needs migrations, indexes, audit strategy, CDC where necessary, and standard backup/restore.",
      costImplications:
        "Event sourcing stores history and multiple projections and raises engineering/support cost. CRUD stores compact current state and is usually cheaper; separate audit or analytics pipelines add targeted cost.",
      useCasesA: [
        "Domains where decisions and temporal reconstruction are core, such as ledgers or complex workflows",
        "Systems needing several independently rebuildable projections",
        "Aggregates with explicit command semantics"
      ],
      useCasesB: [
        "Most catalogs, profiles, configuration, and administrative systems",
        "Domains centered on current state",
        "Teams prioritizing direct operability"
      ],
      guidance:
        "CRUD is the default. Use event sourcing for a bounded domain where immutable decision history is a business capability, not merely because events are used for integration. An outbox can publish events without event-sourcing the authority.",
      antiPatterns: [
        "Event sourcing every entity",
        "Treating integration events as the domain event store",
        "Replaying external side effects",
        "Mutable or meaning-changing historical events"
      ],
      decisionSignals: [
        "Business value from temporal reconstruction favors event sourcing",
        "Simple current-state needs favor CRUD",
        "Audit alone may be satisfied by append-only audit records"
      ]
    },
    {
      id: "build-vs-buy",
      title: "Build vs buy",
      optionA: "Build",
      optionB: "Buy or managed service",
      criteria: [
        "Strategic differentiation",
        "Required control and integration",
        "Time to value",
        "Total ownership cost",
        "Vendor and exit risk"
      ],
      advantagesA: [
        "Exact domain fit and roadmap control",
        "Deep integration and ownership of data and behavior",
        "Can create differentiated capability when it is core to the business"
      ],
      advantagesB: [
        "Faster delivery of commodity capability and access to specialist expertise",
        "Vendor absorbs portions of compliance, availability, patches, and scale",
        "Cost and support may be predictable at moderate scope"
      ],
      disadvantagesA: [
        "Engineering, security, compliance, documentation, on-call, and maintenance persist for the product lifetime",
        "Opportunity cost competes with customer-facing differentiation",
        "Internal platforms can become unsupported products"
      ],
      disadvantagesB: [
        "Roadmap, price, quota, outage, data location, and contract dependency",
        "Customization can create brittle integration",
        "Migration may be expensive because APIs and data models are proprietary"
      ],
      operationalComplexity:
        "Build requires a funded product owner, reliability model, security response, upgrades, and support. Buy requires vendor due diligence, contract/SLA management, integration monitoring, quota planning, data export, and contingency procedures.",
      costImplications:
        "Compare five-year total cost: labor, platform, support, compliance, incidents, migration, and opportunity cost—not license versus compute. Model vendor price at expected peak and growth tiers.",
      useCasesA: [
        "Capabilities that materially differentiate the product",
        "Unique regulatory, latency, or integration requirements vendors cannot meet",
        "Stable long-term demand with funded ownership"
      ],
      useCasesB: [
        "Commodity identity, payments, email, observability, and infrastructure capabilities",
        "Urgent delivery with standard requirements",
        "Domains where external expertise lowers risk"
      ],
      guidance:
        "Buy commodity capabilities unless a quantified gap affects strategic outcomes. Wrap vendor-specific contracts behind a domain boundary, validate data export, and fund an exit only in proportion to credible risk.",
      antiPatterns: [
        "Building to avoid procurement",
        "Buying before validating quotas and data portability",
        "A universal abstraction over several hypothetical vendors",
        "Ignoring internal support and compliance labor"
      ],
      decisionSignals: [
        "Strategic differentiation and unique constraints favor build",
        "Commodity needs and time-to-value favor buy",
        "High switching cost requires contractual and technical exit controls"
      ]
    }
  ];

  content.leadership = {
    id: "lead-engineer-perspective",
    title: "Architecture as technical leadership",
    summary:
      "A lead engineer makes decisions legible, reversible where possible, and connected to business and operating reality. The work is as much structured inquiry and ownership design as technology selection.",
    principles: [
      {
        id: "lead-discussions",
        title: "Lead architecture discussions",
        guidance:
          "Open with the decision, constraints, and evidence required—not a blank canvas. Time-box context, options, challenge, and commitment; close with a decision owner and unresolved actions.",
        practices: [
          "Send a one-page pre-read containing the problem, quantified requirements, assumptions, and candidate options",
          "Use a visible decision log and parking lot so tangents do not consume the meeting",
          "Invite the quietest domain and operations voices before senior opinions anchor the room",
          "Distinguish consultation, consent, and the accountable decision maker"
        ],
        warningSigns: [
          "The meeting debates tools before agreeing on criteria",
          "The same decision recurs because no owner or record exists",
          "Consensus is treated as mandatory even when trade-offs are irreducible"
        ]
      },
      {
        id: "challenge-assumptions",
        title: "Challenge assumptions with evidence",
        guidance:
          "Turn hidden certainty into named, testable hypotheses. Ask what observation would falsify the assumption and whether a small experiment is cheaper than designing around it.",
        practices: [
          "Maintain an assumption register with owner, confidence, impact, and validation date",
          "Ask 'Compared with what baseline?' and 'At what scale does this become true?'",
          "Separate constraints imposed by physics, regulation, contracts, legacy systems, and habit",
          "Use spikes, load tests, production traces, or vendor proofs for high-impact unknowns"
        ],
        warningSigns: [
          "Requirements contain words such as unlimited, real-time, seamless, or future-proof without a number",
          "A remembered incident substitutes for current workload evidence",
          "An assumption has no person empowered to resolve it"
        ]
      },
      {
        id: "competing-requirements",
        title: "Manage competing requirements",
        guidance:
          "Make conflict explicit in a weighted decision model. Reliability, latency, consistency, delivery date, cost, and team autonomy cannot all be maximized; determine which failure is least acceptable for this business journey.",
        practices: [
          "Rank requirements as hard constraints, objectives, and preferences",
          "Quantify the marginal value and cost of stronger targets",
          "Create tiered service behavior so critical paths survive while optional features degrade",
          "Escalate genuine business conflicts to the accountable product or risk owner"
        ],
        warningSigns: [
          "Every requirement is P0",
          "An architecture promises consistency, availability, low latency, and low cost without naming the partition behavior",
          "Engineering silently chooses a business trade-off"
        ]
      },
      {
        id: "document-decisions",
        title: "Document decisions, not meetings",
        guidance:
          "Record the context, chosen option, rejected alternatives, consequences, and revisit triggers near the code or architecture repository. Keep the record short enough to stay current.",
        practices: [
          "Link decisions to requirements, diagrams, experiments, incidents, and owners",
          "Use durable status values: proposed, accepted, superseded, deprecated",
          "Record the decision date and the conditions under which it should be reviewed",
          "Update the index rather than rewriting history when a decision changes"
        ],
        warningSigns: [
          "A diagram has no date, scope, or authoritative source",
          "Documentation describes only the selected design",
          "A future engineer cannot tell why a constraint exists"
        ]
      },
      {
        id: "use-adrs",
        title: "Use ADRs proportionally",
        guidance:
          "Write an Architecture Decision Record for choices that constrain teams, data, operations, security, or migration. Do not create ceremony for reversible local implementation details.",
        practices: [
          "State the decision in one sentence and keep consequences balanced",
          "Include assumptions and evidence so future reviewers can detect changed context",
          "Name migration and rollback implications",
          "Supersede an ADR with a new record rather than editing the old rationale"
        ],
        warningSigns: [
          "The ADR is written after implementation merely for approval",
          "Consequences list only benefits",
          "A committee owns the record but nobody owns the outcome"
        ]
      },
      {
        id: "review-designs",
        title: "Review another engineer's design",
        guidance:
          "Review from requirements to evidence to behavior under stress. Ask whether the proposed boundaries and guarantees are implementable and operable; avoid substituting personal style for material risk.",
        practices: [
          "Trace one critical write, one read, one retry, and one recovery path end to end",
          "Check every external dependency, state authority, trust boundary, and owner",
          "Label findings as correctness, security, reliability, operability, cost, or preference",
          "Offer the smallest change that mitigates the identified risk"
        ],
        warningSigns: [
          "Feedback starts with a favorite technology",
          "The happy-path diagram is accepted without failure sequences",
          "Minor naming comments obscure an invariant or recovery gap"
        ]
      },
      {
        id: "avoid-premature-complexity",
        title: "Avoid premature complexity",
        guidance:
          "Design for the next credible constraint and preserve low-cost seams for later. Complexity is justified only by a requirement, measured bottleneck, isolation need, or owned migration—not by possible scale alone.",
        practices: [
          "Start with the smallest architecture that satisfies current quality targets",
          "Use modules, contracts, stable identifiers, and outboxes as option-preserving seams",
          "Attach an adoption trigger and removal plan to speculative infrastructure",
          "Prefer managed, familiar components for undifferentiated capability"
        ],
        warningSigns: [
          "Multiple regions, services, or databases exist before one production workload",
          "A component has no failure it contains or capacity limit it relieves",
          "Future flexibility creates current dual writes or duplicated authorities"
        ]
      },
      {
        id: "manage-technical-debt",
        title: "Manage technical debt as risk",
        guidance:
          "Describe debt by the future change it slows or failure exposure it creates, not code aesthetics. Compare interest—incident risk, lead-time loss, cloud waste—with the cost and timing of repayment.",
        practices: [
          "Keep a debt register linked to evidence, affected outcomes, owner, and trigger",
          "Reserve capacity for recurring high-interest debt and fold local repayment into feature work",
          "Use incidents, delivery metrics, toil, and cost anomalies to reprioritize",
          "Retire unused abstractions and infrastructure as deliberate debt reduction"
        ],
        warningSigns: [
          "A generic rewrite is proposed without an incremental value path",
          "Debt has no business consequence or owner",
          "Temporary exceptions have no expiry or telemetry"
        ]
      },
      {
        id: "incremental-evolution",
        title: "Plan incremental evolution",
        guidance:
          "Define stages that each deliver value and remain operable. Treat data migration, compatibility, observability, and rollback as first-class architecture, using strangler, expand-contract, shadow, and canary patterns where appropriate.",
        practices: [
          "Give every stage entry criteria, exit criteria, owner, and rollback",
          "Separate traffic migration from data migration when that lowers risk",
          "Verify dual-write or CDC consistency with reconciliation before cutover",
          "Remove compatibility paths after an observed safety window"
        ],
        warningSigns: [
          "The plan jumps from current state to target state",
          "A big-bang database or client migration has no coexistence period",
          "Temporary dual paths become permanent because success criteria are absent"
        ]
      },
      {
        id: "business-alignment",
        title: "Align architecture with business priorities",
        guidance:
          "Translate capabilities into revenue, customer trust, regulatory exposure, delivery speed, and strategic options. A technically elegant design that arrives after the market window or exceeds the product's risk tolerance is a poor design.",
        practices: [
          "Map every major architecture investment to a business metric or protected loss",
          "Use service tiers so investment follows journey criticality",
          "Present the cost of delay beside the cost of implementation",
          "Revisit architecture when product strategy, unit economics, or risk appetite changes"
        ],
        warningSigns: [
          "The proposal contains no customer or business outcome",
          "Reliability work is sold only as engineering hygiene",
          "The team optimizes a low-value path because it is technically interesting"
        ]
      },
      {
        id: "stakeholder-translation",
        title: "Explain trade-offs to non-technical stakeholders",
        guidance:
          "Express architecture in outcomes, options, cost ranges, exposure, and reversibility. Avoid removing uncertainty; state what is known, what is assumed, and when evidence will arrive.",
        practices: [
          "Replace infrastructure terms with the user journey or loss they affect",
          "Present two or three viable options against agreed criteria",
          "Use concrete scenarios: expected behavior during a regional outage or sale peak",
          "Ask the stakeholder to choose between business consequences, not technologies"
        ],
        warningSigns: [
          "A diagram is used in place of a decision",
          "Risk is described as red/yellow/green without exposure or mitigation",
          "Engineering promises certainty to secure approval"
        ]
      },
      {
        id: "cost-operational-overhead",
        title: "Estimate cost and operational overhead",
        guidance:
          "Model total cost at baseline, peak, and growth scenarios: compute, storage, replicas, transfer, requests, licenses, observability, support, migration, compliance, and human on-call effort.",
        practices: [
          "Separate fixed platform cost from marginal per-transaction cost",
          "Include read/write amplification, backups, indexes, retention, and non-production environments",
          "Price failure headroom and recovery capacity",
          "Assign an operating owner and estimate toil before adding a technology"
        ],
        warningSigns: [
          "Cost estimates include only list-price compute",
          "A managed service is called expensive without valuing labor and risk transfer",
          "Scale-out assumes perfect utilization"
        ]
      },
      {
        id: "organizational-constraints",
        title: "Identify organizational constraints",
        guidance:
          "Treat skills, funding, procurement, compliance gates, release processes, vendor contracts, on-call coverage, and legacy ownership as real architecture inputs. Plan how constraints change rather than wishing them away.",
        practices: [
          "Inventory capabilities and support hours before selecting infrastructure",
          "Surface governance lead times on the delivery critical path",
          "Prefer paved-road technologies unless deviation has a funded owner",
          "Record which constraint is temporary and the investment needed to remove it"
        ],
        warningSigns: [
          "The design requires 24/7 expertise the organization does not have",
          "A dependency is nobody's budget or on-call responsibility",
          "Architecture assumes procurement, security, or data review happens instantly"
        ]
      },
      {
        id: "team-topology",
        title: "Let team topology inform architecture",
        guidance:
          "Architecture and communication structure reinforce each other. Place stable, cognitively manageable business capabilities with stream-aligned teams; use platform teams to provide self-service, and enabling teams to transfer capability rather than accept permanent tickets.",
        practices: [
          "Map desired service boundaries to teams that can own build and run",
          "Measure cognitive load before expanding a team's technology or domain surface",
          "Define platform APIs, SLOs, and adoption feedback like an internal product",
          "Reduce cross-team synchronous coordination on the critical delivery path"
        ],
        warningSigns: [
          "One team owns many services while several teams edit each service",
          "A platform team becomes a deployment queue",
          "Service boundaries mirror the org chart's transient reporting lines"
        ]
      },
      {
        id: "ownership-boundaries",
        title: "Make ownership boundaries executable",
        guidance:
          "A service boundary is credible only when one team owns its contract, data, SLO, security posture, cost, and lifecycle. Shared outcomes still need one accountable coordinator and explicit escalation paths.",
        practices: [
          "Publish a service catalog with owners, consumers, data classification, SLOs, and runbooks",
          "Prohibit direct writes to another domain's data and govern contract compatibility",
          "Define incident command and dependency escalation before an outage",
          "Align budget and decision rights with operational accountability"
        ],
        warningSigns: [
          "A component has a code owner but no production owner",
          "Teams can create services but not retire them",
          "Shared databases or topics have no field-level authority"
        ]
      }
    ],
    adrTemplate: {
      title: "Architecture Decision Record template",
      fields: [
        {
          name: "Title",
          prompt: "ADR-NNN: Choose [decision] for [scope]"
        },
        {
          name: "Status and ownership",
          prompt: "Proposed, accepted, or superseded; date; accountable owner; consulted groups"
        },
        {
          name: "Context",
          prompt: "Problem, forces, quantified requirements, constraints, assumptions, and evidence"
        },
        {
          name: "Decision drivers",
          prompt: "Ranked criteria with non-negotiable thresholds"
        },
        {
          name: "Options considered",
          prompt: "Viable choices evaluated against the same criteria, including doing nothing"
        },
        {
          name: "Decision",
          prompt: "One direct sentence stating what will be done and its scope"
        },
        {
          name: "Consequences",
          prompt: "Benefits, costs, risks, operational duties, security effects, and lost options"
        },
        {
          name: "Delivery and rollback",
          prompt: "Migration stages, compatibility, validation, rollback, and owners"
        },
        {
          name: "Revisit triggers",
          prompt: "Metrics, dates, scale, incidents, or business changes that invalidate the decision"
        },
        {
          name: "References",
          prompt: "Diagrams, prototypes, benchmarks, threat models, related ADRs, and dissent"
        }
      ],
      exampleDecision:
        "We will use a modular monolith with schema-owned modules for the first release because one team owns the workflow and its transactional boundaries are still changing. We will revisit extraction when independent deployment demand exceeds two blocked releases per quarter or one module requires materially different scaling."
    },
    reviewHeuristics: [
      {
        name: "Trace the invariant",
        test: "Locate where each critical invariant is checked, committed, and repaired after partial failure."
      },
      {
        name: "Find every authority",
        test: "For each important field, name exactly one authoritative owner and label every cache, replica, projection, and export."
      },
      {
        name: "Crash between arrows",
        test: "Pause after every durable write or external side effect and explain retry, duplicate, timeout, and recovery behavior."
      },
      {
        name: "Remove a dependency",
        test: "Make each downstream dependency slow or absent and verify timeout, degradation, queueing, and user-visible state."
      },
      {
        name: "Skew the workload",
        test: "Replace uniform traffic with hot tenants, hot keys, flash bursts, large payloads, and retry storms."
      },
      {
        name: "Verify the restore",
        test: "Connect backup, replication, promotion, reconciliation, and tested restore time to the stated RTO and RPO."
      },
      {
        name: "Cross the trust boundary",
        test: "Follow identity, authorization, secrets, PII, payment data, logs, and administrator actions end to end."
      },
      {
        name: "Name the operator",
        test: "For each component and alert, identify the team, runbook, maintenance path, cost owner, and escalation route."
      },
      {
        name: "Test reversibility",
        test: "Identify irreversible data and contract choices and require stronger evidence, migration, and rollback for them."
      },
      {
        name: "Challenge the end state",
        test: "Prove each complexity is needed now or attach a measurable future trigger and a low-cost seam."
      }
    ],
    stakeholderTranslation: [
      {
        technicalConcept: "99.95% availability",
        businessTranslation:
          "A monthly error budget of roughly 22 minutes; decide which checkout failures consume it and what investment protects peak revenue."
      },
      {
        technicalConcept: "Eventual consistency",
        businessTranslation:
          "A confirmed change may take a bounded time to appear elsewhere; define acceptable delay, user messaging, and the cost of stale decisions."
      },
      {
        technicalConcept: "Multi-region active-active",
        businessTranslation:
          "Faster local service and reduced regional outage exposure in exchange for duplicate capacity, conflict rules, and continuous failover testing."
      },
      {
        technicalConcept: "Technical debt",
        businessTranslation:
          "A known design constraint is increasing delivery time or incident exposure; compare its accumulating cost with staged repayment."
      },
      {
        technicalConcept: "Load shedding",
        businessTranslation:
          "During overload, preserve order placement and account access by deliberately reducing lower-value enrichment rather than allowing a total outage."
      },
      {
        technicalConcept: "Build vs buy",
        businessTranslation:
          "Choose whether this capability differentiates us enough to fund its lifetime engineering and risk instead of paying a vendor and accepting dependency."
      }
    ],
    architectureReviewAgenda: [
      "5 min — decision, business outcome, scope, and non-negotiable constraints",
      "10 min — workload, critical journeys, invariants, and evidence",
      "15 min — architecture and primary/failure/recovery flows",
      "15 min — alternatives, cost, security, operability, and organizational fit",
      "10 min — material risks, dissent, validation, and evolution triggers",
      "5 min — decision status, owners, due dates, and ADR link"
    ],
    decisionQualityChecklist: [
      "The problem and success measure are understandable without the proposed solution",
      "Functional scope and quality targets are prioritized and quantified",
      "Scale estimates connect to capacity and technology decisions",
      "Every state copy has an authority, freshness contract, and repair path",
      "Primary, retry, timeout, duplicate, and disaster paths are described",
      "Security, privacy, observability, cost, and on-call ownership are designed",
      "Alternatives use shared criteria and include organizational consequences",
      "The delivery path is incremental, observable, reversible where possible, and owned",
      "The ADR records consequences, open questions, dissent, and revisit triggers"
    ]
  };

  content.glossary = [
    { term: "ACID", definition: "Atomicity, consistency, isolation, and durability: properties that define reliable database transaction behavior.", relatedTopicIds: ["module-4", "handle-consistency"] },
    { term: "Active-active", definition: "A topology in which multiple sites simultaneously serve traffic; state ownership and conflict handling determine whether it is truly multi-writer.", relatedTopicIds: ["active-active-vs-active-passive", "module-5"] },
    { term: "Active-passive", definition: "A topology with one serving site and a standby promoted during recovery, requiring fencing and tested data readiness.", relatedTopicIds: ["active-active-vs-active-passive", "failure-scenarios"] },
    { term: "Architecture Decision Record (ADR)", definition: "A short, durable record of an architectural decision, its context, alternatives, consequences, and revisit conditions.", relatedTopicIds: ["discuss-tradeoffs", "lead-engineer-perspective"] },
    { term: "API gateway", definition: "An edge component that applies cross-cutting API policies such as routing, authentication, quotas, transformation, and observability.", relatedTopicIds: ["module-3", "define-apis"] },
    { term: "Authentication", definition: "The process of establishing the identity represented by a request or session.", relatedTopicIds: ["module-6", "add-security"] },
    { term: "Authorization", definition: "The decision about whether an authenticated or anonymous principal may perform an action on a specific resource and tenant.", relatedTopicIds: ["module-6", "add-security"] },
    { term: "Availability", definition: "The proportion of valid demand for which a system provides an acceptable response, measured through a defined SLI.", relatedTopicIds: ["module-1", "non-functional-requirements"] },
    { term: "Backpressure", definition: "A mechanism by which a saturated consumer slows, limits, or rejects upstream production instead of accumulating unbounded work.", relatedTopicIds: ["module-5", "async-processing"] },
    { term: "Backup", definition: "A recoverable point-in-time copy of data kept independently from the live failure domain; its value is established by restore tests.", relatedTopicIds: ["module-4", "failure-scenarios"] },
    { term: "Bandwidth", definition: "The rate at which bytes can cross a link; payload size, replication, fan-out, and protocol overhead all consume it.", relatedTopicIds: ["module-2", "estimate-scale"] },
    { term: "BASE", definition: "A loose description—basically available, soft state, eventual consistency—of systems that permit replicas to converge asynchronously.", relatedTopicIds: ["module-4", "strong-vs-eventual-consistency"] },
    { term: "Batch processing", definition: "Processing a finite dataset or time window as a scheduled unit, favoring repeatability and bulk efficiency over freshness.", relatedTopicIds: ["batch-vs-streaming", "module-3"] },
    { term: "Bulkhead", definition: "Isolation of resources such as thread pools, queues, tenants, or cells so one workload's exhaustion does not sink unrelated work.", relatedTopicIds: ["module-5", "failure-scenarios"] },
    { term: "Cache-aside", definition: "A caching pattern where the application reads the cache, loads misses from the authority, and explicitly invalidates or refreshes entries.", relatedTopicIds: ["cache-strategies", "add-caching"] },
    { term: "Cache stampede", definition: "A burst of concurrent source requests when many callers miss or refresh the same cache entry, mitigated with coalescing, jitter, or stale serving.", relatedTopicIds: ["module-3", "add-caching"] },
    { term: "CAP theorem", definition: "Under a network partition, a distributed data system cannot guarantee both linearizable consistency and availability for every request.", relatedTopicIds: ["module-1", "strong-vs-eventual-consistency"] },
    { term: "Cardinality", definition: "The number of distinct values in a dimension or key space; high-cardinality telemetry and indexes can dominate memory and cost.", relatedTopicIds: ["module-3", "add-observability"] },
    { term: "Change data capture (CDC)", definition: "Capturing committed database changes, commonly from a transaction log, for replication, integration, or downstream projections.", relatedTopicIds: ["module-4", "async-processing"] },
    { term: "Choreography", definition: "A coordination style in which participants react to published facts without one component controlling the entire workflow.", relatedTopicIds: ["orchestration-vs-choreography", "module-5"] },
    { term: "Circuit breaker", definition: "A stateful client-side control that temporarily blocks calls to an unhealthy dependency so it can recover and callers fail predictably.", relatedTopicIds: ["module-3", "failure-scenarios"] },
    { term: "Content delivery network (CDN)", definition: "A geographically distributed edge network that caches and delivers content near users while shielding origins from read traffic.", relatedTopicIds: ["module-3", "single-vs-multi-region"] },
    { term: "Cell architecture", definition: "Partitioning a platform into repeated, mostly independent stacks so tenants or traffic are assigned to limited blast-radius cells.", relatedTopicIds: ["module-5", "identify-bottlenecks"] },
    { term: "Clock skew", definition: "The difference between clocks on machines; wall-clock timestamps alone do not reliably establish distributed causality.", relatedTopicIds: ["module-5", "handle-consistency"] },
    { term: "Column-family database", definition: "A distributed store organizing sparse rows into column families, suited to large partition-key/range-key access patterns and high write throughput.", relatedTopicIds: ["module-4", "sql-vs-nosql"] },
    { term: "Compaction", definition: "Rewriting immutable storage segments to remove obsolete versions or merge files, trading background I/O for read and space efficiency.", relatedTopicIds: ["module-4", "kafka-vs-message-queues"] },
    { term: "Concurrency", definition: "Overlapping execution of work whose interleavings may contend or race even when hardware is not executing it simultaneously.", relatedTopicIds: ["module-1", "handle-consistency"] },
    { term: "Consistent hashing", definition: "Mapping keys and nodes onto a logical ring so membership changes move only a fraction of keys; virtual nodes improve balance.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Distributed consensus", definition: "A protocol by which nodes agree on an ordered value or leader despite failures, generally requiring a reachable quorum.", relatedTopicIds: ["module-5", "handle-consistency"] },
    { term: "Consumer group", definition: "A set of consumers that cooperatively divides partitions or messages so each unit is processed by one member of that group.", relatedTopicIds: ["kafka-vs-message-queues", "async-processing"] },
    { term: "CQRS", definition: "Command Query Responsibility Segregation separates write behavior from read models so each can use different models and scaling strategies.", relatedTopicIds: ["module-4", "event-sourcing-vs-crud"] },
    { term: "Dead-letter queue (DLQ)", definition: "A quarantine destination for messages that exhausted bounded handling or failed permanently, requiring ownership and a redrive policy.", relatedTopicIds: ["module-5", "async-processing"] },
    { term: "Distributed lock", definition: "A coordination lease shared across processes; safe use needs expiry, ownership validation, and usually fencing against stale holders.", relatedTopicIds: ["module-3", "handle-consistency"] },
    { term: "DNS", definition: "The hierarchical naming system that resolves domain names to records; caching and TTLs make changes propagate asynchronously.", relatedTopicIds: ["module-3", "single-vs-multi-region"] },
    { term: "Document database", definition: "A store whose unit is a self-contained document, useful when aggregate-shaped reads and flexible fields outweigh cross-document joins.", relatedTopicIds: ["module-4", "sql-vs-nosql"] },
    { term: "Durability", definition: "The property that acknowledged data survives the failures covered by the system's stated fault and recovery model.", relatedTopicIds: ["module-1", "non-functional-requirements"] },
    { term: "Edge cache", definition: "A cache close to clients—often at a CDN or gateway—that reduces origin latency and load but has distributed invalidation behavior.", relatedTopicIds: ["module-3", "add-caching"] },
    { term: "Error budget", definition: "The permitted amount of SLO failure in a window, used to balance reliability investment with delivery and risk.", relatedTopicIds: ["module-5", "add-observability"] },
    { term: "Event sourcing", definition: "Persisting an aggregate's immutable domain events as its authority and deriving current state by replay or snapshots.", relatedTopicIds: ["event-sourcing-vs-crud", "module-4"] },
    { term: "Eventual consistency", definition: "A model in which replicas may temporarily disagree but converge when updates cease and communication succeeds.", relatedTopicIds: ["strong-vs-eventual-consistency", "handle-consistency"] },
    { term: "Exactly-once processing", definition: "An end-to-end claim that each logical input changes business state once; it usually requires atomic boundaries or idempotent effects beyond broker delivery labels.", relatedTopicIds: ["module-5", "async-processing"] },
    { term: "Fan-out", definition: "Distributing one request or event to many downstream operations; it amplifies traffic, tail latency, and failure opportunities.", relatedTopicIds: ["module-3", "identify-bottlenecks"] },
    { term: "Fault tolerance", definition: "The ability to continue meeting a defined service level despite specified component or network failures.", relatedTopicIds: ["module-1", "failure-scenarios"] },
    { term: "Fencing token", definition: "A monotonically increasing lease generation checked by a resource to reject writes from expired or superseded lock holders.", relatedTopicIds: ["module-5", "handle-consistency"] },
    { term: "Graceful degradation", definition: "Preserving critical behavior while intentionally reducing optional quality or capability during dependency failure or overload.", relatedTopicIds: ["module-5", "failure-scenarios"] },
    { term: "Graph database", definition: "A store optimized for vertices, edges, and relationship traversal where connection patterns are primary query concerns.", relatedTopicIds: ["module-4", "sql-vs-nosql"] },
    { term: "Hash ring", definition: "The logical circular key space used by consistent-hashing schemes to assign ranges to physical or virtual nodes.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Head-of-line blocking", definition: "Delay of later independent work because an earlier item blocks a shared ordered queue, connection, partition, or resource.", relatedTopicIds: ["module-5", "identify-bottlenecks"] },
    { term: "Hot partition", definition: "A shard receiving disproportionate traffic or data, saturating before aggregate system capacity is exhausted.", relatedTopicIds: ["module-4", "identify-bottlenecks"] },
    { term: "Idempotency", definition: "The property that repeating the same logical operation produces no additional business effect after the first successful application.", relatedTopicIds: ["module-3", "define-apis", "failure-scenarios"] },
    { term: "Index", definition: "An auxiliary data structure that speeds selected lookups or ordering at the cost of storage, write amplification, and maintenance.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Isolation level", definition: "A transaction setting defining which anomalies concurrent operations may observe, such as dirty, non-repeatable, phantom, or serialization anomalies.", relatedTopicIds: ["module-4", "handle-consistency"] },
    { term: "JSON Web Token (JWT)", definition: "A compact signed token format carrying claims; signatures protect integrity, not secrecy, revocation, or correct authorization.", relatedTopicIds: ["module-6", "add-security"] },
    { term: "Key-value database", definition: "A store optimized for retrieving an opaque value by a unique key, often with predictable partitioned scale and limited secondary queries.", relatedTopicIds: ["module-4", "sql-vs-nosql"] },
    { term: "Latency", definition: "Elapsed time for an operation, best characterized by a distribution and tail percentiles rather than an average alone.", relatedTopicIds: ["module-1", "non-functional-requirements"] },
    { term: "Leader election", definition: "Selecting one member to coordinate work or accept writes for a term, commonly backed by consensus and leases.", relatedTopicIds: ["module-3", "module-5"] },
    { term: "Load balancer", definition: "A component distributing traffic among healthy targets using routing, health, capacity, and sometimes session-affinity policies.", relatedTopicIds: ["module-3", "high-level-architecture"] },
    { term: "Load shedding", definition: "Rejecting or degrading lower-priority work before saturation causes uncontrolled queueing and total service collapse.", relatedTopicIds: ["module-5", "identify-bottlenecks"] },
    { term: "Message queue", definition: "A durable work-distribution abstraction in which producers enqueue messages and consumers acknowledge claimed work.", relatedTopicIds: ["kafka-vs-message-queues", "async-processing"] },
    { term: "Microservice", definition: "An independently owned and deployable service aligned to a bounded business capability and responsible for its contracts, data, and operations.", relatedTopicIds: ["monolith-vs-microservices", "high-level-architecture"] },
    { term: "Modular monolith", definition: "One deployable with enforced internal modules, explicit APIs, and owned data boundaries, preserving local-call and transaction simplicity.", relatedTopicIds: ["monolith-vs-microservices", "high-level-architecture"] },
    { term: "Monolith", definition: "An application packaged and deployed as one unit; it may be well modularized or tightly coupled and is not inherently unscalable.", relatedTopicIds: ["monolith-vs-microservices", "module-1"] },
    { term: "Multi-tenancy", definition: "Serving multiple customer organizations through shared software while enforcing tenant data, performance, configuration, and administrative isolation.", relatedTopicIds: ["module-6", "high-level-architecture"] },
    { term: "Normalization", definition: "Structuring relational data to reduce update anomalies and redundant facts by representing dependencies in separate relations.", relatedTopicIds: ["module-4", "define-data-model"] },
    { term: "NoSQL", definition: "An umbrella category for non-relational stores—such as key-value, document, graph, and column-family—with distinct data models and guarantees.", relatedTopicIds: ["sql-vs-nosql", "module-4"] },
    { term: "OAuth 2.0", definition: "An authorization framework for delegated access using scoped tokens; it does not by itself define user authentication.", relatedTopicIds: ["module-6", "add-security"] },
    { term: "Observability", definition: "The ability to infer system state and user impact from designed telemetry such as metrics, logs, traces, profiles, and business events.", relatedTopicIds: ["module-5", "add-observability"] },
    { term: "OpenID Connect (OIDC)", definition: "An identity layer on OAuth 2.0 that defines authentication flows and identity claims through an ID token and provider metadata.", relatedTopicIds: ["module-6", "add-security"] },
    { term: "Optimistic concurrency control", definition: "Detecting conflicting updates using a version or predicate at commit time and retrying or rejecting instead of holding a lock throughout work.", relatedTopicIds: ["module-4", "handle-consistency"] },
    { term: "Orchestration", definition: "A coordination style in which a durable workflow owner directs participants, tracks progress, and manages timeouts and compensation.", relatedTopicIds: ["orchestration-vs-choreography", "module-5"] },
    { term: "Transactional outbox", definition: "Writing domain state and a publication record in one local transaction, then relaying that record asynchronously to avoid an unsafe dual write.", relatedTopicIds: ["module-5", "async-processing"] },
    { term: "PACELC", definition: "An extension of CAP: during a partition choose availability or consistency; else, in normal operation, choose latency or consistency.", relatedTopicIds: ["module-1", "strong-vs-eventual-consistency"] },
    { term: "Partition", definition: "A subset of data or traffic assigned by a key or range to limit coordination and enable parallel storage or processing.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Partition tolerance", definition: "The ability of a distributed system to continue with defined behavior when nodes cannot communicate reliably across a network split.", relatedTopicIds: ["module-1", "failure-scenarios"] },
    { term: "Pessimistic locking", definition: "Preventing conflicting access by acquiring a lock before changing data, trading simpler serialization for contention and deadlock risk.", relatedTopicIds: ["module-4", "handle-consistency"] },
    { term: "Personally identifiable information (PII)", definition: "Data that identifies or can reasonably be linked to a person and therefore requires lifecycle, access, privacy, and incident controls.", relatedTopicIds: ["module-6", "add-security"] },
    { term: "Poison message", definition: "A message that repeatedly fails because of malformed data, incompatible schema, or deterministic domain error and should not block healthy work.", relatedTopicIds: ["module-5", "async-processing"] },
    { term: "Projection", definition: "A read-optimized or derived view built from authoritative state or events, with an explicit freshness and rebuild contract.", relatedTopicIds: ["module-4", "event-sourcing-vs-crud"] },
    { term: "Quorum", definition: "A subset large enough to intersect other successful subsets, commonly a majority, used to preserve an agreed state despite some failures.", relatedTopicIds: ["module-4", "module-5"] },
    { term: "Rate limiting", definition: "Controlling admitted operations by identity, tenant, route, or resource over time to protect capacity, fairness, cost, and abuse boundaries.", relatedTopicIds: ["module-3", "add-security"] },
    { term: "Read replica", definition: "A database copy serving reads from replicated state; it reduces primary read load but introduces lag and failover considerations.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Reliability", definition: "The probability that a system performs its required function without failure over a defined period and operating condition.", relatedTopicIds: ["module-1", "non-functional-requirements"] },
    { term: "Replication", definition: "Maintaining copies of data across nodes or regions for read capacity, durability, or recovery, with explicit lag and authority semantics.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Retry budget", definition: "A limit on retries relative to original demand that prevents recovery traffic from overwhelming an already impaired dependency.", relatedTopicIds: ["module-5", "failure-scenarios"] },
    { term: "Reverse proxy", definition: "A server accepting client connections and forwarding them to upstream services while applying routing, TLS, buffering, or policy.", relatedTopicIds: ["module-3", "high-level-architecture"] },
    { term: "Recovery point objective (RPO)", definition: "The maximum acceptable amount of data loss measured backward in time after a disruption.", relatedTopicIds: ["module-5", "failure-scenarios"] },
    { term: "Recovery time objective (RTO)", definition: "The target maximum elapsed time to restore a business capability after a disruption.", relatedTopicIds: ["module-5", "failure-scenarios"] },
    { term: "Saga", definition: "A distributed business transaction composed of local commits with durable progress and compensating actions rather than one global atomic commit.", relatedTopicIds: ["module-5", "orchestration-vs-choreography"] },
    { term: "Schema evolution", definition: "Changing data or message structure while preserving compatibility, migration safety, and the ability to process retained historical records.", relatedTopicIds: ["module-4", "define-data-model"] },
    { term: "Secondary index", definition: "An index ordered by fields other than the primary key, improving alternate access paths while adding write and storage cost.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Service discovery", definition: "Resolving a logical service identity to currently healthy network endpoints, often integrated with orchestration or a registry.", relatedTopicIds: ["module-3", "high-level-architecture"] },
    { term: "Sharding", definition: "Horizontally dividing data among independent stores by a shard key to scale capacity and isolate work.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Service-level indicator (SLI)", definition: "A measured ratio or distribution representing user-visible service behavior, such as successful valid requests or latency.", relatedTopicIds: ["module-5", "add-observability"] },
    { term: "Service-level objective (SLO)", definition: "A target for an SLI over a defined window that guides reliability work and error-budget policy.", relatedTopicIds: ["module-5", "add-observability"] },
    { term: "Split brain", definition: "A failure state where multiple nodes or sites independently believe they hold exclusive authority, risking conflicting writes.", relatedTopicIds: ["module-5", "active-active-vs-active-passive"] },
    { term: "Stateful service", definition: "A service whose correct behavior depends on durable or session state tied to an instance or coordinated store.", relatedTopicIds: ["module-1", "high-level-architecture"] },
    { term: "Stateless service", definition: "A service instance that can handle a request without instance-local durable state, enabling flexible routing but not eliminating downstream state.", relatedTopicIds: ["module-1", "high-level-architecture"] },
    { term: "Stream processing", definition: "Continuously processing unbounded event sequences with explicit ordering, state, event-time, and replay behavior.", relatedTopicIds: ["batch-vs-streaming", "module-3"] },
    { term: "Strong consistency", definition: "A guarantee that operations observe a single authoritative ordering, often linearizability for individual operations or serializability for transactions.", relatedTopicIds: ["strong-vs-eventual-consistency", "handle-consistency"] },
    { term: "Tail latency", definition: "Latency at high percentiles such as p99, representing slow experiences that become common under fan-out or large request volume.", relatedTopicIds: ["module-1", "non-functional-requirements"] },
    { term: "Throughput", definition: "The amount of work completed per unit time under stated workload and correctness conditions.", relatedTopicIds: ["module-1", "estimate-scale"] },
    { term: "Time-series database", definition: "A store optimized for timestamped measurements, high ingest, retention/downsampling, and time-window aggregation.", relatedTopicIds: ["module-4", "sql-vs-nosql"] },
    { term: "Token bucket", definition: "A rate-limiting algorithm that accumulates tokens at a fixed rate up to a capacity, allowing bounded bursts when tokens are available.", relatedTopicIds: ["module-3", "add-security"] },
    { term: "Distributed tracing", definition: "Correlating timed spans across process and async boundaries to explain a request or business transaction's critical path.", relatedTopicIds: ["module-5", "add-observability"] },
    { term: "Transaction", definition: "A unit of work committed or aborted under defined atomicity and isolation guarantees.", relatedTopicIds: ["module-4", "handle-consistency"] },
    { term: "Two-phase commit (2PC)", definition: "A coordinator protocol that prepares participants then commits them, providing atomicity but risking blocking and tight availability coupling.", relatedTopicIds: ["module-5", "handle-consistency"] },
    { term: "Vector clock", definition: "A set of per-node logical counters used to identify causal ordering or concurrency among distributed versions.", relatedTopicIds: ["module-5", "handle-consistency"] },
    { term: "Watermark", definition: "A stream processor's estimate that events earlier than a given event time are mostly complete, enabling windows to close despite late arrivals.", relatedTopicIds: ["batch-vs-streaming", "module-3"] },
    { term: "Write-ahead log (WAL)", definition: "A durable append log written before data pages so committed changes can be recovered and often replicated.", relatedTopicIds: ["module-4", "select-storage"] },
    { term: "Write-behind cache", definition: "A cache that acknowledges or buffers changes before asynchronously persisting them to the backing store, requiring durable recovery for important data.", relatedTopicIds: ["cache-strategies", "add-caching"] },
    { term: "Write-through cache", definition: "A cache pattern in which writes update the cache and backing store through one path before reporting completion.", relatedTopicIds: ["cache-strategies", "add-caching"] },
    { term: "Zero trust", definition: "A security model that continuously authenticates and authorizes access using identity, device, context, and least privilege rather than trusting network location.", relatedTopicIds: ["module-6", "add-security"] }
  ];

  content.examples = [
    {
      id: "idempotent-order-api",
      title: "Idempotent order creation contract",
      technology: "HTTP / REST",
      language: "http",
      principle:
        "The idempotency key identifies one caller intent; the server stores a request fingerprint and original outcome so transport retries cannot create a second order.",
      code: String.raw`POST /v1/orders HTTP/1.1
Content-Type: application/json
Idempotency-Key: 4f4fe47d-4191-44f2-9d14-f130777bb9a7
Traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01

{
  "cartId": "cart_01J3M",
  "pricedCartVersion": 17,
  "paymentMethodToken": "pm_tok_8nK"
}

HTTP/1.1 201 Created
Location: /v1/orders/ord_01J3N
Content-Type: application/json

{
  "orderId": "ord_01J3N",
  "status": "PAYMENT_PENDING",
  "createdAt": "2026-07-16T18:42:11Z"
}`,
      notes: [
        "Return the stored response for the same key and same canonical request fingerprint.",
        "Return 409 Conflict if the key is reused with a different fingerprint; validate key format and scope it to the authenticated tenant.",
        "Persist the key and order in the same transaction. A short-lived Redis entry may accelerate lookup but must not be the only authority."
      ],
      relatedTopicIds: ["define-apis", "handle-consistency", "failure-scenarios"]
    },
    {
      id: "problem-details",
      title: "Client-actionable validation failure",
      technology: "RFC 9457 Problem Details",
      language: "json",
      principle:
        "Errors are stable contracts. Separate a machine-readable type and field issues from a safe human explanation, and propagate correlation without exposing internals.",
      code: String.raw`{
  "type": "https://api.example.com/problems/stale-cart-price",
  "title": "Cart price changed",
  "status": 409,
  "detail": "Refresh the cart and confirm the updated total.",
  "instance": "/v1/orders/attempts/att_01J3N",
  "correlationId": "01J3N8AX6YJGK7H1W0MW",
  "currentCartVersion": 18,
  "errors": [
    { "field": "pricedCartVersion", "code": "STALE_VERSION" }
  ]
}`,
      notes: [
        "Do not return SQL, stack traces, tokens, payment data, or raw downstream responses.",
        "Use 409 for a valid request that conflicts with current state; use 400 for malformed or invalid input."
      ],
      relatedTopicIds: ["define-apis", "add-security"]
    },
    {
      id: "order-accepted-event",
      title: "Versioned domain-event envelope",
      technology: "Kafka-compatible event contract",
      language: "json",
      principle:
        "Publish an immutable fact with a stable identity, aggregate version, event time, trace context, and minimal domain snapshot. Key the record by aggregate ID to preserve per-order ordering.",
      code: String.raw`{
  "eventId": "evt_01J3N9F0TEJ7Z8R6Y32B",
  "eventType": "ORDER_ACCEPTED",
  "schemaVersion": 2,
  "occurredAt": "2026-07-16T18:42:11Z",
  "producer": "order-service",
  "traceparent": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "aggregate": {
    "type": "ORDER",
    "id": "ord_01J3N",
    "version": 1
  },
  "data": {
    "customerId": "cus_01J2A",
    "currency": "USD",
    "totalMinor": 12999,
    "fulfillmentRegion": "us-central"
  }
}`,
      notes: [
        "Put routing identity in the Kafka record key and propagate trace metadata in headers as well as the portable envelope when needed.",
        "Consumers deduplicate by eventId and tolerate additive fields. Do not include secrets, payment credentials, or unnecessary PII.",
        "An event records a committed fact; OrderAccepted should not be emitted before the order transaction commits."
      ],
      relatedTopicIds: ["async-processing", "schema-evolution", "kafka-vs-message-queues"]
    },
    {
      id: "spring-transactional-outbox",
      title: "Commit domain state and publication intent together",
      technology: "Java / Spring Boot",
      language: "java",
      principle:
        "A local transaction can atomically create the order and its outbox record. A separate relay publishes and marks delivery; consumers remain idempotent because a relay crash can publish twice.",
      code: String.raw`@Service
class OrderApplicationService {
  private final OrderRepository orders;
  private final OutboxRepository outbox;

  @Transactional
  OrderReceipt create(CreateOrder command, IdempotencyKey key) {
    return orders.findReceiptByIdempotencyKey(key)
        .orElseGet(() -> {
          Order order = Order.accept(command, key);
          orders.save(order);
          outbox.append(DomainEvent.orderAccepted(order));
          return OrderReceipt.from(order);
        });
  }
}`,
      notes: [
        "Enforce a unique database constraint on the idempotency key; an application lookup alone races.",
        "Translate a concurrent unique-constraint conflict in a fresh transaction by re-reading the stored fingerprint and result rather than returning an internal error.",
        "The example is intentionally domain-focused. Production code also stores a request fingerprint and rejects key reuse for a different command.",
        "Use CDC or a polling relay with row claiming, bounded batches, backoff, and an unpublished-row age SLI."
      ],
      relatedTopicIds: ["module-5", "handle-consistency", "async-processing"]
    },
    {
      id: "postgres-outbox-schema",
      title: "Order authority and transactional outbox",
      technology: "PostgreSQL",
      language: "sql",
      principle:
        "Database constraints carry correctness under concurrency; a partial index keeps the relay's hot query small while retention handles published history.",
      code: String.raw`CREATE TABLE orders (
  order_id           uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL,
  idempotency_key    uuid NOT NULL,
  request_fingerprint bytea NOT NULL,
  status             text NOT NULL,
  version            bigint NOT NULL DEFAULT 1,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key),
  CHECK (status IN ('PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED'))
);

CREATE TABLE outbox_events (
  event_id       uuid PRIMARY KEY,
  aggregate_id  uuid NOT NULL REFERENCES orders(order_id),
  aggregate_version bigint NOT NULL,
  event_type     text NOT NULL,
  payload        jsonb NOT NULL,
  occurred_at    timestamptz NOT NULL,
  published_at   timestamptz,
  UNIQUE (aggregate_id, aggregate_version, event_type)
);

CREATE INDEX outbox_unpublished_idx
  ON outbox_events (occurred_at)
  WHERE published_at IS NULL;`,
      notes: [
        "Insert the order and outbox row in one transaction; do not hold that transaction open while calling Kafka or a payment provider.",
        "Partition or archive event history based on retention and replay needs, and test point-in-time restore.",
        "A foreign key is appropriate because both tables are owned by the same service and transaction boundary."
      ],
      relatedTopicIds: ["select-storage", "define-data-model", "async-processing"]
    },
    {
      id: "kafka-safety-config",
      title: "Kafka producer and consumer safety baseline",
      technology: "Apache Kafka",
      language: "properties",
      principle:
        "Broker durability and producer idempotence reduce transport duplicates and loss; they do not make external database or business effects exactly once.",
      code: String.raw`# Producer
acks=all
enable.idempotence=true
max.in.flight.requests.per.connection=5
delivery.timeout.ms=120000

# Consumer
enable.auto.commit=false
isolation.level=read_committed
max.poll.records=250

# Topic policy belongs in infrastructure configuration
# replication.factor=3
# min.insync.replicas=2`,
      notes: [
        "Commit a consumer offset only after the effect is durable, or atomically with output when using Kafka transactions entirely inside Kafka.",
        "Use an inbox/deduplication record or naturally idempotent state transition for database effects.",
        "Size partitions from throughput and key-order requirements; more partitions do not repair a hot key."
      ],
      relatedTopicIds: ["kafka-vs-message-queues", "async-processing", "failure-scenarios"]
    },
    {
      id: "redis-rate-limit",
      title: "Atomic fixed-window rate-limit primitive",
      technology: "Redis",
      language: "lua",
      principle:
        "A server-side script atomically increments and expires a scoped counter. The application must still define identity, fairness, boundary bursts, and fail-open versus fail-closed behavior.",
      code: String.raw`-- KEYS[1] = rl:{tenant}:{route}:{windowStart}
-- ARGV[1] = limit, ARGV[2] = window length in milliseconds
local count = tonumber(redis.call('GET', KEYS[1]) or '0')

if count >= tonumber(ARGV[1]) then
  return {0, count, redis.call('PTTL', KEYS[1])}
end

count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
end

return {1, count, redis.call('PTTL', KEYS[1])}`,
      notes: [
        "Fixed windows allow bursts across boundaries; use token bucket or a rolling-window design when that matters.",
        "Include tenant and route in the key, cap key cardinality, and return a Retry-After derived from the remaining TTL.",
        "Define whether Redis failure denies security-sensitive operations or temporarily allows low-risk traffic with local protection."
      ],
      relatedTopicIds: ["module-3", "add-security", "add-caching"]
    },
    {
      id: "kubernetes-resilience",
      title: "Kubernetes workload with deliberate health semantics",
      technology: "Kubernetes",
      language: "yaml",
      principle:
        "Readiness controls traffic, liveness detects irrecoverable process failure, startup protects slow initialization, and disruption/placement policies reduce correlated loss.",
      code: String.raw`apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-api
spec:
  replicas: 4
  selector:
    matchLabels: { app: order-api }
  template:
    metadata:
      labels: { app: order-api }
    spec:
      serviceAccountName: order-api
      containers:
        - name: app
          image: registry.example.com/order-api:2026.07.16
          ports: [{ name: http, containerPort: 8080 }]
          resources:
            requests: { cpu: "500m", memory: "768Mi" }
            limits: { memory: "768Mi" }
          startupProbe:
            httpGet: { path: /actuator/health/readiness, port: http }
            failureThreshold: 30
            periodSeconds: 2
          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: http }
            periodSeconds: 5
          livenessProbe:
            httpGet: { path: /actuator/health/liveness, port: http }
            periodSeconds: 10
          lifecycle:
            preStop: { exec: { command: ["sh", "-c", "sleep 10"] } }
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels: { app: order-api }
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: order-api
spec:
  minAvailable: 3
  selector:
    matchLabels: { app: order-api }`,
      notes: [
        "Do not make liveness depend on a downstream database; a dependency outage should not create a restart storm.",
        "Use immutable image digests in deployment promotion; the readable version tag here keeps the teaching example concise.",
        "Set CPU policy from measurement. A CPU limit can throttle latency-sensitive Java workloads, while requests drive scheduling and autoscaling assumptions.",
        "A PDB covers voluntary disruptions, not node or zone failure. Validate replica count, placement, rolling-update settings, and real zonal capacity together."
      ],
      relatedTopicIds: ["failure-scenarios", "identify-bottlenecks", "serverless-vs-containers"]
    },
    {
      id: "aws-sqs-redrive",
      title: "Bounded retries and quarantine on AWS",
      technology: "AWS CloudFormation / Amazon SQS",
      language: "yaml",
      principle:
        "A work queue needs an explicit visibility window, bounded receive count, encrypted storage, and an owned quarantine path; a DLQ is not automatic recovery.",
      code: String.raw`Resources:
  OrderWorkDlq:
    Type: AWS::SQS::Queue
    Properties:
      KmsMasterKeyId: alias/aws/sqs
      MessageRetentionPeriod: 1209600

  OrderWorkQueue:
    Type: AWS::SQS::Queue
    Properties:
      KmsMasterKeyId: alias/aws/sqs
      VisibilityTimeout: 90
      MessageRetentionPeriod: 345600
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt OrderWorkDlq.Arn
        maxReceiveCount: 5`,
      notes: [
        "Set visibility above expected processing time and extend it deliberately for long work; a timeout makes the message eligible for duplicate delivery.",
        "Alarm on oldest-message age, visible backlog, and DLQ arrivals. Assign redrive approval, diagnosis, and replay ownership.",
        "Use payload references in object storage when message size or sensitive-data controls make embedding unsuitable."
      ],
      relatedTopicIds: ["kafka-vs-message-queues", "async-processing", "failure-scenarios"]
    },
    {
      id: "docker-java-image",
      title: "Minimal immutable Java service image",
      technology: "Docker / Java",
      language: "dockerfile",
      principle:
        "Separate compilation from runtime, run as a non-root identity, pin the production base by digest, and inject configuration and secrets at deployment time.",
      code: String.raw`FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar

FROM eclipse-temurin:21-jre-jammy
RUN useradd --system --uid 10001 appuser
WORKDIR /app
COPY --from=build --chown=10001:0 /workspace/build/libs/app.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]`,
      notes: [
        "Resolve and pin the runtime tag to a verified immutable digest through dependency automation before production promotion.",
        "Use a restrictive runtime security context, read-only filesystem where feasible, image scanning, and signed provenance.",
        "Do not bake credentials or environment-specific application configuration into image layers."
      ],
      relatedTopicIds: ["serverless-vs-containers", "add-security", "future-evolution"]
    },
    {
      id: "opensearch-autocomplete",
      title: "Autocomplete as a rebuildable search projection",
      technology: "OpenSearch / Elasticsearch-compatible DSL",
      language: "json",
      principle:
        "Search serves a denormalized, asynchronously refreshed projection. It finds candidate products quickly; the product, price, and inventory authorities validate mutable facts before purchase.",
      code: String.raw`PUT products-v3
{
  "mappings": {
    "properties": {
      "productId": { "type": "keyword" },
      "name": { "type": "search_as_you_type" },
      "brand": { "type": "keyword" },
      "categoryIds": { "type": "keyword" },
      "catalogVersion": { "type": "long" }
    }
  }
}

GET products-v3/_search
{
  "size": 10,
  "query": {
    "multi_match": {
      "query": "cordless dri",
      "type": "bool_prefix",
      "fields": ["name", "name._2gram", "name._3gram"]
    }
  }
}`,
      notes: [
        "Build a new versioned index and atomically swap an alias rather than mutating mappings in place.",
        "Monitor event-to-search freshness, indexing rejection, query p95/p99, zero-result rate, and relevance metrics.",
        "Do not reserve inventory or promise checkout price from a stale search document."
      ],
      relatedTopicIds: ["module-3", "handle-consistency", "future-evolution"]
    },
    {
      id: "saga-state-machine",
      title: "Order saga transition guard",
      technology: "Technology-neutral pseudocode",
      language: "text",
      principle:
        "Persist explicit states and accept only valid, idempotent transitions. Recovery workers can then find timed-out states rather than infer progress from missing events.",
      code: String.raw`on PaymentAuthorized(orderId, authorizationId, messageId):
  begin transaction
    if inbox contains messageId: return current order
    order = load orderId for update

    if order.state == CONFIRMED: record inbox; return order
    require order.state == PAYMENT_PENDING

    order.paymentAuthorizationId = authorizationId
    order.state = INVENTORY_PENDING
    append outbox ReserveInventory(orderId, order.lines)
    record inbox messageId
  commit

on deadline exceeded in INVENTORY_PENDING:
  transition to CANCELLATION_PENDING
  append outbox VoidPayment(orderId, authorizationId)`,
      notes: [
        "A business state machine is separate from transport retry state. Persist both progress and message deduplication in an atomic local boundary.",
        "Compensation is a new business action that can fail; it is not a rollback of history.",
        "Reconciliation scans states older than their workflow SLO and compares external references before deciding the next command."
      ],
      relatedTopicIds: ["orchestration-vs-choreography", "handle-consistency", "failure-scenarios"]
    }
  ];
})();
