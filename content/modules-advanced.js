(function () {
  "use strict";

  const content = (window.SD_CONTENT = window.SD_CONTENT || {});
  content.modules = content.modules || [];

  const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);
  const slug = (value) => String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const topic = (spec) => ({
    id: spec.id || slug(spec.name),
    name: spec.name,
    definition: spec.definition,
    intuition: spec.intuition || spec.howItWorks,
    howItWorks: spec.howItWorks || spec.intuition,
    practicalExample: spec.practicalExample,
    useWhen: list(spec.useWhen),
    avoidWhen: list(spec.avoidWhen),
    failureModes: list(spec.failureModes),
    tradeoffs: list(spec.tradeoffs),
    operations: list(spec.operations),
    technologies: list(spec.technologies),
    leadEngineerLens: spec.leadEngineerLens
  });

  const upsertModule = (module) => {
    module.decisionMatrices = list(module.decisionMatrices).map((matrix) => {
      const headers = matrix.headers || matrix.columns || [];
      return {
        ...matrix,
        headers,
        rows: list(matrix.rows).map((row) => Array.isArray(row)
          ? Object.fromEntries(headers.map((header, index) => [header, row[index]]))
          : row)
      };
    });
    module.diagrams = list(module.diagrams).map((diagram) => ({
      ...diagram,
      flow: diagram.flow || list(diagram.flows).map(([from, to, label]) => ({ from, to, label }))
    }));
    const index = content.modules.findIndex((item) => item.id === module.id);
    if (index >= 0) content.modules[index] = module;
    else content.modules.push(module);
  };

  upsertModule({
    id: "module-4-data-architecture",
    number: 4,
    title: "Data Architecture",
    kicker: "Model invariants, access paths, and failure semantics before choosing a database",
    summary: "A lead-engineer guide to matching data models and consistency guarantees to workload shape, then operating the result through growth, schema change, retention, and disaster recovery.",
    estimatedMinutes: 190,
    level: "advanced",
    objectives: [
      "Translate business invariants and access patterns into an explicit consistency and storage strategy.",
      "Choose database families using workload evidence rather than category slogans.",
      "Reason about replication, partitioning, transactions, indexes, and concurrency under failure.",
      "Design evolution, retention, backup, and recovery as first-class lifecycle capabilities."
    ],
    topics: [
      topic({
        name: "SQL versus NoSQL",
        definition: "SQL systems center on relational tables, declarative queries, constraints, and transactions. NoSQL is an umbrella for non-relational models optimized for particular access patterns, scale, or distribution semantics.",
        howItWorks: "Start from invariants and query shapes. Relational engines maintain indexes and transactional constraints across related rows; NoSQL systems often trade joins or cross-record transactions for predictable partition-local operations and elastic distribution.",
        practicalExample: "Use PostgreSQL for orders, payments, and ledger relationships that must reconcile. Use DynamoDB for a cart keyed by customerId where the dominant operations are GetItem and conditional UpdateItem at high, bursty scale.",
        useWhen: ["Choose SQL when constraints, joins, ad hoc reporting, and multi-row transactions are core.", "Choose NoSQL when a stable key-based access pattern, very high distribution, or a specialized model dominates."],
        avoidWhen: ["Do not select NoSQL merely to claim scalability.", "Do not force highly connected, rapidly changing aggregate queries into a key-value schema."],
        failureModes: ["A missing access pattern creates scans or secondary-index explosions.", "Cross-partition invariants become application-level races.", "Relational hot rows or long transactions serialize throughput."],
        tradeoffs: ["Relational flexibility and integrity versus specialized predictable paths.", "Operational familiarity versus workload-specific scaling.", "Schema-on-write discipline versus looser evolution with more reader complexity."],
        operations: ["Measure query plans, lock waits, partition skew, replication lag, and storage amplification.", "Run failure and restore tests before treating either family as durable."],
        technologies: ["PostgreSQL", "MySQL", "Aurora", "DynamoDB", "Cassandra", "MongoDB"],
        leadEngineerLens: "Reject database debates without a workload table: cardinality, item size, query shape, consistency, peak rate, growth, recovery objective, and team operating skill."
      }),
      topic({
        name: "Document databases",
        definition: "A document database stores self-contained, usually JSON-like aggregates addressed by an identifier and queried through document fields or indexes.",
        howItWorks: "Related data read and changed together is embedded in one document; independent or unbounded relationships are referenced. Atomicity is strongest within one document, though some products support broader transactions at added cost.",
        practicalExample: "A product authoring record can hold localized copy, attributes, media references, and merchandising metadata that vary by category, while a separate search index serves discovery.",
        useWhen: ["Aggregate boundaries are clear and fields vary by entity type.", "Most reads need the whole aggregate and joins are limited."],
        avoidWhen: ["Many-to-many relationships and cross-aggregate constraints dominate.", "Documents grow without a hard bound or are updated by many independent writers."],
        failureModes: ["Oversized documents increase write amplification and contention.", "Duplicated embedded data becomes stale.", "Unindexed predicates degrade into collection scans."],
        tradeoffs: ["Locality and schema flexibility versus duplication and weaker relational guarantees.", "Convenient developer shape versus careful document-boundary design."],
        operations: ["Enforce document-size limits, validate schemas, budget index count, and monitor working-set fit.", "Plan online backfills for evolving embedded fields."],
        technologies: ["MongoDB", "Amazon DocumentDB", "Couchbase", "Firestore"]
      }),
      topic({
        name: "Key-value databases",
        definition: "A key-value database maps a unique key to an opaque or lightly structured value, optimizing direct lookup and partition-local updates.",
        howItWorks: "A hash or range partition maps the key to a shard. The service replicates that shard and exposes get, put, delete, conditional-write, and sometimes limited secondary-index operations.",
        practicalExample: "A shopping cart item uses PK=CUSTOMER#42 and SK=SKU#123 with a conditional version update, TTL for abandoned carts, and a stream for analytics.",
        useWhen: ["Access is dominated by known keys with predictable latency.", "Traffic is large and horizontally distributed with bounded item sizes."],
        avoidWhen: ["Users require arbitrary filtering, joins, or changing analytical queries.", "The partition key cannot distribute the workload."],
        failureModes: ["Celebrity or time-bucket keys create hot partitions.", "Retries without conditions overwrite newer values.", "Secondary indexes add hidden write and storage cost."],
        tradeoffs: ["Scale and latency predictability versus query expressiveness.", "Denormalized reads versus write fan-out and reconciliation."],
        operations: ["Track throttling per partition, consumed capacity, item size, TTL lag, and global-replication conflicts.", "Load-test the actual key distribution, not uniform synthetic keys."],
        technologies: ["DynamoDB", "Redis", "Aerospike", "FoundationDB key-value layer"]
      }),
      topic({
        name: "Graph databases",
        definition: "A graph database represents entities as vertices and relationships as first-class edges, optimized for multi-hop traversal and topology-aware queries.",
        howItWorks: "Queries expand from indexed starting nodes across adjacent edges instead of repeatedly joining large relation tables. Property graphs and RDF stores use different models and query languages.",
        practicalExample: "A fraud service traverses customer, device, payment instrument, address, and order relationships to find dense suspicious clusters within a few hops.",
        useWhen: ["Relationship traversal is the product capability, such as fraud, identity, recommendations, or network topology.", "Queries ask variable-depth path questions."],
        avoidWhen: ["Workload is simple entity lookup or aggregate reporting.", "The graph is written at extreme rates but rarely traversed."],
        failureModes: ["Supernodes make traversals unbounded.", "Cross-shard graph walks have unpredictable latency.", "A missing traversal budget causes runaway queries."],
        tradeoffs: ["Expressive relationships versus specialized skills and harder distribution.", "Fast local traversal versus expensive global graph operations."],
        operations: ["Set hop, result, and execution limits; monitor supernodes and page-cache hit rate.", "Design bulk ingest and snapshot/restore separately from online traversal."],
        technologies: ["Neo4j", "Amazon Neptune", "JanusGraph", "TigerGraph"]
      }),
      topic({
        name: "Column-family databases",
        definition: "A wide-column or column-family database stores sparse rows partitioned by a key and ordered by clustering columns for large, write-heavy distributed datasets.",
        howItWorks: "Writes append to a log and memory table, then flush to immutable sorted files. Compaction merges files; partition and clustering keys determine placement and on-disk order.",
        practicalExample: "Telemetry is modeled by deviceId plus day as the partition key and eventTime as the clustering key, enabling bounded time-range reads without a global secondary index.",
        useWhen: ["Write throughput is high, queries are known in advance, and multi-region availability matters.", "Data naturally fits bounded partition-local time or entity ranges."],
        avoidWhen: ["Ad hoc joins and multi-row ACID transactions are required.", "The team cannot operate compaction, repair, and consistency tuning."],
        failureModes: ["Large or hot partitions overload a node.", "Tombstones and compaction debt cause latency cliffs.", "Inadequate repair loses convergence guarantees."],
        tradeoffs: ["Linear write scaling and availability versus query-first denormalization.", "Tunable consistency versus operational complexity."],
        operations: ["Monitor partition sizes, tombstones, pending compactions, repair age, disk headroom, and coordinator latency.", "Model one table per critical access pattern."],
        technologies: ["Apache Cassandra", "ScyllaDB", "Google Bigtable", "Amazon Keyspaces"]
      }),
      topic({
        name: "Time-series databases",
        definition: "A time-series database optimizes timestamped measurements, labels, retention, downsampling, and range aggregation.",
        howItWorks: "Data is partitioned by time and series identity, compressed in timestamp order, then expired or rolled up by policy. Indexes locate label sets; the data path performs range scans and aggregations.",
        practicalExample: "A Kubernetes metrics platform stores request_count and latency_histogram by service, route, region, and status, retaining raw points for seven days and hourly rollups for thirteen months.",
        useWhen: ["Data is append-heavy, time-bounded, and queried by ranges or windows.", "Retention and rollups are central requirements."],
        avoidWhen: ["Records are frequently updated or strongly relational.", "Uncontrolled labels create unbounded cardinality."],
        failureModes: ["High-cardinality tags exhaust memory.", "Late data misses rollup windows.", "Large time-range queries saturate storage and network."],
        tradeoffs: ["Compression and time queries versus limited transactional semantics.", "Rich labels versus cardinality cost."],
        operations: ["Budget series cardinality, ingestion lag, retention tiers, compaction, and query concurrency.", "Define late-arrival and correction policy explicitly."],
        technologies: ["Amazon Timestream", "TimescaleDB", "InfluxDB", "Prometheus", "ClickHouse"]
      }),
      topic({
        name: "Normalization and denormalization",
        definition: "Normalization represents each fact once and relates it through keys; denormalization duplicates or precomputes facts to make critical reads cheaper.",
        howItWorks: "Normalized writes update canonical tables under constraints. Denormalized projections are updated in the same transaction when local, or asynchronously through CDC/events when distributed.",
        practicalExample: "Orders retain immutable product title and sale price snapshots for audit, while product details remain normalized in the catalog. Search documents denormalize catalog, price, and availability with explicit freshness targets.",
        useWhen: ["Normalize authoritative mutable facts and invariants.", "Denormalize high-volume read models whose join cost or latency is unacceptable."],
        avoidWhen: ["Do not duplicate data without ownership and repair paths.", "Do not normalize across service boundaries into a shared runtime join."],
        failureModes: ["Projection lag returns stale facts.", "Dual writes diverge.", "Over-normalized hot paths create chatty services or expensive joins."],
        tradeoffs: ["Integrity and flexible queries versus read latency.", "Simple reads versus write amplification and reconciliation."],
        operations: ["Attach source version and updatedAt to projections, measure lag, and support replay/rebuild.", "Document which copy is authoritative for each field."],
        technologies: ["PostgreSQL constraints", "Kafka Connect", "Debezium", "OpenSearch projections"]
      }),
      topic({
        name: "Primary and secondary indexes",
        definition: "A primary index determines or directly supports row identity and often physical locality; a secondary index provides an additional lookup order over other attributes.",
        howItWorks: "B-tree, hash, LSM, inverted, and specialized indexes trade read acceleration for extra storage and work on every write. Composite index order must match predicate and sort prefixes.",
        practicalExample: "PostgreSQL uses a unique order_id index plus (customer_id, created_at DESC) for order history. OpenSearch uses an inverted index for product text and doc values for filtering and sorting.",
        useWhen: ["A frequent selective query is too expensive without an index.", "Uniqueness or lookup constraints must be enforced."],
        avoidWhen: ["Low-selectivity fields or rarely used queries do not justify write amplification.", "An index cannot rescue an unbounded result set or bad data model."],
        failureModes: ["Index bloat, cache eviction, and write latency grow with index count.", "Wrong column order yields scans.", "Online builds contend with production traffic."],
        tradeoffs: ["Read latency versus write cost and disk.", "Covering indexes versus duplication and maintenance."],
        operations: ["Inspect actual query plans, hit ratios, index usage, bloat, and build impact.", "Remove redundant indexes only after workload evidence and rollback planning."],
        technologies: ["PostgreSQL EXPLAIN", "DynamoDB GSIs", "OpenSearch inverted indexes", "MongoDB compound indexes"]
      }),
      topic({
        name: "Read replicas",
        definition: "Read replicas asynchronously or synchronously copy a primary database to scale reads, isolate workloads, or improve recovery.",
        howItWorks: "The primary emits a write-ahead log that replicas replay. Clients route suitable reads to replicas while writes go to the primary; asynchronous replay introduces lag.",
        practicalExample: "Order writes and immediate post-checkout reads use the Aurora writer; customer history and reporting use reader endpoints only when several seconds of staleness is acceptable.",
        useWhen: ["Reads dominate and tolerate bounded staleness.", "Reporting or backups need isolation from the writer."],
        avoidWhen: ["Read-your-writes is mandatory without session routing or a consistency token.", "The write bottleneck, not reads, limits the system."],
        failureModes: ["Replica lag produces stale state or resurrected decisions.", "Failover loses acknowledged asynchronous writes.", "A heavy query delays replay."],
        tradeoffs: ["Read capacity and isolation versus staleness and routing complexity.", "Synchronous durability versus commit latency and availability."],
        operations: ["Alert on replay bytes and time lag, not only replica health.", "Exercise promotion, DNS/connection-pool refresh, and post-failover fencing."],
        technologies: ["PostgreSQL streaming replication", "Amazon RDS/Aurora replicas", "MySQL replicas"]
      }),
      topic({
        name: "Multi-primary replication",
        definition: "Multi-primary replication accepts writes at more than one replica or region and reconciles concurrent updates.",
        howItWorks: "Each primary applies local writes and exchanges a replication log. Conflicts are prevented through ownership, serialized through consensus, or resolved using deterministic rules such as versions, CRDTs, or domain merges.",
        practicalExample: "Customer preferences that tolerate DynamoDB Global Tables' last-writer-wins semantics can use separate items per independently updated preference; a financial ledger should instead have a single writer per account or a consensus-backed transaction boundary.",
        useWhen: ["Regional write latency and write availability justify conflict complexity.", "Operations are commutative, partition-owned, or safely mergeable."],
        avoidWhen: ["Global uniqueness or strict cross-region invariants dominate.", "Last-writer-wins could discard a valid business action."],
        failureModes: ["Concurrent writes silently overwrite each other.", "Clock skew corrupts timestamp resolution.", "Replication loops or backlog delay convergence."],
        tradeoffs: ["Local write availability versus conflict semantics.", "Consensus correctness versus inter-region latency."],
        operations: ["Record conflict metrics and resolution provenance; retain repair logs.", "Test partitions longer than normal retention and region rejoin behavior."],
        technologies: ["DynamoDB Global Tables", "CockroachDB", "YugabyteDB", "Cassandra multi-datacenter", "EDB Postgres Distributed (BDR)"]
      }),
      topic({
        name: "Partitioning strategies",
        definition: "Partitioning divides a logical dataset by range, hash, list, geography, tenant, or composite key so work and storage can scale independently.",
        howItWorks: "A routing function maps each record to one partition. Good keys spread load while preserving the locality needed by queries and transactions; rebalancing moves ownership safely.",
        practicalExample: "Orders partition by hash(customerId) for customer history, while a separate time-partitioned analytical store supports operational reporting. Large tenants may receive dedicated shards.",
        useWhen: ["One node cannot meet capacity, throughput, or maintenance windows.", "Tenant or geographic isolation is a business requirement."],
        avoidWhen: ["A single-node design still has comfortable headroom.", "Most transactions span candidate partitions."],
        failureModes: ["Skew overloads a partition.", "Cross-partition queries fan out to every shard.", "Rebalancing doubles traffic or violates ownership."],
        tradeoffs: ["Scale and isolation versus routing and cross-shard complexity.", "Locality versus even distribution."],
        operations: ["Track per-partition rate, bytes, p99, queue depth, and tenant concentration.", "Automate split, move, drain, and rollback with fencing tokens."],
        technologies: ["PostgreSQL declarative partitioning", "Citus", "DynamoDB partition keys", "Kafka partitions", "Vitess"]
      }),
      topic({
        name: "Hot partitions",
        definition: "A hot partition receives disproportionately high traffic, storage, or contention and exhausts its local capacity before the system-wide average is high.",
        howItWorks: "Skew comes from celebrity entities, monotonic time keys, low-cardinality keys, or a single serialized invariant. Adaptive partitioning helps only when the hot key itself can split.",
        practicalExample: "A flash-sale SKU cannot be served by one inventory row. Admission tokens are bucketed, inventory ownership is serialized behind a reservation service, and reads use a cached approximate availability signal.",
        useWhen: ["Treat hot-key design as mandatory for feeds, counters, flash sales, and large tenants."],
        avoidWhen: ["Do not hide a correctness invariant behind random sharding without a reconciliation rule."],
        failureModes: ["Throttling creates retry amplification.", "A hot logical key remains hot after physical splits.", "Random suffixes make reads expensive fan-outs."],
        tradeoffs: ["Key spreading versus aggregation cost and consistency.", "Dedicated capacity versus utilization."],
        operations: ["Observe top keys and per-shard saturation, not averages.", "Pre-warm, isolate, rate-limit, and rehearse degradation for known events."],
        technologies: ["DynamoDB Contributor Insights", "Redis Cluster", "Kafka partition metrics", "Cassandra virtual nodes"]
      }),
      topic({
        name: "Consistent hashing",
        definition: "Consistent hashing maps keys and nodes onto a logical ring so membership changes move only a fraction of keys instead of remapping the full dataset.",
        howItWorks: "A key belongs to the next token clockwise; virtual nodes or many tokens smooth distribution. Replicas occupy subsequent distinct failure domains. Modern systems may use rendezvous hashing for similar goals.",
        practicalExample: "A client-side cache cluster uses rendezvous hashing so adding a Redis node invalidates only the keys reassigned to that node rather than the entire cache.",
        useWhen: ["Client-side sharding, caches, partition ownership, or sticky routing needs stable remapping."],
        avoidWhen: ["The datastore already owns routing.", "Range scans and co-location by ordered key are essential."],
        failureModes: ["Too few virtual nodes cause imbalance.", "Clients with stale membership disagree on owners.", "Replication ignores availability zones."],
        tradeoffs: ["Low remap cost versus ring and membership complexity.", "Uniformity versus range locality."],
        operations: ["Version and distribute membership atomically; observe ownership variance.", "Throttle rebalancing and retain fallback owners during movement."],
        technologies: ["Cassandra token ring", "Dynamo-style systems", "Envoy ring-hash routing", "Rendezvous hashing"]
      }),
      topic({
        name: "Transactions",
        definition: "A transaction groups operations into one logical unit with defined atomicity, isolation, and durability guarantees.",
        howItWorks: "The database records intent in a log, coordinates locks or versions, validates conflicts, and commits or rolls back. A local transaction does not make remote side effects atomic.",
        practicalExample: "Creating an order and its outbox event occurs in one PostgreSQL transaction; payment authorization is a separate idempotent step coordinated by a saga.",
        useWhen: ["A business invariant spans records within one transactional boundary.", "Partial application would be materially incorrect."],
        avoidWhen: ["Do not stretch a database transaction over network calls or user think time.", "Do not use distributed transactions when compensation or boundary redesign is safer."],
        failureModes: ["Deadlocks and serialization retries surface under concurrency.", "Long transactions retain versions and locks.", "Unknown commit outcomes trigger duplicates."],
        tradeoffs: ["Invariant protection versus contention and latency.", "Larger atomic boundaries versus availability and scalability."],
        operations: ["Set statement, lock, and transaction timeouts; expose retryable error classes.", "Monitor deadlocks, abort rates, long transactions, and log growth."],
        technologies: ["PostgreSQL", "Spring @Transactional", "DynamoDB TransactWriteItems", "Spanner"]
      }),
      topic({
        name: "ACID",
        definition: "ACID means atomicity, consistency of declared invariants, isolation between concurrent transactions, and durability after commit.",
        howItWorks: "Write-ahead logging supplies atomicity and durability; constraints and application logic preserve consistency; locks or multiversion concurrency control provide a chosen isolation level.",
        practicalExample: "A PostgreSQL ledger transaction inserts balanced debit and credit entries, enforces account references, and commits before publishing through an outbox.",
        useWhen: ["Money, inventory ownership, identity, and workflows need auditable invariants."],
        avoidWhen: ["Do not assume ACID automatically protects invariants the schema never encoded.", "Do not equate ACID with global serializability."],
        failureModes: ["Weak isolation permits write skew.", "Durability settings acknowledge before replicas or stable media.", "Application-side dual writes escape the transaction."],
        tradeoffs: ["Stronger guarantees versus coordination cost.", "Synchronous durability versus write latency."],
        operations: ["Document the actual isolation and durability configuration.", "Test crash recovery and constraint behavior under concurrent load."],
        technologies: ["PostgreSQL MVCC", "MySQL InnoDB", "Spanner", "CockroachDB"]
      }),
      topic({
        name: "BASE",
        definition: "BASE describes systems that prioritize basic availability, allow soft or intermediate state, and converge eventually instead of enforcing every invariant synchronously.",
        howItWorks: "Independent replicas accept or serve work during coordination gaps, then exchange updates and resolve conflicts. Convergence requires explicit merge semantics, delivery, and repair.",
        practicalExample: "Product search may briefly show an older title after a catalog update; the indexed document carries sourceVersion so consumers reject regressions and replay missing events.",
        useWhen: ["Staleness is bounded and reversible, and availability or distribution matters more than immediate agreement."],
        avoidWhen: ["Safety-critical, monetary, or scarce-resource decisions cannot tolerate conflicting states."],
        failureModes: ["'Eventually' has no measured bound.", "Non-commutative writes lose intent.", "Repair streams expire before a replica rejoins."],
        tradeoffs: ["Availability and local latency versus temporary inconsistency.", "Loose coupling versus reconciliation complexity."],
        operations: ["Define convergence SLOs, source versions, anti-entropy, and manual repair procedures.", "Alert on oldest unprocessed change, not only consumer rate."],
        technologies: ["DynamoDB Global Tables", "Cassandra", "Kafka projections", "CRDT-based systems"]
      }),
      topic({
        name: "Isolation levels",
        definition: "Isolation levels define which concurrent anomalies transactions may observe, from read committed through repeatable read or snapshot isolation to serializable execution.",
        howItWorks: "MVCC gives transactions snapshots while predicate locks, validation, or strict locking prevent progressively more anomalies. Product names do not always map to identical semantics.",
        practicalExample: "Two checkout requests each see one remaining unit. Under read committed both may decrement unless an atomic conditional update or serializable transaction protects the invariant.",
        useWhen: ["Choose the weakest level that still protects documented invariants, supplemented by atomic statements or constraints."],
        avoidWhen: ["Do not rely on default isolation without testing the actual race.", "Do not raise global isolation to fix one poorly modeled workflow."],
        failureModes: ["Lost updates, non-repeatable reads, phantoms, and write skew.", "Serializable abort storms under contention."],
        tradeoffs: ["Correctness simplicity versus concurrency and retry cost.", "Snapshot performance versus write-skew risk."],
        operations: ["Create deterministic concurrency tests and treat serialization failures as expected retryable outcomes.", "Track conflicts and lock waits by operation."],
        technologies: ["PostgreSQL isolation levels", "Spring transaction isolation", "Jepsen-style testing"]
      }),
      topic({
        name: "Optimistic versus pessimistic locking",
        definition: "Optimistic locking detects a conflicting write at commit or conditional update; pessimistic locking reserves access before changing data.",
        howItWorks: "Optimistic control compares a version or snapshot and retries on mismatch. Pessimistic control acquires row or distributed locks and blocks competitors until completion.",
        practicalExample: "A customer profile PATCH uses If-Match/version for optimistic updates. A short PostgreSQL inventory allocation may use SELECT FOR UPDATE when contention is bounded and all writers share the database.",
        useWhen: ["Optimistic: conflicts are rare and retries are cheap.", "Pessimistic: contention is likely and a short exclusive critical section protects a local invariant."],
        avoidWhen: ["Avoid optimistic retries for hot resources with expensive side effects.", "Avoid pessimistic locks across services, remote calls, or long work."],
        failureModes: ["Optimistic livelock under heavy contention.", "Pessimistic deadlocks, lock leaks, and convoying.", "A distributed lock without fencing permits stale owners."],
        tradeoffs: ["Concurrency versus retry waste.", "Predictable exclusivity versus blocking and availability."],
        operations: ["Set lock timeouts, bounded retries with jitter, and expose conflict metrics.", "Use monotonic fencing tokens for external resources."],
        technologies: ["JPA @Version", "PostgreSQL FOR UPDATE", "DynamoDB ConditionExpression", "Redis locks with fencing"]
      }),
      topic({
        name: "Eventual consistency",
        definition: "Eventual consistency permits replicas or derived views to differ temporarily but requires them to converge when updates stop and communication succeeds.",
        howItWorks: "Changes propagate asynchronously through replication or events. Ordering, conflict resolution, deduplication, and repair determine whether and how convergence occurs.",
        practicalExample: "Catalog is authoritative in PostgreSQL; Debezium and Kafka update OpenSearch. Product detail can read the source of truth while search exposes freshness age and tolerates a short delay.",
        useWhen: ["Derived views, recommendations, analytics, and discovery tolerate bounded staleness."],
        avoidWhen: ["A decision spends money, grants access, or consumes scarce inventory based on possibly stale state."],
        failureModes: ["Updates arrive out of order and regress state.", "Poison events halt convergence.", "Consumers cannot rebuild from retained history."],
        tradeoffs: ["Loose coupling and availability versus stale reads and repair machinery.", "Higher throughput versus user-visible anomalies."],
        operations: ["Carry entity version, measure end-to-end freshness percentiles, and support replay plus reconciliation.", "Design UX for pending state rather than pretending writes are instantly global."],
        technologies: ["Kafka", "Debezium", "OpenSearch", "DynamoDB Streams"]
      }),
      topic({
        name: "Strong consistency",
        definition: "Strong consistency makes completed writes appear in a single agreed order according to a specified model, commonly linearizability for individual operations or serializability for transactions.",
        howItWorks: "A leader or quorum coordinates replicas before acknowledging. During a partition the system may reject or delay operations rather than return conflicting authoritative results.",
        practicalExample: "An inventory reservation uses a conditional write against the authoritative stock partition; a search availability badge remains advisory and cannot authorize checkout.",
        useWhen: ["Access grants, balances, unique names, and scarce-resource allocation require one current answer."],
        avoidWhen: ["Global coordination cost exceeds the value of immediacy for feeds, analytics, or caches."],
        failureModes: ["Leader loss increases latency or causes temporary unavailability.", "Client timeouts leave commit outcome unknown.", "A supposedly strong read is accidentally routed to an asynchronous replica."],
        tradeoffs: ["Clear invariants versus coordination latency and reduced partition availability.", "Global ordering versus regional autonomy."],
        operations: ["Expose consistency mode in clients, test quorum loss, and bound retries around unknown outcomes.", "Measure leader placement and cross-zone/region latency."],
        technologies: ["PostgreSQL primary", "DynamoDB strongly consistent reads", "Spanner", "etcd"]
      }),
      topic({
        name: "Quorum reads and writes",
        definition: "Quorum protocols read from R replicas and write to W replicas out of N; overlap can make the latest version observable when R + W > N, subject to version and failure assumptions.",
        howItWorks: "Coordinators contact replicas, wait for the configured count, compare versions, and may repair stale copies. Sloppy quorums and last-write-wins weaken the simple mathematical claim.",
        practicalExample: "A Cassandra service with RF=3 may use LOCAL_QUORUM within a region, accepting that cross-region replicas lag and global behavior is not linearizable.",
        useWhen: ["Tunable availability and latency are useful and application conflicts are understood."],
        avoidWhen: ["Do not use the equation alone to claim linearizability.", "Strict global invariants need consensus or single ownership."],
        failureModes: ["Clock-based versions select the wrong winner.", "Read repair cannot recover an expired tombstone.", "Correlated replica placement defeats fault tolerance."],
        tradeoffs: ["Higher quorum for freshness/durability versus latency and availability.", "Local quorum versus cross-region staleness."],
        operations: ["Align replica placement to failure domains; monitor repair age and hinted-handoff backlog.", "Document consistency per operation, not per database brand."],
        technologies: ["Cassandra", "ScyllaDB", "Dynamo-style systems"]
      }),
      topic({
        name: "Schema evolution",
        definition: "Schema evolution changes stored or exchanged data while old and new writers, readers, and records coexist.",
        howItWorks: "Safe changes expand first, migrate/backfill, switch readers and writers, then contract. Events use compatibility rules and defaults; databases use online DDL and resumable backfills.",
        practicalExample: "Add nullable promotionSource, deploy readers that tolerate absence, publish it from new producers, backfill in throttled batches, validate, then make the contract stricter in a later release.",
        useWhen: ["Every production schema change should follow a mixed-version plan."],
        avoidWhen: ["Avoid renames, type narrowing, or required fields in one deployment.", "Avoid backfills that contend with peak traffic."],
        failureModes: ["Old consumers reject new enum values.", "Backfill replication lag overloads replicas.", "Rollback writes an incompatible old shape."],
        tradeoffs: ["Compatibility windows and duplicate fields versus deployment safety.", "Faster migration versus production load."],
        operations: ["Use schema registries/contract tests, rate-limited checkpoints, and validation queries.", "Define rollback for both code and data before execution."],
        technologies: ["Flyway", "Liquibase", "Kafka Schema Registry", "Avro", "Protobuf", "PostgreSQL online DDL"]
      }),
      topic({
        name: "Change data capture",
        definition: "Change data capture converts committed database-log changes into an ordered stream for downstream projections and integrations.",
        howItWorks: "A connector reads WAL/binlog positions, emits row-level changes, and checkpoints progress. Consumers deduplicate, apply per-key versions, and rebuild projections from retained history or snapshots.",
        practicalExample: "Debezium reads PostgreSQL product changes into Kafka; an indexer upserts OpenSearch only when the source LSN/version is newer than the document version.",
        useWhen: ["Legacy or authoritative database changes must feed search, analytics, cache invalidation, or integration without application dual writes."],
        avoidWhen: ["Raw row changes lack the business semantics consumers require.", "Sensitive columns cannot safely enter a broad stream."],
        failureModes: ["Schema changes break connectors.", "Replication slots retain WAL until disk fills.", "Snapshot and live stream overlap creates duplicates or regressions."],
        tradeoffs: ["Reliable capture of commits versus coupling to storage schema.", "Low application intrusion versus connector operations."],
        operations: ["Monitor source log retention, connector lag, schema changes, and destination idempotency.", "Classify and redact fields before shared topics."],
        technologies: ["Debezium", "Kafka Connect", "PostgreSQL logical decoding", "DynamoDB Streams", "AWS DMS"]
      }),
      topic({
        name: "Event sourcing",
        definition: "Event sourcing persists an aggregate's accepted domain events as the source of truth and derives current state by folding those events.",
        howItWorks: "Commands validate against an aggregate version, append immutable events with optimistic concurrency, and update projections asynchronously. Snapshots accelerate replay but do not replace the log.",
        practicalExample: "An order stream records OrderPlaced, PaymentAuthorized, InventoryReserved, Shipped, and Refunded, preserving why the state changed and enabling temporal audit.",
        useWhen: ["Audit history, temporal reasoning, replay, and domain transitions are central enough to justify the model."],
        avoidWhen: ["Simple CRUD and reporting do not benefit from replay.", "The team lacks event-versioning and projection-operating discipline."],
        failureModes: ["Events encode mutable implementation details.", "A bug replay corrupts every projection.", "Privacy deletion conflicts with immutable payloads."],
        tradeoffs: ["Auditability and new projections versus conceptual and operational complexity.", "Immutable history versus correction and privacy challenges."],
        operations: ["Version events, make upcasters deterministic, verify snapshots, and rehearse projection rebuilds.", "Store sensitive values by erasable reference or crypto-shreddable key."],
        technologies: ["EventStoreDB", "Kafka with domain constraints", "Axon", "PostgreSQL append-only event store"]
      }),
      topic({
        name: "CQRS",
        definition: "Command Query Responsibility Segregation uses different models for writes that enforce invariants and reads optimized for specific views.",
        howItWorks: "Commands update the authoritative model; events or CDC project state into one or more read stores. The API exposes pending/stale behavior rather than assuming immediate projection updates.",
        practicalExample: "Checkout commands operate on PostgreSQL order aggregates; customer order history is a denormalized DynamoDB view and support search is an OpenSearch projection.",
        useWhen: ["Read and write workloads have materially different models, scale, or ownership."],
        avoidWhen: ["One transactional schema serves both sides adequately.", "The business cannot tolerate or explain projection lag."],
        failureModes: ["Projection consumers stop silently.", "Users read stale state immediately after a command.", "Too many bespoke views multiply cost."],
        tradeoffs: ["Purpose-built reads and independent scale versus eventual consistency and more components.", "Clear command intent versus duplicated models."],
        operations: ["Track projection checkpoints and freshness; retain rebuild paths.", "Return command IDs/status and use read-your-write routing where needed."],
        technologies: ["Spring Boot", "Kafka", "PostgreSQL", "DynamoDB", "OpenSearch"]
      }),
      topic({
        name: "Data retention",
        definition: "Data retention defines how long each class of data remains available in each storage tier and why.",
        howItWorks: "Classification maps legal, product, analytical, and operational needs to TTL, lifecycle, legal-hold, and deletion policies across primary stores, replicas, caches, logs, and backups.",
        practicalExample: "Raw request logs keep 14 days with token/PII redaction, order records follow statutory retention, abandoned-cart items expire after 30 days, and aggregated metrics retain 13 months.",
        useWhen: ["Every dataset needs an owner, purpose, retention duration, deletion SLA, and hold policy."],
        avoidWhen: ["Never retain by default because storage seems cheap.", "Do not delete from the primary while forgotten copies persist indefinitely."],
        failureModes: ["TTL backlog leaves data queryable.", "Legal hold and deletion jobs conflict.", "Backups violate the promised erasure timeline."],
        tradeoffs: ["Analytical/history value versus privacy, breach impact, and cost.", "Fine-grained deletion versus operational simplicity."],
        operations: ["Inventory copies, verify deletion with sampled audits, and alert on lifecycle drift.", "Document restoration behavior for records already deleted by policy."],
        technologies: ["DynamoDB TTL", "S3 Lifecycle", "PostgreSQL partition drop", "OpenSearch ISM"]
      }),
      topic({
        name: "Archival",
        definition: "Archival moves infrequently accessed data to a lower-cost, slower tier while preserving integrity, discoverability, and controlled retrieval.",
        howItWorks: "Closed time partitions or immutable exports are checksummed, cataloged, encrypted, and moved to object storage classes; online indexes retain only the locator and necessary summary.",
        practicalExample: "Orders older than seven years are exported as versioned Parquet to S3 Glacier with a manifest and checksum, then removed from hot PostgreSQL partitions after restore verification.",
        useWhen: ["Compliance or rare investigations require history that should not burden online stores."],
        avoidWhen: ["Latency-sensitive data or frequently changing records belong in hot/warm storage.", "An archive without a tested reader is not a usable archive."],
        failureModes: ["Schema knowledge is lost.", "Retrieval misses keys or takes longer than the business promise.", "Deletion requests cannot find archived copies."],
        tradeoffs: ["Lower cost and smaller hot stores versus retrieval latency and tooling.", "Immutable formats versus correction workflows."],
        operations: ["Test restore samples, preserve schema and lineage, rotate encryption keys safely, and catalog legal holds.", "Budget retrieval fees and time in support procedures."],
        technologies: ["Amazon S3", "S3 Glacier", "Parquet", "AWS Glue Data Catalog", "Athena"]
      }),
      topic({
        name: "Backup and recovery",
        definition: "Backups are recoverable copies independent of the live failure domain; recovery is the proven process that restores usable data to a selected point.",
        howItWorks: "Full snapshots plus incremental logs enable point-in-time recovery. Copies are encrypted, access-controlled, replicated, integrity-checked, and restored regularly into isolated environments.",
        practicalExample: "RDS automated snapshots and WAL support a five-minute RPO; quarterly restore drills rebuild the database, rotate credentials, run reconciliation queries, and measure time to service readiness.",
        useWhen: ["Always: replication protects availability, while backups protect against deletion, corruption, and operator error."],
        avoidWhen: ["Do not count an untested snapshot or same-account replica as recovery assurance."],
        failureModes: ["Backups share credentials with compromised production.", "Corruption is replicated and old clean points expire.", "Restore completes but dependent services or keys are missing."],
        tradeoffs: ["Backup frequency and immutability versus cost.", "Fine-grained PITR versus log retention overhead."],
        operations: ["Measure restore success, achieved RPO/RTO, checksum validity, and dependency readiness.", "Use cross-account immutable copies and least-privilege break-glass access."],
        technologies: ["RDS PITR", "AWS Backup Vault Lock", "S3 Object Lock", "pgBackRest"]
      }),
      topic({
        name: "Disaster recovery",
        definition: "Disaster recovery restores a business service after a region, account, control-plane, or correlated dependency failure, within declared RTO and RPO.",
        howItWorks: "Runbooks combine data replication/backups, infrastructure definitions, dependency failover, traffic steering, credential recovery, validation, and an accountable decision process.",
        practicalExample: "A warm-standby AWS region continuously receives order data, keeps scaled-down Kubernetes and Kafka capacity, and is promoted through a tested runbook with DNS, fencing, reconciliation, and failback steps.",
        useWhen: ["Business impact analysis justifies a recovery tier: backup/restore, pilot light, warm standby, or multi-site."],
        avoidWhen: ["Do not buy active-active complexity for a recovery objective that warm standby meets."],
        failureModes: ["Both regions depend on one identity, DNS, artifact, or secrets control plane.", "Failover creates split-brain writes.", "Data is available but capacity or staff procedures are not."],
        tradeoffs: ["Lower RTO/RPO versus continuous cost and complexity.", "Automatic failover speed versus false-positive blast radius."],
        operations: ["Run game days including failback, lost-write accounting, and external-provider behavior.", "Track configuration drift and prove alternate-region capacity under peak assumptions."],
        technologies: ["AWS Route 53", "Aurora Global Database", "DynamoDB Global Tables", "S3 CRR", "Kubernetes", "Terraform"]
      })
    ],
    decisionMatrices: [
      {
        title: "Data-store selection matrix",
        columns: ["Workload / invariant", "Default fit", "Why", "Watch closely"],
        rows: [
          ["Orders, payments, ledger", "PostgreSQL / distributed SQL", "Transactions, constraints, audit joins", "Hot aggregates, isolation, regional latency"],
          ["Customer cart or session by key", "DynamoDB / key-value", "Predictable key access and burst scale", "Partition keys, conditional writes, TTL semantics"],
          ["Flexible product authoring", "Document or relational JSONB", "Aggregate-local evolving attributes", "Document bounds, index growth, governance"],
          ["Product discovery", "OpenSearch plus authoritative store", "Text relevance, facets, autocomplete", "Freshness, rebuilds, mapping explosions"],
          ["Fraud relationship traversal", "Graph database", "Variable-hop relationship queries", "Supernodes and cross-shard traversal"],
          ["High-volume ordered telemetry", "Time-series / wide-column", "Append throughput, range scans, retention", "Cardinality, compaction, late data"],
          ["Object/media payloads", "Object storage plus metadata DB", "Cheap durable blobs and lifecycle tiers", "Consistency around metadata, access control"],
          ["Cross-model analytics", "Columnar lake/warehouse", "Large scans and aggregation economics", "Freshness, governance, small-file debt"]
        ],
        guidance: "Use a system of record plus derived purpose-built views when one engine cannot meet conflicting needs. Every additional store needs an owner, lag SLO, rebuild path, security boundary, and cost model."
      },
      {
        title: "Consistency decision matrix",
        columns: ["Decision", "Required model", "Implementation pattern", "Failure stance"],
        rows: [
          ["Consume scarce inventory", "Strong per SKU/location", "Conditional write or serialized owner", "Reject/defer when quorum unavailable"],
          ["Show search availability", "Eventual, bounded", "Versioned projection", "Display advisory state; verify at checkout"],
          ["Update profile preference", "Read-your-write", "Primary/session token or versioned merge", "Return pending state if projection lags"],
          ["Maintain financial balance", "Serializable or append-only invariant", "Ledger transaction", "Never guess; reconcile unknown outcome"],
          ["Generate recommendation", "Eventual", "Streaming/batch projection", "Serve older model or degrade gracefully"]
        ]
      },
      {
        title: "Partition-key review",
        columns: ["Criterion", "Good evidence", "Red flag"],
        rows: [
          ["Distribution", "p99 key rate within per-partition headroom", "Average-only capacity estimate"],
          ["Locality", "Critical read and invariant stay partition-local", "Routine full-cluster fan-out"],
          ["Growth", "Item count and bytes bounded per key", "Tenant or time key grows forever"],
          ["Rebalance", "Online split/move with fencing and rollback", "Manual emergency migration"],
          ["Hot keys", "Explicit celebrity and flash-event mitigation", "Uniform synthetic load test only"]
        ]
      }
    ],
    diagrams: [
      {
        id: "data-authority-projections",
        title: "Authoritative write model and rebuildable projections",
        type: "flow",
        nodes: [
          { id: "api", label: "Spring Boot command API", group: "compute" },
          { id: "pg", label: "PostgreSQL system of record", group: "data" },
          { id: "outbox", label: "Transactional outbox", group: "data" },
          { id: "kafka", label: "Kafka domain events", group: "stream" },
          { id: "search", label: "OpenSearch discovery view", group: "read" },
          { id: "dynamo", label: "DynamoDB customer view", group: "read" },
          { id: "lake", label: "S3 analytical archive", group: "read" },
          { id: "reconcile", label: "Reconciliation and replay", group: "control" }
        ],
        flows: [
          ["api", "pg", "transaction"], ["pg", "outbox", "same commit"], ["outbox", "kafka", "at-least-once publish"],
          ["kafka", "search", "versioned upsert"], ["kafka", "dynamo", "idempotent projection"], ["kafka", "lake", "append"],
          ["reconcile", "pg", "scan source versions"], ["reconcile", "search", "repair/rebuild"], ["reconcile", "dynamo", "repair/rebuild"]
        ],
        caption: "The database transaction protects the command invariant. Derived views are explicitly stale, versioned, measurable, and rebuildable."
      },
      {
        id: "online-schema-evolution",
        title: "Expand, migrate, contract",
        type: "sequence",
        nodes: [
          { id: "old", label: "Old application" }, { id: "new", label: "New application" },
          { id: "db", label: "Database" }, { id: "worker", label: "Backfill worker" }, { id: "checks", label: "Validation" }
        ],
        flows: [
          ["new", "db", "1. add compatible nullable field/index"], ["old", "db", "2. continue old reads/writes"],
          ["new", "db", "3. dual-read or dual-write intentionally"], ["worker", "db", "4. throttled resumable backfill"],
          ["checks", "db", "5. compare completeness and lag"], ["new", "db", "6. switch to new representation"],
          ["old", "db", "7. retire old fleet, then contract later"]
        ]
      },
      {
        id: "regional-data-ownership",
        title: "Partitioned ownership instead of unsafe global multi-write",
        type: "flow",
        nodes: [
          { id: "useast", label: "US East API" }, { id: "euwest", label: "EU West API" },
          { id: "owner", label: "Account/SKU ownership directory" }, { id: "usdb", label: "US authoritative partitions" },
          { id: "eudb", label: "EU authoritative partitions" }, { id: "bus", label: "Global event replication" },
          { id: "views", label: "Regional read projections" }
        ],
        flows: [
          ["useast", "owner", "resolve owner"], ["euwest", "owner", "resolve owner"],
          ["owner", "usdb", "route US-owned writes"], ["owner", "eudb", "route EU-owned writes"],
          ["usdb", "bus", "committed events"], ["eudb", "bus", "committed events"], ["bus", "views", "eventual local views"]
        ]
      }
    ],
    examples: [
      {
        title: "Atomic inventory reservation in PostgreSQL",
        language: "sql",
        code: `UPDATE inventory
SET available = available - :quantity,
    reserved = reserved + :quantity,
    version = version + 1
WHERE sku = :sku
  AND location_id = :locationId
  AND available >= :quantity
RETURNING version;`,
        explanation: "One conditional statement makes the non-negative inventory invariant atomic. Zero returned rows means sold out or a stale request—not an infrastructure retry signal."
      },
      {
        title: "Version-aware projection consumer",
        language: "java",
        code: `@KafkaListener(topics = "catalog.product.v1")
void project(ProductChanged event) {
  var current = repository.versionOf(event.productId());
  if (current != null && current >= event.aggregateVersion()) return;
  search.upsert(event.productId(), event.aggregateVersion(), event.document());
}`,
        explanation: "At-least-once delivery and reordering are expected. The destination must make duplicate and older events harmless; the production implementation should commit the consumer checkpoint only after the durable upsert."
      },
      {
        title: "Conditional cart update in DynamoDB",
        language: "json",
        code: `{
  "Key": {"pk": "CUSTOMER#42", "sk": "SKU#ABC"},
  "UpdateExpression": "SET quantity = :q, version = :next",
  "ConditionExpression": "attribute_not_exists(version) OR version = :expected",
  "ExpressionAttributeValues": {":q": 2, ":expected": 7, ":next": 8}
}`,
        explanation: "The version condition prevents a delayed retry from overwriting a newer cart. The API should return a conflict with the current version, not blindly loop forever."
      },
      {
        title: "Spring transaction plus outbox",
        language: "java",
        code: `@Transactional
public OrderId place(PlaceOrder command) {
  Order order = Order.create(command);
  orders.save(order);
  outbox.append(DomainEvent.of("OrderPlaced", order.id(), order.version()));
  return order.id();
}`,
        explanation: "The order and publication intent commit together. A relay may publish more than once, so eventId and aggregateVersion remain required downstream."
      }
    ],
    checklists: [
      {
        title: "Data architecture review",
        items: [
          "Name the authoritative source and owner for every mutable fact.",
          "List critical access patterns with peak rate, cardinality, result size, and latency target.",
          "State each business invariant and the boundary that enforces it.",
          "Specify consistency per workflow: linearizable, serializable, read-your-write, monotonic, or bounded eventual.",
          "Demonstrate partition-key distribution with realistic heavy tenants and event spikes.",
          "Budget indexes, write amplification, replication, backups, and derived-store cost.",
          "Define projection lag SLOs, replay, deduplication, ordering, and reconciliation.",
          "Show expand/migrate/contract and rollback for schema changes.",
          "Map retention, deletion, archive, backup, legal hold, and encryption to every copy.",
          "Prove restore and regional recovery with measured RPO/RTO, not documentation alone."
        ]
      }
    ],
    exercises: [
      {
        id: "m4-store-selection",
        difficulty: "advanced",
        type: "choose-the-right-database",
        prompt: "Design storage for an e-commerce platform with authoritative products, flexible category attributes, full-text search, carts, inventory reservations, and seven-year order audit. Pick boundaries and explain which copies may be stale.",
        suggestedAnswer: "Use PostgreSQL or relational JSONB for authoritative catalog and order/inventory invariants; OpenSearch as a versioned rebuildable discovery view; DynamoDB/key-value for cart with conditional versions and TTL; object storage/warehouse for immutable audit exports. Search and cart analytics may lag; inventory authorization and money cannot.",
        rubric: ["Names authority per fact", "Separates transactional from search workloads", "Defines consistency", "Includes replay/reconciliation", "Covers lifecycle and cost"]
      },
      {
        id: "m4-hot-key",
        difficulty: "lead",
        type: "what-fails-first",
        prompt: "A DynamoDB table is at 18% provisioned capacity but 8% of flash-sale writes throttle. Diagnose what fails first and propose evidence-driven mitigations without weakening the stock invariant.",
        suggestedAnswer: "A hot SKU partition reaches per-partition capacity; retries amplify it. Inspect top keys and consumed capacity. Separate advisory reads, gate admission, use deterministic inventory buckets with a serialized/conditional aggregate or reservation tokens, pre-scale, jitter retries, and reconcile. Do not random-suffix the authoritative count without a safe aggregation rule.",
        rubric: ["Rejects average utilization", "Preserves stock invariant", "Controls retries", "Includes observability and reconciliation"]
      },
      {
        id: "m4-isolation-race",
        difficulty: "advanced",
        type: "architecture-critique",
        prompt: "Two doctors may independently go off call, but at least one must remain. The service uses snapshot isolation and each transaction updates a different row after reading both. Find the anomaly and repair it.",
        suggestedAnswer: "This is write skew: both snapshots see two on-call doctors and each updates a different row. Use serializable isolation with retries, lock a shared schedule aggregate, or encode the invariant in a single guarded row/constraint boundary.",
        rubric: ["Identifies write skew", "Explains why row versions do not conflict", "Offers a testable invariant boundary"]
      },
      {
        id: "m4-dr-game-day",
        difficulty: "lead",
        type: "design-exercise",
        prompt: "Create a recovery game day for orders with RTO 45 minutes and RPO 5 minutes after a regional control-plane failure.",
        suggestedAnswer: "Exercise independent credentials, artifacts, DNS, keys, data restore/replica promotion, fencing, dependency capacity, smoke and reconciliation checks, communications, and failback. Measure last durable order and time to full business workflow—not merely database availability.",
        rubric: ["Tests correlated dependencies", "Measures achieved RPO/RTO", "Prevents split brain", "Includes business validation and failback"]
      }
    ],
    quiz: [
      {
        question: "Does R + W > N by itself guarantee linearizable reads?",
        choices: ["Yes, always", "Only with compatible versioning, replica sets, and protocol semantics", "Only when reads use one replica", "Only for NoSQL"],
        answer: 1,
        explanation: "Quorum overlap is necessary in some protocols but not sufficient when sloppy quorums, clock-based conflict resolution, concurrent writes, or inconsistent replica membership are involved."
      },
      {
        question: "Which design most safely feeds OpenSearch after a PostgreSQL order commit?",
        choices: ["Write both inside one HTTP handler", "Poll OpenSearch until it agrees", "Commit order and outbox together, then idempotently project", "Use a longer database transaction around the network call"],
        answer: 2,
        explanation: "A transactional outbox closes the database/publication gap; versioned idempotent consumers handle duplicate or reordered delivery."
      },
      {
        question: "What is the most important first step when selecting a partition key?",
        choices: ["Choose a UUID", "Model realistic key distribution and critical local operations", "Add more replicas", "Enable autoscaling"],
        answer: 1,
        explanation: "Partition keys must balance traffic and retain required locality. Replicas and autoscaling do not fix a single unsplittable hot logical key."
      },
      {
        question: "Why is a read replica not a backup?",
        choices: ["It cannot run SQL", "It immediately replicates deletion or corruption", "It is always synchronous", "It cannot be promoted"],
        answer: 1,
        explanation: "Replication improves availability but commonly propagates operator error and corruption. Backups preserve independent recovery points."
      },
      {
        question: "Under snapshot isolation, which anomaly can still violate a cross-row invariant?",
        choices: ["Dirty read", "Write skew", "Torn page", "DNS rebinding"],
        answer: 1,
        explanation: "Transactions updating different rows may both commit from snapshots that made the same predicate appear true."
      },
      {
        question: "What makes eventual consistency an engineering commitment rather than a slogan?",
        choices: ["A NoSQL database", "A convergence bound, versions, repair, and user-visible semantics", "Three replicas", "Asynchronous code"],
        answer: 1,
        explanation: "Teams must define how updates order and merge, how lag is measured, how divergence repairs, and what users experience while state is stale."
      }
    ],
    keyTakeaways: [
      "Business invariants—not database categories—determine the authoritative boundary and consistency model.",
      "Derived stores are safe when their staleness is explicit, versioned, observable, and repairable.",
      "Partitioning trades one-node limits for routing, skew, rebalancing, and cross-partition complexity.",
      "ACID guarantees are only as strong as the isolation, durability configuration, and encoded constraints actually used.",
      "Replication is not backup; availability design is not disaster recovery until failover and restore are proven.",
      "Schema and data lifecycle changes must work across mixed versions, rollback, retention, archive, and deletion."
    ]
  });

  upsertModule({
    id: "module-6-security-governance",
    number: 6,
    title: "Security and Governance",
    kicker: "Reduce trust, data exposure, and blast radius while preserving operability",
    summary: "Security architecture maps identity, policy, sensitive-data flows, tenant boundaries, and verifiable controls onto the system design. Protocol correctness matters, but ownership and evidence determine whether controls remain effective.",
    estimatedMinutes: 175,
    level: "advanced",
    objectives: [
      "Separate authentication, authorization, delegation, token format, and session concerns precisely.",
      "Design least-privilege service and network boundaries with rotation and incident response.",
      "Minimize PII and payment scope across storage, logs, events, analytics, and support tooling.",
      "Turn threat models and compliance obligations into testable architecture controls and evidence."
    ],
    topics: [
      topic({
        name: "Authentication",
        definition: "Authentication establishes confidence that a user, workload, device, or service is the identity it claims to be.",
        howItWorks: "An identity provider verifies one or more factors, applies risk policy, and creates a bounded session or credential. Downstream systems validate issuer, audience, freshness, and binding rather than trusting self-asserted identity headers.",
        practicalExample: "Employees authenticate to an enterprise IdP with phishing-resistant MFA; a Spring Boot API trusts tokens only from that issuer and maps the immutable subject to its local account record.",
        useWhen: ["Every protected human and machine entry point needs an explicit authentication authority and assurance level."],
        avoidWhen: ["Do not build password or MFA infrastructure when a mature managed IdP meets requirements.", "Do not accept identity passed by an untrusted client."],
        failureModes: ["Credential stuffing, phishing, session fixation, and account recovery bypass.", "A stale/deleted identity remains accepted.", "Shared service credentials erase accountability."],
        tradeoffs: ["Higher assurance and step-up checks versus user friction.", "Central IdP consistency versus correlated dependency risk."],
        operations: ["Monitor failed/risky sign-ins, recovery, MFA enrollment, credential age, and IdP availability.", "Design break-glass access with short duration, strong audit, and post-use review."],
        technologies: ["WebAuthn/FIDO2", "Amazon Cognito", "Microsoft Entra ID", "Okta", "Spring Security"]
      }),
      topic({
        name: "Authorization",
        definition: "Authorization decides whether an authenticated principal may perform a specific action on a specific resource in the current context.",
        howItWorks: "Policy evaluates subject, action, resource, tenant, attributes, relationship, purpose, and environment. Enforcement must occur at the service that owns the resource; gateway scopes are coarse prechecks, not object-level authorization.",
        practicalExample: "A support agent with orders:read can view only orders in assigned business units, and sensitive fields are masked unless a time-limited elevated role plus case reference is present.",
        useWhen: ["Enforce RBAC for stable job functions, ABAC for contextual constraints, and ReBAC for resource relationships—often in combination."],
        avoidWhen: ["Do not infer permission from UI visibility, client-supplied tenantId, or possession of a valid token alone."],
        failureModes: ["Broken object-level authorization exposes another customer's record.", "Role explosion becomes unreviewable.", "Cached policy outlives revocation."],
        tradeoffs: ["Central policy consistency versus latency/availability and ownership coupling.", "Fine-grained least privilege versus policy complexity."],
        operations: ["Log policy decision IDs and safe reason codes; test deny paths and cross-tenant identifiers.", "Review privileged grants, dormant entitlements, and revocation propagation."],
        technologies: ["Spring method security", "Open Policy Agent", "AWS Cedar/Verified Permissions", "relationship-based access systems"]
      }),
      topic({
        name: "OAuth 2.0",
        definition: "OAuth 2.0 is an authorization framework for a client to obtain scoped access to a resource server on behalf of a resource owner or itself. OAuth alone is not a user-authentication protocol.",
        howItWorks: "Authorization Code with PKCE exchanges a short-lived code at the token endpoint; client credentials represents a workload. The resource server validates access-token issuer, audience, expiry, signature/introspection, and scopes. Refresh tokens stay with an appropriate confidential boundary and rotate where supported.",
        practicalExample: "A browser-facing app uses a backend-for-frontend as an OAuth confidential client. The BFF keeps tokens server-side, sends an HttpOnly session cookie to the browser, and calls order APIs with an audience-bound access token.",
        useWhen: ["Delegated API access, third-party integrations, or standardized service credentials need scopes and lifecycle controls."],
        avoidWhen: ["Do not use the implicit or resource-owner-password flows for new systems.", "Do not send an ID token to an API as an access token."],
        failureModes: ["Redirect URI manipulation, stolen bearer/refresh tokens, authorization-code interception, audience confusion, and overbroad scopes.", "Client credentials are shared across workloads."],
        tradeoffs: ["Standards-based delegation versus flow and lifecycle complexity.", "Self-contained access tokens versus fast revocation with introspection."],
        operations: ["Allowlist exact redirects, require state and PKCE, rotate client credentials/refresh tokens, and audit grants.", "Cache discovery/JWKS safely while honoring key rotation and issuer pinning."],
        technologies: ["OAuth 2.0 Authorization Code + PKCE", "client credentials", "Spring Authorization Server", "Amazon Cognito", "Entra ID"]
      }),
      topic({
        name: "OpenID Connect",
        definition: "OpenID Connect is an identity layer on OAuth 2.0 that lets a client verify an end-user authentication event and obtain standardized identity claims.",
        howItWorks: "The client requests the openid scope, validates the ID token signature, issuer, audience, expiry, and nonce, and may call UserInfo. The ID token is for the client; resource servers authorize API calls using access tokens intended for them.",
        practicalExample: "A Spring BFF redirects to the OIDC provider, binds state/nonce to the browser session, validates the returned ID token, then creates its own secure application session keyed by the stable issuer+subject pair.",
        useWhen: ["Single sign-on and federated user identity are required."],
        avoidWhen: ["Do not use email as the immutable subject or treat every claim as verified/current.", "Do not use OIDC where machine-to-machine OAuth is sufficient."],
        failureModes: ["Nonce/state validation omitted.", "Confusing tokens from another issuer or client.", "Logout/revocation assumptions leave sessions active."],
        tradeoffs: ["Central SSO and MFA versus IdP coupling and session-lifecycle complexity.", "Rich claims versus privacy and stale authorization data."],
        operations: ["Pin issuer metadata, handle signing-key rotation, define local session termination, and minimize requested claims.", "Map issuer+sub to identity and treat authorization attributes with explicit freshness."],
        technologies: ["OIDC Discovery", "ID Token", "UserInfo", "Spring Security oauth2Login"]
      }),
      topic({
        name: "JWT",
        definition: "A JSON Web Token is a compact claims container that is commonly signed as JWS and can be encrypted as JWE. A signed JWT is readable by its holder and is not inherently confidential.",
        howItWorks: "A resource server parses only after enforcing an algorithm allowlist, verifies signature with issuer-controlled keys, and validates iss, aud, exp, nbf, token type, and required authorization claims. Short lifetime limits stale authority; revocation needs additional design.",
        practicalExample: "An order API accepts a five-minute access JWT with aud=orders-api and scopes=orders.read. It rejects a valid token minted for catalog-api, unknown kid after bounded refresh, alg=none, and excessive clock skew.",
        useWhen: ["Distributed resource servers benefit from offline verification and modest claim propagation."],
        avoidWhen: ["Opaque tokens are often better for immediate revocation, very large/dynamic policy, or sensitive claims.", "Never put PAN, secrets, or unnecessary PII in a JWT."],
        failureModes: ["Signature checked but audience/issuer ignored.", "Algorithm confusion or stale key cache.", "Long-lived bearer token replay.", "Roles remain valid after removal."],
        tradeoffs: ["Local validation and availability versus revocation and claim staleness.", "Claims convenience versus token size and exposure."],
        operations: ["Use established libraries, rotate keys with overlap, cap token size/lifetime, and monitor validation failures by safe reason.", "Never log complete tokens."],
        technologies: ["JWS", "JWK/JWKS", "Spring Security Resource Server", "Nimbus JOSE + JWT"]
      }),
      topic({
        name: "Session management",
        definition: "Session management binds a sequence of requests to authenticated application state and controls creation, rotation, expiry, revocation, and termination.",
        howItWorks: "A browser commonly holds an opaque Secure, HttpOnly, SameSite cookie while state and upstream tokens remain server-side. Rotate the identifier after authentication/privilege change, enforce idle and absolute expiry, and protect state-changing requests from CSRF.",
        practicalExample: "A Redis-backed BFF session stores only encrypted token references and user context, uses a __Host- cookie, rotates on step-up authentication, and revokes all sessions after credential compromise.",
        useWhen: ["Browser applications need revocable state and should keep bearer tokens out of JavaScript."],
        avoidWhen: ["Do not store access/refresh tokens in localStorage for a high-risk application.", "Do not accept session IDs in URLs."],
        failureModes: ["Fixation, hijacking, CSRF, overly long sessions, inconsistent logout, and cache/session-store outage."],
        tradeoffs: ["Server-side revocation and smaller browser exposure versus state-store availability.", "Strict expiry versus user friction."],
        operations: ["Measure creation, refresh, revocation, concurrent sessions, anomalous geography/device changes, and store saturation.", "Test key rotation and IdP outage behavior."],
        technologies: ["Spring Session", "Redis", "secure cookies", "CSRF tokens", "backend-for-frontend"]
      }),
      topic({
        name: "API security",
        definition: "API security protects every service boundary through authenticated identity, resource-level authorization, schema validation, safe failure, abuse controls, and hardened processing.",
        howItWorks: "The edge normalizes protocol and size limits; each owning service validates input and authorization. Output encoding, parameterized storage APIs, SSRF egress rules, dependency hygiene, and safe errors close common exploit paths.",
        practicalExample: "PATCH /v1/orders/{id} validates content type/size and an allowlisted JSON schema, derives tenant from trusted identity, authorizes that specific order, uses parameterized queries, and returns RFC 9457 errors without internal details.",
        useWhen: ["Apply defense in depth to public, partner, internal, administrative, and event-driven APIs."],
        avoidWhen: ["An internal network or API gateway is not a substitute for service ownership checks."],
        failureModes: ["BOLA/IDOR, mass assignment, injection, SSRF, unrestricted resource consumption, and verbose error leakage.", "An older API version lacks current controls."],
        tradeoffs: ["Strict validation and small surfaces versus compatibility and integration speed.", "Gateway consistency versus service-specific semantics."],
        operations: ["Inventory APIs and versions, fuzz/negative-test contracts, scan dependencies/images, and monitor authz denials and abuse.", "Use 401 for invalid/missing authentication and 403 for authenticated denial without leaking resource existence."],
        technologies: ["Spring Security", "Bean Validation", "OWASP API Security Top 10", "AWS WAF", "API Gateway"]
      }),
      topic({
        name: "Rate limiting",
        definition: "Rate limiting enforces a consumption policy by identity, tenant, token, IP, operation, or cost to protect fairness, cost, and availability.",
        howItWorks: "Token bucket permits controlled bursts; leaky bucket smooths; fixed/sliding windows count usage. Distributed enforcement uses a consistent authority or deliberately approximate local budgets. Limits complement concurrency and queue admission controls.",
        practicalExample: "Anonymous search is limited by IP plus risk signals, partner APIs by clientId and contract tier, and checkout by account/device risk without allowing attackers to lock out victims by spoofing one dimension.",
        useWhen: ["Protect scarce, expensive, abusive, or contract-governed operations."],
        avoidWhen: ["Do not rely on IP alone for identity or treat rate limiting as authorization/DDoS protection by itself."],
        failureModes: ["Central limiter becomes a bottleneck.", "Fail-open permits cost explosion; fail-closed causes outage.", "Retrying 429s amplifies load."],
        tradeoffs: ["Accurate global fairness versus availability and latency.", "Burst tolerance versus downstream saturation."],
        operations: ["Return 429 and Retry-After, expose quota headers where safe, monitor limit hits and shadow-test new policy.", "Define fail-open/closed per operation and reserve emergency capacity."],
        technologies: ["Redis Lua/token bucket", "API Gateway usage plans", "Envoy local/global rate limit", "Bucket4j"]
      }),
      topic({
        name: "Encryption in transit",
        definition: "Encryption in transit protects confidentiality and integrity while data moves between clients, services, brokers, databases, and administrative tools.",
        howItWorks: "TLS authenticates at least the server and negotiates ephemeral session keys; mutual TLS also authenticates workloads. Certificate identity must be validated against expected names/trust roots and rotated automatically.",
        practicalExample: "Public traffic terminates TLS at an AWS load balancer, then uses TLS to the Kubernetes ingress and mTLS for sensitive service calls; PostgreSQL and Kafka require encrypted authenticated connections.",
        useWhen: ["Use TLS on every untrusted or multi-tenant network path and for sensitive internal traffic."],
        avoidWhen: ["Do not assume VPC placement makes plaintext safe or disable certificate validation to fix deployment issues."],
        failureModes: ["Expired certs, weak protocol/cipher, incorrect trust roots, downgrade, plaintext side channel, or compromised termination point."],
        tradeoffs: ["mTLS workload identity versus certificate and mesh complexity.", "Inspection at proxies versus end-to-end confidentiality."],
        operations: ["Automate issuance/rotation, alert well before expiry, inventory termination points, and test trust-bundle rollover.", "Protect private keys in managed key stores or workload identity systems."],
        technologies: ["TLS 1.2/1.3", "AWS ACM", "cert-manager", "service mesh mTLS", "SPIFFE/SPIRE"]
      }),
      topic({
        name: "Encryption at rest",
        definition: "Encryption at rest protects stored bytes on disks, snapshots, backups, object stores, caches, logs, and removable media from unauthorized raw access.",
        howItWorks: "Services use envelope encryption: data is encrypted with a data key, which is wrapped by a centrally controlled key-encryption key. Application/field encryption narrows trust further when infrastructure-level encryption is insufficient.",
        practicalExample: "RDS, EBS, S3, Kafka volumes, and backups use customer-managed KMS keys; especially sensitive tax identifiers are encrypted at the application field layer with tenant/context-bound associated data.",
        useWhen: ["Baseline for production data, with field/token encryption for high-impact values and separation-of-duty needs."],
        avoidWhen: ["At-rest encryption does not protect data returned to an overprivileged application or written to logs."],
        failureModes: ["Key and ciphertext share unrestricted access.", "Snapshots or exports use different defaults.", "Rotation or key deletion makes data unrecoverable."],
        tradeoffs: ["Additional isolation versus latency, search limitations, and key lifecycle complexity.", "Customer-managed keys versus operational responsibility."],
        operations: ["Inventory encrypted copies, audit decrypt use, test rotation/restore, and protect deletion with multi-party controls.", "Define crypto-shredding and legal-hold interaction."],
        technologies: ["AWS KMS", "RDS/S3 encryption", "envelope encryption", "PostgreSQL pgcrypto selectively"]
      }),
      topic({
        name: "Key management",
        definition: "Key management governs cryptographic key generation, storage, authorization, rotation, versioning, backup, revocation, and destruction.",
        howItWorks: "A KMS/HSM retains key-encryption keys and performs controlled cryptographic operations. Applications receive short-lived identity-based permission, use envelope data keys, bind encryption context, and never store raw master keys.",
        practicalExample: "The order service role may decrypt only its production customer-data key when encryptionContext includes service=orders and environment=prod; administrators can manage policy but cannot decrypt records by default.",
        useWhen: ["Centralize key lifecycle, audit, and separation of duties for all sensitive stores."],
        avoidWhen: ["Do not hardcode keys, reuse one key across unrelated blast radii, or rotate without versioned decrypt support."],
        failureModes: ["Overbroad kms:Decrypt turns KMS into theater.", "Key disable/delete causes outage.", "Regional KMS dependency blocks disaster recovery."],
        tradeoffs: ["Fine-grained keys and rotation versus policy/availability complexity.", "HSM assurance versus cost and throughput."],
        operations: ["Alert on anomalous decrypts and policy changes, test old-ciphertext restore after rotation, and maintain break-glass recovery.", "Separate key administration, data access, and audit roles."],
        technologies: ["AWS KMS", "AWS CloudHSM", "HashiCorp Vault Transit", "envelope encryption"]
      }),
      topic({
        name: "Secrets management",
        definition: "Secrets management stores and delivers credentials, private keys, tokens, and sensitive configuration to authorized workloads with minimal exposure and a controlled lifecycle.",
        howItWorks: "Workload identity authenticates the process to a secret manager, which returns a short-lived or rotated credential at runtime. Secrets stay out of source, images, logs, command lines, and broad environment dumps.",
        practicalExample: "An EKS pod uses IRSA to obtain an RDS IAM auth token and read only its provider API credential from Secrets Manager; rotation updates both provider and consumers with an overlap window.",
        useWhen: ["Use managed identity instead of a secret where possible; otherwise centralize issuance, access, rotation, and audit."],
        avoidWhen: ["Kubernetes Secrets/base64, CI variables, or encrypted config files are not complete lifecycle solutions by themselves."],
        failureModes: ["Secret leaks through logs/crash dumps.", "Rotation breaks cached connections.", "One shared credential prevents attribution and revocation."],
        tradeoffs: ["Dynamic short-lived credentials versus dependency and integration complexity.", "Frequent rotation versus connection churn."],
        operations: ["Scan repositories and artifacts, audit reads, rehearse emergency rotation, and alert on stale/static credentials.", "Define behavior when the secret manager is temporarily unavailable without extending credentials indefinitely."],
        technologies: ["AWS Secrets Manager", "SSM Parameter Store", "Vault", "Kubernetes External Secrets", "IAM roles for service accounts"]
      }),
      topic({
        name: "Network segmentation",
        definition: "Network segmentation divides systems into zones and restricts allowed paths to reduce attack surface, lateral movement, and blast radius.",
        howItWorks: "Default-deny security groups, firewall rules, Kubernetes network policies, private endpoints, controlled ingress/egress, and separate administrative paths enforce a documented communication graph.",
        practicalExample: "Internet traffic reaches only the public load balancer; application pods accept traffic from ingress, databases accept only owning service identities/subnets, and payment egress is allowlisted through a monitored path.",
        useWhen: ["Separate public, application, data, management, PCI, and tenant-sensitive zones according to threat and ownership."],
        avoidWhen: ["Flat trusted networks and ad hoc CIDR allowlists do not provide durable service authorization."],
        failureModes: ["0.0.0.0/0 rules accumulate.", "DNS or control-plane paths bypass policy.", "Emergency rules never close."],
        tradeoffs: ["Containment versus connectivity and debugging complexity.", "Service identity precision versus infrastructure overhead."],
        operations: ["Generate allowed-flow inventories, test denied paths, review drift, log meaningful rejects, and time-limit exceptions.", "Include IPv6, egress, and managed-service endpoints."],
        technologies: ["AWS VPC/security groups", "AWS PrivateLink", "Kubernetes NetworkPolicy", "service mesh authorization"]
      }),
      topic({
        name: "Zero-trust architecture",
        definition: "Zero trust removes implicit trust based on network location and continuously evaluates identity, device/workload, resource, action, and context for each access.",
        howItWorks: "Strong workload/user identity, least-privilege policy, authenticated encryption, short-lived credentials, posture/context, and telemetry protect each resource boundary. It is an architecture principle, not a single proxy product.",
        practicalExample: "A pod calling inventory presents a SPIFFE identity over mTLS and an audience-bound service token; inventory policy permits only Reserve on the caller's tenant scope, regardless of shared cluster network.",
        useWhen: ["Hybrid, cloud, partner, administrative, and service-to-service environments where location cannot prove intent."],
        avoidWhen: ["Do not add token hops without resource-level policy or retain broad network trust behind a zero-trust-branded gateway."],
        failureModes: ["Identity control plane becomes a correlated outage.", "Policies grant wildcards for operability.", "Legacy paths bypass enforcement."],
        tradeoffs: ["Smaller trust zones and attribution versus identity/policy operational complexity.", "Frequent re-evaluation versus latency and dependency."],
        operations: ["Inventory identities and policies, simulate denies, monitor exceptions, rotate credentials, and provide bounded break-glass.", "Stage enforcement from observe to deny with owner sign-off."],
        technologies: ["SPIFFE/SPIRE", "service mesh", "OPA", "AWS IAM", "BeyondCorp-style access"]
      }),
      topic({
        name: "Audit logging",
        definition: "Audit logging creates durable evidence of security- and business-significant actions: who or what acted, on which resource, when, through which authority, and with what outcome.",
        howItWorks: "Services emit structured, append-oriented events to a separately controlled pipeline with synchronized timestamps, immutable IDs, policy decision/context, integrity controls, retention, and restricted search.",
        practicalExample: "A refund audit event records actor subject, support case, order reference, amount/currency, prior/new state, authorization decision ID, request/trace ID, result, and source IP category—without card or full customer data.",
        useWhen: ["Privileged access, auth changes, policy decisions, sensitive reads, financial transitions, data exports/deletes, and configuration changes."],
        avoidWhen: ["Do not use mutable application debug logs as the sole audit record or put secrets/needless PII into evidence."],
        failureModes: ["Attackers can alter/delete logs.", "Shared accounts destroy attribution.", "Audit pipeline outage silently drops actions."],
        tradeoffs: ["Evidence completeness versus volume and privacy exposure.", "Synchronous assurance versus business-path availability."],
        operations: ["Alert on pipeline gaps and privileged actions, use write-once retention where justified, audit access to audits, and test investigations.", "Define degraded behavior for actions when audit durability is unavailable."],
        technologies: ["AWS CloudTrail", "S3 Object Lock", "OpenTelemetry Logs", "SIEM platforms"]
      }),
      topic({
        name: "Data privacy",
        definition: "Data privacy ensures personal data is collected, used, shared, retained, and deleted only for explicit legitimate purposes with appropriate rights and transparency.",
        howItWorks: "Data maps connect purpose, classification, lawful/contractual basis, owner, stores, processors, regions, retention, access, and deletion. Minimization and purpose limitation are architecture constraints, not policy documents alone.",
        practicalExample: "Recommendation training consumes pseudonymous behavioral features, excludes raw contact data, keeps lineage and consent state, enforces regional residency, and can rebuild after deletion requests.",
        useWhen: ["Apply privacy-by-design to schemas, events, telemetry, analytics, ML, support, vendors, and backups."],
        avoidWhen: ["Do not collect speculative fields or copy production personal data into lower environments."],
        failureModes: ["Shadow copies evade deletion.", "Secondary use exceeds original purpose.", "Derived features re-identify users.", "Vendor transfer lacks controls."],
        tradeoffs: ["Data utility and personalization versus exposure and obligations.", "Deletion granularity versus immutable analytical/event designs."],
        operations: ["Maintain data inventory and lineage, verify rights workflows and deletion SLAs, review processors, and test restoration after deletion.", "Use synthetic or masked test data."],
        technologies: ["Data catalogs", "Macie/DLP", "Lake Formation", "tokenization", "privacy-preserving analytics"]
      }),
      topic({
        name: "PII handling",
        definition: "PII handling applies classification-specific controls to information that identifies or can reasonably be linked to a person, including combinations that become identifying.",
        howItWorks: "Classify direct, indirect, sensitive, and regulated fields; minimize collection; isolate identifiers from operational facts; tokenize or pseudonymize; restrict access; redact telemetry; and propagate deletion/retention to every copy.",
        practicalExample: "Order events carry customerRef, country code, and fulfillment status—not name, email, street address, or token. A tightly controlled profile service resolves the reference for the few workflows that need contact data.",
        useWhen: ["Use field-level classification and flow review wherever personal data enters, leaves, or changes purpose."],
        avoidWhen: ["Hashing a low-entropy email without a secret does not anonymize it.", "Encryption is not permission to replicate PII broadly."],
        failureModes: ["PII appears in URLs, logs, traces, DLQs, analytics, or support screenshots.", "Joins re-identify pseudonymous data.", "Backups outlive deletion commitments."],
        tradeoffs: ["Central isolation reduces exposure but adds availability and integration dependency.", "Pseudonymization preserves joins but remains personal data in many threat models."],
        operations: ["Automate schema/telemetry scanning, sample redaction, audit sensitive reads, and trace subject-rights propagation.", "Treat non-production and incident artifacts as copies."],
        technologies: ["Tokenization vaults", "AWS Macie", "KMS field encryption", "DLP scanners", "format-preserving tokenization selectively"]
      }),
      topic({
        name: "Multi-tenancy",
        definition: "Multi-tenancy serves multiple customer organizations from shared software or infrastructure while preserving isolation, fairness, configurability, and lifecycle ownership.",
        howItWorks: "Common models are pooled tables with tenant keys, schema-per-tenant, database/account-per-tenant, or hybrids that place large/regulated tenants in cells. Tenant context comes from trusted identity and propagates through requests, jobs, events, caches, and telemetry.",
        practicalExample: "A SaaS platform uses pooled stateless services and PostgreSQL row-level security for standard tenants, but allocates regulated tenants to separate AWS accounts/databases behind the same control plane.",
        useWhen: ["Choose isolation tier from breach impact, noisy-neighbor risk, customization, residency, scale, and operating economics."],
        avoidWhen: ["Do not infer tenant from a request body or assume one schema pattern fits every tenant size."],
        failureModes: ["Cross-tenant query/cache/event leak.", "One tenant exhausts shared resources.", "Per-tenant customization prevents upgrades.", "Tenant deletion misses async copies."],
        tradeoffs: ["Pooling efficiency versus blast radius.", "Dedicated isolation versus fleet cost and upgrade toil."],
        operations: ["Meter cost and saturation by tenant, enforce quotas, canary migrations across cells, and automate tenant move/export/delete.", "Test cross-tenant negatives continuously."],
        technologies: ["PostgreSQL RLS", "DynamoDB composite tenant keys", "Kubernetes namespaces", "AWS Organizations/accounts", "cell-based architecture"]
      }),
      topic({
        name: "Tenant isolation",
        definition: "Tenant isolation prevents one tenant's identity, data, workload, configuration, or resource consumption from affecting or revealing another tenant.",
        howItWorks: "Identity-derived tenant context participates in every authorization and storage key; database policy supplies defense in depth; caches, search aliases, object prefixes, queues, encryption keys, and observability enforce the same boundary.",
        practicalExample: "Repository methods do not accept a free-form tenant string from controllers; a verified TenantContext scopes PostgreSQL RLS, S3 access points, Redis keys, OpenSearch filtered aliases, and Kafka message headers validated by consumers.",
        useWhen: ["Treat isolation as an end-to-end invariant with technical and operational layers."],
        avoidWhen: ["A WHERE tenant_id clause by convention is insufficient for high-impact pooled data."],
        failureModes: ["Missing predicate or cache-key namespace leaks data.", "Background jobs lose tenant context.", "Support/admin bypass is overbroad.", "Timing/resource side channels remain."],
        tradeoffs: ["Multiple enforcement layers versus complexity and testing.", "Hard resource quotas versus utilization."],
        operations: ["Run generated cross-tenant tests, policy simulation, per-tenant rate/saturation metrics, and privileged-access reviews.", "Include migration, restore, export, and deletion tooling in the boundary."],
        technologies: ["PostgreSQL RLS", "AWS IAM ABAC", "S3 Access Points", "OpenSearch filtered aliases", "Redis ACL/key namespaces"]
      }),
      topic({
        name: "Compliance considerations",
        definition: "Compliance maps applicable legal, contractual, and industry obligations to owned controls, retained evidence, exceptions, and recurring verification.",
        howItWorks: "Scope data and system boundaries first, then map requirements to preventive/detective controls and evidence. Inherited cloud controls reduce work but never transfer the customer's configuration and usage responsibilities.",
        practicalExample: "Keep cardholder data out of the commerce platform using provider-hosted fields and provider tokens. Isolate payment webhooks and token references, verify signatures, restrict egress, and document which PCI responsibilities remain rather than claiming tokenization removes all scope.",
        useWhen: ["Architecture reviews must consider PCI DSS, privacy, audit, retention, residency, accessibility, or sector obligations relevant to the actual system."],
        avoidWhen: ["Do not design from checklist labels without validating applicability and system scope.", "A compliant cloud service does not make the application compliant."],
        failureModes: ["Scope quietly expands through logs/events/support tools.", "Evidence is manual or missing.", "Exceptions never expire.", "Control exists but is not effective."],
        tradeoffs: ["Smaller scope and managed services versus integration constraints and vendor dependency.", "Strong segregation versus cost and delivery speed."],
        operations: ["Maintain control owners, evidence automation, exception expiry, vendor attestations, and periodic scope diagrams.", "Engage security/legal/QSA specialists for interpretations rather than embedding uncertain rules in code."],
        technologies: ["AWS Artifact", "Security Hub", "CloudTrail", "AWS Config", "GRC platforms", "payment tokenization providers"]
      }),
      topic({
        name: "Threat modeling",
        definition: "Threat modeling systematically identifies assets, trust boundaries, attacker goals, abuse paths, and mitigations early enough to change the design.",
        howItWorks: "Draw data flows and privilege boundaries, inventory assets/actors, enumerate threats with STRIDE or attack trees, score likelihood and impact, assign mitigations and residual risk, then revisit when architecture changes.",
        practicalExample: "Checkout modeling identifies cart-price tampering, idempotency-key abuse, payment-webhook spoofing, SSRF through image URLs, overshared PII in events, privileged refund fraud, and denial of scarce inventory.",
        useWhen: ["Run at design inception, before major launch, after new data/identity/integration boundaries, and after incidents."],
        avoidWhen: ["Do not produce a static diagram with generic threats and no owners or verification."],
        failureModes: ["Only external attackers are considered.", "Business-logic abuse is missed.", "Mitigations shift risk to operations.", "Residual risk lacks accountable acceptance."],
        tradeoffs: ["Early analysis time versus avoided redesign and incident cost.", "Broad coverage versus prioritization depth."],
        operations: ["Track mitigations like engineering work, connect tests/alerts to threats, and time-bound accepted risks.", "Include insiders, compromised workloads, vendors, supply chain, and recovery paths."],
        technologies: ["STRIDE", "attack trees", "OWASP Threat Dragon", "data-flow diagrams", "MITRE ATT&CK as supporting reference"]
      })
    ],
    decisionMatrices: [
      {
        title: "Identity and token decision matrix",
        columns: ["Scenario", "Recommended pattern", "Why", "Avoid"],
        rows: [
          ["Browser web application", "OIDC Authorization Code + PKCE through BFF; secure session cookie", "Keeps bearer tokens out of browser JavaScript", "Implicit flow; tokens in localStorage"],
          ["Native/mobile application", "OIDC/OAuth Authorization Code + PKCE", "Public client cannot protect a client secret", "Embedded shared secret; password grant"],
          ["Service to service", "Workload identity or OAuth client credentials with audience", "Attributable short-lived machine identity", "Shared static API key across fleet"],
          ["Partner delegated access", "OAuth authorization grant with narrow scopes/consent", "Revocable bounded authority", "Sharing user credentials"],
          ["Immediate central revocation required", "Opaque reference token + introspection or short session", "Authority stays at policy service", "Long-lived self-contained JWT"]
        ]
      },
      {
        title: "Tenant isolation models",
        columns: ["Model", "Isolation", "Economics", "Operational concern"],
        rows: [
          ["Pooled tables/services", "Logical; must be enforced everywhere", "Highest density", "Cross-tenant bug and noisy neighbor"],
          ["Schema per tenant", "Metadata/schema boundary", "Moderate", "Migration fleet and connection count"],
          ["Database per tenant", "Strong data plane", "Higher", "Provisioning, upgrades, backup fleet"],
          ["Account/cell per tenant or cohort", "Strong blast-radius boundary", "Highest fixed cost", "Control-plane automation and drift"],
          ["Hybrid placement", "Risk/size-based", "Optimized by tier", "Tenant movement and consistent control semantics"]
        ],
        guidance: "Choose the minimum isolation that satisfies breach impact, regulation, workload variance, and recovery goals; automate movement to a stronger tier before large tenants become emergencies."
      },
      {
        title: "Sensitive-data control selection",
        columns: ["Data", "Preferred boundary", "Allowed propagation", "Operational proof"],
        rows: [
          ["Payment card data", "Provider-hosted capture/token vault", "Provider token + safe metadata only", "Scope diagram, webhook verification, log scans"],
          ["Address/contact PII", "Profile/fulfillment service", "Opaque reference; reveal only to authorized workflow", "Access audit, deletion test, redaction scan"],
          ["Credentials/secrets", "Workload identity + secret manager", "Short-lived handle/credential", "Rotation exercise, read audit"],
          ["Audit evidence", "Separate append-oriented account/store", "Safe identifiers and decision facts", "Integrity, retention, investigation drill"],
          ["Analytics identity", "Pseudonymous subject in governed lake", "Purpose-limited features", "Lineage, re-identification review, deletion propagation"]
        ]
      },
      {
        title: "Security control behavior under dependency failure",
        columns: ["Control", "Default failure stance", "Reason", "Planned exception"],
        rows: [
          ["Authentication validation", "Fail closed for new sessions", "Cannot establish identity", "Existing short sessions may continue by policy"],
          ["Object authorization", "Fail closed", "Resource exposure is irreversible", "Read-only cached policy only within measured revocation bound"],
          ["Rate limiter", "Per-operation", "Availability and abuse risk differ", "Local emergency budget for critical commands"],
          ["Audit pipeline", "Buffer critical evidence; block highest-risk admin actions if durability is lost", "Accountability requirement", "Bounded encrypted local spool"],
          ["Secret manager", "Use already-issued short-lived credential until expiry", "Avoid broad static fallback", "Break-glass credential with approval/audit"]
        ]
      }
    ],
    diagrams: [
      {
        id: "oidc-bff-api",
        title: "OIDC sign-in with a token-confidential BFF",
        type: "sequence",
        nodes: [
          { id: "browser", label: "Browser" }, { id: "bff", label: "Backend for frontend" },
          { id: "idp", label: "OIDC provider" }, { id: "session", label: "Server session store" },
          { id: "api", label: "Orders resource server" }
        ],
        flows: [
          ["browser", "bff", "start login"], ["bff", "browser", "state + nonce; redirect"],
          ["browser", "idp", "authenticate + authorize"], ["idp", "bff", "authorization code"],
          ["bff", "idp", "code + PKCE verifier; token exchange"], ["bff", "bff", "validate ID token issuer/aud/nonce"],
          ["bff", "session", "store tokens server-side"], ["bff", "browser", "Secure HttpOnly __Host- session cookie"],
          ["browser", "bff", "application request + CSRF defense"], ["bff", "api", "audience-bound access token"],
          ["api", "api", "validate token + object authorization"]
        ],
        caption: "OIDC authenticates the user to the client. The access token authorizes the BFF to call the intended resource server; the ID token is not sent as the API credential."
      },
      {
        id: "tenant-defense-depth",
        title: "Tenant isolation is an end-to-end invariant",
        type: "flow",
        nodes: [
          { id: "identity", label: "Verified issuer + subject + tenant claims" },
          { id: "policy", label: "Object/action policy" }, { id: "service", label: "Owning service TenantContext" },
          { id: "db", label: "PostgreSQL RLS / partition" }, { id: "cache", label: "Tenant-namespaced cache" },
          { id: "search", label: "Filtered search alias" }, { id: "events", label: "Validated tenant event envelope" },
          { id: "quota", label: "Per-tenant quota and saturation" }
        ],
        flows: [
          ["identity", "policy", "trusted context"], ["policy", "service", "permit/deny + decision ID"],
          ["service", "db", "tenant-bound query + RLS"], ["service", "cache", "tenant in key"],
          ["service", "search", "server-owned filter"], ["service", "events", "tenant context signed/validated"],
          ["service", "quota", "admission and fairness"]
        ]
      },
      {
        id: "pci-minimized-boundary",
        title: "Minimize payment-card exposure",
        type: "flow",
        nodes: [
          { id: "browser", label: "Customer browser" }, { id: "hosted", label: "Provider-hosted payment fields" },
          { id: "provider", label: "Payment provider/vault" }, { id: "checkout", label: "Checkout service" },
          { id: "orders", label: "Order database" }, { id: "webhook", label: "Hardened webhook endpoint" },
          { id: "audit", label: "Audit/reconciliation" }
        ],
        flows: [
          ["browser", "hosted", "PAN directly to provider boundary"], ["hosted", "provider", "tokenize"],
          ["provider", "browser", "payment-method token"], ["browser", "checkout", "token + idempotency key; no PAN"],
          ["checkout", "provider", "authorize token"], ["checkout", "orders", "provider refs + safe brand/last4 only if required"],
          ["provider", "webhook", "signed event + replay defense"], ["webhook", "audit", "verified transition/reconciliation"]
        ],
        caption: "Tokenization and hosted fields reduce exposure, but architecture, scripts, webhooks, logs, support tools, and provider responsibilities still require explicit PCI scoping."
      },
      {
        id: "envelope-encryption",
        title: "Envelope encryption and separation of duties",
        type: "flow",
        nodes: [
          { id: "app", label: "Authorized workload identity" }, { id: "kms", label: "KMS key-encryption key" },
          { id: "datakey", label: "Ephemeral data key" }, { id: "cipher", label: "Ciphertext + wrapped key + context" },
          { id: "store", label: "Database/object store" }, { id: "audit", label: "Decrypt audit" }
        ],
        flows: [
          ["app", "kms", "GenerateDataKey with context"], ["kms", "datakey", "plaintext + wrapped copy"],
          ["app", "cipher", "encrypt; erase plaintext key"], ["cipher", "store", "persist"],
          ["app", "kms", "decrypt wrapped key under policy/context"], ["kms", "audit", "record cryptographic use"]
        ]
      }
    ],
    examples: [
      {
        title: "Spring resource-server validation",
        language: "java",
        code: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
  return http
      .authorizeHttpRequests(a -> a
          .requestMatchers(HttpMethod.GET, "/v1/orders/**").hasAuthority("SCOPE_orders.read")
          .anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(j -> j.decoder(orderApiDecoder())))
      .build();
}

JwtDecoder orderApiDecoder() {
  NimbusJwtDecoder d = JwtDecoders.fromIssuerLocation(TRUSTED_ISSUER);
  d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
      JwtValidators.createDefaultWithIssuer(TRUSTED_ISSUER),
      new AudienceValidator("orders-api")));
  return d;
}`,
        explanation: "Library defaults are supplemented with explicit issuer and audience validation. Scope is only a coarse API gate; the order handler must still authorize the requested order and tenant."
      },
      {
        title: "Tenant-safe repository boundary",
        language: "java",
        code: `public Optional<Order> findVisible(OrderId orderId, TenantContext tenant) {
  return jdbc.query(ORDER_SQL,
      Map.of("orderId", orderId.value(), "tenantId", tenant.verifiedId()),
      orderMapper).stream().findFirst();
}`,
        explanation: "Tenant identity comes from verified server context, not request JSON. Database row-level security should provide an independent second layer for pooled high-impact data."
      },
      {
        title: "Webhook authenticity and replay guard",
        language: "java",
        code: `void acceptWebhook(byte[] rawBody, Headers h) {
  verifier.verifyTimestampAndSignature(rawBody, h.signature(), h.timestamp());
  providerEvents.insertOnce(h.eventId(), sha256(rawBody));
  transitions.applyExpected(h.operationId(), h.eventType());
}`,
        explanation: "Verify the signature over the unmodified body, enforce a timestamp tolerance, deduplicate provider eventId, bind it to the expected operation, and guard the state transition. Network allowlists alone are insufficient."
      },
      {
        title: "Security-relevant audit event",
        language: "json",
        code: `{
  "eventType": "ORDER_REFUND_APPROVED",
  "actorSubject": "iss|sub",
  "tenantId": "tenant-17",
  "resourceRef": "order-ref-hash",
  "authorizationDecisionId": "dec-8831",
  "reasonCode": "CUSTOMER_RETURN",
  "outcome": "SUCCEEDED",
  "traceId": "4f...",
  "occurredAt": "2026-07-16T19:42:11Z"
}`,
        explanation: "The event supports attribution and policy review without copying card, address, email, token, or unrestricted request payload data into the audit system."
      },
      {
        title: "Kubernetes workload identity, not static AWS keys",
        language: "yaml",
        code: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-service
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/order-service-prod`,
        explanation: "The role policy should name only required resources/actions and use short-lived credentials. Namespace isolation and admission policy prevent arbitrary pods from adopting the service account."
      }
    ],
    checklists: [
      {
        title: "Architecture security review",
        items: [
          "Draw trust boundaries and every sensitive data flow, including events, logs, analytics, backups, support, and vendors.",
          "Name the authenticating issuer and assurance level for each human and workload identity.",
          "Enforce action-and-resource authorization at the owning service; include tenant and purpose context.",
          "Validate OAuth/OIDC token type, issuer, audience, signature, expiry, nonce/state where applicable, and required scopes.",
          "Use short-lived credentials, managed workload identity, rotation, and audited break-glass instead of shared static secrets.",
          "Validate size, schema, encoding, and allowed fields at every API/event boundary; prevent mass assignment and SSRF.",
          "Default-deny network and egress paths, then document allowed service flows and exceptions.",
          "Define secure behavior when IdP, policy, KMS, secret, limiter, or audit dependencies are unavailable.",
          "Threat-model abuse, insiders, compromised workloads, supply chain, recovery tooling, and administrative paths.",
          "Assign owners and tests to every mitigation and record residual-risk acceptance with expiry."
        ]
      },
      {
        title: "PII, payment, and privacy review",
        items: [
          "For every field, record purpose, classification, owner, regions, consumers, retention, and deletion behavior.",
          "Keep PAN/payment credentials in provider-hosted/tokenized boundaries; document remaining PCI scope with specialists.",
          "Use opaque references rather than PII in URLs, events, logs, traces, DLQs, caches, and metrics.",
          "Restrict and audit sensitive reads, exports, support impersonation, refunds, and bulk operations.",
          "Scan code, telemetry, object stores, and lower environments for secrets and sensitive fields.",
          "Propagate subject deletion/correction through projections, archives, processors, and restore workflows.",
          "Separate key administration, data access, and audit duties; test key rotation and recovery.",
          "Verify webhook signature, freshness, event deduplication, operation binding, and state-transition validity.",
          "Maintain vendor/subprocessor, residency, and data-transfer evidence.",
          "Treat tokenized and pseudonymous data according to re-identification risk, not optimistic labels."
        ]
      },
      {
        title: "Multi-tenant isolation review",
        items: [
          "Derive tenant context only from trusted identity and bind it to every request, job, event, and admin action.",
          "Include tenant in data partition, cache key, search filter, object prefix/policy, quota, and encryption context.",
          "Use database/policy enforcement as defense in depth rather than repository convention alone.",
          "Run negative tests with valid identifiers from another tenant across APIs and async workflows.",
          "Cap noisy-neighbor CPU, memory, connection, queue, storage, and external-provider use.",
          "Automate tenant provision, key rotation, export, migration between cells, suspension, deletion, backup, and restore.",
          "Scope support and break-glass access by tenant, purpose, duration, and case with audit.",
          "Measure tenant-level saturation without exposing tenant identity in broad telemetry."
        ]
      }
    ],
    exercises: [
      {
        id: "m6-oauth-review",
        difficulty: "advanced",
        type: "architecture-critique",
        prompt: "A single-page app obtains a 24-hour JWT through the implicit flow, stores it in localStorage, and sends the ID token to three APIs. Identify the protocol and threat-model failures and redesign it.",
        suggestedAnswer: "OIDC ID tokens authenticate the user to the client and are not API access tokens. Replace implicit with Authorization Code + PKCE, preferably through a BFF that keeps short-lived audience-specific access and rotated refresh tokens server-side behind a Secure HttpOnly SameSite cookie with CSRF defense. APIs validate issuer, audience, expiry, signature, scope, then object authorization.",
        rubric: ["Separates ID/access tokens", "Replaces implicit flow", "Reduces browser token exposure", "Validates audience/issuer", "Includes resource authorization"]
      },
      {
        id: "m6-tenant-leak",
        difficulty: "lead",
        type: "find-the-bottleneck",
        prompt: "A pooled SaaS API correctly filters PostgreSQL rows by tenant, but users intermittently see another tenant's product name. Trace likely cross-tenant paths beyond the database.",
        suggestedAnswer: "Inspect cache keys missing tenant, CDN variation, OpenSearch aliases/filters, asynchronous events with lost tenant context, reused object-storage URLs, support impersonation, and response/request coalescing. Add trusted TenantContext, defense-in-depth policies, tenant-aware namespaces, generated cross-tenant tests, and auditable admin access.",
        rubric: ["Looks beyond SQL", "Covers caches/search/events", "Uses trusted tenant context", "Adds enforcement and testing"]
      },
      {
        id: "m6-pci-scope",
        difficulty: "lead",
        type: "ecommerce-security",
        prompt: "Redesign checkout so the commerce platform avoids handling raw card numbers while supporting authorization, 3-D Secure, refunds, webhooks, reconciliation, and support investigations.",
        suggestedAnswer: "Use provider-hosted fields/redirect or mobile SDK so PAN goes directly to the provider. Commerce receives a scoped token and safe metadata, sends stable idempotent operation IDs, redirects/challenges as required, verifies signed fresh webhooks, stores provider references, and reconciles provider reports. Refund permissions are step-up, case-bound, and audited. Scan logs/events/support tools and confirm remaining PCI scope with a qualified specialist.",
        rubric: ["Keeps PAN out", "Covers idempotency/webhooks", "Handles 3DS and reconciliation", "Secures refunds/support", "Does not claim zero PCI scope"]
      },
      {
        id: "m6-threat-model",
        difficulty: "advanced",
        type: "architecture-review",
        prompt: "Threat-model a product-image importer that accepts a merchant URL and stores the fetched image in S3.",
        suggestedAnswer: "Threats include SSRF to metadata/internal services, DNS rebinding, redirect to private ranges, decompression bombs, malicious MIME/polyglots, oversized downloads, credentialed URL leakage, tenant overwrite, malware, and public-bucket exposure. Use isolated fetch workers, egress proxy/allow rules, resolve-and-pin/public-address checks at every redirect, size/time limits, safe decoders, generated object keys, malware scanning, quarantine, least-privilege S3, and audit.",
        rubric: ["Identifies SSRF and parser risks", "Controls egress/redirects", "Bounds resources", "Protects tenant/object access", "Includes quarantine/audit"]
      },
      {
        id: "m6-key-outage",
        difficulty: "lead",
        type: "what-fails-first",
        prompt: "KMS in the primary region becomes unreachable. Decide which operations continue, fail, or degrade for an order platform using envelope encryption.",
        suggestedAnswer: "Already decrypted in-memory data keys may continue only within short policy/cache bounds; new decrypt/encrypt operations fail closed for sensitive writes. Non-sensitive cached reads can continue if authorization holds. Do not introduce a static fallback master key. Queue no plaintext, surface explicit dependency failure, invoke regional KMS/DR design, protect audit, and reconcile any accepted work after recovery.",
        rubric: ["Avoids insecure fallback", "Distinguishes cached key bounds", "Fails sensitive writes safely", "Covers region design and audit"]
      }
    ],
    quiz: [
      {
        question: "What does OAuth 2.0 define by itself?",
        choices: ["User authentication", "Delegated authorization to resources", "JWT encryption", "Password storage"],
        answer: 1,
        explanation: "OAuth is an authorization framework. OpenID Connect adds standardized end-user authentication and identity claims."
      },
      {
        question: "Which token should an API normally validate for an API request?",
        choices: ["The OIDC ID token", "The access token intended for that API", "The refresh token", "The session cookie from any domain"],
        answer: 1,
        explanation: "The resource server validates an access token with its audience and required authority. An ID token is issued to the client to describe authentication."
      },
      {
        question: "Does signing a JWT hide its claims from the bearer?",
        choices: ["Yes", "Only with RS256", "No; signature provides integrity/authenticity, not confidentiality", "Only after expiry"],
        answer: 2,
        explanation: "A typical JWS payload is base64url encoded and readable. Confidentiality requires JWE or, more commonly, not putting sensitive data in the token."
      },
      {
        question: "Where must object-level authorization be enforced?",
        choices: ["Only in the UI", "Only at the API gateway", "At the service that owns and resolves the resource", "Only in the identity provider"],
        answer: 2,
        explanation: "The owner has the resource and domain context needed to decide whether this subject may perform this action on this object."
      },
      {
        question: "What is the safest default source for tenant identity?",
        choices: ["tenantId in request JSON", "A query parameter", "Verified identity/session context bound by the server", "The Referer header"],
        answer: 2,
        explanation: "Untrusted request fields can select another tenant. The server derives and propagates tenant context from verified authority."
      },
      {
        question: "Why do provider-hosted payment fields reduce risk?",
        choices: ["They make refunds unnecessary", "Raw card data goes directly to the payment provider instead of the merchant application", "They remove every PCI responsibility", "They eliminate webhook verification"],
        answer: 1,
        explanation: "They narrow card-data exposure, but scripts, integration, tokens, webhooks, access, logging, and contractual responsibilities still require explicit scoping."
      },
      {
        question: "Which is a complete secrets strategy?",
        choices: ["Base64 in Kubernetes Secret", "Encrypted value committed to Git", "Workload identity, managed delivery, least privilege, rotation, audit, and incident recovery", "An environment variable shared by all services"],
        answer: 2,
        explanation: "Storage format alone does not address issuance, delivery, authorization, rotation, attribution, leakage, and emergency recovery."
      },
      {
        question: "What is the main purpose of a threat model?",
        choices: ["Prove the system is secure", "Generate a compliance diagram", "Prioritize credible abuse paths and owned mitigations before incidents", "Replace penetration testing"],
        answer: 2,
        explanation: "Threat modeling is a decision tool. It makes boundaries, assets, attacker goals, controls, and residual risk explicit; it complements testing and review."
      }
    ],
    keyTakeaways: [
      "Authentication proves identity; authorization decides a specific action on a specific resource. Every owning service needs both context and enforcement.",
      "OAuth delegates access, OIDC communicates user authentication to a client, and JWT is only a token format.",
      "A valid signature is insufficient: validate issuer, audience, time, token type, authority, and the requested resource.",
      "Workload identity, short-lived credentials, least privilege, segmentation, and auditable break-glass reduce blast radius.",
      "Minimize sensitive data at collection and propagation; encryption does not justify copying PII or payment data everywhere.",
      "Tenant isolation spans identity, authorization, data, cache, search, events, resources, operations, and recovery.",
      "Compliance requires scoped boundaries, effective controls, accountable owners, and repeatable evidence—not service badges.",
      "Threat models stay valuable only when mitigations become tested work and accepted risks expire."
    ]
  });

  upsertModule({
    id: "module-5-distributed-systems-reliability",
    number: 5,
    title: "Distributed Systems and Reliability",
    kicker: "Design for partial failure, uncertain outcomes, and controlled degradation",
    summary: "Distributed reliability is not the absence of failure. It is the ability to preserve critical invariants, contain damage, recover predictably, and give operators enough evidence to act.",
    estimatedMinutes: 210,
    level: "advanced",
    objectives: [
      "Reason explicitly about uncertainty introduced by networks, clocks, retries, and independent failure.",
      "Build message and workflow semantics that tolerate duplicates, reordering, and partial completion.",
      "Choose regional topology from business RTO/RPO and consistency needs.",
      "Turn telemetry into actionable SLOs, alerts, incident decisions, and error-budget policy."
    ],
    topics: [
      topic({
        name: "Partial failures",
        definition: "A partial failure occurs when some components, requests, or communication paths fail while others continue, leaving participants with different and incomplete knowledge.",
        howItWorks: "A caller cannot distinguish a dead server, dropped request, lost response, paused process, or slow dependency from a timeout alone. The system must act under uncertainty rather than infer a global state.",
        practicalExample: "Payment authorization succeeds, but the response is lost. Checkout times out; a retry with the same idempotency key must return the original authorization instead of charging again.",
        useWhen: ["Treat every remote call, distributed workflow, and replicated write as subject to partial failure."],
        avoidWhen: ["Never equate timeout with failure or assume all participants observe the same event."],
        failureModes: ["Unknown outcomes create duplicates.", "Healthy nodes make conflicting decisions based on stale membership.", "Recovery automation amplifies a transient fault."],
        tradeoffs: ["Fail-fast containment versus false rejection.", "Coordination for certainty versus latency and availability."],
        operations: ["Expose outcome states such as accepted, rejected, pending, and unknown.", "Reconcile uncertain operations from authoritative provider records."],
        technologies: ["HTTP idempotency keys", "Kafka", "AWS SDK retry metrics", "Kubernetes probes"]
      }),
      topic({
        name: "Network partitions",
        definition: "A network partition prevents some healthy nodes from communicating while they may still serve clients or reach other dependencies.",
        howItWorks: "Packet loss, routing, firewall, DNS, or zone failures split connectivity. CAP applies when a partition exists: a replicated operation must sacrifice availability for consistency or permit divergent responses; normal-operation latency is the PACELC concern.",
        practicalExample: "During an inter-region partition, a single-owner order service rejects writes in the non-owner region but serves stale order history, preserving order identity and payment invariants.",
        useWhen: ["Choose per-operation partition behavior before multi-zone or multi-region deployment."],
        avoidWhen: ["Do not label an entire product simply CP or AP; different operations can make different choices."],
        failureModes: ["Both sides accept conflicting writes.", "Minority replicas continue as leaders.", "Rejoin overwhelms replication or applies stale data."],
        tradeoffs: ["Invariant preservation versus write availability.", "Regional autonomy versus reconciliation complexity."],
        operations: ["Test asymmetric packet loss and dependency-specific isolation, not only process kills.", "Fence old leaders and measure convergence after healing."],
        technologies: ["Toxiproxy", "AWS Fault Injection Service", "etcd/Raft", "Route 53"]
      }),
      topic({
        name: "Timeouts",
        definition: "A timeout bounds how long a caller waits; it is a resource and latency policy, not proof that the callee did not complete.",
        howItWorks: "Set the end-to-end deadline from the user latency budget, subtract queue and network allowance, and propagate the remaining deadline downstream. Connection, read, write, and acquisition timeouts protect different resources.",
        practicalExample: "A 900 ms checkout-read budget allocates 100 ms gateway, 250 ms pricing, 200 ms inventory, and 150 ms tax, with parallel calls and 200 ms reserve. Calls receive the remaining deadline, not independent one-second timeouts.",
        useWhen: ["Every remote call, pool wait, queue operation, and lock needs a bounded wait."],
        avoidWhen: ["Avoid one global timeout and avoid a stack of downstream timeouts longer than the caller deadline."],
        failureModes: ["Too short causes false failures and retry load.", "Too long exhausts threads/connections.", "Timeout storms synchronize at the same threshold."],
        tradeoffs: ["Resource protection versus false negatives.", "Tight tail latency versus completion rate."],
        operations: ["Derive timeouts from latency histograms under load and include deadline-exceeded attribution.", "Use monotonic clocks for elapsed time."],
        technologies: ["Spring WebClient", "gRPC deadlines", "Envoy", "Resilience4j TimeLimiter"]
      }),
      topic({
        name: "Retries",
        definition: "A retry re-attempts an operation after a likely transient failure, within a bounded time and attempt budget.",
        howItWorks: "Retry only classified transient outcomes, with exponential backoff, jitter, a shared deadline, and an idempotent operation. Place retries at one layer where outcome and budget are understood.",
        practicalExample: "A catalog GET retries one connection reset with full jitter; a checkout POST reuses its idempotency key and queries status after an unknown payment outcome instead of immediately issuing a new authorization.",
        useWhen: ["Failures are transient, attempts are safe, and spare capacity exists."],
        avoidWhen: ["Validation errors, overload, non-idempotent effects, or expired deadlines.", "Avoid multiplying retries in gateway, client, and service."],
        failureModes: ["Retry storms turn degradation into outage.", "Delayed attempts arrive after newer actions.", "Non-idempotent retries duplicate side effects."],
        tradeoffs: ["Higher success probability versus extra load and tail latency.", "Client simplicity versus provider deduplication state."],
        operations: ["Track original calls, attempts, recovered calls, exhausted retries, and added latency separately.", "Honor Retry-After and maintain a retry budget as a fraction of traffic."],
        technologies: ["Resilience4j Retry", "AWS SDK adaptive retries", "Envoy retry budgets"]
      }),
      topic({
        name: "Duplicate processing",
        definition: "Duplicate processing occurs when the same logical command or event is delivered or executed more than once, commonly after retries, redelivery, failover, or checkpoint loss.",
        howItWorks: "At-least-once systems favor not losing work and therefore redeliver. Correct consumers identify the logical operation and make repeated application harmless or detect the prior durable result.",
        practicalExample: "A Kafka consumer restarts after committing an order-status update but before committing its offset. Reprocessing uses eventId plus a unique inbox constraint and skips the already-applied transition.",
        useWhen: ["Assume duplicates at HTTP boundaries, queues, streams, schedulers, and batch recovery."],
        avoidWhen: ["Do not claim exactly-once end to end because one broker transaction deduplicates within a narrow boundary."],
        failureModes: ["Repeated charge, notification, inventory decrement, or state transition.", "Deduplication expires before a late retry.", "Same intent receives a new random identifier."],
        tradeoffs: ["Dedup state and key discipline versus side-effect safety.", "Long dedup windows versus storage cost."],
        operations: ["Measure duplicates and dedup hits; size retention from maximum retry/replay horizon.", "Reconcile external effects that cannot join the local transaction."],
        technologies: ["PostgreSQL unique constraints", "DynamoDB conditional puts", "Kafka transactions", "SQS FIFO deduplication"]
      }),
      topic({
        name: "Idempotency",
        definition: "An idempotent operation produces the same externally meaningful result when the same logical request is applied repeatedly.",
        howItWorks: "The client supplies a stable idempotency key; the owner atomically records key, request fingerprint, status, and response. Same key plus different payload is rejected. In-progress and expired states are explicit.",
        practicalExample: "POST /v1/orders with Idempotency-Key: checkout-8f2 stores the order result in the same transaction. Concurrent duplicates receive the same orderId; mismatched cart versions receive 409.",
        useWhen: ["Commands can be retried or redelivered and side effects must occur once logically."],
        avoidWhen: ["Do not cache only the HTTP response in process memory.", "Do not confuse HTTP method idempotence with business-level deduplication."],
        failureModes: ["Race creates two records before key storage.", "A reused key with changed payload returns an unrelated result.", "TTL is shorter than client retry horizon."],
        tradeoffs: ["Safety and retryability versus durable state and lifecycle rules.", "Fine-grained keys versus client complexity."],
        operations: ["Encrypt or hash sensitive fingerprints, monitor conflict and hit rates, and define retention.", "Make downstream provider keys derive from the same stable operation identity."],
        technologies: ["PostgreSQL INSERT ON CONFLICT", "DynamoDB ConditionExpression", "Stripe-style idempotency", "Redis only as an optimization"]
      }),
      topic({
        name: "Ordering guarantees",
        definition: "Ordering guarantees specify which operations or events observers must see in sequence: none, per key/partition, causal, total, or domain-state-machine order.",
        howItWorks: "A sequencer, partition owner, logical version, or consensus log assigns order. Kafka preserves order within one partition, not across a topic; retries and concurrent producers can still need idempotence and version checks.",
        practicalExample: "All events for order-123 use orderId as the Kafka key and carry aggregateVersion. A consumer accepts version n+1, ignores older versions, and parks gaps for repair.",
        useWhen: ["State transitions, ledgers, and projections depend on predecessor state."],
        avoidWhen: ["Global order is rarely worth its throughput and availability cost when per-entity order suffices."],
        failureModes: ["Wrong partition key reorders one entity.", "Parallel consumers apply completion order instead of event order.", "Late events regress a projection."],
        tradeoffs: ["Stronger order versus coordination and head-of-line blocking.", "More partitions versus per-key locality."],
        operations: ["Track sequence gaps, late-event age, partition skew, and blocked keys.", "Define gap timeout, replay, and poison-event behavior."],
        technologies: ["Kafka partitions", "Pulsar key-shared subscriptions", "database sequence/version", "Raft logs"]
      }),
      topic({
        name: "Clock synchronization",
        definition: "Clock synchronization bounds disagreement between wall clocks; it does not make timestamps a universally safe causal or ordering mechanism.",
        howItWorks: "NTP disciplines wall time but can step or slew; monotonic clocks measure local duration. Hybrid/logical clocks add causality information, while TrueTime-style systems expose uncertainty and wait it out.",
        practicalExample: "Use Instant for audit display, a monotonic timer for timeouts, and aggregateVersion or Kafka offset for ordering. Never resolve inventory conflicts solely with application server timestamps.",
        useWhen: ["Time is needed for expiry, audit, windows, and operations—with an explicit skew tolerance."],
        avoidWhen: ["Do not use wall-clock timestamps as proof of causality or uniqueness across nodes."],
        failureModes: ["Clock jumps expire leases early or late.", "Last-writer-wins discards the causally later update.", "Leap or drift breaks window assignment."],
        tradeoffs: ["Logical ordering accuracy versus metadata and coordination.", "Tighter time bounds versus infrastructure cost."],
        operations: ["Monitor offset and NTP health; fail closed for lease/credential decisions beyond tolerance.", "Record source timestamp and ingestion timestamp separately."],
        technologies: ["NTP/chrony", "Java System.nanoTime", "Hybrid Logical Clocks", "Spanner TrueTime"]
      }),
      topic({
        name: "Distributed consensus",
        definition: "Consensus lets non-faulty nodes agree on a value or ordered log despite crashes and message delay, usually requiring a quorum.",
        howItWorks: "Protocols such as Raft elect a leader for a term, replicate log entries to a majority, and commit only entries that meet protocol rules. Safety holds under partition; availability requires a reachable quorum.",
        practicalExample: "etcd uses Raft to serialize Kubernetes control-plane state. Application services consume that capability for configuration/leases rather than implementing their own election algorithm.",
        useWhen: ["Metadata, membership, leader election, locks with fencing, or strict replicated state needs one decision."],
        avoidWhen: ["High-volume business data can often be partition-owned without one global consensus group.", "Do not build custom consensus casually."],
        failureModes: ["Loss of quorum stops writes.", "Large entries or slow disks stall commit.", "Unsafe membership changes create two quorums."],
        tradeoffs: ["Safety and deterministic leadership versus coordination latency and quorum availability.", "Larger quorums versus fault tolerance cost."],
        operations: ["Use odd-sized clusters across failure domains, monitor commit/apply lag, and control snapshot size.", "Test quorum loss and member replacement without forceful split-brain recovery."],
        technologies: ["etcd", "Consul", "ZooKeeper", "Raft", "Paxos-family systems"]
      }),
      topic({
        name: "Split-brain scenarios",
        definition: "Split brain occurs when multiple nodes or regions believe they are the authoritative writer for the same state.",
        howItWorks: "Partitions, stale leases, forced failover, or broken membership let old and new leaders operate concurrently. Quorums reduce this risk; fencing tokens stop stale leaders at the resource boundary.",
        practicalExample: "A scheduler lease carries monotonically increasing epoch 91. The database rejects writes from epoch 90 even if the old scheduler resumes after a pause.",
        useWhen: ["Design prevention for databases, schedulers, singleton jobs, region failover, and distributed locks."],
        avoidWhen: ["A lease timeout alone is not proof that the previous owner stopped."],
        failureModes: ["Duplicate jobs, conflicting writes, and irreversible external effects.", "Manual promotion skips fencing.", "Clock-based leases overlap under pauses."],
        tradeoffs: ["Quorum/fencing safety versus availability during ambiguity.", "Automatic promotion speed versus false failover risk."],
        operations: ["Require epoch-aware writes, audit promotions, and rehearse rejoin/failback.", "Prefer stopping uncertain writers to reconciling unbounded corruption."],
        technologies: ["etcd leases", "PostgreSQL advisory locks plus fencing", "Kubernetes Lease objects", "STONITH in clustered systems"]
      }),
      topic({
        name: "Saga patterns",
        definition: "A saga coordinates a long-running business transaction as local commits plus compensating actions rather than one global atomic transaction.",
        howItWorks: "Orchestration uses a durable coordinator/state machine; choreography lets services react to events. Each step is idempotent, persists state, defines timeout and compensation, and accepts that compensation is a new business action rather than rollback.",
        practicalExample: "Checkout creates PENDING order, authorizes payment, reserves inventory, and confirms. If reservation fails, it voids payment and marks order REJECTED; a reconciler handles provider uncertainty.",
        useWhen: ["A workflow spans independently owned services and temporary intermediate states are acceptable."],
        avoidWhen: ["A single local transaction or boundary redesign can enforce the invariant.", "Compensation cannot legally or physically undo the effect without explicit policy."],
        failureModes: ["Compensation fails or races with forward progress.", "Choreography forms invisible cycles.", "Operator replay repeats side effects."],
        tradeoffs: ["Service autonomy and availability versus intermediate states and recovery logic.", "Orchestration visibility versus coordinator coupling."],
        operations: ["Persist every transition, timer, attempt, and external reference; expose stuck-state age.", "Provide safe resume, compensate, and manual resolution actions."],
        technologies: ["Temporal", "AWS Step Functions", "Camunda", "Kafka", "Spring Boot state machines"]
      }),
      topic({
        name: "Two-phase commit",
        definition: "Two-phase commit coordinates atomic commit across transactional participants by first preparing each, then issuing a global commit or rollback decision.",
        howItWorks: "Participants durably promise they can commit and hold resources. The coordinator records the decision. A coordinator failure after prepare can leave participants blocked until the outcome is recovered.",
        practicalExample: "A tightly controlled enterprise database transaction can atomically update two XA resources, but it should not include a payment provider or loosely available microservice.",
        useWhen: ["Participants support the protocol, atomicity is non-negotiable, scope is small, and blocking/latency are acceptable."],
        avoidWhen: ["Internet-facing cross-service workflows, long operations, or heterogeneous providers."],
        failureModes: ["In-doubt prepared transactions retain locks.", "Coordinator recovery is unavailable.", "One slow participant caps the whole system."],
        tradeoffs: ["Atomicity versus blocking, coupling, and availability.", "Simpler business state versus harder infrastructure recovery."],
        operations: ["Monitor prepared transaction age and provide a documented heuristic-resolution process.", "Bound participants and transaction duration."],
        technologies: ["XA/JTA", "PostgreSQL PREPARE TRANSACTION", "transaction coordinators"]
      }),
      topic({
        name: "Transactional outbox pattern",
        definition: "The outbox pattern stores a domain change and its publication intent in the same local transaction, then relays the intent asynchronously.",
        howItWorks: "A service inserts an outbox row with eventId, aggregateId, version, type, and payload. CDC or a polling relay publishes it. Delivery is normally at least once, so consumers remain idempotent.",
        practicalExample: "OrderPlaced and the new order commit together in PostgreSQL. Debezium publishes the outbox row to Kafka; inventory rejects duplicate eventId and older aggregateVersion.",
        useWhen: ["A database commit must reliably trigger a message without a distributed transaction."],
        avoidWhen: ["Do not treat the outbox as end-to-end exactly once.", "Avoid opaque row-change events when a stable domain contract is needed."],
        failureModes: ["Relay lag grows unnoticed.", "Outbox table bloats.", "Schema or payload leaks internal/sensitive fields."],
        tradeoffs: ["Reliable publication versus lag and relay operations.", "Domain event clarity versus contract stewardship."],
        operations: ["Monitor oldest unpublished age, retain until broker confirmation, archive safely, and support replay.", "Use schema compatibility and field classification."],
        technologies: ["Debezium Outbox Event Router", "Kafka Connect", "PostgreSQL", "Spring transactions"]
      }),
      topic({
        name: "Dead-letter queues",
        definition: "A dead-letter queue isolates messages that exceeded a deliberate retry policy so healthy work can continue and operators can inspect or repair them.",
        howItWorks: "After classified transient retries, the consumer publishes the original envelope plus error, attempts, schema, trace, and source position. Redrive is controlled and idempotent.",
        practicalExample: "An invalid shipment address event goes to shipment.dlq.v1 after schema validation; support corrects referenced data, then a tool redrives selected event IDs with audit metadata.",
        useWhen: ["Poison messages would otherwise block a partition or create infinite retry."],
        avoidWhen: ["A DLQ must not become silent data loss or a substitute for alerting and ownership."],
        failureModes: ["Sensitive payloads leak into broad-access queues.", "Blind bulk redrive recreates an outage.", "Ordering gaps leave later messages invalid."],
        tradeoffs: ["Flow continuity versus out-of-band recovery and ordering complexity.", "Rich diagnostic context versus data exposure."],
        operations: ["Assign owner and age/volume SLO; redact sensitive values; redrive in bounded batches.", "Preserve source position and causal keys for repair."],
        technologies: ["Kafka DLQ topics", "Amazon SQS redrive policies", "Spring Kafka DeadLetterPublishingRecoverer"]
      }),
      topic({
        name: "Backpressure",
        definition: "Backpressure makes downstream capacity limits visible upstream so producers slow, buffer within bounds, or reject work instead of creating unbounded queues.",
        howItWorks: "Pull-based demand, bounded queues, consumer credits, rate adaptation, or admission control couple offered load to service capacity. It must cross every boundary; one unbounded executor defeats it.",
        practicalExample: "A Reactor-based Spring service limits concurrent inventory calls, pauses Kafka partitions when its bounded worker queue is full, and resumes below a low-water mark.",
        useWhen: ["Any pipeline can receive work faster than a stage processes it."],
        avoidWhen: ["Do not use memory as an implicit infinite buffer or let broker lag grow without a recovery bound."],
        failureModes: ["Queueing inflates latency until deadlines expire.", "Producers ignore slow signals.", "Head-of-line blocking starves priority work."],
        tradeoffs: ["Stability versus throughput during bursts.", "Buffer absorption versus stale work and recovery time."],
        operations: ["Track queue age, not only depth; define capacity, watermarks, priorities, and rejection semantics.", "Load-test sustained overload and recovery."],
        technologies: ["Reactive Streams", "Kafka pause/resume", "gRPC flow control", "SQS visibility and concurrency controls"]
      }),
      topic({
        name: "Load shedding",
        definition: "Load shedding deliberately rejects or drops lower-value work when capacity is exhausted to preserve critical workflows and prevent collapse.",
        howItWorks: "Admission control checks concurrency, queue age, deadline, priority, tenant quota, and dependency health before consuming scarce resources. Responses are explicit and retry guidance avoids amplification.",
        practicalExample: "During a flash sale the platform preserves checkout and inventory reservation, serves cached recommendations, rejects expensive anonymous facets, and returns 429 with Retry-After at the edge.",
        useWhen: ["Demand can exceed hard capacity or downstream health can shrink it."],
        avoidWhen: ["Do not shed after expensive work is already done or randomly discard irreversible commands."],
        failureModes: ["All tiers retry simultaneously.", "Priority inversion starves important tenants.", "Health checks pass while queues are already unusable."],
        tradeoffs: ["Partial availability versus total outage.", "Fairness versus business priority."],
        operations: ["Define service classes and shed points; alert on shed rate and affected business outcomes.", "Exercise overload, recovery, and Retry-After behavior."],
        technologies: ["Envoy overload manager", "API Gateway throttling", "Resilience4j Bulkhead", "Kubernetes HPA as a slower complement"]
      }),
      topic({
        name: "Graceful degradation",
        definition: "Graceful degradation preserves a smaller, explicitly safe product experience when a dependency or capacity tier is unavailable.",
        howItWorks: "Capabilities are ranked by business criticality and correctness risk. The service uses cached, stale, approximate, deferred, or disabled modes only where semantics remain honest.",
        practicalExample: "Product pages use a recent cached catalog and hide recommendations during search trouble; checkout refuses to guess price, payment, or inventory and presents a recoverable pending state.",
        useWhen: ["Optional features, read views, or deferred work can fail independently."],
        avoidWhen: ["Never degrade authoritative security, balance, pricing, or inventory checks into fabricated success."],
        failureModes: ["Fallback depends on the same failed system.", "Stale data causes unsafe decisions.", "Degraded mode remains enabled after recovery."],
        tradeoffs: ["User continuity versus reduced freshness/functionality.", "More fallback paths versus testing burden."],
        operations: ["Name modes, entry/exit conditions, freshness labels, and owner; include them in game days.", "Measure business outcome and time spent degraded."],
        technologies: ["Redis cache", "CDN stale-if-error", "feature flags", "circuit breakers"]
      }),
      topic({
        name: "Multi-region design",
        definition: "Multi-region design places service and data capabilities across geographically separate regions for latency, sovereignty, or disaster resilience.",
        howItWorks: "Traffic routing, data ownership, replication, failover, dependencies, secrets, artifacts, observability, and operator authority must all survive the intended regional failure. Data topology is the limiting decision.",
        practicalExample: "Customer reads are local in US and EU; each account has a home region for order writes, events replicate to local read views, and disaster promotion changes ownership epoch with explicit fencing.",
        useWhen: ["Measured business impact, latency, or residency requirements justify the additional system."],
        avoidWhen: ["A multi-AZ single region meets the objective or global writes lack conflict semantics."],
        failureModes: ["Hidden global dependency takes down every region.", "Failover has insufficient capacity.", "Regional data conflicts or violates residency."],
        tradeoffs: ["Lower regional latency/resilience versus duplicated cost and correctness complexity.", "Home-region ownership versus failover delay."],
        operations: ["Maintain regional dependency maps, capacity evidence, routing tests, fencing, data-loss accounting, and failback drills.", "Run region-isolation exercises, not only application restarts."],
        technologies: ["AWS multi-region", "Route 53/Global Accelerator", "DynamoDB Global Tables", "Aurora Global Database", "Kubernetes"]
      }),
      topic({
        name: "Active-active and active-passive architectures",
        definition: "Active-active serves production traffic from multiple sites; active-passive keeps a standby that is promoted after failure. Active-active reads are easier than conflict-free active-active writes.",
        howItWorks: "Active-active needs routing, capacity, shared or partitioned ownership, and conflict handling. Active-passive needs replication, health decisions, promotion, fencing, capacity warm-up, and failback.",
        practicalExample: "A catalog is active-active for reads with asynchronous regional indexes. Order writes are active-passive per customer home region, giving a clear authority during normal operations.",
        useWhen: ["Active-active when latency/availability value exceeds conflict cost; active-passive when clear ownership and simpler recovery meet RTO."],
        avoidWhen: ["Do not call two writable databases active-active without defining conflicts and split-brain behavior."],
        failureModes: ["Uneven traffic overloads survivor.", "False promotion creates two writers.", "Passive configuration or data silently drifts."],
        tradeoffs: ["Instant capacity utilization versus constant coordination.", "Standby simplicity versus failover time and idle cost."],
        operations: ["Prove N-1 capacity, replication lag, promotion/fencing, and failback.", "Route synthetic business transactions through every site continuously."],
        technologies: ["AWS Global Accelerator", "Route 53 ARC", "Aurora Global Database", "DynamoDB Global Tables"]
      }),
      topic({
        name: "RTO and RPO",
        definition: "Recovery Time Objective is the maximum targeted time to restore a business capability; Recovery Point Objective is the maximum targeted data loss measured backward from disruption.",
        howItWorks: "Business impact sets objectives per workflow. Architecture then maps replication, backup frequency, capacity, dependencies, runbooks, and staffing to those targets; exercises report achieved values.",
        practicalExample: "Checkout may target RTO 30 minutes/RPO near zero, while recommendation training targets RTO 24 hours/RPO one day. Their recovery designs and costs should differ.",
        useWhen: ["Prioritize recovery investment by business capability and data class."],
        avoidWhen: ["Do not inherit one enterprise-wide number or confuse high availability with recoverability."],
        failureModes: ["Database meets RTO but identity, DNS, keys, or vendors do not.", "Async lag exceeds RPO during peak traffic.", "Objectives exist only on paper."],
        tradeoffs: ["Tighter objectives versus replication, standby, automation, and staffing cost."],
        operations: ["Measure actual time from incident start to validated workflow and actual lost/duplicated business records.", "Review objectives as business impact changes."],
        technologies: ["AWS Backup", "Route 53 ARC", "S3 cross-region replication", "runbook automation"]
      }),
      topic({
        name: "Chaos engineering",
        definition: "Chaos engineering runs controlled experiments to test a specific resilience hypothesis under realistic conditions and bounded blast radius.",
        howItWorks: "Define steady-state business metrics, hypothesis, abort conditions, scope, owner, and rollback. Inject one failure mode, observe, learn, fix, and promote the experiment gradually.",
        practicalExample: "Hypothesis: losing one Kafka broker during 2x order traffic keeps confirmed-order loss at zero and consumer freshness under 60 seconds. Abort if checkout error rate exceeds 2%.",
        useWhen: ["Architecture claims about failover, retry, degradation, or recovery need evidence."],
        avoidWhen: ["Do not inject unbounded faults without observability, owner, rollback, or incident readiness."],
        failureModes: ["Experiment tests infrastructure health but not customer outcomes.", "Blast radius escapes.", "Known issues remain unfixed while experiments repeat."],
        tradeoffs: ["Confidence and learning versus operational risk and preparation cost."],
        operations: ["Begin in lower environments, then production with safeguards; preserve findings and actions.", "Include dependency latency, partitions, credential failures, and capacity loss—not only pod termination."],
        technologies: ["AWS Fault Injection Service", "LitmusChaos", "Chaos Mesh", "Toxiproxy"]
      }),
      topic({
        name: "Observability",
        definition: "Observability is the ability to infer a system's internal state from its outputs well enough to explain novel failures, not merely view preselected dashboards.",
        howItWorks: "Correlated logs, metrics, traces, profiles, events, and business state share stable service, operation, tenant-safe, deployment, and trace identifiers. Telemetry answers user impact, scope, cause, and recovery.",
        practicalExample: "A checkout dashboard links SLO burn to deployment version, region, payment-provider latency, Kafka lag, and order states stuck in PAYMENT_PENDING, with trace exemplars into sanitized spans.",
        useWhen: ["Every production design needs observability requirements alongside functional requirements."],
        avoidWhen: ["Do not collect everything without questions, cardinality controls, retention, privacy, and owners."],
        failureModes: ["Telemetry pipeline fails with the service.", "High-cardinality labels explode cost.", "Sampling drops rare errors or secrets enter payloads."],
        tradeoffs: ["Diagnostic depth versus cost, performance, and privacy.", "Centralization versus correlated blast radius."],
        operations: ["Define telemetry budgets, sampling, redaction, retention, and alternate-region access.", "Validate signals during load and disaster tests."],
        technologies: ["OpenTelemetry", "CloudWatch", "Prometheus", "Grafana", "Datadog", "Jaeger"]
      }),
      topic({
        name: "Logging",
        definition: "Logs are timestamped, structured records of discrete events intended for diagnosis, audit, and workflow evidence.",
        howItWorks: "Applications emit machine-parseable fields with event name, severity, service, version, trace/request ID, safe entity references, and outcome. Central pipelines index only useful dimensions and archive selectively.",
        practicalExample: "order.transition records orderRefHash, fromState, toState, reasonCode, traceId, eventId, and duration—not the card, token, address, or full customer object.",
        useWhen: ["Record state transitions, errors with context, security events, and infrequent diagnostic facts."],
        avoidWhen: ["Do not log secrets, access tokens, payment data, raw PII, or high-frequency metrics as prose."],
        failureModes: ["Log storms consume CPU/disk.", "Inconsistent text prevents aggregation.", "Sensitive data broadens breach scope."],
        tradeoffs: ["Forensic detail versus cost and exposure.", "Verbose debug value versus production overhead."],
        operations: ["Use schema governance, sampling/rate limits, retention tiers, access audit, and redaction tests.", "Keep audit logs tamper-evident and separate from debug logs."],
        technologies: ["SLF4J structured logging", "OpenTelemetry Logs", "CloudWatch Logs", "OpenSearch"]
      }),
      topic({
        name: "Metrics",
        definition: "Metrics are numerical time series that efficiently describe rates, errors, durations, saturation, and business outcomes over time.",
        howItWorks: "Counters, gauges, histograms, and summaries aggregate labeled observations. Useful service dashboards pair request RED signals with resource USE signals and business-state health.",
        practicalExample: "checkout_requests_total, checkout_duration_seconds histogram, thread_pool_active, payment_unknown_outcomes, and orders_stuck_total reveal both service and workflow health.",
        useWhen: ["Trend, alert, compare, and capacity-plan bounded-cardinality measurements."],
        avoidWhen: ["User IDs, order IDs, URLs, or exception text must not become labels."],
        failureModes: ["Cardinality overwhelms the backend.", "Averages hide tail latency.", "Counters reset or dashboards mix units."],
        tradeoffs: ["Dimensional detail versus cost.", "Aggregation efficiency versus per-event evidence."],
        operations: ["Set naming/unit conventions, cardinality budgets, histogram buckets, and recording rules.", "Validate that metrics remain available during dependency failure."],
        technologies: ["Micrometer", "Prometheus", "CloudWatch Metrics", "OpenTelemetry Metrics"]
      }),
      topic({
        name: "Distributed tracing",
        definition: "Distributed tracing connects spans from one request or asynchronous workflow to expose its causal path, latency, errors, and service boundaries.",
        howItWorks: "W3C trace context propagates trace and parent identifiers over HTTP and messaging. Each service records bounded attributes and events; sampling retains a representative or tail-selected subset.",
        practicalExample: "A checkout trace links gateway, pricing, inventory, payment, PostgreSQL, and Kafka publication; the orderId is stored only as a safe hashed/linkable reference.",
        useWhen: ["Latency and failure cross multiple services or queues."],
        avoidWhen: ["Tracing does not replace metrics, logs, or durable business audit.", "Do not propagate untrusted baggage without limits."],
        failureModes: ["Broken context creates orphan spans.", "Head sampling drops rare failures.", "High-cardinality or sensitive attributes raise cost and risk."],
        tradeoffs: ["Causal detail versus overhead and sampling gaps.", "Tail sampling quality versus collector complexity."],
        operations: ["Monitor collector loss, propagation coverage, span limits, and sampling decisions.", "Instrument broker publish/consume as separate causal spans."],
        technologies: ["OpenTelemetry", "W3C Trace Context", "AWS X-Ray", "Jaeger", "Tempo"]
      }),
      topic({
        name: "Alerting",
        definition: "Alerting routes timely, actionable signals about user-impacting or imminently dangerous conditions to an accountable responder.",
        howItWorks: "Page on fast/slow SLO burn or hard safety signals; create tickets for trends and toil. Alerts include impact, scope, dashboard, runbook, recent changes, and a safe first action.",
        practicalExample: "Page when checkout availability burns 2% of the monthly budget in one hour and 5% in six hours; ticket on disk growth that will exhaust in fourteen days.",
        useWhen: ["A human action is required within a defined time to protect users or data."],
        avoidWhen: ["Do not page on every CPU spike, single error, or condition with no response action."],
        failureModes: ["Alert fatigue hides real incidents.", "Static thresholds miss low-traffic total failure.", "An alert depends on the failed telemetry region."],
        tradeoffs: ["Sensitivity versus noise.", "Earlier warning versus false positives."],
        operations: ["Review every page for actionability, ownership, and outcome; prune chronic noise.", "Test notification routing and break-glass access."],
        technologies: ["Prometheus Alertmanager", "CloudWatch Alarms", "Datadog monitors", "PagerDuty"]
      }),
      topic({
        name: "SLIs, SLOs, and error budgets",
        definition: "An SLI measures user-visible service behavior; an SLO sets a target over a window; the error budget is the allowed unreliability, commonly 1 minus the target.",
        howItWorks: "Define good events over valid events, or a latency distribution, from the service boundary users experience. Multi-window burn alerts detect rapid and sustained consumption. Policy links remaining budget to release and reliability choices.",
        practicalExample: "Checkout-confirmation SLI counts valid attempts reaching confirmed or explicit business rejection within 2 seconds. Target: 99.95% over 28 days; provider declines are not system errors, unknown outcomes are.",
        useWhen: ["Align product, architecture, operations, and investment around measurable reliability."],
        avoidWhen: ["Do not use infrastructure uptime or an unowned aspirational percentage as the SLO."],
        failureModes: ["Denominator excludes hard failures.", "Target exceeds dependency capability.", "Teams ignore budget policy."],
        tradeoffs: ["Higher target versus feature velocity and cost.", "Broad journey SLO versus diagnostic specificity."],
        operations: ["Version definitions, audit data quality, review dependencies, and report budget trend with decisions.", "Use separate durability/data-integrity objectives where request success is insufficient."],
        technologies: ["Prometheus recording rules", "OpenSLO", "CloudWatch SLO tooling", "Grafana"]
      })
    ],
    decisionMatrices: [
      {
        title: "Remote-call failure policy",
        columns: ["Operation", "Timeout / retry", "Idempotency", "Degradation"],
        rows: [
          ["Catalog GET", "Short deadline; one jittered retry", "Naturally idempotent", "Serve bounded stale cache"],
          ["Inventory reserve", "Bounded deadline; status lookup after unknown", "Stable reservation key + conditional write", "Do not fabricate availability"],
          ["Payment authorize", "Provider-specific timeout; reconcile unknown", "Stable merchant operation key", "Order remains PAYMENT_PENDING"],
          ["Recommendation fetch", "Very short; usually no retry", "Not material", "Omit module or serve cached set"],
          ["Event consumer", "Retry transient locally, then isolate", "Inbox/versioned state transition", "DLQ plus controlled redrive"]
        ]
      },
      {
        title: "Regional topology choice",
        columns: ["Topology", "Best fit", "Primary cost", "Core proof"],
        rows: [
          ["Single region, multi-AZ", "Most systems with moderate RTO", "Regional outage recovery", "AZ isolation and restore drill"],
          ["Pilot light", "Hours-level RTO", "Promotion automation", "Rebuild dependencies and capacity in time"],
          ["Warm standby", "Minutes-to-hour RTO", "Duplicated minimum capacity", "N-1 scaling and promotion/fencing"],
          ["Active-active reads", "Global read latency", "Projection consistency", "Freshness, routing, regional isolation"],
          ["Partitioned active-active writes", "Global writes with separable ownership", "Ownership movement", "No dual owner; event convergence"],
          ["Conflict-resolved multi-write", "Mergeable/commutative state", "Domain conflict machinery", "Partition tests and reconciliation"]
        ]
      },
      {
        title: "Coordination pattern selection",
        columns: ["Need", "Default pattern", "Reason", "Warning"],
        rows: [
          ["Atomic local state + publish", "Transactional outbox", "Closes dual-write gap", "Still at-least-once downstream"],
          ["Cross-service business workflow", "Orchestrated saga", "Visible durable state and recovery", "Compensation is not rollback"],
          ["Replicated metadata agreement", "Consensus service", "Quorum safety", "Stops without quorum"],
          ["Tiny XA-compatible atomic scope", "2PC, rarely", "True atomic commit", "Blocking and participant coupling"],
          ["Exclusive external resource", "Lease plus fencing token", "Rejects stale owner", "Lease alone is insufficient"]
        ]
      }
    ],
    diagrams: [
      {
        id: "deadline-retry-containment",
        title: "One deadline, bounded retries, isolated dependency pools",
        type: "flow",
        nodes: [
          { id: "client", label: "Client deadline 1200 ms" }, { id: "gateway", label: "Gateway admission control" },
          { id: "checkout", label: "Checkout 900 ms remaining" }, { id: "pricepool", label: "Pricing bulkhead" },
          { id: "paypool", label: "Payment bulkhead" }, { id: "pricing", label: "Pricing" }, { id: "payment", label: "Payment provider" },
          { id: "pending", label: "Pending/reconciliation" }
        ],
        flows: [
          ["client", "gateway", "deadline + idempotency key"], ["gateway", "checkout", "remaining deadline"],
          ["checkout", "pricepool", "parallel, bounded queue"], ["pricepool", "pricing", "safe GET: max 1 retry"],
          ["checkout", "paypool", "after validation"], ["paypool", "payment", "stable provider key"],
          ["payment", "pending", "timeout means unknown, query/reconcile"]
        ],
        caption: "Retries never receive a fresh full timeout, and payment uncertainty becomes durable business state rather than an assumed failure."
      },
      {
        id: "order-saga-outbox",
        title: "Durable order saga with idempotent steps",
        type: "sequence",
        nodes: [
          { id: "api", label: "Checkout API" }, { id: "order", label: "Order orchestrator" },
          { id: "payment", label: "Payment" }, { id: "inventory", label: "Inventory" },
          { id: "outbox", label: "Outbox/Kafka" }, { id: "recon", label: "Reconciler" }
        ],
        flows: [
          ["api", "order", "PlaceOrder(key, cartVersion)"], ["order", "payment", "Authorize(orderId)"],
          ["payment", "order", "AUTHORIZED or UNKNOWN"], ["order", "recon", "persist UNKNOWN; query later"],
          ["order", "inventory", "Reserve(orderId, expiry)"], ["inventory", "order", "RESERVED or REJECTED"],
          ["order", "payment", "Void on reservation rejection"], ["order", "outbox", "commit state + event"],
          ["recon", "payment", "provider status by same key"], ["recon", "order", "idempotent transition"]
        ]
      },
      {
        id: "regional-failover-fencing",
        title: "Active-passive promotion with fencing",
        type: "flow",
        nodes: [
          { id: "traffic", label: "Global traffic control" }, { id: "primary", label: "Region A writer epoch 44" },
          { id: "standby", label: "Region B standby" }, { id: "data", label: "Replicated data/quorum" },
          { id: "authority", label: "Promotion authority" }, { id: "new", label: "Region B writer epoch 45" },
          { id: "old", label: "Recovered old process epoch 44" }
        ],
        flows: [
          ["primary", "data", "writes accepted at epoch 44"], ["authority", "data", "verify/fence and allocate 45"],
          ["authority", "new", "promote"], ["traffic", "new", "route after validation"],
          ["new", "data", "writes accepted at epoch 45"], ["old", "data", "rejected: stale epoch"]
        ]
      },
      {
        id: "slo-feedback-loop",
        title: "Reliability feedback loop",
        type: "flow",
        nodes: [
          { id: "journey", label: "Customer journey" }, { id: "sli", label: "Boundary SLI" },
          { id: "budget", label: "Error-budget burn" }, { id: "alert", label: "Actionable alert" },
          { id: "incident", label: "Incident response" }, { id: "learning", label: "Review and reliability work" },
          { id: "policy", label: "Release/investment policy" }
        ],
        flows: [
          ["journey", "sli", "valid good/total events"], ["sli", "budget", "28-day target"],
          ["budget", "alert", "fast + slow burn"], ["alert", "incident", "impact + runbook"],
          ["incident", "learning", "causal evidence"], ["learning", "policy", "prioritized actions"], ["policy", "journey", "safer change"]
        ]
      }
    ],
    examples: [
      {
        title: "Deadline-aware resilient HTTP client",
        language: "java",
        code: `Mono<Price> price(ProductId id, Duration remaining) {
  return client.get().uri("/v1/prices/{id}", id.value())
      .retrieve().bodyToMono(Price.class)
      .timeout(remaining.minusMillis(50))
      .retryWhen(Retry.backoff(1, Duration.ofMillis(40))
          .jitter(0.8).filter(this::transientAndSafe));
}`,
        explanation: "The caller supplies the remaining budget. One jittered retry is permitted only for classified safe failures; production code also caps concurrency and records attempt metrics."
      },
      {
        title: "Idempotency record",
        language: "sql",
        code: `INSERT INTO idempotency_key
  (scope, key, request_hash, status, expires_at)
VALUES (:scope, :key, :hash, 'IN_PROGRESS', :expiresAt)
ON CONFLICT (scope, key) DO NOTHING;`,
        explanation: "The insert must be coordinated with the authoritative command result. A conflict loads the existing record, verifies request_hash, and returns IN_PROGRESS or the durable prior response."
      },
      {
        title: "Versioned Kafka state transition",
        language: "java",
        code: `@Transactional
void consume(OrderEvent e) {
  if (inbox.existsById(e.eventId())) return;
  int changed = orders.transition(e.orderId(), e.expectedVersion(), e.nextState());
  if (changed == 0) throw new GapOrConflict(e.orderId());
  inbox.insert(e.eventId());
}`,
        explanation: "Inbox deduplication and state transition share a database transaction. A missing expected version is not blindly retried; it is classified as a gap, stale event, or invalid transition."
      },
      {
        title: "OpenTelemetry-safe span attributes",
        language: "java",
        code: `Span.current()
    .setAttribute("app.operation", "inventory.reserve")
    .setAttribute("app.region", region)
    .setAttribute("app.outcome", outcome.code())
    .setAttribute("app.quantity_bucket", bucket(quantity));`,
        explanation: "Bounded dimensions support diagnosis without putting order IDs, customer IDs, tokens, addresses, or raw exception payloads into telemetry."
      }
    ],
    checklists: [
      {
        title: "Distributed workflow review",
        items: [
          "For every remote call, state the deadline, transient error classes, retry owner, attempt cap, and idempotency behavior.",
          "Represent unknown outcome explicitly; never infer not-committed from a timeout.",
          "Name the source of truth and allowed intermediate states for every saga step.",
          "Ensure event consumers tolerate duplicates, older versions, gaps, and poison records.",
          "Bound every queue, executor, connection pool, and backlog; define shedding by priority.",
          "Use fencing for leader, lock, or region ownership changes.",
          "Provide reconciliation for external side effects and projection drift.",
          "Test partition, latency, capacity loss, process pause, and dependency failure under load."
        ]
      },
      {
        title: "Reliability and observability review",
        items: [
          "Define journey-level SLIs with valid-event denominators and explicit exclusions.",
          "Set SLOs from business need and achievable dependency reliability, then adopt an error-budget policy.",
          "Page only on user impact or imminent danger with a named owner and action.",
          "Correlate logs, metrics, and traces without high-cardinality labels or sensitive payloads.",
          "Instrument business states stuck in progress, not only request errors.",
          "Keep telemetry usable during the failure domain it diagnoses.",
          "Measure achieved RTO/RPO and N-1 capacity during exercises.",
          "Document degraded modes, entry/exit criteria, freshness, and forbidden fallbacks."
        ]
      }
    ],
    exercises: [
      {
        id: "m5-retry-storm",
        difficulty: "advanced",
        type: "find-the-bottleneck",
        prompt: "A gateway, Spring service, and AWS SDK each retry three times. The database slows for ten seconds and incoming traffic stays flat. Explain the nonlinear failure and redesign the retry policy.",
        suggestedAnswer: "One logical request can expand to dozens of attempts while long waits retain threads and connections. Put one bounded retry policy at the layer with semantic knowledge, propagate a common deadline, add full jitter and a retry budget, honor overload signals, cap concurrency, and shed before scarce resources are consumed.",
        rubric: ["Calculates multiplicative attempts", "Uses one deadline", "Classifies retryable operations", "Adds concurrency/admission controls", "Defines metrics"]
      },
      {
        id: "m5-unknown-payment",
        difficulty: "lead",
        type: "architecture-critique",
        prompt: "Checkout marks an order failed whenever payment authorization times out, then retries with a new provider request ID. Critique the design and define a safe state machine.",
        suggestedAnswer: "Timeout is UNKNOWN, not declined. Persist PAYMENT_PENDING with the stable merchant idempotency key, query provider status and reconcile webhooks, then transition once by expected version to AUTHORIZED, DECLINED, or MANUAL_REVIEW. A later inventory failure issues an idempotent void/refund, and every transition is audited.",
        rubric: ["Models unknown outcome", "Uses stable key", "Includes reconciliation", "Guards transitions", "Handles compensation"]
      },
      {
        id: "m5-region-choice",
        difficulty: "lead",
        type: "design-exercise",
        prompt: "An order platform needs 99.95% availability, 45-minute RTO, five-minute RPO, and users in two continents. Choose a regional topology before the business has proven a need for local writes.",
        suggestedAnswer: "Use multi-AZ primary plus warm standby/read projections in the second region. Keep a single authoritative writer, asynchronous replication within the five-minute objective, pre-provision critical dependencies, and automate fenced promotion. Serve local catalog/search reads if valuable. Active-active order writes add conflict cost that the stated objectives do not require.",
        rubric: ["Derives topology from objectives", "Avoids premature multi-write", "Includes hidden dependencies and capacity", "Covers fencing/failback"]
      },
      {
        id: "m5-slo-design",
        difficulty: "advanced",
        type: "scenario",
        prompt: "Define an SLI, SLO, and alert for an asynchronous notification API that accepts requests and normally delivers within two minutes.",
        suggestedAnswer: "SLI: valid accepted notifications delivered or terminally classified within two minutes divided by valid accepted notifications, measured from durable acceptance. Set a product-backed target such as 99.9% over 28 days. Page on fast and sustained error-budget burn; separately alert on oldest pending age and provider-specific backlog. Exclude explicit invalid addresses, not internal unknown outcomes.",
        rubric: ["Measures outcome not HTTP 202", "Defines denominator/exclusions", "Uses window and burn rate", "Adds diagnostic signal"]
      },
      {
        id: "m5-chaos-plan",
        difficulty: "lead",
        type: "architecture-review",
        prompt: "Review a proposal to terminate 30% of production pods at random to test resilience. Replace it with a useful first experiment.",
        suggestedAnswer: "Choose a specific hypothesis, such as one-zone pod loss at 1.5x traffic keeps checkout success above its SLO. Establish steady state, scope one service/zone, confirm headroom and observability, set abort thresholds and owner, inject gradually, verify autoscaling/routing and business outcome, then record remediation before expanding scope.",
        rubric: ["States hypothesis", "Bounds blast radius", "Uses business steady state", "Defines abort/rollback", "Requires follow-through"]
      }
    ],
    quiz: [
      {
        question: "What can a caller conclude when a remote write times out?",
        choices: ["The write failed", "The server crashed", "The outcome is unknown without more evidence", "The write committed"],
        answer: 2,
        explanation: "The request, processing, or response may have been lost or delayed. Query status or retry safely with the same operation identity."
      },
      {
        question: "What guarantee does Kafka provide by default for record order?",
        choices: ["Global topic order", "Order within a partition", "Causal order across topics", "Exactly-once external side effects"],
        answer: 1,
        explanation: "Partition order is useful when the key preserves entity locality; consumers still handle duplicates, gaps, and external side effects."
      },
      {
        question: "Why must a distributed lock use a fencing token for external writes?",
        choices: ["To encrypt the lock", "To let the resource reject a stale former owner", "To shorten the lease", "To avoid consensus"],
        answer: 1,
        explanation: "A paused owner can resume after its lease expires. A monotonically increasing token lets the protected resource reject its stale operations."
      },
      {
        question: "Which message most deserves an immediate retry?",
        choices: ["Invalid schema", "Authorization denied", "Brief connection reset on an idempotent operation with deadline remaining", "Downstream overload with Retry-After"],
        answer: 2,
        explanation: "Retries are for transient, safe failures with spare time and capacity. Invalid, denied, and explicit overload outcomes need correction, rejection, or delayed admission."
      },
      {
        question: "What is the critical weakness of two-phase commit during coordinator failure after prepare?",
        choices: ["Messages reorder", "Participants can remain blocked holding resources", "It becomes eventually consistent", "It cannot use SQL"],
        answer: 1,
        explanation: "Prepared participants cannot safely choose commit or rollback independently until the durable global decision is recovered."
      },
      {
        question: "Which is the strongest service SLI for checkout?",
        choices: ["Kubernetes pods running", "Average CPU below 60%", "Valid checkout attempts reaching correct terminal/pending outcomes within the promised time", "Gateway process uptime"],
        answer: 2,
        explanation: "A boundary outcome reflects what the customer receives; infrastructure signals diagnose why but do not define success."
      },
      {
        question: "When is active-active multi-region writing relatively safe?",
        choices: ["Whenever DNS supports latency routing", "When writes are partition-owned or conflicts have valid domain merge semantics", "When both regions use the same database brand", "When clocks use NTP"],
        answer: 1,
        explanation: "The hard problem is concurrent authority. Ownership or well-defined commutative/mergeable operations make conflicts tractable."
      }
    ],
    keyTakeaways: [
      "Remote timeouts create uncertainty; idempotency and reconciliation turn uncertainty into controlled state.",
      "Retries consume capacity and must share a deadline, budget, jitter, semantic classifier, and one clear owner.",
      "At-least-once delivery is normal; correctness comes from durable operation identity, versioned transitions, and repair.",
      "Consensus, sagas, outbox, and two-phase commit solve different coordination problems and are not interchangeable.",
      "Backpressure, bulkheads, shedding, and honest degradation preserve the critical path under overload.",
      "Multi-region is a data-authority and operations design, not a traffic-routing checkbox.",
      "SLIs and error budgets connect user outcomes to alerting, release decisions, and reliability investment."
    ]
  });

  content.moduleGroups = content.moduleGroups || {};
  content.moduleGroups.advanced = [
    "module-4-data-architecture",
    "module-5-distributed-systems-reliability",
    "module-6-security-governance"
  ];
  content.modules.sort((a, b) => (a.number || 999) - (b.number || 999));
})();
