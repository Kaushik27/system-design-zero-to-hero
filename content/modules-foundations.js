(function () {
  "use strict";

  window.SD_CONTENT ||= {
    modules: [],
    caseStudies: [],
    tradeoffs: [],
    glossary: [],
    assessments: {}
  };

  const slug = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const concept = (
    name,
    definition,
    intuition,
    practicalExample,
    useCases,
    tradeoffs,
    misconceptions
  ) => ({
    id: slug(name),
    name,
    definition,
    intuition,
    practicalExample,
    useCases,
    tradeoffs,
    misconceptions
  });

  const calculationTopic = (
    name,
    method,
    steps,
    formula,
    example,
    leadEngineerLens
  ) => ({
    id: slug(name),
    name,
    method,
    steps,
    formula,
    example,
    leadEngineerLens
  });

  const component = (
    name,
    problem,
    howItWorks,
    useWhen,
    avoidWhen,
    failureModes,
    scalingLimits,
    operations,
    technologies,
    tradeoffs
  ) => ({
    id: slug(name),
    name,
    problem,
    howItWorks,
    useWhen,
    avoidWhen,
    failureModes,
    scalingLimits,
    operations,
    technologies,
    tradeoffs
  });

  const foundations = {
    id: "system-design-foundations",
    number: 1,
    title: "System Design Foundations",
    summary: "Build a precise vocabulary for reasoning about architecture, then use it to expose conflicts among scale, correctness, resilience, delivery speed, and operating cost.",
    duration: "5-7 hours",
    objectives: [
      "Turn a vague architecture conversation into explicit functional and quality requirements.",
      "Distinguish related qualities such as availability, reliability, durability, and fault tolerance.",
      "Reason about distribution using latency, throughput, consistency, CAP, and PACELC rather than slogans.",
      "Choose an initial architecture style that matches domain boundaries, team topology, and operational maturity."
    ],
    topics: [
      concept(
        "What system design is",
        "System design is the disciplined conversion of business capabilities and quality constraints into components, interfaces, data ownership, deployment topology, and operating controls.",
        "A design is a set of justified decisions under constraints, not a diagram. The useful question is not whether an architecture is modern, but what workload and failure model it is fit for.",
        "For a marketplace, the design maps browse, price, buy, fulfill, and refund workflows to APIs and data while meeting peak-sale latency, payment correctness, recovery, compliance, and cost targets.",
        [
          "Greenfield architecture and major platform evolution",
          "Architecture reviews, capacity planning, and system design interviews",
          "Resolving cross-team ownership, data, and reliability decisions"
        ],
        [
          "More upfront analysis reduces some rework but delays feedback when uncertainty is high.",
          "Optimizing one quality, such as consistency, may increase latency, cost, or coupling.",
          "The best boundary technically may not match current team skills or ownership."
        ],
        [
          "System design is not synonymous with drawing boxes and arrows.",
          "There is rarely one correct design independent of scale, risk, and organization.",
          "Choosing products before clarifying requirements is not architecture."
        ]
      ),
      concept(
        "High-level design versus low-level design",
        "High-level design (HLD) defines system boundaries, major components, integrations, data ownership, deployment, and quality strategy; low-level design (LLD) defines contracts, domain models, algorithms, schemas, class responsibilities, and concurrency details inside those boundaries.",
        "HLD decides where responsibility lives and how it communicates. LLD decides how that responsibility behaves safely and maintainably.",
        "An HLD might assign checkout orchestration to a service with PostgreSQL and Kafka. Its LLD specifies the order state machine, idempotency table, transactional outbox, API problem responses, and optimistic-lock version column.",
        [
          "HLD for investment, dependency, and failure-domain decisions",
          "LLD for implementation readiness, correctness, and code review",
          "Linking ADRs to contracts, schemas, and sequence diagrams"
        ],
        [
          "HLD remains legible to broad stakeholders but intentionally omits implementation hazards.",
          "LLD provides precision but becomes stale if authored too early or at excessive scope.",
          "Cross-cutting properties such as security and observability must appear at both levels."
        ],
        [
          "HLD is not architecture while LLD is merely coding; both contain architectural decisions.",
          "A component diagram alone is not a complete HLD without flows and failure behavior.",
          "LLD does not require documenting every class."
        ]
      ),
      concept(
        "Functional versus non-functional requirements",
        "Functional requirements describe user-visible capabilities and system behaviors; non-functional requirements (NFRs) quantify qualities and constraints such as latency, availability, consistency, security, recovery, scale, cost, and compliance.",
        "Functions say what must happen. NFRs determine which architecture can make it happen acceptably and how success is measured.",
        "‘A shopper can place an order’ is functional. ‘No acknowledged order is lost, p99 checkout is under 800 ms at 2,000 RPS, and payment data stays outside the merchant boundary’ are NFRs.",
        [
          "Scoping an MVP without silently sacrificing critical quality",
          "Turning business risk into SLOs and recovery objectives",
          "Comparing designs against shared evaluation criteria"
        ],
        [
          "Stricter NFRs usually add redundancy, engineering effort, and operating cost.",
          "Requirements may conflict: global strong consistency increases coordination latency.",
          "A measurable target is more useful but exposes ownership and monitoring obligations."
        ],
        [
          "Non-functional does not mean optional.",
          "‘Fast’ and ‘highly available’ are aspirations, not testable requirements.",
          "NFRs should not be copied unchanged from another system with a different risk profile."
        ]
      ),
      concept(
        "Scalability",
        "Scalability is the ability to sustain workload growth by adding resources while keeping quality and cost degradation within agreed bounds.",
        "A scalable system has an understood growth axis and a way to spread work along it. Capacity without an economical growth path is merely overprovisioning.",
        "A Spring Boot catalog API scales read traffic across stateless Kubernetes pods, partitions PostgreSQL by tenant only when a single primary becomes limiting, and moves search reads to OpenSearch.",
        [
          "Seasonal commerce traffic and viral growth",
          "Large tenant or data-volume expansion",
          "Compute-heavy batch and stream workloads"
        ],
        [
          "Horizontal scale introduces coordination, partitioning, and debugging complexity.",
          "Precomputing and caching improve reads but increase freshness and invalidation work.",
          "Scaling for peak improves headroom but may waste money without elasticity."
        ],
        [
          "Adding instances does not help a serialized database or lock bottleneck.",
          "Elasticity, the speed of adapting capacity, is related to but different from scalability.",
          "Microservices do not automatically make a workload scalable."
        ]
      ),
      concept(
        "Availability",
        "Availability is the proportion of intended service time during which a system can successfully serve valid requests, measured at a defined boundary and quality threshold.",
        "Availability is about being usable now. Define whose success counts, because a green process that returns errors or unusably slow responses is unavailable to its consumer.",
        "An order-read SLI may count responses under 500 ms with correct status codes; an SLO of 99.95% permits roughly 21.6 minutes of unavailability in a 30-day month.",
        [
          "Customer-facing APIs and critical internal workflows",
          "SLO design and dependency budgeting",
          "Region, zone, and deployment resilience planning"
        ],
        [
          "Higher availability requires redundancy, isolation, safer changes, and operational investment.",
          "Fail-open behavior preserves access but can weaken correctness or security.",
          "Multi-region serving improves regional resilience but adds data-consistency complexity."
        ],
        [
          "Uptime of a host is not end-to-end availability.",
          "Percentages without a measurement window and SLI are ambiguous.",
          "Serial dependencies multiply failure probability rather than inheriting the best SLA."
        ]
      ),
      concept(
        "Reliability",
        "Reliability is the probability that a system performs its intended function correctly and consistently over a stated interval and operating condition.",
        "Availability asks whether a response was served; reliability asks whether the whole behavior, including state transitions and side effects, was correct.",
        "A checkout endpoint that returns 200 but creates two orders during a retry may be available yet unreliable. An idempotency record, state machine, and reconciliation job address that gap.",
        [
          "Financial, inventory, and fulfillment workflows",
          "Defining correctness SLIs alongside latency and error rate",
          "Designing repair, reconciliation, and invariant monitoring"
        ],
        [
          "Stronger validation and coordination can reduce throughput and increase latency.",
          "Reconciliation accepts temporary inconsistency in exchange for simpler online paths.",
          "More failure handling adds states that must themselves be tested and observed."
        ],
        [
          "Reliability is broader than uptime.",
          "Retries alone do not make a workflow reliable; they can amplify duplicates and load.",
          "A high unit-test count does not prove production reliability."
        ]
      ),
      concept(
        "Durability",
        "Durability is the probability that acknowledged data remains intact and recoverable over time despite failures.",
        "Once the system says a write succeeded, durability defines how confidently it can make that promise and what disasters are included.",
        "A PostgreSQL order commit uses write-ahead logging and synchronous zone replication; encrypted backups copied to another region protect against corruption or regional loss, subject to tested RPO.",
        [
          "Orders, payments, audit events, and customer records",
          "Backup, archive, and disaster-recovery policy",
          "Selecting storage classes and replication modes"
        ],
        [
          "Synchronous replication lowers potential data loss but raises write latency and failure coupling.",
          "More replicas help hardware failure but can replicate logical corruption.",
          "Long retention improves recovery and auditability but raises cost and privacy obligations."
        ],
        [
          "Replication is not a backup.",
          "A successful HTTP response is not durable unless persistence semantics support it.",
          "Eleven nines of object durability does not mean the application has eleven nines of availability."
        ]
      ),
      concept(
        "Maintainability",
        "Maintainability is the ease and safety with which a system can be understood, changed, tested, operated, and retired over its lifetime.",
        "Most system cost arrives after launch. A design is maintainable when ordinary changes stay local, failure behavior is legible, and ownership is unambiguous.",
        "A modular Spring Boot application enforces catalog, pricing, and inventory boundaries through modules and contracts, records decisions in ADRs, and exposes consistent telemetry before independent deployment is justified.",
        [
          "Frequent business-rule change",
          "Multi-team platforms and on-call ownership",
          "Reducing release risk and technical-debt interest"
        ],
        [
          "Abstraction improves change isolation until it obscures behavior or predicts requirements badly.",
          "Standardization reduces cognitive load but can constrain locally optimal choices.",
          "Independent services isolate change but create distributed operational work."
        ],
        [
          "Maintainability is not simply clean code; boundaries, deployment, data, and runbooks matter.",
          "More services do not necessarily mean smaller blast radius if they share data and releases.",
          "Documentation is useful only when owned and connected to decisions or operations."
        ]
      ),
      concept(
        "Fault tolerance",
        "Fault tolerance is the ability to continue providing an acceptable level of service when specified components fail.",
        "Assume faults will occur, then prevent them from becoming user-visible system failures through redundancy, isolation, fallback, and recovery.",
        "If a recommendation service times out, a product page serves cached popular items; if one Kubernetes zone fails, pods and the load balancer continue across remaining zones.",
        [
          "Critical paths with unreliable dependencies",
          "Zone, process, network, and deployment failures",
          "Graceful degradation of optional capabilities"
        ],
        [
          "Redundancy increases cost and may add coordination failure modes.",
          "Fallback data can be stale or semantically weaker.",
          "Masking faults too aggressively can delay detection and overload surviving capacity."
        ],
        [
          "Fault tolerance is not the claim that nothing fails.",
          "High availability does not imply tolerance of every fault class.",
          "A replica in the same failure domain may not provide meaningful redundancy."
        ]
      ),
      concept(
        "Performance",
        "Performance describes how efficiently a system completes work, commonly through latency distributions, throughput, resource utilization, and cost per operation under a stated workload.",
        "Measure the user-critical path at realistic concurrency. Averages conceal tail latency, saturation, and noisy-neighbor effects.",
        "A catalog service tracks p50, p95, and p99 latency by endpoint while load tests vary cache hit rate, OpenSearch query shape, database pool size, payload size, and pod CPU limits.",
        [
          "Latency-sensitive APIs and interactive experiences",
          "Capacity tests, regression gates, and cost optimization",
          "Finding queueing and saturation before peak events"
        ],
        [
          "Lower latency may require denormalization, caching, or more capacity.",
          "Batching increases throughput but adds waiting time.",
          "Aggressive optimization may reduce maintainability without improving a meaningful SLO."
        ],
        [
          "Average latency is not representative of tail experience.",
          "A fast component does not guarantee a fast end-to-end workflow.",
          "CPU below 100% does not prove spare capacity; pools, locks, I/O, or quotas may saturate first."
        ]
      ),
      concept(
        "Latency versus throughput",
        "Latency is the time one operation takes; throughput is the amount of work completed per unit time. They interact through concurrency, batching, queueing, and resource saturation.",
        "A highway can move many cars per minute yet each trip may be slow. As utilization approaches capacity, queues grow and tail latency can rise sharply before throughput improves.",
        "A Kafka producer batches order events for higher messages per second, accepting a few milliseconds of linger; a synchronous checkout call avoids large batches to protect user latency.",
        [
          "Selecting synchronous or buffered workflows",
          "Sizing concurrency pools and partition counts",
          "Defining separate interactive and bulk-workload SLOs"
        ],
        [
          "Batching and parallelism increase throughput but can raise per-item latency and memory.",
          "More concurrency helps until downstream contention or throttling dominates.",
          "Prioritizing tail latency may leave some capacity unused."
        ],
        [
          "Latency and throughput are not interchangeable measures of speed.",
          "Doubling threads does not necessarily double throughput.",
          "A throughput benchmark without latency and error distributions is incomplete."
        ]
      ),
      concept(
        "Consistency",
        "Consistency defines what values and ordering clients may observe after concurrent or distributed operations; models include linearizability, serializability, causal consistency, monotonic reads, and eventual convergence.",
        "Consistency is a contract for observations, not a single on/off property. Choose it per invariant and workflow rather than for an entire company.",
        "Inventory reservation requires an atomic conditional decrement for a SKU-location, while the search index may reflect the catalog seconds later and display an availability hint rather than a promise.",
        [
          "Protecting money, uniqueness, quotas, and inventory invariants",
          "Setting read-your-writes expectations",
          "Designing caches, replicas, indexes, and cross-region data"
        ],
        [
          "Stronger guarantees require coordination that adds latency or reduces availability during partitions.",
          "Weaker guarantees improve locality and scale but move conflict and stale-read handling to the application.",
          "Mixed models reduce cost but require explicit user-facing semantics."
        ],
        [
          "Eventual consistency does not mean data is randomly wrong forever.",
          "ACID and CAP consistency describe different concerns.",
          "Reading from a replica is not automatically safe for read-after-write flows."
        ]
      ),
      concept(
        "CAP theorem",
        "CAP states that when a network partition prevents nodes from communicating, a distributed read/write system cannot simultaneously guarantee linearizable consistency and availability for every request.",
        "Partitions force a runtime choice: reject or delay some operations to preserve a single current truth, or keep serving and accept divergent observations that must later reconcile.",
        "During a region link failure, an order-id allocator may stop writes in the isolated region to preserve uniqueness, while shopping carts accept local writes and merge item changes after connectivity returns.",
        [
          "Reasoning about partition-time behavior",
          "Classifying invariants by whether stale or conflicting writes are tolerable",
          "Designing multi-region routing and reconciliation"
        ],
        [
          "CP behavior protects strong invariants but sacrifices some request availability during partition.",
          "AP behavior sustains local progress but requires conflict semantics and may show stale state.",
          "Different operations in the same product can make different choices."
        ],
        [
          "CAP is not ‘choose any two’ during normal operation; partition tolerance is not optional for a genuinely distributed system.",
          "CAP does not say which trade-off to make when the network is healthy.",
          "Availability in CAP is a strict per-request property, not the same as a monthly uptime SLO."
        ]
      ),
      concept(
        "PACELC",
        "PACELC extends CAP: if there is a Partition, choose Availability or Consistency; Else, during normal operation, choose lower Latency or stronger Consistency.",
        "The everyday replication path matters more often than a rare partition. Cross-region coordination can protect fresh reads while taxing every request with distance latency.",
        "A DynamoDB global-table cart favors local latency and asynchronous convergence, while a payment ledger keeps a single write authority or uses quorum coordination for a stricter invariant.",
        [
          "Comparing replicated database behavior in healthy and partitioned states",
          "Selecting regional read and write paths",
          "Explaining why consistency choices affect steady-state latency"
        ],
        [
          "Local quorum or primary reads improve freshness but add coordination and tail latency.",
          "Asynchronous replication improves locality but increases lag and conflict windows.",
          "Hybrid strategies require routing rules and clear session semantics."
        ],
        [
          "PACELC is a reasoning lens, not a complete database-selection rubric.",
          "Low latency is not guaranteed merely by choosing an eventually consistent store.",
          "A product can use different PACELC choices for different entities or operations."
        ]
      ),
      concept(
        "Vertical versus horizontal scaling",
        "Vertical scaling gives one node more CPU, memory, I/O, or network; horizontal scaling distributes work across more nodes or partitions.",
        "Scale up to buy simplicity while headroom exists; scale out when workload, availability, or failure-domain needs justify distribution.",
        "Moving an Amazon RDS PostgreSQL primary to a larger instance may be the safest near-term step. Stateless Spring Boot pods scale horizontally behind an ALB, and only later might the database be sharded by tenant.",
        [
          "Vertical scaling for databases and stateful systems below hard limits",
          "Horizontal scaling for stateless serving, partitionable data, and independent workers",
          "Combining both while evolving an architecture"
        ],
        [
          "Vertical scale is operationally simple but has hard ceilings, larger blast radius, and stepwise cost.",
          "Horizontal scale improves elasticity and redundancy but introduces partitioning and coordination.",
          "Data movement and rebalancing can dominate horizontal growth."
        ],
        [
          "Vertical scaling is not inherently amateurish; it can be the lowest-risk economic choice.",
          "Horizontal scaling does not remove per-node or shared-resource limits.",
          "Replicas improve read scale but usually do not scale a single write authority."
        ]
      ),
      concept(
        "Stateless versus stateful systems",
        "A stateless service can handle each request without relying on node-local conversational state; a stateful system owns or coordinates durable or session state across requests.",
        "Stateless compute is easy to replace and rebalance. State must still exist somewhere, so the architectural question is where it lives and what consistency and recovery it needs.",
        "Spring Boot API pods validate a JWT and fetch cart state from Redis or DynamoDB, allowing any pod to serve the next request. PostgreSQL and Kafka brokers remain stateful and need careful replication and recovery.",
        [
          "Stateless APIs, elastic workers, and rolling deployments",
          "Stateful databases, streams, locks, and collaborative sessions",
          "Externalizing session state to improve failover"
        ],
        [
          "External state adds a network dependency and serialization cost.",
          "Sticky sessions reduce state migration but impair balancing and failover.",
          "Stateful placement can improve locality while complicating orchestration."
        ],
        [
          "Stateless does not mean the business has no data.",
          "Storing state in a singleton cache does not make it safely distributed.",
          "Kubernetes can run stateful workloads, but it does not supply database semantics automatically."
        ]
      ),
      concept(
        "Synchronous versus asynchronous communication",
        "Synchronous communication couples a caller to an immediate response; asynchronous communication records or sends work for later processing without holding the original call open.",
        "Use synchronous paths when the user needs an answer now and asynchronous paths to absorb bursts, decouple timing, fan out side effects, or tolerate temporary consumer failure.",
        "Checkout synchronously validates the cart and commits Order=PENDING plus an outbox record. A durable orchestrator then reserves inventory and authorizes payment; success moves the order to CONFIRMED and emits OrderConfirmed, while fulfillment, analytics, and notifications proceed asynchronously.",
        [
          "Synchronous reads, validations, and commands requiring immediate confirmation",
          "Asynchronous emails, indexing, integration, and long-running jobs",
          "Hybrid workflows that return 202 with an operation-status resource"
        ],
        [
          "Synchronous calls simplify request semantics but compound latency and runtime dependency failure.",
          "Asynchrony improves buffering and autonomy but adds eventual consistency, duplicates, ordering, and observability work.",
          "Queues shift rather than eliminate capacity needs; backlog age becomes a user-facing metric."
        ],
        [
          "Kafka is not automatically asynchronous if a caller blocks waiting for downstream completion.",
          "Fire-and-forget without durable handoff is data loss, not decoupling.",
          "Asynchronous workflows still require explicit success, failure, and compensation semantics."
        ]
      ),
      concept(
        "Monoliths",
        "A monolith packages and deploys the system as one runtime unit, often with shared in-process calls and a shared transactional database.",
        "A deployment boundary can contain many well-designed domain boundaries. Keeping calls local reduces distributed-systems cost while the product and team are still learning.",
        "A commerce application deploys catalog, cart, checkout, and order modules together in one Spring Boot artifact and commits a checkout transaction within one PostgreSQL database.",
        [
          "Early products, cohesive domains, and small-to-medium teams",
          "Workloads with strong multi-entity transactions",
          "Organizations without mature distributed operations"
        ],
        [
          "Simple deployment and transactions come with coupled release cadence and resource scaling.",
          "A large codebase needs enforced modular boundaries to avoid becoming a big ball of mud.",
          "One process creates a broad blast radius unless internal bulkheads and safe releases exist."
        ],
        [
          "Monolith does not mean unstructured legacy code.",
          "A monolith can scale horizontally when stateless and supported by scalable data stores.",
          "Extracting services is not the only route to team autonomy."
        ]
      ),
      concept(
        "Modular monoliths",
        "A modular monolith is one deployable system with explicitly enforced domain modules, internal contracts, data access rules, and dependency direction.",
        "It buys architectural boundaries before paying for network boundaries, making extraction possible when evidence supports it.",
        "Spring Modulith verifies that order code cannot access inventory repositories directly; modules communicate through interfaces or in-process events while sharing a deployment and potentially a database with schema ownership rules.",
        [
          "Growing products that need domain ownership but not independent operations",
          "Incremental modernization of a coupled application",
          "Testing service boundaries before extraction"
        ],
        [
          "Shared deployment limits independent scaling and release cadence.",
          "Boundaries require tooling and review discipline because runtime isolation is weak.",
          "In-process events may conceal future remote-call latency and failure semantics."
        ],
        [
          "A package structure alone does not create modularity.",
          "A modular monolith is not merely a temporary failure to adopt microservices.",
          "Shared tables across modules undermine later separation even if code packages look clean."
        ]
      ),
      concept(
        "Microservices",
        "Microservices are independently deployable services aligned to cohesive business capabilities, with explicit contracts and autonomous ownership of logic and usually data.",
        "Distribution is justified when independent change, scaling, isolation, or ownership is worth the cost of networks, eventual consistency, platform engineering, and cross-service operations.",
        "Catalog search scales and deploys independently from order management; each owns its data, integrates through versioned REST or Kafka contracts, and carries its own SLO, telemetry, runbook, and on-call owner.",
        [
          "Distinct domains with different change cadence or scaling profiles",
          "Multiple teams that can own services end to end",
          "Isolation of high-risk or regulated capabilities such as payment"
        ],
        [
          "Autonomy and fault isolation trade against distributed transactions, contract evolution, and platform cost.",
          "Fine-grained services increase call depth, cognitive load, and on-call fragmentation.",
          "Database-per-service protects ownership but requires projections, APIs, or events for cross-domain views."
        ],
        [
          "Microservices are not the default target state for every system.",
          "Independent repositories do not create autonomy when releases or databases remain coupled.",
          "A service should follow a domain boundary, not an arbitrary line count or CRUD entity."
        ]
      ),
      concept(
        "Event-driven systems",
        "An event-driven system communicates meaningful facts as durable events that producers publish and interested consumers process, often asynchronously.",
        "Events make completed state changes observable without the producer knowing every downstream action. That temporal decoupling shifts complexity into contracts, ordering, idempotency, replay, and governance.",
        "After committing an order and outbox row, a relay publishes OrderPlaced to Kafka. Inventory, fulfillment, notification, fraud, and analytics consume independently and maintain their own projections.",
        [
          "Cross-domain integration and fan-out",
          "Audit streams, materialized views, and near-real-time pipelines",
          "Burst absorption and independently recoverable consumers"
        ],
        [
          "Loose temporal coupling comes with eventual consistency and difficult end-to-end debugging.",
          "Long retention enables replay but raises schema-evolution and side-effect safety requirements.",
          "Central event platforms reduce duplication but can create governance and ownership bottlenecks."
        ],
        [
          "Events are facts in past tense, not disguised remote commands.",
          "Exactly-once business effects do not follow automatically from exactly-once broker features.",
          "Event-driven does not mean every interaction should be asynchronous."
        ]
      )
    ],
    decisionTables: [
      {
        title: "Choose an initial architecture boundary",
        columns: ["Signal", "Monolith", "Modular monolith", "Microservices", "Event-driven integration"],
        rows: [
          ["Team and domain", "One cohesive team", "Several domain streams in one product", "Autonomous teams with stable boundaries", "Several consumers react to the same facts"],
          ["Transactions", "Frequent cross-module ACID", "ACID with enforced data ownership", "Local ACID plus sagas or reconciliation", "Local commit plus outbox; eventual projections"],
          ["Scaling", "Mostly uniform", "Mostly uniform with internal isolation", "Materially different by domain", "High fan-out, burst, or replay needs"],
          ["Operational cost", "Lowest initial", "Low-to-moderate", "High: platform, contracts, on-call", "High: schemas, lag, replay, idempotency"],
          ["Default guidance", "Good for small cohesive scope", "Strong default for evolving domains", "Use when autonomy pays for distribution", "Add where durable decoupling has a concrete benefit"]
        ]
      },
      {
        title: "Quality attribute review",
        columns: ["Attribute", "Question to quantify", "Evidence"],
        rows: [
          ["Availability", "Which operations, over what window, at what latency?", "Success-rate SLI and dependency budget"],
          ["Reliability", "Which invariants must never be violated?", "Invariant metrics, reconciliation, failure tests"],
          ["Durability", "What acknowledged data loss is tolerable?", "RPO, backup restore test, replication mode"],
          ["Performance", "At which peak load and percentile?", "Workload model, p95/p99 latency, saturation data"],
          ["Maintainability", "Who changes and operates each boundary?", "Ownership, release coupling, cognitive load"]
        ]
      }
    ],
    exercises: [
      {
        title: "Turn adjectives into architecture constraints",
        type: "requirements",
        prompt: "A stakeholder says a global cart must be fast, always available, and never lose an item. Rewrite this as measurable NFRs and identify the consistency conflict.",
        suggestedAnswer: "Define regional p99 latency, monthly successful-read/write SLOs, accepted-item durability, read-your-writes scope, conflict semantics, and RPO/RTO. Ask whether concurrent offline edits may merge. CAP/PACELC means cross-region linearizability conflicts with low local latency and partition availability; an available cart commonly uses local writes, versioned item operations, session consistency, and deterministic merge."
      },
      {
        title: "Choose a deployment boundary",
        type: "architecture critique",
        prompt: "Three teams propose 25 microservices for a new B2B pricing product with uncertain boundaries, frequent cross-entity transactions, and no 24/7 platform team. Recommend a first architecture and explicit extraction triggers.",
        suggestedAnswer: "Start with a modular monolith or a few coarse services, enforce module/data ownership, publish contracts, and instrument hotspots. Extract only when a boundary has independent ownership plus sustained need for separate scale, release, isolation, security, or technology. Treat call depth, distributed transactions, and on-call load as costs in the decision record."
      },
      {
        title: "Classify failure semantics",
        type: "what fails first",
        prompt: "A checkout API calls pricing, inventory, payment, order, email, and analytics synchronously. Identify the first scalability and reliability symptoms and redesign the critical path.",
        suggestedAnswer: "Tail latency compounds across calls, connection pools saturate, and optional dependency faults reduce checkout availability. Keep only decisions required before confirmation synchronous; use deadlines, idempotency, and a durable order workflow. Publish post-commit events for email and analytics, and model payment/inventory compensation explicitly."
      }
    ],
    quiz: [
      {
        question: "A service returns HTTP 200 for every request but occasionally commits duplicate charges. Which quality is most directly violated?",
        options: ["Availability", "Reliability", "Elasticity", "Maintainability"],
        answer: 1,
        explanation: "The endpoint is reachable, but the intended behavior is incorrect. Idempotency and reconciliation address reliability of the business effect."
      },
      {
        question: "During a network partition, both regions accept conflicting profile updates and reconcile later. What CAP posture describes those writes?",
        options: ["CP", "AP", "CA", "CAP does not apply"],
        answer: 1,
        explanation: "The system preserves write availability during partition and temporarily relaxes a single linearizable value."
      },
      {
        question: "Why does PACELC add value beyond CAP?",
        options: ["It guarantees exactly-once delivery", "It covers latency versus consistency during healthy operation", "It eliminates partitions", "It ranks databases by cost"],
        answer: 1,
        explanation: "PACELC makes the normal replication-path trade-off explicit as well as partition behavior."
      },
      {
        question: "What is the strongest evidence that a service boundary is justified?",
        options: ["The module has many classes", "A vendor recommends microservices", "It needs independent ownership or scale enough to repay distributed cost", "It uses its own package"],
        answer: 2,
        explanation: "A boundary should deliver concrete autonomy, scaling, isolation, security, or change-cadence value."
      },
      {
        question: "Which statement best distinguishes durability from availability?",
        options: ["Durability concerns acknowledged data surviving; availability concerns serving valid operations now", "Durability applies only to object storage", "Availability guarantees correctness", "They are equivalent at five nines"],
        answer: 0,
        explanation: "A system can be temporarily unavailable while its data remains durable, or available while acknowledging non-durable writes."
      }
    ],
    takeaways: [
      "Start with measurable workload, correctness, recovery, security, cost, and ownership constraints; architecture styles are downstream choices.",
      "Define qualities at an end-to-end operation boundary. Availability, reliability, durability, and fault tolerance answer different questions.",
      "Treat consistency as a per-invariant contract. CAP explains partition choices; PACELC exposes normal latency-versus-consistency cost.",
      "Prefer the least distributed architecture that meets current requirements, while making module and data ownership explicit enough to evolve.",
      "A lead engineer communicates assumptions, alternatives, failure behavior, and triggers for revisiting the decision—not only the chosen topology."
    ]
  };

  const estimation = {
    id: "estimation-capacity-planning",
    number: 2,
    title: "Estimation and Capacity Planning",
    summary: "Convert product assumptions into order-of-magnitude traffic, storage, network, cache, queue, availability, and latency constraints—and use measurements to refine the model.",
    duration: "4-6 hours",
    objectives: [
      "Build a transparent workload model from users, actions, read/write mix, seasonality, and peaks.",
      "Estimate steady-state and growth capacity with units, headroom, replication, and retention included.",
      "Allocate availability and latency across dependencies without treating targets as independent wishes.",
      "Use estimates to expose design decisions and validation tests, not to manufacture false precision."
    ],
    topics: [
      calculationTopic(
        "Requests per second",
        "Translate business actions into average RPS by operation, then apply hourly and event peaks separately. Keep reads, writes, cache misses, and fan-out visible because they stress different resources.",
        [
          "Choose a time window and count active users or business events in it.",
          "Multiply by actions per user or event, then divide by seconds in the window.",
          "Split by endpoint and apply peak, retry, bot, and internal fan-out factors.",
          "Compare the result with per-instance measurements at the target latency percentile."
        ],
        "RPS = active users × actions per user ÷ window seconds; peak RPS = average RPS × peak factor",
        "Eight million daily active shoppers making 20 catalog requests produce about 1,852 average catalog RPS. A 12× event peak implies roughly 22,200 RPS before retries or cache-miss fan-out.",
        "Present a range and name its sensitive assumptions. Capacity should be based on sustainable tested throughput, not a vendor maximum or one optimistic benchmark."
      ),
      calculationTopic(
        "Read/write ratios",
        "Partition demand into operation classes and follow each class through caches, replicas, primary writes, indexes, and downstream events.",
        [
          "Count user-facing reads and writes by API, not only total HTTP calls.",
          "Estimate cache and search offload to calculate database reads.",
          "Include write amplification from indexes, replicas, CDC, and derived views.",
          "Model exceptional periods such as bulk imports or flash-sale reservations separately."
        ],
        "database reads = logical reads × (1 − cache hit ratio) × queries per miss",
        "At 20,000 product-read RPS, a 92% cache hit ratio and 1.2 SQL queries per miss yield about 1,920 database query RPS; 300 catalog writes per second may also create 300 CDC events and several index writes.",
        "A 100:1 read/write ratio does not mean writes are unimportant. The write path may set the consistency, durability, and partitioning architecture."
      ),
      calculationTopic(
        "Concurrent users and in-flight work",
        "Estimate simultaneous sessions for state sizing and concurrent in-flight operations for threads, connections, and queueing. They are different quantities.",
        [
          "Estimate active sessions from arrival rate and average session duration.",
          "Estimate in-flight requests using Little's Law at each latency target.",
          "Separate open connections, actively executing requests, blocked I/O, and background tasks.",
          "Verify pools and per-node memory against peak concurrency plus headroom."
        ],
        "concurrency ≈ arrival rate × average time in system (Little's Law)",
        "At 5,000 checkout RPS and 400 ms average latency, about 2,000 requests are in flight. If each request synchronously opens three downstream calls, downstream connection demand can be much higher.",
        "Java virtual threads change thread cost, not database connection or downstream capacity. Bound scarce resources explicitly and watch queue time."
      ),
      calculationTopic(
        "Peak traffic",
        "Model sustained daily peaks, short bursts, planned events, and failover peaks. Use separate multipliers because a ten-second retry storm and a four-hour sale demand different controls.",
        [
          "Derive seasonality and peak-to-average ratios from comparable telemetry when available.",
          "Add launch, campaign, bot, retry, and cache-cold scenarios.",
          "Apply loss-of-zone or loss-of-region capacity to the surviving fleet.",
          "Specify burst duration and autoscaling reaction time, then size buffers or warm capacity."
        ],
        "required surviving capacity = peak demand × safety factor ÷ remaining capacity fraction",
        "A 60,000 RPS sale with 30% headroom needs 78,000 RPS. To survive losing one of three equal zones without shedding traffic, each zone cannot be planned near one-third of 78,000; the remaining two must carry it.",
        "Do not apply one arbitrary multiplier everywhere. Use event-specific scenarios and define which traffic may be degraded or shed."
      ),
      calculationTopic(
        "Storage estimation",
        "Estimate logical bytes from entity count and realistic encoded size, then add indexes, versions, tombstones, metadata, replication, backups, and growth headroom.",
        [
          "List durable record and blob types with average and p95 sizes.",
          "Multiply creation rate by retention and compression assumptions.",
          "Add primary/secondary indexes, replication, write-ahead logs, and backup copies.",
          "Project multiple horizons and identify the operational threshold before the hard maximum."
        ],
        "physical storage ≈ records × encoded bytes × (1 + index overhead) × replicas + backups",
        "Ten million orders per month at 3 KB logical size retained for seven years are about 2.52 TB raw. Two 35% indexes, three data copies, and one compressed backup can move the provisioned footprint well beyond 10 TB.",
        "Measure real serialization and compression. Small-row metadata and index overhead make headline payload size a weak planning input."
      ),
      calculationTopic(
        "Bandwidth estimation",
        "Calculate ingress and egress from payload size, response fan-out, replication, compression, and protocol overhead; separate public egress from intra-region and cross-region transfer.",
        [
          "Estimate request and response bytes by endpoint at peak RPS.",
          "Add TLS, headers, retries, replication, and broker traffic.",
          "Separate bits from bytes and use decimal versus binary units consistently.",
          "Compare throughput with NIC, load-balancer, NAT, service-mesh, and cloud quota limits."
        ],
        "bandwidth in bits/s = requests/s × average bytes/request × 8",
        "25,000 image-manifest responses per second at 40 KB each require roughly 8 Gb/s before protocol overhead. CDN cache hits can remove most origin egress; cross-region replication remains separately billable.",
        "Network cost often changes the design before raw bandwidth limits do. Include cross-zone and cross-region paths in the cost model."
      ),
      calculationTopic(
        "Cache sizing",
        "Size the hot working set, not the full database, and budget entry overhead, fragmentation, replication, eviction policy, and failure headroom.",
        [
          "Rank access frequency and estimate how many objects produce the target hit ratio.",
          "Measure serialized key and value sizes plus Redis object overhead.",
          "Multiply by replicas and reserve memory for failover, rebalancing, and fragmentation.",
          "Load-test hit rate, eviction churn, origin capacity, and cold-start behavior."
        ],
        "cache bytes ≈ hot entries × (key + encoded value + metadata) × replicas ÷ target utilization",
        "Five million 2 KB product summaries with about 250 bytes of key/metadata use roughly 11.25 GB logical. With two copies and a 70% target utilization, plan around 32 GB before observing real fragmentation.",
        "A high hit ratio can still miss expensive keys. Track origin load avoided, hit rate by endpoint and tenant, and hot-key concentration."
      ),
      calculationTopic(
        "Database growth",
        "Model data, indexes, transaction logs, vacuum or compaction space, temporary query space, and operational thresholds over time.",
        [
          "Compute net daily ingest after deletes and retention.",
          "Add index and log growth, including replica or CDC lag windows.",
          "Project when tables, partitions, or instances cross chosen service limits.",
          "Schedule partition creation, archival, resharding, or instance changes before the threshold."
        ],
        "future size = current size + (daily ingest − daily expiry) × days, adjusted for index and storage-engine overhead",
        "A 2 TB order database adding 12 GB net per day reaches 4 TB in about 167 days before growth headroom. Monthly partitions and archival must be implemented and restore-tested before that date.",
        "Capacity is an operational timeline. Attach owners and lead time to every forecasted threshold."
      ),
      calculationTopic(
        "Replication overhead",
        "Account for extra storage, write traffic, cross-zone or cross-region bandwidth, apply lag, quorum acknowledgements, and reduced surviving capacity.",
        [
          "Count full, incremental, and backup copies by failure domain.",
          "Estimate bytes replicated from write rate, log amplification, and compression.",
          "Model normal lag plus catch-up traffic after outage or maintenance.",
          "Test write latency and availability under replica loss and network degradation."
        ],
        "replication egress ≈ primary change bytes/s × remote replica count; storage copies = primary + replicas + backups",
        "An 80 MB/s logical change stream copied to two remote regions can exceed 160 MB/s of inter-region traffic before protocol and log overhead. Catch-up after a one-hour outage requires replaying at least 288 GB while new writes continue.",
        "Replication has both steady-state and recovery capacity. A replica that cannot catch up under continued peak load is not a credible recovery control."
      ),
      calculationTopic(
        "Message throughput",
        "Estimate records and bytes per second by topic, partitions needed for consumer parallelism, retention bytes, retry traffic, and maximum tolerable backlog age.",
        [
          "Count events per business transaction and include fan-out or compaction behavior.",
          "Calculate peak messages and bytes per second with producer batching.",
          "Choose partitions from measured per-partition throughput and required consumer parallelism.",
          "Model consumer outage: backlog bytes, catch-up rate, retention, and downstream replay safety."
        ],
        "backlog records = (arrival rate − processing rate) × duration; catch-up time = backlog ÷ (processing rate − arrival rate)",
        "At 30,000 events/s, a consumer processing 20,000/s accumulates 36 million events in an hour. If later capacity is 45,000/s, catch-up takes 40 minutes while arrivals continue.",
        "Partition count is difficult to reduce and affects ordering. Size for a measured range, then use keys that spread load without violating ordering requirements."
      ),
      calculationTopic(
        "Availability targets",
        "Translate business criticality into an end-to-end SLO, error budget, dependency targets, and planned failure behavior for each user journey.",
        [
          "Define a valid event and a good outcome, including latency threshold.",
          "Choose a measurement window and target based on business loss and user tolerance.",
          "Allocate a budget across serial dependencies, deployments, capacity, and operations.",
          "Define fallback, freeze, and escalation policies as the budget is consumed."
        ],
        "allowed bad time = window × (1 − target); serial availability ≈ product of required dependency availabilities",
        "99.9% allows about 43.2 minutes in 30 days; 99.99% allows about 4.32 minutes. Four required dependencies each at 99.95% yield roughly 99.80% before considering the application itself.",
        "Do not promise an end-to-end SLO above what uncontrolled critical dependencies and recovery practice can support. Reduce serial dependencies or add safe fallback."
      ),
      calculationTopic(
        "Latency budgets",
        "Allocate an end-to-end percentile target across edge, service, dependencies, data, and queue time while preserving contingency for variance and retries.",
        [
          "Start from the user-facing percentile and measurement boundary.",
          "Map serial and parallel critical-path operations.",
          "Assign deadlines and budgets using observed percentile distributions, not averages.",
          "Reserve headroom and ensure client timeouts exceed internal deadlines without enabling runaway work."
        ],
        "serial path latency ≈ sum of serial stages; parallel branch latency ≈ maximum branch latency, plus coordination overhead",
        "For a 500 ms p99 product-page API: reserve 60 ms at edge, 40 ms application work, 120 ms catalog, 100 ms pricing/inventory in parallel, 80 ms rendering/serialization, and 100 ms contingency. Correlated tails require end-to-end tests.",
        "Percentiles are not simply additive, yet a budget is still useful for ownership. Validate the combined distribution under representative concurrency."
      ),
      calculationTopic(
        "Back-of-the-envelope estimation",
        "Use a few explicit assumptions and powers-of-ten arithmetic to determine the likely dominant resource, then bound uncertainty and identify what must be measured next.",
        [
          "Write assumptions with units before calculating.",
          "Round to useful precision and compute low, expected, and high cases.",
          "Cross-check via a second path, such as daily volume versus peak RPS.",
          "Turn the result into a design implication, capacity test, and monitoring threshold."
        ],
        "estimate = workload × size or time × amplification × retention or peak factors",
        "If 100 million daily feed reads return 50 items averaging 700 bytes, raw daily response payload is about 3.5 TB. The result suggests CDN/compression and precomputed-feed evaluation, but real cacheability and response distribution must be measured.",
        "The purpose is decision resolution. Report ‘roughly 20k-40k peak RPS’ with assumptions, not ‘31,746 RPS’ without evidence."
      )
    ],
    workedExamples: [
      {
        title: "Flash-sale checkout capacity",
        scenario: "A retailer expects a 20-minute product drop with 1.2 million waiting users. Ten percent attempt checkout, most in the first five minutes.",
        assumptions: [
          "120,000 checkout attempts in five minutes, with a 2.0 burst factor inside ten-second intervals",
          "Each attempt makes one idempotent order command, two inventory operations, and one payment authorization",
          "15% payment decline and 5% client retry rate; retries reuse the same idempotency key",
          "Each application pod sustains 65 checkout RPS at p99 below 700 ms in a representative load test"
        ],
        calculations: [
          "Average attempt rate during the hot five minutes = 120,000 ÷ 300 = 400 RPS.",
          "Short-burst arrival ≈ 400 × 2.0 × 1.05 = 840 command RPS.",
          "At 65 RPS/pod, 840 ÷ 65 = 12.9; preserving 40% headroom after losing one of three zones requires at least 28 evenly spread pods, so provision 30 and validate downstream limits.",
          "Inventory sees roughly 1,680 operations/s; payment sees up to 840 requests/s but needs a provider-specific rate and timeout budget.",
          "If payment slows to 3 seconds, in-flight payment calls approach 2,520; bulkhead and queue limits must prevent exhausting the general request pool."
        ],
        decision: "Admission-control checkout attempts, reserve inventory atomically with expiry, use idempotency keys for order/payment, isolate payment concurrency, pre-scale rather than relying on reactive autoscaling, and publish downstream fulfillment work after a durable order transition."
      },
      {
        title: "Seven-year order storage",
        scenario: "A marketplace retains order records online for two years and in an archive for five more, with audit and disaster-recovery requirements.",
        assumptions: [
          "6 million orders/month, 4 KB canonical order snapshot, and 8 state-transition events averaging 900 bytes",
          "Database indexes add 45% to snapshot size; three database copies are maintained",
          "Events compress to 45% in object storage and have two regional copies",
          "20% annual order growth"
        ],
        calculations: [
          "Year-one snapshots = 72 million × 4 KB ≈ 288 GB logical; indexes raise this to about 418 GB per copy.",
          "Three database copies require about 1.25 TB for year one before WAL, free space, and backup overhead.",
          "Year-one events = 72 million × 8 × 0.9 KB ≈ 518 GB raw; compressed two-copy archive is about 466 GB.",
          "A two-year online horizon grows by a factor of 1 + 1.2 = 2.2 over the first-year baseline, requiring partition and restore planning rather than one static number."
        ],
        decision: "Partition online data by time while preserving order-id lookup indexes, archive immutable snapshots/events to encrypted object storage, keep a tested retrieval path, and attach lifecycle policies to legal holds rather than unconditional deletion."
      },
      {
        title: "Kafka backlog and recovery",
        scenario: "Catalog changes feed an OpenSearch index. Peak production is 18,000 events/s and consumers normally process 24,000/s.",
        assumptions: [
          "Average compressed event size is 1.5 KB",
          "Consumers are unavailable for 45 minutes during an index incident",
          "After restoration, safe processing capacity is 30,000 events/s while new events remain at peak",
          "Topic retention is 48 hours and replicas factor is three"
        ],
        calculations: [
          "Backlog = 18,000 × 2,700 seconds = 48.6 million events, about 72.9 GB of payload.",
          "Net catch-up rate = 30,000 − 18,000 = 12,000 events/s.",
          "Catch-up time = 48.6 million ÷ 12,000 = 4,050 seconds, or 67.5 minutes.",
          "Normal peak ingress is about 27 MB/s payload; replicated broker storage and network are roughly three times payload before overhead."
        ],
        decision: "Alert on backlog age rather than raw count, verify replay-safe upserts and mapping compatibility, provision recovery headroom, and degrade search freshness indicators rather than overload the primary catalog database."
      }
    ],
    reusableTemplates: [
      {
        name: "Workload envelope",
        fields: [
          "Users or business events per day",
          "Actions per user by operation",
          "Average, sustained peak, and short-burst RPS",
          "Read/write/cache-miss mix",
          "Payload and response size distribution",
          "Growth horizon, seasonal event, and failover case"
        ],
        calculation: "For each operation: daily volume ÷ 86,400; apply measured peak factors, retries, fan-out, and headroom."
      },
      {
        name: "Data footprint",
        fields: [
          "Record or object type and encoded size",
          "Creation rate and retention",
          "Index, metadata, compression, and tombstone overhead",
          "Replica, backup, archive, and regional copy counts",
          "Growth and deletion rates",
          "Operational utilization threshold"
        ],
        calculation: "Logical bytes × storage-engine amplification × copies, projected at low/expected/high growth."
      },
      {
        name: "Queue recovery",
        fields: [
          "Peak arrival rate and record bytes",
          "Normal and degraded processing rates",
          "Maximum outage duration",
          "Maximum acceptable backlog age",
          "Retention and retry/DLQ rates",
          "Catch-up capacity without downstream overload"
        ],
        calculation: "Backlog = arrival × outage; catch-up time = backlog ÷ (recovery capacity − ongoing arrival)."
      },
      {
        name: "SLO and latency budget",
        fields: [
          "User journey and success event",
          "Availability target and window",
          "End-to-end percentile latency",
          "Critical dependency and fallback list",
          "RTO/RPO and deployment budget",
          "Actions at 25%, 50%, and 100% budget consumption"
        ],
        calculation: "Allowed failures = eligible events × (1 − SLO); allocate latency and failure budget to the critical path, then validate end to end."
      }
    ],
    latencyBudget: {
      title: "Example p99 checkout budget",
      target: "800 ms from API gateway ingress to durable checkout response",
      allocations: [
        ["Gateway, authentication, and rate limit", "60 ms", "Fail closed for invalid identity; local verification where safe"],
        ["Checkout validation and orchestration", "90 ms", "Includes serialization and state-machine work"],
        ["Cart and pricing in parallel", "140 ms", "Deadline each branch; define price-snapshot semantics"],
        ["Inventory reservation", "130 ms", "Atomic conditional write on critical key"],
        ["Payment authorization", "260 ms", "Provider deadline, idempotency, isolated connection pool"],
        ["Order commit and outbox", "70 ms", "One local transaction before acknowledgement"],
        ["Contingency", "50 ms", "Queue variance and network jitter; not a retry allowance"]
      ],
      guidance: "Use one absolute request deadline propagated downstream. Do not stack per-hop timeouts that can exceed the caller budget, and measure the combined p99 because dependent tails may correlate."
    },
    availabilityMath: {
      monthlyAllowances: [
        ["99%", "7 h 12 min in 30 days"],
        ["99.9%", "43 min 12 sec in 30 days"],
        ["99.95%", "21 min 36 sec in 30 days"],
        ["99.99%", "4 min 19 sec in 30 days"]
      ],
      examples: [
        "Serial path: application 99.95% × database 99.99% × required payment provider 99.95% ≈ 99.89%, before other dependencies.",
        "Parallel redundant path, assuming independent failures: two 99.9% instances provide 1 − (0.001 × 0.001) = 99.9999% component availability; common dependencies and correlated failure make the real number lower.",
        "Error budget: at 50 million eligible monthly checkout attempts and 99.95% SLO, 25,000 may be bad. Budget policy matters more than expressing the percentage alone."
      ],
      caution: "Independence assumptions are often false: replicas share regions, credentials, code, quotas, and deployment pipelines. Model common-mode failures explicitly and verify with game days."
    },
    decisionTables: [
      {
        title: "Estimate to architecture decision",
        columns: ["Estimate reveals", "Likely response", "Validation"],
        rows: [
          ["Read-dominated, stable hot set", "Cache and read replicas before sharding", "Hit distribution, origin load, stale-read tolerance"],
          ["Write throughput exceeds one partition", "Choose a distributable key or isolate write domains", "Hot-key test, rebalance time, cross-partition operations"],
          ["Short peak exceeds autoscaling reaction", "Warm capacity, admission control, queue or token bucket", "Burst load and cold-cache test"],
          ["Backlog recovery exceeds freshness SLO", "More consumer headroom, partitions, or degradable work", "Outage-and-catch-up game day"],
          ["Serial dependency SLO misses target", "Remove dependency, cache, fallback, or renegotiate SLO", "End-to-end synthetic and failure test"]
        ]
      },
      {
        title: "Headroom by workload type",
        columns: ["Workload", "Plan for", "Watch"],
        rows: [
          ["Interactive API", "Tail latency at sustained peak plus failure capacity", "Queue time, pool saturation, retries"],
          ["Stream consumer", "Peak ingress plus catch-up margin", "Backlog age, skew, downstream throttling"],
          ["Batch", "Completion deadline and coexistence with online traffic", "I/O contention, spill, checkpoint recovery"],
          ["Stateful store", "Growth lead time, failover, compaction or vacuum", "Disk/IOPS, hot partitions, replication lag"]
        ]
      }
    ],
    exercises: [
      {
        title: "Estimate a product-search tier",
        type: "capacity",
        prompt: "Twenty million daily users run eight searches each. Traffic peaks at 10× average, responses average 18 KB compressed, and 85% of responses are served at the CDN or edge cache. Estimate peak query RPS and origin egress; list the three assumptions that most affect the answer.",
        suggestedAnswer: "Average is about 1,852 search RPS and peak about 18,520 RPS. At 15% origin traffic, origin responses are about 2,778 RPS and roughly 50 MB/s or 400 Mb/s before protocol/retry overhead. Peak concentration, cacheability by query, and response-size distribution dominate."
      },
      {
        title: "Find the pool bottleneck",
        type: "find the bottleneck",
        prompt: "A pod handles 300 RPS at 120 ms average latency and uses a 30-connection database pool. A new query holds a connection for 180 ms on 40% of requests. Estimate connection demand per pod and predict the symptom.",
        suggestedAnswer: "Demand is 300 × 0.4 × 0.18 ≈ 21.6 connections on average, leaving little tail or burst headroom. Queue time and p99 latency rise before CPU saturates; more pods can also overwhelm the database. Optimize/offload the query and coordinate application and database capacity."
      },
      {
        title: "Budget a four-nines API",
        type: "availability",
        prompt: "An API target is 99.99%, but it synchronously requires three vendor services contracted at 99.95% each. Explain why the target is not credible and propose options.",
        suggestedAnswer: "Under an independence simplification the vendor chain alone is about 99.85%, far below target. Remove calls from the critical path, cache verified data, define safe fallbacks, make some work asynchronous, obtain stronger vendor commitments, or set a realistic end-to-end SLO."
      }
    ],
    quiz: [
      {
        question: "At 2,000 requests/s with 250 ms mean time in the system, what is approximate in-flight concurrency?",
        options: ["250", "500", "2,000", "8,000"],
        answer: 1,
        explanation: "Little's Law gives 2,000 × 0.25 = 500 in-flight requests."
      },
      {
        question: "A consumer receives 10,000 events/s and processes 8,000/s for 30 minutes. How large is the new backlog?",
        options: ["60,000", "600,000", "3.6 million", "18 million"],
        answer: 2,
        explanation: "The deficit is 2,000 events/s for 1,800 seconds, or 3.6 million events."
      },
      {
        question: "What is missing from an estimate based only on average daily RPS?",
        options: ["A programming language", "Peak shape, duration, retries, and failover demand", "An exact cloud bill", "A class diagram"],
        answer: 1,
        explanation: "Capacity and queue behavior depend on peak magnitude and duration, plus amplification and surviving capacity."
      },
      {
        question: "Why can a 95% cache hit ratio still overload the origin?",
        options: ["Cache hits always query the database", "Misses may concentrate on costly or hot keys and peak traffic may be large", "Redis cannot store strings", "Percentages apply only to writes"],
        answer: 1,
        explanation: "Aggregate hit rate hides miss cost, key skew, and absolute miss volume."
      },
      {
        question: "A 99.9% monthly SLO permits approximately how much bad time in 30 days?",
        options: ["4.3 minutes", "43.2 minutes", "7.2 hours", "43.2 hours"],
        answer: 1,
        explanation: "Thirty days contain 43,200 minutes; 0.1% is 43.2 minutes."
      }
    ],
    takeaways: [
      "Write assumptions and units first, calculate ranges, and make the result traceable to a design decision.",
      "Separate averages, sustained peaks, short bursts, growth, retries, and failover. They require different controls.",
      "Include amplification: cache misses, indexes, replicas, CDC, events, backups, and recovery traffic consume real capacity.",
      "Capacity plans need operational lead time, headroom, and a validation method; a spreadsheet without telemetry and load tests is not a control.",
      "Budget availability and latency end to end, then remove or degrade critical dependencies that cannot support the promise."
    ]
  };

  const buildingBlocks = {
    id: "core-building-blocks",
    number: 3,
    title: "Core Building Blocks",
    summary: "Understand the mechanics, limits, and failure behavior of the components commonly used to build scalable systems, then compose them only where each solves a named problem.",
    duration: "10-14 hours",
    objectives: [
      "Explain what each infrastructure component contributes to a request, data, or control path.",
      "Select components from workload and failure requirements instead of technology popularity.",
      "Recognize shared bottlenecks, operational limits, and common-mode failures in a composed architecture.",
      "Design bounded retries, idempotency, isolation, partitioning, and observability into the path from the start."
    ],
    topics: [
      component(
        "DNS",
        "Clients need a stable, human-meaningful name that can resolve to changing service endpoints and sometimes steer users by geography or policy.",
        "A recursive resolver walks or caches the hierarchy from root to top-level domain to authoritative name servers. Authoritative records map names through A/AAAA, CNAME, alias, or service records; TTL controls resolver caching, not an instantaneous global switch.",
        [
          "Public entry points, regional traffic steering, domain verification, and service bootstrap",
          "Weighted or latency-aware migration where coarse-grained, TTL-delayed changes are acceptable"
        ],
        [
          "Do not use public DNS as a per-request load balancer or assume unhealthy answers disappear immediately.",
          "Do not expose volatile pod addresses directly; Kubernetes Services and CoreDNS provide cluster discovery."
        ],
        [
          "Authoritative-provider outage, resolver failure, stale or negative caching, misconfigured delegation, certificate/name mismatch, and DNS hijacking",
          "A bad record can persist for its prior TTL; clients and JVMs may apply additional caching."
        ],
        [
          "Authoritative and resolver query quotas, record-set limits, TTL convergence, and coarse health signals",
          "Large responses can trigger TCP fallback; hot zones and DDoS require provider capacity."
        ],
        [
          "Use infrastructure as code, staged weighted changes, DNSSEC where justified, monitored synthetic resolution, and tested registrar recovery.",
          "Keep TTLs long in stable state, lower them before planned migration, and account for clients that ignore expectations."
        ],
        ["Amazon Route 53", "Cloudflare DNS", "Google Cloud DNS", "BIND", "Kubernetes CoreDNS"],
        [
          "Low TTL accelerates planned changes but increases query load and does not guarantee immediate failover.",
          "Single-provider simplicity concentrates a control-plane failure; multi-provider DNS adds delegation and consistency complexity."
        ]
      ),
      component(
        "Content delivery networks (CDNs)",
        "Users far from the origin experience propagation delay, and popular static or cacheable content can overwhelm origin compute and network egress.",
        "A CDN terminates connections at edge points of presence, serves objects by cache key and policy, and fetches misses from an origin or origin shield. It may also provide compression, TLS, request filtering, image transforms, and limited edge compute.",
        [
          "Static assets, software downloads, video segments, public product media, and safely cacheable API responses",
          "Global latency reduction, DDoS absorption, and origin offload"
        ],
        [
          "Avoid caching personalized, authorization-sensitive, or rapidly changing responses without a deliberate cache key and invalidation contract.",
          "A CDN is not a substitute for origin capacity when requests have low reuse."
        ],
        [
          "Stale content, cache poisoning, key explosion, regional edge outage, invalidation delay, and thundering-herd origin fetches",
          "Incorrect Vary, Cookie, or authorization handling can leak one user's content to another."
        ],
        [
          "Per-object and total cache limits, purge rate, edge-compute quotas, origin connection limits, and low hit ratio for long-tail keys",
          "Large flash crowds on an uncached key can collapse the origin unless request coalescing or shielding is used."
        ],
        [
          "Version immutable assets, define Cache-Control and stale-if-error deliberately, protect origins so they cannot be bypassed, and monitor hit ratio plus origin bytes avoided.",
          "Test invalidation, signed URL/cookie expiry, regional degradation, and cache-key changes."
        ],
        ["Amazon CloudFront", "Fastly", "Akamai", "Cloudflare CDN", "CloudFront Functions and Lambda@Edge"],
        [
          "Long TTL and immutable versions maximize hit rate but require versioned publishing; frequent purge improves freshness but increases operational coupling.",
          "Edge logic lowers latency but multiplies deployment, observability, and vendor-portability concerns."
        ]
      ),
      component(
        "Reverse proxies",
        "Backend topology, TLS, routing, compression, and cross-cutting connection behavior should not be reimplemented by every application process.",
        "A reverse proxy accepts client connections, optionally terminates TLS, normalizes and routes requests to upstream pools, and can apply buffering, header policy, compression, caching, and timeouts while hiding origin addresses.",
        [
          "Ingress routing, TLS termination, legacy-to-modern migration, static delivery, and protocol normalization",
          "Protecting applications with request size, header, connection, and timeout limits"
        ],
        [
          "Avoid embedding business authorization or complex workflow orchestration in proxy configuration.",
          "Do not add another hop when the platform load balancer already provides the required behavior."
        ],
        [
          "Misrouted paths, header spoofing, oversized buffers, connection exhaustion, retry amplification, and a shared-proxy outage",
          "Incorrect trusted-proxy configuration can corrupt client identity, scheme, or security decisions."
        ],
        [
          "Concurrent connections, file descriptors, TLS handshakes, memory buffers, network throughput, and configuration reload behavior",
          "Long-lived streaming connections need different timeouts and balancing from short HTTP requests."
        ],
        [
          "Pin and test configuration, strip untrusted forwarding headers, propagate request IDs, set bounded buffers/deadlines, and expose upstream latency and response metrics.",
          "Run multiple instances across failure domains and automate certificate rotation."
        ],
        ["NGINX", "Envoy", "HAProxy", "Apache HTTP Server", "Kubernetes Ingress controllers"],
        [
          "Central policy is consistent but creates a high-blast-radius configuration surface.",
          "Buffering protects slow clients and applications but uses memory and can undermine streaming."
        ]
      ),
      component(
        "Load balancers",
        "Traffic must be distributed across healthy service instances while instance membership, capacity, and failure change over time.",
        "Layer 4 balancers route connections using network metadata; Layer 7 balancers inspect HTTP attributes and can terminate TLS, route by host/path/header, and apply algorithms such as round robin, least outstanding requests, or consistent hashing. Active and passive health signals control membership.",
        [
          "Horizontally scaled APIs, zone redundancy, blue/green and canary rollout, and protocol-aware routing",
          "Separating a stable public endpoint from an elastic backend fleet"
        ],
        [
          "Avoid session affinity when state can be externalized; it creates skew and weakens failover.",
          "Do not assume a healthy TCP port means the user-critical workflow is healthy."
        ],
        [
          "Bad health checks, uneven long-lived connections, draining failures, retry storms, target-registration lag, and balancer or control-plane outage",
          "A healthy fleet can still fail when all targets share a database, secret, or deployment defect."
        ],
        [
          "New connections, concurrent flows, rule counts, processed bytes, TLS rate, target ports, and per-zone capacity",
          "Hashing and sticky sessions can create hot targets; cross-zone routing may add latency and cost."
        ],
        [
          "Use shallow liveness and dependency-aware readiness carefully, configure connection draining, preserve client/request identity safely, and monitor rejected connections and target latency.",
          "Test loss of zone, target churn, slow targets, certificate rotation, and deployment rollback."
        ],
        ["AWS Application Load Balancer", "AWS Network Load Balancer", "Envoy", "HAProxy", "Kubernetes Service"],
        [
          "Layer 7 offers rich routing and telemetry at greater CPU, latency, and configuration cost than Layer 4.",
          "Aggressive health removal reacts quickly but can eject slow instances during a shared downstream incident and overload survivors."
        ]
      ),
      component(
        "API gateways",
        "External consumers need one governed edge for routing, identity enforcement, quotas, protocol adaptation, versioning, and consistent API telemetry.",
        "An API gateway terminates or proxies requests, validates identity and policy, applies rate limits and request constraints, and routes to services. Some gateways aggregate responses or translate protocols, but domain decisions should stay in owned services.",
        [
          "Public, partner, and mobile APIs with consistent authentication, quotas, analytics, and staged rollout",
          "Separating external contracts from internal service topology"
        ],
        [
          "Avoid placing business transactions, extensive transformations, or chatty orchestration in a shared gateway.",
          "For a small internal system, a load balancer plus application middleware may be enough."
        ],
        [
          "Gateway outage, policy misconfiguration, stale authorization keys, rate-limit-store failure, transformation defects, and retry amplification",
          "One global configuration change can break unrelated APIs."
        ],
        [
          "Requests, connections, payload size, integration timeout, routes, policy execution, authorizer latency, and quota-store throughput",
          "Response aggregation adds downstream fan-out and tail-latency coupling."
        ],
        [
          "Version configuration, stage and canary policy changes, cache signing keys safely, propagate correlation context, redact sensitive logs, and define fail-open/fail-closed behavior per control.",
          "Track gateway overhead separately from backend latency and test provider or regional failover."
        ],
        ["Amazon API Gateway", "Kong", "Apigee", "Envoy Gateway", "Spring Cloud Gateway"],
        [
          "Central governance improves consistency but can bottleneck team autonomy and create a wide blast radius.",
          "Managed gateways reduce operations but may impose timeout, payload, pricing, and portability constraints."
        ]
      ),
      component(
        "Application servers",
        "Business rules, API contracts, orchestration, and access to domain data need an execution environment with controlled concurrency and lifecycle.",
        "An application server accepts requests or jobs, executes domain logic, calls dependencies through bounded clients, and returns or records results. Stateless instances scale behind a balancer; stateful runtime concerns such as caches and sessions require explicit ownership.",
        [
          "REST or gRPC services, background workers, domain command handlers, and server-rendered applications",
          "Compute that benefits from process isolation, autoscaling, and rolling deployment"
        ],
        [
          "Avoid retaining authoritative state only in process memory when instances can restart or scale.",
          "Do not use request threads for unbounded jobs; accept asynchronously and expose job state."
        ],
        [
          "Memory leak, CPU throttling, garbage-collection pause, thread or connection-pool exhaustion, dependency stall, bad rollout, and noisy neighbor",
          "Blind retries and unbounded queues can keep an unhealthy pod ‘alive’ while latency explodes."
        ],
        [
          "CPU, memory, heap, concurrency, downstream pools, startup time, network, platform quotas, and the slowest required dependency",
          "Adding pods may worsen a shared database bottleneck."
        ],
        [
          "Set resource requests/limits from measurement, use readiness and graceful shutdown, propagate deadlines, bound executors and pools, and emit RED metrics plus traces.",
          "Exercise canaries, rollback, pod disruption, dependency latency, and JVM/container memory behavior."
        ],
        ["Java and Spring Boot", "Netty", "Tomcat", "Node.js", "Go", "Docker", "Kubernetes and Amazon ECS"],
        [
          "More concurrency improves utilization until contention or downstream limits increase tail latency.",
          "Containers standardize deployment but do not remove runtime tuning, patching, or capacity responsibility."
        ]
      ),
      component(
        "Caching",
        "Repeated computation or remote reads add latency, cost, and origin load even when results can be safely reused for a period.",
        "A cache stores values closer to the consumer, addressed by a key and governed by TTL, eviction, and invalidation. Common policies include cache-aside, read-through, write-through, and write-behind; local and distributed tiers can be combined.",
        [
          "Read-heavy data with temporal locality, expensive aggregation, session state, tokens, and rate-limit counters",
          "Graceful stale fallback when product semantics permit it"
        ],
        [
          "Avoid caching before defining correctness, key, invalidation, and miss behavior.",
          "Do not treat a cache as the sole durable record unless the technology and recovery design explicitly support that role."
        ],
        [
          "Stale values, thundering herd, hot keys, cache penetration, eviction storm, split local views, failover data loss, and poisoned entries",
          "A cold or unavailable cache can overload the origin; negative caching can preserve transient errors."
        ],
        [
          "Memory, network, operations per second, key skew, object size, eviction throughput, replication, and resharding",
          "Hit ratio plateaus when the working set exceeds economical memory or requests lack reuse."
        ],
        [
          "Use versioned or namespaced keys, TTL jitter, request coalescing, bounded negative caching, origin protection, and explicit freshness metrics.",
          "Monitor hit rate by cost and endpoint, evictions, memory fragmentation, hot keys, latency, and origin load during cache loss."
        ],
        ["Redis", "Amazon ElastiCache", "Caffeine", "Memcached", "HTTP and CDN caches"],
        [
          "Long TTL increases hit rate but widens staleness; invalidation improves freshness but couples write and read paths.",
          "Distributed caches share data across nodes but add a network dependency; local caches are faster but may diverge."
        ]
      ),
      component(
        "Relational databases",
        "Many domains require transactions, constraints, joins, evolving queries, and a durable authoritative record with a strong consistency model.",
        "A relational engine stores typed tables, uses indexes and a query optimizer, and protects transactions through write-ahead logging, locks or multi-version concurrency control, and recovery. Replicas and partitions extend read scale and manageability but do not erase transactional limits.",
        [
          "Orders, payments, inventory reservations, identity, and domains with relational integrity",
          "Workloads needing ACID transactions, flexible joins, and mature administrative tooling"
        ],
        [
          "Avoid forcing high-volume unbounded blobs, search relevance, or globally distributed low-latency writes into one relational primary.",
          "Do not shard until query/index tuning, data lifecycle, read offload, and vertical headroom are understood."
        ],
        [
          "Lock contention, deadlocks, connection exhaustion, replica lag, long transaction, slow query, storage/IOPS saturation, failover, corruption, and accidental full-table scan",
          "Schema changes can block or amplify writes if not designed for online rollout."
        ],
        [
          "Single-writer throughput, IOPS, storage, connection count, vacuum/compaction, replication apply rate, and cross-partition transactions",
          "Read replicas scale eligible reads but add staleness and do not help write bottlenecks."
        ],
        [
          "Measure query plans and wait events, use short transactions and bounded pools, automate backups with restore tests, monitor lag, and use expand-migrate-contract schema changes.",
          "Define failover, fencing, RPO/RTO, retention, and index ownership before production growth."
        ],
        ["PostgreSQL", "MySQL", "Amazon Aurora and RDS", "Oracle Database", "Microsoft SQL Server"],
        [
          "Strong transactions and query flexibility trade against easy multi-region write locality and transparent horizontal write scale.",
          "Managed databases reduce undifferentiated operations but keep schema, query, capacity, recovery, and cost responsibilities."
        ]
      ),
      component(
        "NoSQL databases",
        "Some workloads need predictable key-based access, flexible records, specialized relationships, time-series ingestion, or distributed write scale that does not fit a general relational model economically.",
        "NoSQL is a family: key-value, document, wide-column, graph, and time-series engines optimize different access patterns. Many distribute data by a partition key and trade joins or multi-item transactions for locality, availability, or scale.",
        [
          "Known key-based access at large scale, flexible aggregates, graph traversal, telemetry, and globally replicated user state",
          "Domains whose consistency and query needs match a specific engine's contract"
        ],
        [
          "Avoid choosing ‘NoSQL’ without naming access patterns, consistency needs, and partition keys.",
          "Do not emulate relational joins and global constraints through many expensive client requests."
        ],
        [
          "Hot partitions, uneven item size, throttling, eventual-read surprise, secondary-index amplification, schema drift, compaction pressure, and difficult ad hoc queries",
          "Application bugs can create inconsistent denormalized copies without repair tooling."
        ],
        [
          "Per-partition throughput/storage, item size, index count, cross-partition query, consistency mode, and rebalance behavior",
          "Nominal cluster scale does not solve a single celebrity key or monotonically increasing partition key."
        ],
        [
          "Design from queries and key distribution, load-test skew, version documents, track throttling and consumed capacity, and build backup/reconciliation paths.",
          "Document conditional-write, transaction, replica, and index-freshness guarantees precisely."
        ],
        ["Amazon DynamoDB", "MongoDB", "Apache Cassandra", "Neo4j", "Amazon Timestream", "Redis"],
        [
          "Predictable distributed access trades against general joins and global transactions.",
          "Denormalization improves locality but increases write amplification, schema evolution, and repair work."
        ]
      ),
      component(
        "Object storage",
        "Large immutable or append-oriented blobs need highly durable, inexpensive storage independent of application instance disks.",
        "Objects are stored under keys in buckets with metadata, checksums, lifecycle and access policies. The service distributes and replicates storage internally; clients upload or download through APIs, often using short-lived signed URLs and multipart transfer.",
        [
          "Images, video, documents, backups, archives, data-lake files, model artifacts, and static sites",
          "Large payloads that should bypass application memory and database rows"
        ],
        [
          "Avoid object storage for low-latency partial row updates, locking, or high-rate tiny transactional mutations.",
          "Do not expose a public bucket when scoped signed access or CDN origin access is sufficient."
        ],
        [
          "Permission leak, accidental deletion, incomplete multipart upload, overwritten key, regional outage, object corruption, and lifecycle-policy mistake",
          "Listing semantics and event notifications should not be treated as a transactional queue."
        ],
        [
          "Request-rate patterns, object size, multipart parts, throughput per prefix or account, API quotas, lifecycle transition, and network egress",
          "Millions of tiny objects can create request and inventory cost even when byte storage is cheap."
        ],
        [
          "Use private-by-default policy, versioning where recovery requires it, checksums, encryption, access logs, retention controls, and tested cross-region restore.",
          "Expire orphaned multipart uploads, separate tenant prefixes/keys, scan untrusted uploads, and serve public content through a CDN."
        ],
        ["Amazon S3", "Google Cloud Storage", "Azure Blob Storage", "MinIO"],
        [
          "Durability and low cost trade against database-like update/query semantics and low-latency small writes.",
          "Cross-region copies improve disaster recovery but add transfer cost, replication delay, and data-residency concerns."
        ]
      ),
      component(
        "Search engines",
        "Users need full-text relevance, filtering, facets, autocomplete, and aggregations that transactional databases are not optimized to serve at scale.",
        "Documents are analyzed into terms and stored in inverted indexes distributed across shards with replicas. Queries combine lexical or vector matching, filters, scoring, and aggregation; refresh creates searchable segments asynchronously.",
        [
          "Product and content discovery, logs, autocomplete, geo search, and read-optimized denormalized views",
          "Queries requiring ranking, language analysis, facets, fuzzy matching, or vectors"
        ],
        [
          "Avoid using search as the sole source of truth for orders, balances, or hard inventory promises.",
          "Do not index every field or allow unbounded user aggregations without cost controls."
        ],
        [
          "Stale index, mapping conflict, shard loss, heap pressure, slow query, hot shard, split brain, rejected indexing, and reindex failure",
          "Dual writes can diverge; replay from CDC or an event log needs version and deletion semantics."
        ],
        [
          "Shard count/size, heap, disk and segment merges, indexing rate, query fan-out, field cardinality, result windows, and cluster-state size",
          "Too many small shards waste resources; too few large shards limit parallelism and recovery."
        ],
        [
          "Treat indexes as rebuildable projections, use aliases for zero-downtime reindex, version mappings/templates, monitor refresh/merge/rejection/lag, and cap query complexity.",
          "Test relevance separately from latency and keep a degraded browse path when search is unavailable."
        ],
        ["OpenSearch", "Elasticsearch", "Apache Solr", "Amazon OpenSearch Service", "Lucene"],
        [
          "Near-real-time indexing and rich queries trade against freshness, storage/write amplification, and substantial operations.",
          "Denormalized documents make reads fast but require coordinated updates and full reindex plans."
        ]
      ),
      component(
        "Message queues",
        "Producers and workers need durable temporal decoupling, burst buffering, work distribution, retry scheduling, and acknowledgement semantics.",
        "A producer sends a message to a queue; one worker typically receives it under a visibility lease, performs an idempotent effect, and acknowledges deletion. Failed or timed-out deliveries become visible again and can eventually move to a dead-letter queue.",
        [
          "Task distribution, email, image processing, webhook delivery, order side effects, and burst absorption",
          "Work where one successful consumer should handle each message and moderate reordering is acceptable"
        ],
        [
          "Avoid queues for durable replay by many independent consumer groups when an event log fits better.",
          "Do not enqueue work without defining duplicate, poison-message, expiry, and backlog behavior."
        ],
        [
          "Duplicate delivery, poison message, visibility timeout expiry, lost acknowledgement, DLQ accumulation, backlog growth, hot FIFO group, and broker outage",
          "Retrying a permanently invalid message wastes capacity and can block ordered groups."
        ],
        [
          "Messages and bytes per second, message size, in-flight count, ordering groups, consumers, retention, acknowledgement rate, and downstream capacity",
          "Adding consumers stops helping when the queue is ordered by one key or the downstream service is saturated."
        ],
        [
          "Make consumers idempotent, choose visibility from processing distribution with lease extension, bound attempts, classify retryable errors, alert on oldest-message age, and give DLQs an owned replay process.",
          "Carry correlation, causation, schema version, and trace context without leaking secrets."
        ],
        ["Amazon SQS", "RabbitMQ", "Azure Service Bus", "Google Cloud Tasks", "ActiveMQ"],
        [
          "At-least-once delivery is resilient and practical but requires idempotent effects.",
          "FIFO ordering simplifies some workflows but lowers parallelism and can create head-of-line blocking."
        ]
      ),
      component(
        "Event streams",
        "Many independent consumers need an ordered, retained sequence of facts that can be replayed, processed at different speeds, and partitioned for throughput.",
        "Producers append records to partitioned logs. Order is guaranteed within a partition, offsets identify positions, and consumer groups divide partitions among instances. Retention is time/size based or compacted by key, enabling replay and projection rebuilds.",
        [
          "Domain-event integration, CDC, audit feeds, analytics, stream processing, and rebuilding search or cache projections",
          "High-throughput fan-out where consumers need independent offsets"
        ],
        [
          "Avoid a stream for simple request/reply, delayed jobs with per-message scheduling, or workflows that cannot tolerate eventual processing.",
          "Do not publish ambiguous database-shaped events without domain ownership and evolution rules."
        ],
        [
          "Partition skew, consumer lag, rebalance pause, broker loss, under-replicated partitions, schema incompatibility, oversized message, and unsafe replay side effects",
          "A dual write between database and broker can lose or invent events; use outbox, CDC, or a broker-led transaction with understood boundaries."
        ],
        [
          "Partitions, broker disk/network, replication, controller metadata, producer batching, consumer parallelism, retention, and downstream apply rate",
          "A single key is limited to one partition's throughput and one consumer's ordered processing."
        ],
        [
          "Define event ownership and compatibility, use a schema registry, monitor lag age and partition skew, size retention for recovery, test replay, and isolate slow consumers.",
          "Set producer acknowledgements, idempotence, min in-sync replicas, and unclean-election policy from durability requirements."
        ],
        ["Apache Kafka", "Amazon MSK", "Amazon Kinesis", "Apache Pulsar", "Google Pub/Sub"],
        [
          "Long retention and replay improve recoverability but raise storage, governance, schema, and privacy-deletion complexity.",
          "More partitions increase parallelism but reduce global ordering and add broker/controller overhead."
        ]
      ),
      component(
        "Service discovery",
        "Elastic service instances appear, move, scale, and fail, so callers need a current mapping from logical service identity to reachable endpoints.",
        "Instances register or are derived from an orchestrator; health and leases remove stale members. Client-side discovery selects endpoints in the client, while server-side discovery sends calls through a load balancer or proxy. DNS is commonly the bootstrap surface.",
        [
          "Dynamic containers, virtual machines, service meshes, and internal multi-instance services",
          "Routing by locality, version, metadata, or health"
        ],
        [
          "Avoid introducing a separate registry when Kubernetes Services or the platform already provide sufficient discovery.",
          "Do not confuse discovery health with deep dependency health; cascading removal can empty the pool."
        ],
        [
          "Stale endpoint, registry partition, bad health signal, control-plane outage, registration storm, DNS caching mismatch, and split view",
          "Clients can overload the last surviving instance if outlier ejection and load balancing are uncoordinated."
        ],
        [
          "Registry update/watch rate, endpoint count, propagation delay, DNS/cache TTL, health-check load, and client connection churn",
          "Very large endpoint sets make client watches and control-plane distribution expensive."
        ],
        [
          "Prefer platform-native discovery, use leases and graceful deregistration, monitor propagation, cache with bounded staleness, and secure registration identity.",
          "Test rolling deploys, zone loss, control-plane unavailability, and stale clients."
        ],
        ["Kubernetes Services and CoreDNS", "AWS Cloud Map", "Consul", "Eureka", "Envoy xDS"],
        [
          "Client-side discovery can route intelligently but embeds complex libraries and update state in every client.",
          "Server-side discovery simplifies clients but adds a proxy hop and shared dependency."
        ]
      ),
      component(
        "Configuration management",
        "Behavior varies by environment, tenant, release, and incident, but rebuilding code for every setting is slow and unsafe.",
        "Configuration is stored outside binaries, versioned, validated, and delivered at startup or through a watched control plane. Dynamic changes need explicit scope, defaults, rollout, audit, and rollback behavior.",
        [
          "Endpoints, timeouts, pool sizes, feature parameters, tenant policy, and safe operational tuning",
          "Consistent environment promotion and auditable runtime changes"
        ],
        [
          "Do not put secrets in ordinary config repositories or client-visible bundles.",
          "Avoid dynamic configuration for invariants that require coordinated code/schema deployment without a compatibility sequence."
        ],
        [
          "Malformed value, missing key, inconsistent versions, accidental global scope, control-plane outage, refresh storm, and unsafe live change",
          "A stale but valid config may be safer than failing all requests; the choice must be explicit."
        ],
        [
          "Key and watcher count, update fan-out, propagation latency, payload size, history, and validation throughput",
          "Global pushes to thousands of instances can create synchronized reconnect or behavior spikes."
        ],
        [
          "Use typed schema and range validation, ownership, version history, staged rollout, last-known-good caching, audit, and automatic rollback for monitored regressions.",
          "Separate deploy-time, startup, and live-reload settings and expose active non-sensitive versions in diagnostics."
        ],
        ["Spring Cloud Config", "AWS AppConfig", "Consul KV", "Kubernetes ConfigMaps", "etcd", "feature-flag platforms"],
        [
          "Dynamic config accelerates response but increases the runtime change surface and can bypass normal release controls.",
          "Centralization improves consistency but creates a control-plane dependency and ownership bottleneck."
        ]
      ),
      component(
        "Secrets management",
        "Applications need credentials, private keys, certificates, and tokens without hardcoding them in source, images, logs, or broadly readable configuration.",
        "A secrets manager encrypts values under managed keys, authenticates workloads by identity, authorizes narrow paths or roles, audits access, and may issue short-lived dynamic credentials. Applications fetch or receive secrets at runtime and rotate them without source changes.",
        [
          "Database credentials, API keys, signing keys, TLS certificates, and encryption material",
          "Short-lived workload credentials and centralized rotation/audit"
        ],
        [
          "Do not store non-secret configuration in a secrets manager by default; it adds cost and access sensitivity.",
          "Avoid long-lived shared credentials when workload identity or dynamic credentials are supported."
        ],
        [
          "Expired or revoked secret, control-plane outage, permission drift, failed rotation, leaked logs or crash dumps, stale sidecar cache, and circular bootstrap dependency",
          "Rotating only the store value can break clients if providers and connection pools are not coordinated."
        ],
        [
          "Read rate, secret/version count, payload size, authentication quotas, rotation frequency, and encryption-key throughput",
          "Fetching on every request creates latency and availability coupling; cache narrowly with renewal and revocation semantics."
        ],
        [
          "Use workload identity, least privilege, separate duties, redact telemetry, rotate and revoke through tested playbooks, audit access, and scan source/artifacts for leakage.",
          "Support an overlap window for key rotation and define last-known-good behavior without persisting plaintext insecurely."
        ],
        ["AWS Secrets Manager", "AWS Systems Manager Parameter Store", "HashiCorp Vault", "Kubernetes Secrets with external-store integration", "cloud KMS services"],
        [
          "Central storage improves control but becomes a sensitive runtime dependency and high-value target.",
          "Frequent short-lived credentials reduce exposure while increasing renewal and outage-handling complexity."
        ]
      ),
      component(
        "Distributed locks",
        "Multiple processes sometimes must coordinate exclusive access to a resource or elect one actor when the underlying operation cannot be made atomic another way.",
        "A lock service grants a lease to one owner for a bounded duration, commonly using a consensus-backed store or conditional write. Safe designs use unique ownership and monotonically increasing fencing tokens so a paused former owner cannot mutate the protected resource after its lease expires.",
        [
          "Rare cross-node maintenance, singleton schedulers, or access to an external resource that supports fencing",
          "Short critical sections where a transactional conditional update or partitioned single-writer model is unavailable"
        ],
        [
          "Avoid a distributed lock when a database uniqueness constraint, compare-and-set, idempotent operation, queue partition, or optimistic concurrency control solves the invariant.",
          "Do not hold leases across slow user interaction or unpredictable external calls."
        ],
        [
          "Expired lease during a GC pause, network partition, split-brain owners, missed renewal, dead owner, clock assumption, and lock-service outage",
          "Mutual exclusion at the lock service does not protect a downstream resource that accepts stale owners without fencing."
        ],
        [
          "One contended key serializes throughput; acquisition and renewal load, watcher count, quorum latency, and lease duration bound scale",
          "High-cardinality locks add metadata and cleanup; short leases increase churn, long leases delay recovery."
        ],
        [
          "Prefer fencing tokens, bounded leases, ownership-checked release, timeouts, metrics for wait/hold/renewal, and chaos tests for pause and partition.",
          "Document the exact invariant and validate it at the protected storage boundary, not only in application code."
        ],
        ["etcd", "Apache ZooKeeper", "Consul", "PostgreSQL advisory locks", "DynamoDB conditional writes", "Redis leases with carefully defined safety"],
        [
          "A consensus-backed lock offers stronger ownership semantics at quorum latency and operational cost.",
          "Locking is familiar but reduces availability and throughput; optimistic conflict detection often scales better when collisions are rare."
        ]
      ),
      component(
        "Rate limiting",
        "Finite capacity and fair-use policy require controlling request volume by client, tenant, API, resource, or cost before overload affects everyone.",
        "Token-bucket limiters allow a sustained refill rate plus bounded burst; leaky-bucket shaping smooths traffic; fixed or sliding windows count recent events. Distributed limiters use partitioned counters, local leases, or a centralized store and return explicit quota metadata and Retry-After where appropriate.",
        [
          "Public APIs, login and password reset, expensive search, tenant fairness, webhook ingestion, and downstream quota protection",
          "Admission control before a scarce dependency or flash-sale inventory path"
        ],
        [
          "Avoid one global limit that lets a noisy tenant consume everyone’s allocation.",
          "Do not rely on rate limiting as the only DDoS, authorization, or cost-control mechanism."
        ],
        [
          "Counter-store outage, hot tenant key, clock/window boundary burst, inconsistent regional limits, misidentified client, retry storm after rejection, and fail-open overload",
          "A too-strict policy can become a self-inflicted availability incident."
        ],
        [
          "Counter operations, key cardinality and skew, state memory, regional coordination, decision latency, and policy update propagation",
          "Globally exact quotas require coordination; locally leased quotas are scalable but can overshoot."
        ],
        [
          "Layer coarse edge protection with tenant/resource limits, use stable authenticated identities, expose remaining/reset semantics where useful, add jittered client backoff, and monitor rejects by reason.",
          "Choose fail-open or fail-closed per route: protect checkout capacity, but avoid blocking all low-risk reads because a counter store failed."
        ],
        ["Redis and Lua", "Envoy rate-limit service", "Kong", "Amazon API Gateway and AWS WAF", "Bucket4j", "DynamoDB counters"],
        [
          "Exact distributed fairness increases coordination latency and dependency risk; approximate local budgets are faster and more available.",
          "Large bursts improve client efficiency but can still overwhelm downstream concurrency."
        ]
      ),
      component(
        "Idempotency",
        "Networks and clients can retry after an ambiguous timeout, so the same logical command may arrive more than once and must not duplicate the business effect.",
        "The client sends a stable idempotency key scoped to identity and operation. The server atomically records the key, normalized request fingerprint, status, and result with the state change; repeats return the prior result or report in-progress/conflict. Consumers similarly deduplicate by event or business key at the effect boundary.",
        [
          "Payments, order creation, inventory reservation, webhooks, job submission, and at-least-once message consumption",
          "Any non-read operation whose response can be lost after the effect commits"
        ],
        [
          "Do not use idempotency keys to merge semantically different requests or hide an invalid state transition.",
          "Avoid an in-memory-only deduplication cache for effects requiring durable guarantees."
        ],
        [
          "Key collision, key reuse with different payload, record written separately from effect, expired record before delayed retry, concurrent first requests, and permanently stuck in-progress state",
          "Deduplicating event receipt does not make a non-transactional external side effect exactly once."
        ],
        [
          "Key write/read throughput, retention volume, hot business keys, transaction scope, and response storage size",
          "Long retention increases storage and privacy scope; short retention reopens duplicate risk."
        ],
        [
          "Define key generation, caller scope, request fingerprint, atomicity, response replay, expiry, concurrent behavior, and metrics before publishing the API.",
          "For Spring Boot with PostgreSQL, enforce a unique caller/key constraint and commit the idempotency record, order transition, and outbox in one transaction."
        ],
        ["HTTP Idempotency-Key conventions", "PostgreSQL unique constraints", "DynamoDB conditional writes", "Redis for bounded best-effort cases", "Kafka Streams state stores"],
        [
          "Durable idempotency improves correctness but adds a write and retention to every protected command.",
          "Natural idempotency through set-to-value or versioned state transitions is simpler than a generic key store when available."
        ]
      ),
      component(
        "Retry strategies",
        "Transient faults such as dropped connections, throttling, leader change, or brief unavailability should not turn every request into a user-visible failure.",
        "A retry policy classifies errors, enforces a total deadline and retry budget, waits with capped exponential backoff and jitter, and tries only idempotent or protected operations. Servers communicate throttling with Retry-After when possible; layered clients avoid multiplying attempts.",
        [
          "Transient network errors, explicit throttling, optimistic conflicts with fresh reads, and asynchronous delivery attempts",
          "Operations with enough remaining deadline and safe duplicate semantics"
        ],
        [
          "Avoid retrying validation, authorization, deterministic conflict, or overload errors without a server signal.",
          "Do not automatically retry non-idempotent payment or order commands without a stable idempotency key."
        ],
        [
          "Retry storm, synchronized clients, deadline overrun, duplicate effect, amplified dependency load, hidden persistent fault, and queue head-of-line delay",
          "Three attempts at each of three layers can create up to 27 downstream calls for one user operation."
        ],
        [
          "Attempts per original call, outstanding concurrency, deadline, connection pool, downstream recovery capacity, and retry queue size",
          "Retries consume the same constrained capacity as original work and should have an explicit budget."
        ],
        [
          "Retry at one responsible layer, propagate absolute deadlines, use full jitter and caps, honor Retry-After, emit attempt/outcome metrics, and couple with circuit breaking and load shedding.",
          "Test ambiguous commit, connection reset after response, throttling, and dependency brownout—not only clean outages."
        ],
        ["Resilience4j", "Spring Retry", "AWS SDK retry modes", "gRPC retry policy", "Envoy"],
        [
          "Retries improve success during brief faults but worsen overload and tail latency when the dependency is saturated.",
          "More attempts raise apparent availability at the cost of capacity and slower failure; deadlines bound that cost."
        ]
      ),
      component(
        "Circuit breakers",
        "Repeated calls to a failing or slow dependency waste threads, connections, and latency budget and can spread failure into the caller.",
        "A circuit breaker observes outcomes over a rolling window. It remains closed normally, opens when failure or slow-call thresholds are exceeded, then allows limited probes in half-open state before closing or reopening. It rejects locally and invokes only a defined safe fallback.",
        [
          "Remote dependencies with meaningful fallback or fast-fail behavior",
          "Preventing slow dependency failure from exhausting caller resources"
        ],
        [
          "Avoid using a breaker instead of correct timeouts, capacity planning, or per-tenant isolation.",
          "Do not wrap local deterministic validation or a dependency for which local rejection is worse and no fallback exists without analysis."
        ],
        [
          "Threshold flapping, synchronized half-open probes, stale fallback, false opening on client errors, per-instance inconsistent state, and breaker reset hiding an ongoing incident",
          "A global breaker can deny healthy tenants because one partition or route failed."
        ],
        [
          "State cardinality, rolling-window sample size, probe rate, fallback capacity, and number of service instances",
          "Very fine-grained breakers improve isolation but create noisy state and tuning burden."
        ],
        [
          "Group by meaningful dependency/operation, count timeouts and slow calls, combine with bulkheads and deadlines, limit probes, and instrument state transitions and rejected calls.",
          "Define whether fallback data may be stale and surface degraded state to product and operations."
        ],
        ["Resilience4j", "Spring Cloud CircuitBreaker", "Envoy outlier detection", "Istio"],
        [
          "Fast failure protects resources but can reduce short-term success and mask recovery until probes pass.",
          "Application breakers understand semantics; mesh breakers apply consistently but see less business context."
        ]
      ),
      component(
        "Bulkheads",
        "One tenant, dependency, workload, or feature can exhaust a shared pool and take unrelated operations down with it.",
        "Bulkheads partition finite resources—threads, connections, queues, pods, rate budgets, database pools, or even accounts—so saturation in one compartment has a bounded blast radius. Queue and concurrency limits make rejection explicit.",
        [
          "Separating checkout from browsing, interactive from batch, tenants by tier, and fragile dependencies from general request execution",
          "Containing noisy-neighbor and cascading-failure risk"
        ],
        [
          "Avoid excessive fixed partitions that strand capacity and become difficult to tune.",
          "Do not call a separate queue a bulkhead if workers or downstream pools remain fully shared."
        ],
        [
          "One partition saturation, starvation due to poor allocation, queue overflow, priority inversion, fallback contention, and configuration drift",
          "A shared database or network can remain a common failure domain beneath isolated application pools."
        ],
        [
          "Concurrent permits, queue depth, pool size, workload mix, downstream quotas, and number of isolated partitions",
          "Static reservations lower utilization when demand is uneven; dynamic borrowing needs safeguards."
        ],
        [
          "Map criticality and resource dependency, set bounded concurrency and queueing, reserve recovery capacity, monitor saturation/rejection by bulkhead, and test noisy-neighbor scenarios.",
          "Use separate Kubernetes deployments or node pools when process-level isolation is insufficient."
        ],
        ["Resilience4j bulkheads", "Java executors and semaphores", "separate HTTP/database pools", "Kubernetes deployments and quotas", "AWS account and service quotas"],
        [
          "Isolation improves resilience but reduces pooling efficiency and adds capacity/configuration management.",
          "Hard rejection protects the system but requires product-defined degradation or retry behavior."
        ]
      ),
      component(
        "Leader election",
        "Some distributed tasks require exactly one active coordinator at a time, such as assigning partitions, scheduling a singleton job, or managing cluster metadata.",
        "Candidates campaign through a consensus-backed service or conditional lease. The elected leader renews a term and includes a monotonically increasing epoch in commands; followers take over after confirmed expiry. Safety depends on quorum and fencing, while liveness depends on timeouts and reachable majority.",
        [
          "Cluster controllers, partition coordinators, singleton maintenance, and active-passive control planes",
          "Tasks whose outputs can be fenced or made idempotent across leadership changes"
        ],
        [
          "Avoid electing one leader for independent work that can be partitioned safely.",
          "Do not assume leader election alone gives exactly-once task execution or protects an unfenced external system."
        ],
        [
          "Split brain, stale leader, election storm, slow quorum, paused leader, lost majority, term confusion, and duplicate work during failover",
          "A leader can be logically deposed while still running and issuing side effects."
        ],
        [
          "Quorum round-trip latency, candidate count, lease renewals, state size, failover timeout, and all work serialized through the leader",
          "A single leader's CPU or network can become a scale ceiling even when replicas are numerous."
        ],
        [
          "Use a proven consensus primitive, include term/fencing tokens in writes, make tasks idempotent, monitor leadership churn and quorum health, and test pause/partition behavior.",
          "Keep leader responsibilities small and shard coordination domains when one leader becomes a bottleneck."
        ],
        ["etcd and Raft", "Apache ZooKeeper", "Consul", "Kubernetes Lease API", "database advisory locks for limited cases"],
        [
          "Short election timeout speeds failover but increases false elections during latency spikes.",
          "A single leader simplifies ordering but limits write locality, throughput, and partition availability."
        ]
      ),
      component(
        "Replication",
        "Data or service state must survive node failure, serve reads near users, and sometimes scale read throughput beyond one copy.",
        "Replication copies an ordered change stream from a leader to followers, accepts writes at multiple primaries with conflict handling, or commits through a quorum. Synchronous acknowledgement reduces the data-loss window; asynchronous application lowers write latency and failure coupling but permits lag.",
        [
          "Database high availability, read replicas, regional disaster recovery, event-log durability, and geographically local reads",
          "Maintaining multiple copies across genuinely independent failure domains"
        ],
        [
          "Avoid treating replicas as backups against deletion, corruption, or malicious writes.",
          "Do not route consistency-sensitive read-after-write traffic to an asynchronously lagging replica without session or version controls."
        ],
        [
          "Replica lag, log gap, stale read, replication slot growth, quorum loss, split brain, conflict, promotion of an incomplete replica, and replicated corruption",
          "Failback can be more dangerous than failover when histories diverge."
        ],
        [
          "Change-log generation and apply rate, network bandwidth, storage, replica count, quorum latency, conflict rate, and catch-up capacity",
          "Read replicas do not raise single-leader write capacity, and synchronous remote replicas add distance to every commit."
        ],
        [
          "Monitor byte and time lag, test promotion/fencing/failback, preserve catch-up headroom, place copies by failure domain, and pair replication with immutable backups and restore drills.",
          "Define which acknowledgement corresponds to which RPO and which readers need primary, quorum, or bounded-staleness routing."
        ],
        ["PostgreSQL streaming and logical replication", "Amazon Aurora replicas", "DynamoDB global tables", "Kafka replication", "MySQL Group Replication", "Cassandra"],
        [
          "Synchronous replication narrows data loss but increases latency and can reject writes when replicas or links fail.",
          "Multi-primary locality improves regional availability but requires conflict-free ownership, deterministic merge, or surfaced conflict."
        ]
      ),
      component(
        "Partitioning and sharding",
        "A dataset or workload eventually exceeds the storage, write throughput, maintenance window, or failure tolerance of one node.",
        "Partitioning assigns records to subsets by hash, range, directory, or domain key. Each shard is an independent data unit that can be placed and replicated separately. Consistent hashing reduces movement when nodes change; virtual nodes or many logical partitions smooth placement, but application access patterns remain decisive.",
        [
          "Large multi-tenant datasets, high write rates, bounded data lifecycle, and parallel processing",
          "Isolation by region, tenant, customer, time, or other stable ownership key"
        ],
        [
          "Avoid sharding before less invasive options and a credible key/access model are exhausted.",
          "Do not shard by a low-cardinality, sequentially hot, or frequently changing attribute."
        ],
        [
          "Hot shard, skewed storage, scatter-gather query, cross-shard transaction, unavailable routing metadata, resharding failure, duplicate or missing ranges, and tenant relocation error",
          "A single popular key remains hot even with many shards."
        ],
        [
          "Per-shard storage/throughput, number of shards, routing metadata, connection pools, rebalance bandwidth, and cross-shard fan-out",
          "Too many shards multiply overhead and operations; too few make growth and recovery coarse."
        ],
        [
          "Choose the key from write and query locality, measure skew, include shard identity in telemetry, automate placement, use dual-read/write or change-capture migration, and design global identifiers.",
          "Maintain headroom for shard movement and test split, merge, backup, restore, and one-hot-tenant isolation."
        ],
        ["PostgreSQL declarative partitioning and Citus", "DynamoDB partition keys", "MongoDB sharding", "Cassandra", "Vitess", "consistent-hash libraries"],
        [
          "Hashing distributes uniform load but weakens range locality; range partitioning enables scans but risks hot recent ranges.",
          "Domain or tenant sharding improves ownership and isolation but creates uneven large tenants and cross-tenant query work."
        ]
      ),
      component(
        "Indexing",
        "Scanning all records for common predicates, joins, ordering, or text terms is too slow and resource-intensive at scale.",
        "An index maintains a separate ordered or inverted structure from selected keys to record locations. B-tree indexes support equality/range/order, hash indexes specialize equality, composite indexes depend on prefix/order, and inverted/vector/spatial indexes serve specialized queries. The optimizer chooses among them using statistics.",
        [
          "Frequent selective filters, joins, uniqueness, sorting, prefix/range access, full-text search, and time-window queries",
          "Protecting known latency SLOs with observable access paths"
        ],
        [
          "Avoid indexing every column, low-value predicates, or volatile fields without measuring read benefit versus write cost.",
          "Do not assume an index fixes queries that return a large fraction of the table or perform unbounded aggregation."
        ],
        [
          "Wrong index order, stale statistics, index bloat, write amplification, lock-heavy build, unused duplicate index, missing covering fields, and query-plan regression",
          "An index can make writes slower and consume I/O even when no current query uses it."
        ],
        [
          "Index bytes, update rate, page splits, memory working set, build time, write IOPS, number of indexes, and cardinality",
          "Large secondary indexes can dominate storage and replication traffic; distributed indexes add partition fan-out."
        ],
        [
          "Capture representative query plans and frequency, create online/concurrently where supported, monitor usage and bloat, refresh statistics, set statement limits, and remove redundant indexes cautiously.",
          "For OpenSearch, govern mappings and field cardinality; for PostgreSQL, test composite order, partial/covering indexes, and write impact."
        ],
        ["PostgreSQL B-tree, GIN, GiST, and BRIN", "MySQL indexes", "Lucene and OpenSearch inverted indexes", "DynamoDB global and local secondary indexes"],
        [
          "Indexes exchange write latency, storage, and maintenance for predictable read access.",
          "Denormalized covering indexes reduce lookups but duplicate more data and complicate schema change."
        ]
      ),
      component(
        "Data pipelines",
        "Operational data must move reliably into analytics, search, machine-learning, audit, and integration systems with known freshness and lineage.",
        "A pipeline extracts from APIs, files, CDC, or streams; validates and transforms records; then loads a target with checkpoints, schema handling, deduplication, quality controls, and lineage. A durable raw layer often enables replay when transformation logic changes.",
        [
          "CDC to a warehouse, catalog-to-search indexing, analytics ingestion, feature generation, and regulatory export",
          "Separating operational transaction serving from derived analytical or search workloads"
        ],
        [
          "Avoid ad hoc dual writes from business code to every downstream system.",
          "Do not call a pipeline reliable without ownership for late data, deletions, schema evolution, and replay."
        ],
        [
          "Source gap, duplicate record, out-of-order update, schema drift, poison data, silent truncation, checkpoint corruption, target throttling, and partial backfill",
          "A technically successful job can still publish semantically incorrect data."
        ],
        [
          "Records/bytes, source change-log retention, checkpoint state, transformation shuffle, target write quotas, small-file count, and backfill concurrency",
          "Catch-up and backfill compete with live traffic unless capacity and priority are isolated."
        ],
        [
          "Assign dataset and pipeline owners, publish schemas/data contracts, validate counts and invariants, track end-to-end freshness, keep lineage, quarantine bad records, and rehearse replay/backfill.",
          "Use immutable raw inputs with retention compatible with recovery and honor privacy deletion through every derived copy."
        ],
        ["Kafka Connect", "Debezium", "Apache Airflow", "AWS Glue", "Amazon Data Migration Service", "Apache Beam", "dbt"],
        [
          "Managed connectors accelerate delivery but constrain transformations and failure semantics; custom code increases control and maintenance.",
          "Keeping raw history enables repair but increases storage, governance, and sensitive-data exposure."
        ]
      ),
      component(
        "Batch processing",
        "Large bounded datasets or periodic computations often need efficient throughput and reproducibility more than per-record immediacy.",
        "A scheduler divides bounded input into tasks or stages, processes partitions in parallel, persists intermediate/checkpoint state, and retries failed units. Map/reduce, SQL engines, and DAG orchestrators exploit data locality and bulk I/O; outputs are atomically published or versioned after validation.",
        [
          "Billing, daily reconciliation, historical backfill, model training, index rebuild, reports, and archival compaction",
          "Work with minute-to-hour freshness and efficient bulk access"
        ],
        [
          "Avoid batch when users need low-latency event response or when a full-period recomputation cannot meet the completion window.",
          "Do not let heavy batch jobs share unbounded resources with latency-critical production paths."
        ],
        [
          "Straggler, executor loss, skewed partition, partial output, duplicate retry, missed schedule, checkpoint loss, late input, and downstream overload",
          "A rerun can double side effects unless output commit and task semantics are idempotent."
        ],
        [
          "Input bytes, shuffle and spill, task count, memory, I/O, cluster slots, data skew, checkpoint size, and completion deadline",
          "Parallelism stops helping when a hot key, serialized stage, storage bandwidth, or target write quota dominates."
        ],
        [
          "Use versioned inputs/outputs, idempotent stages, checksums and row-count/invariant gates, checkpointing, backfill controls, resource quotas, and deadline/straggler metrics.",
          "Publish only after validation and retain enough provenance to reproduce a result."
        ],
        ["Apache Spark", "Apache Flink batch", "AWS Glue", "Amazon EMR", "Kubernetes Jobs", "Spring Batch", "Apache Airflow"],
        [
          "Large batches maximize throughput and lower per-record cost but increase latency, recovery work, and blast radius.",
          "Incremental batches reduce recomputation while adding checkpoint and late-data complexity."
        ]
      ),
      component(
        "Stream processing",
        "Continuous events need low-latency transformation, aggregation, joining, enrichment, anomaly detection, or routing without waiting for a batch window.",
        "A stream processor consumes partitioned events, maintains keyed state, uses event time plus watermarks to handle out-of-order data, checkpoints state, and writes outputs with at-least-once or supported transactional semantics. Windows bound otherwise infinite computation.",
        [
          "Real-time fraud signals, inventory projections, metrics, sessionization, alerting, CDC transforms, and recommendation features",
          "Work where seconds-to-minutes freshness provides business value"
        ],
        [
          "Avoid stream processing for infrequent simple jobs that a scheduled query can perform reliably.",
          "Do not claim exactly-once business outcomes when the external sink or side effect is outside the processor's transaction boundary."
        ],
        [
          "Consumer lag, hot key, checkpoint failure, state growth, late event, watermark stall, duplicate output, schema incompatibility, rebalance, and sink throttling",
          "A corrected algorithm may require state migration or replay from retained input."
        ],
        [
          "Events/bytes, partitions, per-key skew, state size, checkpoint duration, network shuffle, window cardinality, sink capacity, and replay horizon",
          "Ordering within one hot key is serial even when the cluster has abundant aggregate capacity."
        ],
        [
          "Define event-time semantics, lateness policy, state TTL, checkpoint/restart SLO, schema compatibility, idempotent or transactional sinks, and lag/freshness metrics.",
          "Retain source events long enough for recovery, test savepoint upgrades and backfills, and reconcile streaming results against an independent batch truth where risk warrants it."
        ],
        ["Apache Flink", "Kafka Streams", "Apache Beam", "Spark Structured Streaming", "Amazon Kinesis Data Analytics"],
        [
          "Low freshness latency adds state, checkpointing, out-of-order, replay, and continuous-operations complexity.",
          "At-least-once with idempotent upserts is often simpler than end-to-end transactional delivery and sufficient for the invariant."
        ]
      )
    ],
    decisionTables: [
      {
        title: "Queue, stream, or synchronous call?",
        columns: ["Need", "Synchronous call", "Message queue", "Event stream"],
        rows: [
          ["Immediate answer", "Strong fit", "Return operation status instead", "Usually derived asynchronously"],
          ["One worker handles task", "Caller handles directly", "Strong fit", "Consumer-group semantics possible but heavier"],
          ["Many independent consumers", "High fan-out coupling", "Duplicate queues or pub/sub needed", "Strong fit with independent offsets"],
          ["Replay history", "No", "Limited and operationally awkward", "Core retained-log capability"],
          ["Per-key ordering", "Call order is not completion order", "FIFO group may provide it", "Partition-key ordering"],
          ["Primary hazards", "Tail latency and cascading failure", "Poison work, duplicates, backlog", "Skew, lag, schemas, unsafe replay"]
        ]
      },
      {
        title: "Storage building-block fit",
        columns: ["Requirement", "Relational", "NoSQL specialty", "Object storage", "Search engine", "Cache"],
        rows: [
          ["Authoritative transactions", "Best general fit", "Fit when exact engine semantics match", "Poor", "Poor", "Usually poor"],
          ["Flexible text relevance", "Limited extensions", "Varies", "Poor", "Best fit", "Poor"],
          ["Large immutable blobs", "Costly", "Item limits", "Best fit", "Metadata only", "Only hot derived bytes"],
          ["Known key at distributed scale", "Good until write/partition limits", "Often best fit", "Good for whole object", "Possible but costly", "Best for ephemeral hot data"],
          ["Freshness model", "Strong primary reads", "Engine-specific", "Read-after-write for objects; workflow-specific listings/events", "Near real time", "Explicit TTL/invalidation"],
          ["Recovery posture", "Logs, replica, backup", "Engine-specific backup/export", "Versioning and cross-region copy", "Rebuild from source", "Refill from source"]
        ]
      },
      {
        title: "Resilience control by failure symptom",
        columns: ["Symptom", "Primary control", "Companion controls", "Do not confuse with"],
        rows: [
          ["Slow or failing remote dependency", "Deadline and circuit breaker", "Bulkhead, bounded retry, fallback", "Making the dependency healthy"],
          ["Duplicate command", "Idempotency at effect boundary", "Unique constraints, state machine, reconciliation", "Broker marketing claims"],
          ["One workload exhausts capacity", "Bulkhead and admission control", "Rate limit, load shedding, autoscaling", "Infinite queueing"],
          ["Concurrent ownership", "Atomic conditional write or fenced lease", "Idempotency, leader epoch", "An unfenced distributed lock"],
          ["Data exceeds one node", "Partitioning plus replication", "Key redesign, rebalance automation", "Adding read replicas alone"]
        ]
      },
      {
        title: "Edge component responsibilities",
        columns: ["Component", "Owns", "Should not own"],
        rows: [
          ["DNS", "Name resolution and coarse routing", "Per-request health or business policy"],
          ["CDN", "Edge caching and delivery", "Authoritative personalized state"],
          ["Reverse proxy/load balancer", "Connection and route distribution", "Domain transactions"],
          ["API gateway", "External policy and contract edge", "Cross-domain business orchestration"],
          ["Application server", "Domain behavior and workflow boundary", "Unbounded local state or infrastructure reinvention"]
        ]
      }
    ],
    exercises: [
      {
        title: "Design the read path",
        type: "architecture",
        prompt: "A global product-detail endpoint needs p99 under 250 ms, serves public catalog data, combines price and location inventory, and must not show another user's contract price. Compose an edge and data path with explicit cache boundaries.",
        suggestedAnswer: "Serve versioned media and public catalog fragments through a CDN. Route authenticated requests through gateway/load balancer to stateless Spring Boot pods. Cache public product documents by catalog/version; key contract pricing by authenticated customer and policy version or do not edge-cache it. Query inventory by location with a short bounded-staleness cache only for display, while checkout revalidates authoritatively. Protect origins against cache loss and propagate a deadline."
      },
      {
        title: "Repair an unreliable event integration",
        type: "architecture critique",
        prompt: "Order service commits PostgreSQL, then publishes to Kafka. Operations occasionally sees orders with no event. The team proposes an infinite retry loop in the request thread. Critique and redesign.",
        suggestedAnswer: "The dual write has an atomicity gap; an infinite request retry adds latency and can duplicate effects. Commit an outbox record with the order, relay via CDC or a bounded publisher, and make consumers idempotent. Monitor oldest unpublished outbox age and consumer lag, quarantine poison records, and provide replay/reconciliation."
      },
      {
        title: "Choose a coordination primitive",
        type: "trade-off",
        prompt: "Ten workers may reserve the same SKU. Compare a Redis lock, a PostgreSQL conditional update, and partitioning commands by SKU through Kafka.",
        suggestedAnswer: "For an online reservation invariant in PostgreSQL, an atomic update such as available >= quantity with versioning is usually the smallest safe boundary. A Redis lease adds split-brain/fencing and cross-store atomicity concerns. Kafka key partitioning serializes per-SKU commands and absorbs bursts but adds asynchronous latency and requires authoritative persistence plus recovery; use it when admission/queue semantics fit."
      },
      {
        title: "What fails first in a cache outage?",
        type: "what fails first",
        prompt: "Redis normally absorbs 95% of 40,000 catalog reads/s. It fails over cold, while every Spring Boot pod retries misses twice. Identify the first failure chain and controls.",
        suggestedAnswer: "Origin demand jumps from about 2,000 to as much as 120,000 attempts/s with two retries, likely saturating database pools/IOPS and then pod queues before the cache warms. Use single responsible bounded retry, request coalescing, stale local fallback where safe, origin concurrency limits, admission control, jittered warm-up, and load tests for zero-hit operation."
      }
    ],
    quiz: [
      {
        question: "Which component is the authoritative source for a paid order?",
        options: ["CDN", "OpenSearch index", "Transactional order store", "Redis cache"],
        answer: 2,
        explanation: "Caches and search indexes are derived views. The order store owns the durable transaction and invariants."
      },
      {
        question: "Why should a distributed lease include a fencing token?",
        options: ["To compress the key", "To let the protected resource reject a stale former owner", "To avoid authentication", "To increase cache hit rate"],
        answer: 1,
        explanation: "A paused process may resume after lease expiry; a monotonically newer token lets the resource reject stale commands."
      },
      {
        question: "What metric best states user impact from a stalled event consumer?",
        options: ["Broker CPU only", "Total topic partitions only", "Age of the oldest unprocessed relevant event", "Producer class count"],
        answer: 2,
        explanation: "Lag age connects backlog to freshness; raw count varies with normal traffic volume."
      },
      {
        question: "Which retry policy is safest for a transient 503?",
        options: ["Retry forever immediately", "Capped exponential backoff with jitter inside a deadline and only for a safe operation", "Retry independently at every layer", "Convert it to 200"],
        answer: 1,
        explanation: "Classification, idempotency, deadline, cap, jitter, and a retry budget prevent amplification."
      },
      {
        question: "What is the principal scaling risk of hash partitioning by customerId?",
        options: ["It cannot store strings", "One very large or active customer can still create a hot key/shard", "It requires global ordering", "It disables replication"],
        answer: 1,
        explanation: "Aggregate distribution can look uniform while a single heavy tenant exceeds one partition's capacity."
      },
      {
        question: "When is a message queue generally a better fit than an event stream?",
        options: ["Many consumer groups need historical replay", "One worker should process each scheduled task with acknowledgement and DLQ", "Consumers rebuild projections from years of events", "The data is an audit log"],
        answer: 1,
        explanation: "Work-queue semantics match one-of-many processing, leases, retries, and dead-letter handling."
      },
      {
        question: "Why is a read replica not a backup?",
        options: ["It cannot serve reads", "Logical deletion or corruption can replicate to it", "It has no storage", "It always uses another schema"],
        answer: 1,
        explanation: "Replication protects many node failures but propagates valid-looking destructive changes; point-in-time and offline recovery need backups."
      }
    ],
    takeaways: [
      "Every component must earn its place by solving a named bottleneck, correctness need, failure mode, or ownership constraint.",
      "Trace the complete critical path. Edge, proxy, service, cache, data, queue, and control-plane layers can each add limits and common-mode failure.",
      "Retries, breakers, and autoscaling do not replace deadlines, idempotency, bulkheads, admission control, and tested downstream capacity.",
      "Derived stores—caches, search indexes, and projections—need a source of truth, freshness contract, rebuild path, and behavior during lag.",
      "Partitioning is a data-access and ownership decision, not merely an infrastructure setting; design skew, relocation, and cross-partition workflows before the first split.",
      "Operational readiness is part of the design: quotas, dashboards, runbooks, restore/replay tests, safe configuration, and explicit owners make architecture real."
    ]
  };

  const moduleIds = new Set(window.SD_CONTENT.modules.map((module) => module.id));
  [foundations, estimation, buildingBlocks].forEach((module) => {
    if (!moduleIds.has(module.id)) {
      window.SD_CONTENT.modules.push(module);
    }
  });
})();
