/**
 * Seeds the NOVA Terminal scale-up programme from the technical delivery
 * timeline: one project, twenty-one milestones across the six delivery phases
 * plus the staged go-live, ten developers mapped to the seven workstreams, and
 * the full task breakdown.
 *
 *   npm run seed:nova
 *
 * Progress is derived from the calendar, not hand-written: a task is complete
 * only where its due date has already passed, so nothing due today or later is
 * ever seeded as done. The programme runs 15 months from SEED_START.
 *
 * By default this replaces only its own data - the NOVA project, its milestones
 * and tasks, and the ten developers it owns - so anything else you created by
 * hand survives. Set SEED_RESET=1 to wipe projects, milestones, developers and
 * tasks first. Admin accounts are never touched.
 *
 * Env overrides: SEED_CLIENT_PASSWORD, SEED_DEV_PASSWORD, SEED_START (YYYY-MM-DD).
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing. Copy .env.example to .env.local first.");
  process.exit(1);
}

const CLIENT_PASSWORD = process.env.SEED_CLIENT_PASSWORD ?? "nova2026";
const DEV_PASSWORD = process.env.SEED_DEV_PASSWORD ?? "nova12345";
const RESET = process.env.SEED_RESET === "1";

// Month 1 of the programme. Every date below is derived from this, so the whole
// timeline shifts together if you change it.
const START = new Date(`${process.env.SEED_START ?? "2026-08-01"}T00:00:00.000Z`);

/**
 * Today, for the purpose of deciding what has already been delivered.
 * Override with SEED_TODAY=YYYY-MM-DD.
 */
const TODAY = new Date(`${process.env.SEED_TODAY ?? "2026-09-02"}T00:00:00.000Z`);

/**
 * Progress follows the calendar rather than a hand-written list:
 *
 *   due before today          -> done
 *   due within the next 30 days, earliest first, at most 6 per milestone
 *                             -> in progress
 *   everything else           -> to do
 *
 * Nothing due today or later is ever seeded as complete.
 */
const IN_FLIGHT_DAYS = 30;
const MAX_IN_FLIGHT = 6;

const PROJECT_NAME = "NOVA Terminal - Scale-Up Program";
const EMAIL_DOMAIN = "novaterminal.com";

/**
 * Day `d` of programme month `m` (1-indexed), as a UTC date.
 *
 * The day is clamped to the length of the calendar month it lands on -
 * programme month 6 can be February, and Date.UTC would silently roll day 29
 * into March, pushing a task past its own milestone.
 */
function md(m, d = 1) {
  const year = START.getUTCFullYear();
  const month = START.getUTCMonth() + (m - 1);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(d, lastDay)));
}

/** Last day of programme month `m`. */
function endOf(m) {
  return new Date(Date.UTC(START.getUTCFullYear(), START.getUTCMonth() + m, 0));
}

// ---------------------------------------------------------------- the team
// One lead per workstream from the timeline document, plus pairs on the two
// heaviest tracks. Colours are shades - the UI is monochrome.
const DEVELOPERS = [
  {
    key: "axit",
    name: "Axit",
    role: "Platform & Multi-tenancy Lead",
    skills: ["PostgreSQL RLS", "Multi-tenancy", "System design", "Node.js"],
    color: "#4a4a4a",
  },
  {
    key: "manoj",
    name: "Manoj",
    role: "Core Services & Order Engine",
    skills: ["Node.js", "Order systems", "Event-driven", "Redis"],
    color: "#5a5a5a",
  },
  {
    key: "priyank",
    name: "Priyank",
    role: "Broker Integrations Lead",
    skills: ["OAuth", "IBKR", "Adapter design", "REST"],
    color: "#6b6b6b",
  },
  {
    key: "vivek",
    name: "Vivek",
    role: "Broker Integrations",
    skills: ["Schwab Trader API", "Alpaca", "Tradier", "TypeScript"],
    color: "#7c7c7c",
  },
  {
    key: "ankit",
    name: "Ankit",
    role: "Market Data Engineer",
    skills: ["WebSockets", "Streaming", "Low latency", "Market feeds"],
    color: "#8d8d8d",
  },
  {
    key: "nirmal",
    name: "Nirmal",
    role: "Intelligence & AI",
    skills: ["LLM grounding", "RAG", "Sentiment/NLP", "Python"],
    color: "#9e9e9e",
  },
  {
    key: "navneet",
    name: "NavNeet",
    role: "Infrastructure & SRE",
    skills: ["Kubernetes", "Terraform", "Observability", "Autoscaling"],
    color: "#afafaf",
  },
  {
    key: "kinjal",
    name: "Kinjal",
    role: "Frontend & Web Experience",
    skills: ["React", "TanStack", "Billing UX", "Onboarding"],
    color: "#5f5f5f",
  },
  {
    key: "kruti",
    name: "Kruti",
    role: "Mobile & Design System",
    skills: ["iOS", "Android", "Push", "Design systems"],
    color: "#707070",
  },
  {
    key: "neha",
    name: "Neha",
    role: "Quality, Security & Compliance",
    skills: ["Test automation", "Pen-testing", "SOC 2", "Threat modelling"],
    color: "#818181",
  },
];

// -------------------------------------------------------------- the plan
// Each milestone is one deliverable block of the programme calendar.
// Tasks are [developer, title, description, priority, due].
const MILESTONES = [
  {
    title: "M1 - P0: Architecture, Security Model & Cloud Scaffold",
    description:
      "Month 1. Lock the decisions everything else depends on: the multi-tenant data model, the universal broker adapter contract, the security and credential-vault design, and the cloud scaffold. Native broker API approvals start here because they are the one long-lead item outside our control. Checkpoint: approved architecture plus a running skeleton on staging.",
    due: endOf(1),
    tasks: [
      ["axit", "Design the multi-tenant schema and row-level-security model", "Table-by-table tenant scoping, the RLS policy set, and how the boundary is enforced for every access path.", "high", md(1, 7)],
      ["axit", "Define tenant isolation boundaries and per-tenant configuration", "What is shared infrastructure, what is tenant-scoped, and which settings vary per tenant.", "high", md(1, 10)],
      ["axit", "Write the migration plan off the single-tenant schema", "How production data moves onto the tenant model without downtime or loss.", "medium", md(1, 12)],
      ["priyank", "Specify the universal Broker Adapter contract", "Authenticate, quote, place, modify, cancel, verify, positions, executions - the interface every broker implements.", "high", md(1, 14)],
      ["priyank", "Define the adapter capability matrix and conformance criteria", "What each broker must support, what may degrade, and how conformance is proven before going live.", "medium", md(1, 16)],
      ["priyank", "Open the native broker API approval programmes (Schwab, IBKR)", "Long-lead item deliberately begun in month 1 so adapter work is never blocked on an approval queue.", "high", md(1, 18)],
      ["manoj", "Map order-engine service boundaries for the re-platform", "Which parts of the proven engine move behind the abstraction, in what order, and what stays put.", "medium", md(1, 16)],
      ["manoj", "Specify the event schema for fills, alerts and statements", "The replayable event contract the analytics, archive and audit paths all build on.", "medium", md(1, 20)],
      ["neha", "Design the encrypted credential vault", "Zero-password OAuth architecture, KMS envelope encryption and per-tenant key separation, designed up front.", "high", md(1, 21)],
      ["neha", "Produce the tenant-isolation threat model", "Enumerate every cross-tenant access path and close it by construction rather than by convention.", "high", md(1, 22)],
      ["neha", "Define the security review gate for every phase", "What must be reviewed, by whom, before a phase is allowed to close.", "medium", md(1, 24)],
      ["navneet", "Stand up the containerised service skeleton on staging", "A deployable skeleton of every core service on Kubernetes-class orchestration.", "high", md(1, 26)],
      ["navneet", "Build the CI/CD pipelines and infrastructure-as-code", "Green pipeline gating every merge; every environment reproducible from code.", "medium", md(1, 28)],
      ["navneet", "Establish the observability baseline", "Metrics, structured logs and traces wired from day one - the floor the P3 SLO work builds on.", "medium", md(1, 29)],
      ["navneet", "Define environment topology and the promotion strategy", "Dev, staging and production boundaries, and how a change travels between them.", "medium", md(1, 30)],
      ["kinjal", "Audit the existing web app against the shared design system", "What carries over to the multi-tenant client and what gets rebuilt in P2.", "low", md(1, 30)],
      ["axit", "Run the architecture sign-off review", "The P0 checkpoint: architecture approved, skeleton running, approvals in flight.", "high", endOf(1)],
      ["axit", "Choose the tenant identifier strategy and propagation format", "How a tenant is named, signed and carried across every service hop.", "medium", md(1, 8)],
      ["axit", "Design the entitlement data model", "Plans, features, limits and overrides, modelled once for billing to plug into later.", "medium", md(1, 13)],
      ["manoj", "Define the order state machine and its terminal states", "Every state an order can occupy and the only legal transitions between them.", "high", md(1, 18)],
      ["manoj", "Specify idempotency keys for order submission", "A retried submit must never become a second order.", "high", md(1, 19)],
      ["priyank", "Define the broker capability degradation policy", "What the platform does when a broker cannot support a requested order type.", "medium", md(1, 17)],
      ["neha", "Define the secrets management and rotation policy", "Where secrets live, who can read them, and how often they change.", "high", md(1, 23)],
      ["neha", "Choose the audit-log schema and retention policy", "What is recorded for every privileged and trading action, and for how long.", "medium", md(1, 25)],
      ["navneet", "Select the container registry and image signing approach", "Only signed, scanned images reach any environment.", "medium", md(1, 27)],
      ["navneet", "Define the alerting and on-call model", "Who is paged, for what, and what the response expectation is.", "medium", md(1, 29)],
      ["kinjal", "Define the shared design tokens for web and mobile", "One source of colour, type and spacing across every client.", "low", md(1, 29)],
    ],
  },
  {
    title: "M2 - P1: Multi-Tenancy Foundation",
    description:
      "Month 2. Tenant identity on every request and row-level security enforced end to end, with the proven IBKR engine moved behind the new tenant boundary. Isolation becomes structural: a tenant cannot reach another tenant's data even if application code has a bug.",
    due: endOf(2),
    tasks: [
      ["axit", "Attach verified tenant identity at the edge", "The gateway rejects any unscoped request before it reaches a service.", "high", md(2, 10)],
      ["axit", "Enforce row-level security on every tenant-scoped table", "Queries are physically unable to return another tenant's rows.", "high", md(2, 18)],
      ["axit", "Build the per-tenant configuration store", "Settings, limits and feature state resolved per tenant at request time.", "medium", md(2, 22)],
      ["axit", "Implement tenant provisioning and de-provisioning", "Create, suspend and fully remove a tenant with all its data.", "medium", md(2, 26)],
      ["manoj", "Move the proven IBKR engine behind the tenant boundary", "Same production reliability, now tenant-scoped on every path.", "high", md(2, 20)],
      ["manoj", "Scope the order, position and execution stores per tenant", "Every write carries a tenant; every read is constrained to one.", "high", md(2, 24)],
      ["manoj", "Tenant-scope the alerts pipeline", "Alert generation, delivery and history isolated per tenant.", "medium", md(2, 27)],
      ["navneet", "Enforce per-tenant rate limits at the API gateway", "Noisy-neighbour protection wired to the entitlement backbone.", "medium", md(2, 25)],
      ["navneet", "Add the tenant dimension to all metrics and traces", "Every signal attributable to a tenant without leaking data between them.", "medium", md(2, 28)],
      ["neha", "Build the cross-tenant isolation test harness", "Adversarial tests that try to reach another tenant's data through every entry point.", "high", md(2, 27)],
      ["neha", "Add RLS regression tests to the release gate", "A missing policy fails the build rather than reaching production.", "medium", endOf(2)],
      ["axit", "Implement tenant-aware database migrations", "Schema changes that roll out safely across every tenant at once.", "medium", md(2, 16)],
      ["axit", "Build the tenant admin API for internal tooling", "Programmatic tenant management for the console and support flows.", "medium", md(2, 28)],
      ["axit", "Document the tenancy model for the team", "The rules every future service has to follow, written down once.", "low", md(2, 29)],
      ["manoj", "Backfill existing production data onto the tenant model", "The live single-tenant data moved across without loss or downtime.", "high", md(2, 22)],
      ["manoj", "Propagate tenant context through async jobs", "Background work carries the same tenant scope as the request that queued it.", "high", md(2, 25)],
      ["manoj", "Add tenant quotas to the job queue", "One tenant cannot starve the queue for everyone else.", "medium", md(2, 27)],
      ["navneet", "Isolate per-tenant log streams", "Support can read one tenant's logs without seeing another's.", "medium", md(2, 26)],
      ["navneet", "Add tenant-aware cache keys in Redis", "Cache hits can never cross a tenant boundary.", "medium", md(2, 24)],
      ["neha", "Load-test the gateway tenant-resolution path", "Identity resolution must not become the bottleneck.", "medium", md(2, 29)],
      ["neha", "Verify RLS behaviour under connection pooling", "Pooled connections must not leak a session's tenant context.", "high", md(2, 28)],
    ],
  },
  {
    title: "M3 - P1: Broker Abstraction & IBKR Re-platform",
    description:
      "Month 3. The Broker Adapter interface is implemented and the existing IBKR integration is re-platformed onto it - same proven reliability, now broker-agnostic upstream. The per-tenant entitlement backbone that the subscription tiers later plug into is built alongside it.",
    due: endOf(3),
    tasks: [
      ["priyank", "Implement the Broker Adapter interface", "The engine above never learns which broker it is talking to.", "high", md(3, 10)],
      ["priyank", "Re-platform the IBKR integration onto the adapter", "Proven reliability preserved, now behind the contract.", "high", md(3, 20)],
      ["priyank", "Implement authenticate, refresh and revoke on the contract", "OAuth connect, token refresh, session health and revocation, uniform across brokers.", "high", md(3, 14)],
      ["priyank", "Implement quote snapshot and streaming on the contract", "Real-time snapshot and streaming quotes through one interface.", "high", md(3, 22)],
      ["manoj", "Implement place, modify and cancel across all order types", "Market, limit, stop, MIT, bracket/OCA and trailing stop, GTC by default, extended hours.", "high", md(3, 22)],
      ["manoj", "Move post-submit order verification behind the abstraction", "Poll the real order book after every submit and alert loudly if the order never appeared.", "high", md(3, 25)],
      ["manoj", "Implement positions, balances and buying-power retrieval", "Holdings, average cost, buying power and margin through the contract.", "medium", md(3, 26)],
      ["manoj", "Implement execution history for the all-time archive", "Trade history captured independently of the broker's short retention window.", "medium", md(3, 28)],
      ["axit", "Build the per-tenant entitlement backbone", "Feature flags, plan limits and rate limits, tenant-scoped and enforced at the gateway.", "high", md(3, 24)],
      ["axit", "Expose entitlement checks as a shared gateway policy", "One place decides what a tenant may do, so services never re-implement it.", "medium", md(3, 28)],
      ["neha", "Build the IBKR sandbox conformance suite", "Auth, quotes and the full order lifecycle validated against the broker sandbox.", "medium", md(3, 29)],
      ["vivek", "Build the adapter test kit every new broker must pass", "One reusable conformance harness so each new broker is a known quantity on day one.", "medium", endOf(3)],
      ["priyank", "Define adapter versioning and deprecation policy", "How a broker adapter evolves without breaking the engine above it.", "medium", md(3, 26)],
      ["priyank", "Build adapter health and capability introspection", "The platform can ask an adapter what it supports and whether it is healthy.", "medium", md(3, 27)],
      ["vivek", "Build a mock broker for local development", "Every engineer can run the full order path without a broker account.", "medium", md(3, 24)],
      ["vivek", "Write the adapter implementation guide", "What a new broker integration has to provide, and how it is proven.", "low", md(3, 29)],
      ["manoj", "Implement bracket and OCA order handling", "Entry, target and stop submitted and cancelled as one unit.", "high", md(3, 24)],
      ["manoj", "Implement the broker order-question confirmation loop", "Warnings and price caps answered programmatically so nothing is dropped mid-submit.", "high", md(3, 21)],
      ["manoj", "Implement GTC-by-default order semantics", "Orders survive the session unless the trader says otherwise.", "medium", md(3, 23)],
      ["manoj", "Implement extended-hours execution routing", "Pre-market and after-hours orders routed correctly per broker.", "medium", md(3, 27)],
      ["axit", "Add entitlement checks to the order submission path", "Plan limits enforced before an order ever reaches a broker.", "high", md(3, 26)],
      ["neha", "Add order lifecycle contract tests to CI", "Submit, modify, cancel and verify asserted on every merge.", "high", md(3, 28)],
    ],
  },
  {
    title: "M4 - P1: Schwab, Alpaca & the Session Pool",
    description:
      "Month 4. The first new native adapters land over OAuth, and the self-healing session generalises into a managed per-tenant pool that keeps every broker link alive independently. Checkpoint: two independent tenants trading on two different brokers, simultaneously.",
    due: endOf(4),
    tasks: [
      ["vivek", "Build the Charles Schwab native adapter (Trader API, OAuth)", "Full trade plus data on the lowest-latency native path.", "high", md(4, 14)],
      ["vivek", "Build the Alpaca native adapter (REST)", "Second native broker, proving the contract generalises.", "high", md(4, 20)],
      ["vivek", "Run Schwab and Alpaca through the sandbox conformance kit", "No adapter reaches live money before it passes.", "high", md(4, 24)],
      ["manoj", "Generalise the self-healing session into a per-tenant pool", "The production auto-revive logic, scaled from one account to thousands.", "high", md(4, 22)],
      ["manoj", "Add health checks and automatic revival per broker link", "Each tenant's link is monitored and recovered independently of every other.", "high", md(4, 26)],
      ["navneet", "Schedule the session pool across worker fleets with autoscale", "Pool work distributed and scaled with demand.", "medium", md(4, 27)],
      ["navneet", "Instrument the session-uptime SLO", "The reliability objective that gates the beta later.", "medium", md(4, 28)],
      ["priyank", "Normalise the broker error taxonomy across adapters", "One error vocabulary upstream, whatever the broker actually returned.", "medium", md(4, 26)],
      ["neha", "Run cross-tenant, cross-broker isolation verification", "Prove that two tenants on two brokers cannot see or affect each other.", "high", md(4, 29)],
      ["axit", "Demonstrate the P1 checkpoint", "Two independent tenants trading on two different brokers, simultaneously.", "high", endOf(4)],
      ["vivek", "Implement Schwab token refresh and revocation handling", "A refresh failure degrades one tenant's link, never the fleet.", "high", md(4, 16)],
      ["vivek", "Implement Alpaca streaming quote subscription", "Streaming quotes through the same contract as every other broker.", "medium", md(4, 22)],
      ["vivek", "Map Schwab and Alpaca order types onto the contract", "Every supported type reachable, every unsupported one declared.", "high", md(4, 18)],
      ["priyank", "Build the broker connection retry and backoff policy", "Reconnection that recovers quickly without hammering the broker.", "medium", md(4, 23)],
      ["priyank", "Track broker API quota consumption per tenant", "Quota exhaustion is predicted rather than discovered.", "medium", md(4, 25)],
      ["manoj", "Persist session state so a restart does not drop links", "A deploy must not disconnect every tenant.", "high", md(4, 24)],
      ["manoj", "Add session revival metrics and failure alerting", "A link that cannot revive raises a page.", "medium", md(4, 27)],
      ["navneet", "Autoscale the session worker fleet on pool depth", "Workers follow the number of live links, not a fixed guess.", "medium", md(4, 28)],
      ["neha", "Soak-test the session pool over a full trading week", "Five days of real market hours before the checkpoint.", "high", md(4, 28)],
      ["axit", "Write the P1 checkpoint demonstration script", "A repeatable demo of two tenants on two brokers, trading at once.", "medium", md(4, 29)],
    ],
  },
  {
    title: "M4-5 - P2: Onboarding, Billing & Entitlements",
    description:
      "Months 4-5. The signup-to-first-trade flow and the subscription spine behind it: create tenant, verify email, connect the broker over OAuth on the broker's own page, sync the account, trade - then plans, cycles, trials, proration, dunning and invoices, wired to the per-tenant entitlement flags built in P1 so feature gating is enforced in real time. Target: signup to first order in under five minutes.",
    due: endOf(5),
    tasks: [
      ["kinjal", "Build signup, email verification and tenant creation", "Step one of the onboarding sequence, with the tenant provisioned behind it.", "high", md(5, 6)],
      ["kinjal", "Build the connect-your-broker OAuth flow", "Authorisation happens on the broker's own page; only a scoped, revocable token reaches the vault.", "high", md(5, 12)],
      ["kinjal", "Build the broker picker and connection health view", "Which brokers are available, what each supports, and whether a link is healthy.", "medium", md(5, 15)],
      ["kinjal", "Instrument onboarding funnel drop-off", "Onboarding completion is a P2 and P4 KPI - it has to be measurable per step.", "medium", md(5, 18)],
      ["manoj", "Build first-sync of positions, balances and buying power", "The terminal populates the moment the broker link completes.", "high", md(5, 14)],
      ["manoj", "Handle partial and failed broker syncs gracefully", "A slow or incomplete sync must never look like an empty account.", "medium", md(5, 18)],
      ["axit", "Provision entitlements at tenant creation", "A new tenant lands with a plan, limits and flags already resolved.", "medium", md(5, 10)],
      ["neha", "Build the end-to-end onboarding test suite", "Signup through to a placed order, run on every release.", "medium", md(5, 19)],
      ["kruti", "Align the onboarding screens with the shared design system", "One visual language across web and, later, mobile.", "low", md(5, 20)],
      ["kinjal", "Build the account setup checklist and progress state", "The trader always knows what is left before they can trade.", "medium", md(5, 16)],
      ["kinjal", "Handle OAuth denial, timeout and revocation paths", "Every unhappy path in the connect flow has a way forward.", "high", md(5, 14)],
      ["kinjal", "Build the resume-onboarding flow for abandoned signups", "Coming back tomorrow picks up where they stopped.", "medium", md(5, 19)],
      ["kinjal", "Add analytics events across the five onboarding steps", "Every step measurable so friction can be found, not guessed.", "medium", md(5, 20)],
      ["manoj", "Surface insufficient buying power at connect time", "The trader learns about a funding problem before they try to trade.", "medium", md(5, 16)],
      ["manoj", "Build the broker disconnect and reconnect flow", "Revoking and re-linking a broker without losing history.", "high", md(5, 17)],
      ["axit", "Enforce the broker-count entitlement at connect time", "A Starter tenant cannot silently link a second broker.", "medium", md(5, 12)],
      ["neha", "Test onboarding against every supported broker", "The flow is only done when it works on all of them.", "high", md(5, 20)],
      ["kruti", "Design the empty and loading states for first sync", "The first minute of the product should never look broken.", "low", md(5, 19)],
      ["kinjal", "Integrate the billing processor and plan catalogue", "Starter, Pro and Elite defined once and enforced everywhere.", "high", md(5, 12)],
      ["kinjal", "Build monthly and annual cycles with trials and coupons", "The acquisition paths the plans depend on.", "high", md(5, 18)],
      ["kinjal", "Build upgrades, downgrades and proration", "Plan changes mid-cycle that bill correctly to the day.", "high", md(5, 24)],
      ["kinjal", "Build dunning, recovery and cancellation flows", "Failed payments recovered rather than silently churned.", "medium", md(5, 27)],
      ["kinjal", "Generate invoices and receipts", "Every charge documented and retrievable by the tenant.", "medium", md(5, 29)],
      ["axit", "Wire entitlements to plans with real-time enforcement", "A plan change takes effect immediately, without a redeploy.", "high", md(5, 22)],
      ["axit", "Enforce usage limits per tier", "Broker count, alert volume, F&O, real-time data, AI and automation gated per tier.", "high", md(5, 26)],
      ["neha", "Build the billing-correctness test suite", "Proration, trial transitions and refunds asserted, not assumed.", "high", md(5, 28)],
      ["neha", "Reconcile subscription state against the processor nightly", "Drift between our records and the processor surfaces the next morning, not at renewal.", "medium", endOf(5)],
      ["kinjal", "Build the plan comparison and upgrade page", "Where a trader decides to pay more, and can.", "medium", md(5, 20)],
      ["kinjal", "Handle payment-method updates and retries", "An expired card is a recoverable event, not a churned tenant.", "medium", md(5, 26)],
      ["kinjal", "Build the billing history view", "Every invoice and receipt retrievable by the tenant.", "low", md(5, 28)],
      ["axit", "Handle entitlement downgrade side effects", "What happens to a second broker link when a tenant drops to Starter.", "high", md(5, 25)],
      ["axit", "Build the entitlement audit log", "Every change to what a tenant may do, recorded.", "medium", md(5, 27)],
      ["manoj", "Enforce alert-volume limits at generation time", "Limits applied where alerts are made, not where they are read.", "medium", md(5, 24)],
      ["neha", "Test trial expiry and conversion paths", "The transition that decides whether the business works.", "high", md(5, 27)],
      ["neha", "Test proration across every plan transition", "Upgrade, downgrade and mid-cycle changes, billed to the day.", "high", md(5, 29)],
      ["navneet", "Alert on billing webhook processing failures", "A dropped webhook must not become a silent revenue loss.", "medium", md(5, 29)],
    ],
  },
  {
    title: "M5-6 - P2: Broker Breadth, Statements & the P2 Gate",
    description:
      "Months 5-6. One aggregator integration unlocks many brokers at once - breadth without dozens of separate builds, and without being gated on a single native approval queue - alongside Tradier natively, automated statements generated from the execution archive, and instant multi-channel notifications. Checkpoint: a stranger can sign up, subscribe, connect a broker and place a live order, unaided.",
    due: endOf(6),
    tasks: [
      ["priyank", "Build the aggregator adapter (SnapTrade / Plaid-class)", "One regulated integration connecting many brokers through the same contract.", "high", md(6, 6)],
      ["priyank", "Map aggregator capabilities onto the adapter contract", "Where the aggregator is thinner than a native path, and how that surfaces upstream.", "high", md(6, 10)],
      ["priyank", "Expose Fidelity, E*TRADE and Robinhood in the broker picker", "Aggregator-backed coverage available in the connect flow.", "medium", md(6, 13)],
      ["priyank", "Document per-broker capability and latency expectations", "What a trader can expect from each broker, written down.", "low", md(6, 15)],
      ["vivek", "Build the Tradier native adapter (REST, OAuth)", "Third native broker on the contract.", "medium", md(6, 8)],
      ["vivek", "Handle per-broker capability degradation in the UI contract", "Unsupported order types are hidden, never silently dropped.", "medium", md(6, 12)],
      ["neha", "Run conformance across every aggregator-backed broker", "Each broker validated individually before it appears in the picker.", "medium", md(6, 14)],
      ["priyank", "Handle aggregator connection re-authorisation", "Links that expire are renewed without losing the account.", "high", md(6, 11)],
      ["priyank", "Build aggregator webhook ingestion", "Position and execution updates consumed as they arrive.", "medium", md(6, 9)],
      ["priyank", "Reconcile aggregator positions against broker truth", "Aggregated data checked, never assumed correct.", "high", md(6, 13)],
      ["vivek", "Implement Tradier streaming quotes", "Streaming parity with the other native adapters.", "medium", md(6, 10)],
      ["vivek", "Add per-broker order-type support metadata", "The client knows what it may offer before it offers it.", "medium", md(6, 11)],
      ["vivek", "Handle aggregator rate limits and backoff", "Shared quota managed across every tenant on the aggregator.", "medium", md(6, 13)],
      ["neha", "Add aggregator sandbox tests to CI", "Regression cover for the path that unlocks the most brokers.", "medium", md(6, 14)],
      ["neha", "Verify order routing correctness per aggregator broker", "The right order reaches the right broker, every time.", "high", md(6, 15)],
      ["navneet", "Monitor aggregator availability as a dependency", "Its outage is visible on our dashboard, not just theirs.", "medium", md(6, 15)],
      ["manoj", "Build the automated daily and monthly statement service", "Generated and emailed without a manual step.", "medium", md(6, 18)],
      ["manoj", "Generate contract-note statements from the execution archive", "The archive, not the broker's short retention window, is the source of truth.", "medium", md(6, 22)],
      ["kruti", "Build the notification service with retry and dedupe", "Delivery that survives a transient outage without spamming the trader.", "medium", md(6, 20)],
      ["kruti", "Deliver instant trade and alert notifications by push and email", "The two channels live for launch.", "medium", md(6, 24)],
      ["kruti", "Scaffold the SMS, WhatsApp and Telegram channels", "Groundwork so extra channels are configuration, not a rebuild.", "low", md(6, 27)],
      ["kinjal", "Build per-tenant notification preferences", "What each trader wants, on which channel.", "low", md(6, 26)],
      ["neha", "Verify statement accuracy against broker records", "Every figure reconciled before a statement is ever sent.", "high", md(6, 28)],
      ["axit", "Demonstrate the P2 checkpoint", "Signup to a live order, unaided, by someone who has never seen the product.", "high", endOf(6)],
      ["manoj", "Build statement PDF rendering and storage", "Contract notes generated once and retrievable forever.", "medium", md(6, 24)],
      ["manoj", "Handle statement regeneration and corrections", "A corrected statement supersedes cleanly and is audit-visible.", "medium", md(6, 26)],
      ["kruti", "Implement notification templating per channel", "One message, rendered correctly for push, email and chat.", "medium", md(6, 22)],
      ["kruti", "Build the notification delivery audit trail", "What was sent, to whom, on which channel, and whether it landed.", "medium", md(6, 25)],
      ["kruti", "Add quiet hours and rate limiting to notifications", "Useful alerts, not a pager the trader learns to ignore.", "low", md(6, 26)],
      ["kinjal", "Build the notification history view", "Everything the platform has told this trader, in one place.", "low", md(6, 27)],
      ["neha", "Test notification delivery across every channel", "Delivery proven per channel before launch.", "medium", md(6, 27)],
      ["neha", "Run the P2 checkpoint dry run with an external tester", "Someone who has never seen the product, signing up unaided.", "high", md(6, 29)],
      ["axit", "Capture the onboarding completion baseline", "The number every later improvement is measured against.", "medium", md(6, 29)],
    ],
  },
  {
    title: "M6-7 - P3: Shared Market-Data Platform",
    description:
      "Months 6-7. A vendor-grade real-time feed ingested once and streamed to every tenant: efficient at scale, entitlement-tiered, and session-aware so the displayed price always matches reality. The price-resilience already proven in production is designed in from day one.",
    due: md(7, 10),
    tasks: [
      ["ankit", "Select the market-data vendor and validate terms", "Vendor and licensing validated before the shared feed goes live - a named timeline dependency.", "high", md(6, 20)],
      ["ankit", "Build the ingest-once service", "One subscription per symbol into a single ingestion service - no per-user scraping.", "high", md(6, 28)],
      ["ankit", "Build WebSocket fan-out to all interested tenants", "One upstream stream, many downstream consumers, cost amortised across the base.", "high", md(7, 5)],
      ["ankit", "Implement session-aware pricing", "Broker real-time in regular hours, consolidated tape pre and after market.", "high", md(7, 8)],
      ["ankit", "Enforce entitlement-tiered real-time versus delayed data", "The data tier is decided at the fan-out, never in the client.", "medium", md(7, 9)],
      ["ankit", "Persist last-known-good price", "A feed hiccup must never revert a card to stale data - the lesson already banked in production.", "high", md(7, 6)],
      ["ankit", "Build symbol subscription lifecycle and reference counting", "Subscriptions released when the last interested tenant drops off.", "medium", md(7, 9)],
      ["navneet", "Size and cost-model the shared feed at target concurrency", "What the feed costs at ten, a hundred and a thousand times today's load.", "medium", md(7, 7)],
      ["neha", "Build data-accuracy assertions against a second source", "Continuous cross-checking, so drift is detected rather than reported by a trader.", "high", md(7, 10)],
      ["ankit", "Build the symbol master and reference data service", "One canonical symbol identity across brokers and the feed.", "medium", md(6, 24)],
      ["ankit", "Implement quote conflation for slow consumers", "A slow client falls behind in price, never in correctness.", "high", md(7, 4)],
      ["ankit", "Build the historical bar and chart data service", "Charts served from our own store rather than per-user vendor calls.", "medium", md(7, 7)],
      ["ankit", "Implement corporate action adjustments", "Splits and dividends applied so history stays truthful.", "medium", md(7, 9)],
      ["ankit", "Build data-feed failover to the secondary vendor", "A vendor outage degrades quality, never availability.", "high", md(7, 8)],
      ["navneet", "Deploy the fan-out tier with connection-aware autoscale", "Scaling driven by live subscriber count.", "high", md(7, 6)],
      ["navneet", "Monitor data-staleness as an SLO", "Stale prices page someone before a trader notices.", "high", md(7, 9)],
      ["manoj", "Wire the shared feed into the alerts engine", "Alerts and the terminal read the same price, always.", "high", md(7, 8)],
      ["neha", "Load-test the fan-out at target concurrent subscribers", "The fan-out proven at the concurrency launch expects.", "high", md(7, 10)],
    ],
  },
  {
    title: "M7 - P3: Scale Infrastructure & Observability",
    description:
      "Month 7. Autoscaling per service, distributed tracing, and trading-specific SLOs - order-success, session uptime, data-staleness and quote latency - tracked as first-class objectives with paging on breach, plus blue-green releases and multi-AZ failover.",
    due: md(7, 25),
    tasks: [
      ["navneet", "Add horizontal autoscaling per service", "Stateless core services scale independently behind the gateway.", "high", md(7, 14)],
      ["navneet", "Roll out distributed tracing across the request path", "One trace from gateway through to the broker call and the fill.", "medium", md(7, 12)],
      ["navneet", "Define the trading SLOs and their error budgets", "Order-success, session uptime, data-staleness and quote latency, with agreed targets.", "high", md(7, 16)],
      ["navneet", "Build paging rules and on-call runbooks", "What happens at three in the morning, written down before it is needed.", "medium", md(7, 20)],
      ["navneet", "Move releases to blue-green with automated rollback", "A bad release is withdrawn in minutes, not debugged in production.", "medium", md(7, 22)],
      ["navneet", "Configure multi-AZ topology and failover", "Availability that survives the loss of a zone.", "high", md(7, 24)],
      ["manoj", "Move fills, alerts and statements onto a replayable event stream", "Decoupled, resilient and replayable for analytics and audit.", "medium", md(7, 21)],
      ["axit", "Introduce read replicas and connection pooling for the tenant store", "The database stops being the ceiling on horizontal scale.", "medium", md(7, 23)],
      ["neha", "Add performance regression gates to CI", "A latency regression fails the build rather than reaching load testing.", "medium", md(7, 25)],
      ["navneet", "Introduce request-level circuit breakers", "A failing dependency is isolated instead of cascading.", "high", md(7, 18)],
      ["navneet", "Add graceful shutdown and connection draining", "A deploy finishes in-flight work instead of dropping it.", "medium", md(7, 19)],
      ["navneet", "Build the capacity model and scaling runbook", "What to scale, when, and what it costs.", "medium", md(7, 24)],
      ["navneet", "Set up log retention and query tooling", "Investigations that take minutes rather than hours.", "low", md(7, 23)],
      ["axit", "Partition the largest tenant tables", "Growth in one tenant does not slow queries for the rest.", "medium", md(7, 22)],
      ["axit", "Add query performance monitoring on the tenant store", "Slow queries surface before they become incidents.", "medium", md(7, 24)],
      ["manoj", "Add dead-letter handling to the event stream", "Nothing is lost silently when a consumer fails.", "high", md(7, 22)],
      ["manoj", "Build event replay tooling for operations", "Reprocessing a bad window without a deploy.", "medium", md(7, 24)],
      ["neha", "Build the synthetic trading canary", "A continuous end-to-end order in a controlled account.", "high", md(7, 25)],
    ],
  },
  {
    title: "M7 - P3: Intelligence, Co-pilot & Risk Guardrails",
    description:
      "Month 7. A grounded conversational co-pilot over the trader's live account, the alerts engine scaled as a service, sentiment and analytics - and the safety layer: risk-based sizing, daily-loss limits, concentration warnings and a kill-switch. Intelligence that explains, never fabricates.",
    due: endOf(7),
    tasks: [
      ["nirmal", "Build the grounded co-pilot over live positions, orders and data", "Answers drawn from the trader's real account and real market data.", "high", md(7, 18)],
      ["nirmal", "Implement retrieval grounding with cited sources", "Every claim traceable to a source - it explains, it never invents numbers.", "high", md(7, 22)],
      ["nirmal", "Add not-advice framing and honest-uncertainty guardrails", "Integrity as a feature and as a compliance safeguard.", "high", md(7, 24)],
      ["nirmal", "Scale the alerts engine as an independent service", "Scoring and honest quality gates running as their own scalable service.", "high", md(7, 20)],
      ["nirmal", "Version, backtest and gate models before release", "No model reaches traders without a recorded backtest behind it.", "high", md(7, 26)],
      ["nirmal", "Score news and filings sentiment per symbol", "Feeds both the alerts engine and the co-pilot's context.", "medium", md(7, 28)],
      ["nirmal", "Build the co-pilot evaluation harness", "Regression testing for answer quality, grounding and refusal behaviour.", "medium", endOf(7)],
      ["manoj", "Build risk guardrails: per-trade sizing and daily-loss limits", "Discipline enforced by software rather than by the trader's willpower.", "high", md(7, 19)],
      ["manoj", "Add over-concentration and earnings-hold warnings", "Pre-trade checks alongside buying-power and bracket sanity.", "medium", md(7, 25)],
      ["manoj", "Build the account kill-switch", "One action halts all automated activity on an account.", "high", md(7, 23)],
      ["manoj", "Build the trade journal and FIFO realised P&L", "Performance analytics over the all-time archive.", "medium", md(7, 29)],
      ["kinjal", "Build paper trading and the simulator", "In-scope for the build because it raises trust before real money is involved.", "medium", endOf(7)],
      ["axit", "Build the advanced screener (core)", "The in-scope slice; deeper analytics follow post-launch.", "low", endOf(7)],
      ["nirmal", "Build the prompt and context assembly pipeline", "What the model sees, assembled deterministically and inspectably.", "high", md(7, 19)],
      ["nirmal", "Add cost and token budgeting per tenant", "AI usage bounded per tier and visible per tenant.", "medium", md(7, 24)],
      ["nirmal", "Implement conversation history and its privacy rules", "What is retained, for how long, and who can ever see it.", "high", md(7, 25)],
      ["nirmal", "Build the model fallback and degradation path", "A provider outage degrades the co-pilot, not the terminal.", "medium", md(7, 27)],
      ["nirmal", "Add alert explainability with the reasons behind a score", "Every alert can show why it fired.", "medium", md(7, 26)],
      ["nirmal", "Build the sentiment backfill and refresh scheduler", "Coverage that stays current across the whole symbol universe.", "medium", md(7, 29)],
      ["manoj", "Add position sizing suggestions to the order ticket", "Risk-based sizing offered where the decision is made.", "medium", md(7, 27)],
      ["kinjal", "Build the co-pilot chat interface", "Sources, streaming answers and clear not-advice framing.", "medium", md(7, 28)],
      ["neha", "Build the guardrail red-team suite", "Adversarial prompts asserting the model refuses what it must.", "high", md(7, 29)],
    ],
  },
  {
    title: "M7-8 - P3: Mobile, Admin Console & Hardening",
    description:
      "Months 7-8. iOS and Android to store-ready on the shared design system, the multi-tenant admin and support console with immutable audit trails, then the hardening that closes the eight-month build: load tests, security review, dependency and secret scanning, anomaly detection and pen-test preparation. Checkpoint: feature-complete, load-tested platform entering the testing programme.",
    due: endOf(8),
    tasks: [
      ["kruti", "Ship the iOS app to store-ready", "Full trading, alerts and account management on the native shell.", "high", md(8, 8)],
      ["kruti", "Ship the Android app to store-ready", "Feature parity with iOS on the shared design system.", "high", md(8, 10)],
      ["kruti", "Implement biometric login on both platforms", "Face and fingerprint unlock backed by the device keystore.", "high", md(8, 12)],
      ["kruti", "Implement push notification delivery on both platforms", "Trade and alert notifications delivered reliably to the device.", "medium", md(8, 14)],
      ["kruti", "Build the home-screen widgets", "Glanceable positions and alerts without opening the app.", "medium", md(8, 16)],
      ["kruti", "Prepare store listings and review submissions", "Review checklists cleared ahead of the P3 gate.", "medium", md(8, 18)],
      ["kinjal", "Build the admin console: tenant management and entitlement overrides", "Support can act without reaching for a database client.", "medium", md(8, 10)],
      ["kinjal", "Build health dashboards for support", "Per-tenant session, order and data health at a glance.", "medium", md(8, 14)],
      ["kinjal", "Build immutable audit trails for privileged actions", "Every administrative action recorded and unalterable.", "high", md(8, 16)],
      ["kinjal", "Add OTP protection to sensitive support workflows", "High-risk actions require a second factor, every time.", "high", md(8, 18)],
      ["kruti", "Build the mobile order ticket", "Full order entry with the same safety rails as the web desk.", "high", md(8, 9)],
      ["kruti", "Implement offline state and reconnect handling", "A dropped connection never looks like a filled or cancelled order.", "high", md(8, 12)],
      ["kruti", "Implement deep links from notifications", "An alert opens exactly the screen it is about.", "medium", md(8, 13)],
      ["kruti", "Add crash reporting and release-health monitoring", "A bad release is visible before the reviews are.", "medium", md(8, 15)],
      ["kruti", "Run device-matrix testing on both platforms", "The real spread of devices traders actually use.", "high", md(8, 17)],
      ["kinjal", "Build tenant impersonation with full audit", "Support can see what a trader sees, and every second is recorded.", "high", md(8, 15)],
      ["kinjal", "Build the broker connection troubleshooting view", "The first question support asks, answered on one screen.", "medium", md(8, 17)],
      ["kinjal", "Build admin search across tenants, orders and sessions", "Finding the one record that matters, quickly.", "medium", md(8, 18)],
      ["neha", "Test the admin console permission boundaries", "An admin role can only do what it is meant to.", "high", md(8, 18)],
      ["neha", "Run high-concurrency load tests against the full stack", "The whole platform under realistic trading-hour concurrency.", "high", md(8, 20)],
      ["neha", "Verify quote latency p95 under one second at target load", "The published objective, proven under load rather than asserted.", "high", md(8, 22)],
      ["neha", "Add dependency and secret scanning to CI", "Findings block the pipeline rather than accumulating in a backlog.", "medium", md(8, 12)],
      ["neha", "Build anomaly detection on auth and trading events", "Unusual patterns surfaced before they become incidents.", "high", md(8, 24)],
      ["neha", "Complete the internal security review", "Full review against the P0 threat model before external testing.", "high", md(8, 26)],
      ["neha", "Agree penetration-test scope and rules of engagement", "Scope, environments and escalation paths settled ahead of P5.", "medium", md(8, 28)],
      ["navneet", "Tune autoscale thresholds from load-test evidence", "Scaling behaviour set by measurement, not by guesswork.", "medium", md(8, 25)],
      ["axit", "Close the P3 checkpoint", "Feature-complete and load-tested - the build is done and the testing programme begins.", "high", endOf(8)],
      ["neha", "Run the order-path chaos suite", "Failure injected exactly where money is involved.", "high", md(8, 23)],
      ["neha", "Verify data isolation under load", "Isolation holds when the system is busy, not just when it is idle.", "high", md(8, 21)],
      ["neha", "Complete the dependency licence audit", "Nothing ships with a licence we cannot honour.", "low", md(8, 27)],
      ["neha", "Run the accessibility review on web and mobile", "The platform is usable by every trader, not most of them.", "medium", md(8, 26)],
      ["navneet", "Profile and remove the top latency hotspots", "The p95 target met by measurement, not by hope.", "high", md(8, 24)],
      ["navneet", "Right-size production from the load-test results", "Capacity set by evidence before real users arrive.", "medium", md(8, 26)],
      ["manoj", "Harden the order confirmation loop against timeouts", "A slow broker must never leave an order in limbo.", "high", md(8, 22)],
      ["ankit", "Tune the feed under simulated market-open load", "The busiest sixty seconds of the day, rehearsed.", "high", md(8, 21)],
      ["axit", "Compile the P3 checkpoint evidence pack", "What was built, what was tested, and what the numbers were.", "medium", md(8, 29)],
    ],
  },
  {
    title: "M9-10 - P4: Closed Beta & Rapid Iteration",
    description:
      "Months 9-10. A hand-picked cohort of real traders onboarded on real brokers with real, small money and instrumented on every session, order and data path - then a weekly feedback, fix and re-ship rhythm against what live trading actually surfaces. A sandbox cannot produce these failure modes; only real fills under real market conditions can.",
    due: endOf(10),
    tasks: [
      ["axit", "Define cohort selection and invite mechanics", "Who is invited, in what order, and what each cohort is meant to prove.", "high", md(9, 8)],
      ["axit", "Onboard the first cohort on real brokers", "Live connections and real money, deliberately capped.", "high", md(9, 18)],
      ["navneet", "Instrument every session, order and data path for the beta", "Beta findings should be evidence, not anecdote.", "high", md(9, 14)],
      ["navneet", "Build the beta telemetry dashboard", "One view of cohort health across sessions, orders and data.", "medium", md(9, 20)],
      ["manoj", "Cap beta account exposure with hard risk limits", "The stakes stay contained while the failure modes are found.", "high", md(9, 12)],
      ["kinjal", "Build the in-app feedback channel", "Feedback captured in context, with the session state attached.", "medium", md(9, 24)],
      ["neha", "Define and baseline the exit-criteria metrics", "Order-success, session uptime, data accuracy and retention, measured from day one.", "high", endOf(9)],
      ["axit", "Draft the beta agreement and disclosures", "What participants are agreeing to, in plain language.", "high", md(9, 6)],
      ["axit", "Build the beta invite and waitlist tooling", "Controlled intake, one cohort at a time.", "medium", md(9, 10)],
      ["manoj", "Add a per-account emergency stop for the beta", "One switch halts everything on one account.", "high", md(9, 16)],
      ["vivek", "Verify every broker path with a live beta account", "Each broker exercised for real before the cohort is let in.", "high", md(9, 20)],
      ["navneet", "Set up per-cohort dashboards and alerting", "Cohort health visible without a query.", "medium", md(9, 22)],
      ["kinjal", "Build the beta onboarding walkthrough", "First-run guidance for people seeing the product cold.", "medium", md(9, 22)],
      ["neha", "Set up session recording with explicit consent", "Evidence for debugging, gathered with permission.", "medium", md(9, 24)],
      ["neha", "Write the beta support runbook", "How a beta report becomes an engineering ticket.", "medium", md(9, 26)],
      ["manoj", "Run the weekly feedback, fix and re-ship cadence", "A seven-day loop from report to shipped fix.", "medium", md(10, 8)],
      ["nirmal", "Refine alert honesty and quality gates from beta signal", "Scoring tuned against what actually happened in live sessions.", "medium", md(10, 16)],
      ["kinjal", "Remove the onboarding friction the cohort surfaced", "Every measured drop-off point in the five-step flow.", "medium", md(10, 20)],
      ["ankit", "Resolve data-accuracy issues reported in live sessions", "Real market conditions against real accounts.", "high", md(10, 18)],
      ["vivek", "Fix the broker edge cases surfaced by real fills", "Behaviour no sandbox reproduces.", "high", md(10, 22)],
      ["kruti", "Ship the mobile fixes from beta feedback", "Device and platform issues found in real use.", "medium", md(10, 26)],
      ["neha", "Triage and categorise every beta defect", "A defect taxonomy that shows where the platform is actually weak.", "medium", endOf(10)],
      ["manoj", "Fix the order-path defects the cohort raised", "The highest-consequence bugs first.", "high", md(10, 14)],
      ["manoj", "Reduce time-to-fill on the order ticket", "Fewer steps between decision and order.", "medium", md(10, 24)],
      ["nirmal", "Retune alert thresholds against realised outcomes", "Scored against what the market actually did.", "high", md(10, 20)],
      ["nirmal", "Improve co-pilot answers from real transcripts", "Failure cases turned into evaluation cases.", "medium", md(10, 24)],
      ["ankit", "Improve feed recovery time after a vendor drop", "Shorter gap between outage and correct prices.", "high", md(10, 22)],
      ["kinjal", "Improve the connection-failure messaging", "A trader should always know what to do next.", "medium", md(10, 24)],
      ["navneet", "Cut the noisiest false-positive alerts", "On-call trust restored before the cohort widens.", "medium", md(10, 26)],
      ["neha", "Publish the weekly beta health report", "One page the whole team reads every Monday.", "medium", md(10, 28)],
    ],
  },
  {
    title: "M11-12 - P4: Reliability, Support & Exit Review",
    description:
      "Months 11-12. Support workflows, incident runbooks and reliability tuning under real usage, the cohort widened in controlled steps, then the hard bars measured: order-success at 99.5 percent, session uptime, data accuracy and retention. Checkpoint: sustained clean trading across the cohort with the defined exit criteria met.",
    due: endOf(12),
    tasks: [
      ["neha", "Write the support workflows and escalation paths", "How a real user problem becomes a resolved ticket.", "high", md(11, 10)],
      ["neha", "Write incident runbooks for the top failure modes", "Broker outage, session storm, data staleness, billing failure.", "high", md(11, 16)],
      ["navneet", "Tune reliability under real usage patterns", "Real traffic shapes, not synthetic ones.", "high", md(11, 18)],
      ["navneet", "Run the first live incident rehearsal", "The runbooks tested before they are needed for real.", "medium", md(11, 22)],
      ["manoj", "Harden the order-path edge cases found in the cohort", "Where a bug costs real money, nothing is left to chance.", "high", md(11, 20)],
      ["kinjal", "Build the support console workflows", "Everything support needs, inside the console and audited.", "medium", md(11, 24)],
      ["axit", "Widen the cohort in controlled steps", "Scale the beta only once reliability holds at the smaller size.", "medium", endOf(11)],
      ["axit", "Define the cohort expansion criteria", "What has to be true before more traders are let in.", "medium", md(11, 14)],
      ["neha", "Build the incident post-mortem process", "Blameless write-ups with tracked actions.", "medium", md(11, 20)],
      ["neha", "Run the support-workflow dry run", "The playbooks tested on a simulated ticket.", "medium", md(11, 26)],
      ["navneet", "Add automatic remediation for the top three incidents", "The most common pages fix themselves.", "high", md(11, 26)],
      ["navneet", "Tune alert thresholds from real incident data", "Alerting shaped by what actually mattered.", "medium", md(11, 28)],
      ["manoj", "Add order reconciliation against broker records", "Our record and the broker's must agree, daily.", "high", md(11, 22)],
      ["vivek", "Add per-broker health scoring", "Which broker is degrading, before traders report it.", "medium", md(11, 24)],
      ["kinjal", "Build the customer communication templates", "Consistent, honest messaging during an incident.", "low", md(11, 26)],
      ["neha", "Measure order-success against the 99.5 percent bar", "The headline reliability gate for the phase.", "high", md(12, 8)],
      ["neha", "Measure session uptime against the target", "Per-tenant broker links, over the whole cohort window.", "high", md(12, 12)],
      ["neha", "Measure data accuracy against the second source", "Continuous cross-checking summarised for the review.", "high", md(12, 16)],
      ["axit", "Measure cohort retention and engagement", "Whether real traders actually keep using it.", "medium", md(12, 20)],
      ["neha", "Produce the P4 exit review and sign-off pack", "Evidence assembled for the go / no-go decision.", "high", md(12, 26)],
      ["axit", "Take the go or no-go decision into P5", "Advance only when the criteria are met.", "high", endOf(12)],
      ["neha", "Measure alert quality against realised outcomes", "Honesty of the signal, quantified.", "high", md(12, 14)],
      ["neha", "Measure onboarding completion across the cohort", "The P2 KPI, re-measured with real users.", "medium", md(12, 18)],
      ["manoj", "Report order reconciliation discrepancies", "Every mismatch explained, not averaged away.", "high", md(12, 14)],
      ["ankit", "Report the data-staleness distribution for the phase", "Not just the average, but the tail.", "medium", md(12, 16)],
      ["navneet", "Report SLO attainment for the phase", "Error budget spent versus available.", "high", md(12, 18)],
      ["kinjal", "Summarise the cohort feedback themes", "What traders kept saying, grouped and ranked.", "medium", md(12, 22)],
      ["axit", "Close out or defer every open beta defect", "Nothing carries into P5 undecided.", "high", md(12, 24)],
    ],
  },
  {
    title: "M13-14 - P5: Load, Chaos, Pen-Test & DR",
    description:
      "Months 13-14. Sustained high-concurrency load, multi-day soak runs and deliberate failure injection - broker outages and session drops - to prove the platform degrades gracefully rather than failing whole; then an independent third-party penetration test with remediation, and disaster-recovery and failover drills run against the runbooks. Recovery objective: under fifteen minutes, verified rather than assumed.",
    due: endOf(14),
    tasks: [
      ["axit", "Expand the beta cohort", "A larger population ahead of the load and soak programme.", "medium", md(13, 8)],
      ["navneet", "Run sustained high-concurrency load tests", "Peak trading-hour concurrency, held.", "high", md(13, 14)],
      ["navneet", "Run multi-day soak tests", "Prove the platform holds over days, where leaks and drift appear.", "high", md(13, 20)],
      ["navneet", "Inject broker outages and session drops", "Chaos testing against the real failure modes of the domain.", "high", md(13, 24)],
      ["ankit", "Prove graceful degradation of the market-data feed", "A vendor hiccup must degrade one capability, never the platform.", "high", md(13, 22)],
      ["vivek", "Prove per-broker failure isolation", "One broker failing must not affect tenants on another.", "high", md(13, 26)],
      ["manoj", "Verify the event stream replays cleanly after failure", "No lost fills, no duplicated statements.", "medium", md(13, 28)],
      ["neha", "Record and triage every degradation finding", "Nothing observed in chaos testing goes unlogged.", "medium", endOf(13)],
      ["navneet", "Establish the load-test baseline and environment", "A production-like target so results mean something.", "high", md(13, 10)],
      ["navneet", "Test autoscale behaviour at market open", "The steepest ramp of the day, deliberately.", "high", md(13, 18)],
      ["ankit", "Test the feed under a full-universe subscription burst", "Everyone subscribing to everything at once.", "high", md(13, 16)],
      ["manoj", "Test order throughput at peak concurrency", "The order path at the volume launch expects.", "high", md(13, 18)],
      ["axit", "Test the tenant store at maximum concurrent tenants", "Where the database becomes the ceiling, found on purpose.", "high", md(13, 20)],
      ["nirmal", "Test co-pilot and alert latency under load", "Intelligence must not degrade when it is most needed.", "medium", md(13, 22)],
      ["vivek", "Test simultaneous multi-broker failure", "Two brokers down at once, and the platform still standing.", "high", md(13, 25)],
      ["neha", "Verify no data loss across every injected failure", "Degradation is acceptable; losing a fill is not.", "high", md(13, 27)],
      ["neha", "Run the independent third-party penetration test", "External assessment against a live-like environment.", "high", md(14, 12)],
      ["neha", "Triage and remediate every critical finding", "Zero critical findings is the gate, not the target.", "high", md(14, 22)],
      ["neha", "Re-test remediations with the assessor", "Fixes confirmed by the people who found the issues.", "high", md(14, 26)],
      ["navneet", "Run disaster-recovery and failover drills", "The runbooks executed for real, against the clock.", "high", md(14, 16)],
      ["navneet", "Verify the recovery objective under fifteen minutes", "The published RTO, demonstrated.", "high", md(14, 20)],
      ["navneet", "Validate backup restore and point-in-time recovery", "A restore that has never been tested is not a backup.", "high", md(14, 24)],
      ["axit", "Review key management and rotation procedures", "Per-tenant key separation and rotation, end to end.", "medium", endOf(14)],
      ["neha", "Run the internal pre-assessment", "Find the obvious findings before paying someone else to.", "high", md(14, 8)],
      ["neha", "Test the credential vault against the threat model", "The highest-value target, attacked deliberately.", "high", md(14, 14)],
      ["neha", "Verify no secrets appear in logs or traces", "The quiet leak that observability can create.", "high", md(14, 18)],
      ["navneet", "Drill a region failover end to end", "The whole platform moved, against the clock.", "high", md(14, 18)],
      ["navneet", "Verify the event stream survives a failover", "No duplicated statements, no lost fills.", "high", md(14, 22)],
      ["manoj", "Verify order integrity across a failover", "Every in-flight order accounted for afterwards.", "high", md(14, 20)],
      ["axit", "Drill tenant data export and deletion", "A right that has never been exercised is not a right.", "medium", md(14, 26)],
      ["kinjal", "Remediate the front-end findings from the assessment", "Client-side issues closed alongside the backend ones.", "medium", md(14, 26)],
    ],
  },
  {
    title: "M15 - P5: Compliance, Sign-off & Staged Go-Live",
    description:
      "Month 15 and launch. Formal compliance review, SOC 2 Type II readiness, privacy review and broker terms-of-service conformance, then final hardening and sign-off - and the staged go-live that follows: a capped soft launch on waitlist and referrals, caps lifted step by step only while order-success, uptime and latency hold, then open signup. Caps exist so reliability leads growth, never the other way around.",
    due: endOf(15),
    tasks: [
      ["neha", "Complete the SOC 2 Type II readiness assessment", "Formal readiness ahead of the audit window.", "high", md(15, 7)],
      ["neha", "Complete the GDPR and privacy review", "Data handling, retention and subject rights signed off.", "medium", md(15, 11)],
      ["neha", "Evidence the control set for audit", "Controls documented and evidenced rather than described.", "medium", md(15, 15)],
      ["priyank", "Obtain broker terms-of-service conformance sign-off", "Every adapter reviewed against its broker's terms.", "medium", md(15, 13)],
      ["navneet", "Freeze the production configuration for launch", "A known, reviewed configuration going into go-live.", "medium", md(15, 17)],
      ["axit", "Complete final hardening and launch sign-off", "The gate the staged go-live depends on.", "high", md(15, 19)],
      ["axit", "Publish the launch readiness review", "The record of what was proven, and by whom.", "high", md(15, 13)],
      ["neha", "Complete the vendor and sub-processor review", "Everyone who touches the data, assessed.", "medium", md(15, 5)],
      ["neha", "Finalise the incident response plan", "Who declares, who communicates, who decides.", "high", md(15, 9)],
      ["neha", "Complete the access review across every system", "Least privilege verified, not assumed.", "medium", md(15, 11)],
      ["priyank", "Verify every adapter against its final broker agreement", "The terms as signed, not as remembered.", "high", md(15, 11)],
      ["navneet", "Complete backup and retention verification", "Restores tested against the retention policy.", "high", md(15, 13)],
      ["manoj", "Complete the trading-records retention review", "What must be kept, and for how long.", "medium", md(15, 15)],
      ["axit", "Complete the data retention and deletion policy", "Written, approved and technically enforced.", "medium", md(15, 15)],
      ["kinjal", "Publish the terms, privacy policy and disclosures", "Everything a public signup legally requires.", "medium", md(15, 17)],
      ["axit", "Run the capped soft launch on waitlist and referrals", "Every new tenant monitored closely at low volume.", "high", md(15, 23)],
      ["navneet", "Watch the SLOs in real time through the ramp", "Growth pauses the moment an objective is threatened.", "high", md(15, 23)],
      ["manoj", "Monitor order-success through the ramp", "The metric that matters most, watched continuously.", "high", md(15, 24)],
      ["axit", "Lift the intake caps step by step", "Each increase earned by the objectives continuing to hold.", "high", md(15, 27)],
      ["neha", "Scale support to match intake", "Support capacity grows with, not behind, the user base.", "medium", md(15, 28)],
      ["kruti", "Publish the mobile apps to both stores", "iOS and Android live alongside the public launch.", "high", md(15, 29)],
      ["kinjal", "Switch on open signup for public launch", "Full self-serve at scale.", "high", md(15, 30)],
      ["axit", "Define the intake cap schedule and lift criteria", "Each increase earned by the objectives holding.", "high", md(15, 21)],
      ["navneet", "Build the launch war-room dashboard", "Every launch-critical number on one screen.", "high", md(15, 22)],
      ["kinjal", "Build the waitlist and referral flow", "Controlled demand ahead of open signup.", "medium", md(15, 22)],
      ["manoj", "Monitor fill quality and slippage through the ramp", "Growth must not quietly degrade execution.", "high", md(15, 25)],
      ["neha", "Staff and rehearse the launch support rota", "Cover in place before the doors open.", "medium", md(15, 26)],
      ["ankit", "Monitor feed cost and headroom as the base grows", "The shared feed stays economic at scale.", "medium", md(15, 26)],
      ["nirmal", "Monitor co-pilot cost and quality at open scale", "Intelligence that stays affordable and honest.", "medium", md(15, 29)],
      ["navneet", "Hold the post-launch stabilisation review", "What the first weeks taught, captured.", "high", md(15, 31)],
    ],
  },
];

// ------------------------------------------------------------------- seed
await mongoose.connect(uri);
const db = mongoose.connection.db;

const projects = db.collection("projects");
const milestones = db.collection("milestones");
const developers = db.collection("developers");
const tasks = db.collection("tasks");

const now = new Date();
const emailOf = (key) => `${key}@${EMAIL_DOMAIN}`;
const seedEmails = DEVELOPERS.map((d) => emailOf(d.key));

if (RESET) {
  const wiped = await Promise.all([
    projects.deleteMany({}),
    milestones.deleteMany({}),
    developers.deleteMany({}),
    tasks.deleteMany({}),
  ]);
  console.log(
    `SEED_RESET: removed ${wiped
      .map((w) => w.deletedCount)
      .join("/")} projects/milestones/developers/tasks.`
  );
} else {
  // Remove only what a previous run of this script created.
  const existing = await projects.findOne({ name: PROJECT_NAME });
  if (existing) {
    await Promise.all([
      milestones.deleteMany({ project: existing._id }),
      tasks.deleteMany({ project: existing._id }),
      projects.deleteOne({ _id: existing._id }),
    ]);
    console.log("Removed the previous NOVA seed.");
  }
  const owned = await developers
    .find({ email: { $in: seedEmails } }, { projection: { _id: 1 } })
    .toArray();
  if (owned.length) {
    const ids = owned.map((d) => d._id);
    await Promise.all([
      tasks.deleteMany({ developer: { $in: ids } }),
      milestones.updateMany({}, { $pull: { developers: { $in: ids } } }),
      developers.deleteMany({ _id: { $in: ids } }),
    ]);
    console.log(`Removed ${owned.length} previously seeded developers.`);
  }
}

await developers.createIndex(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $gt: "" } } }
);

const devPasswordHash = await bcrypt.hash(DEV_PASSWORD, 10);
const devIds = new Map();

for (const d of DEVELOPERS) {
  const { insertedId } = await developers.insertOne({
    name: d.name,
    email: emailOf(d.key),
    role: d.role,
    skills: d.skills,
    color: d.color,
    active: true,
    passwordHash: devPasswordHash,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });
  devIds.set(d.key, insertedId);
}

const { insertedId: projectId } = await projects.insertOne({
  name: PROJECT_NAME,
  client: "NOVA Terminal - Trading Intelligence",
  description:
    "A 15-month technical delivery programme evolving NOVA Terminal into a multi-tenant, multi-broker, intelligent trading platform. Eight months of engineering across four build phases, then seven months of real-world and pre-user testing across two more, closing launch-ready at month 15 and followed by a staged go-live. Seven workstreams run in parallel and converge on a demonstrable checkpoint at the end of every phase. Month targets carry a built-in comfort buffer of up to three months.",
  status: "active",
  startDate: START,
  endDate: endOf(15),
  accessPasswordHash: await bcrypt.hash(CLIENT_PASSWORD, 10),
  visible: true,
  createdAt: now,
  updatedAt: now,
});

let taskCount = 0;
const perDeveloper = new Map(DEVELOPERS.map((d) => [d.key, 0]));
const statusTally = { todo: 0, "in-progress": 0, review: 0, done: 0 };

for (const [order, m] of MILESTONES.entries()) {
  // A milestone's team is exactly whoever owns work inside it.
  const team = [...new Set(m.tasks.map(([key]) => key))];

  const horizon = new Date(TODAY.getTime() + IN_FLIGHT_DAYS * 86400000);

  // Of the work not yet due, only the nearest few count as under way.
  const inFlight = new Set(
    m.tasks
      .map((t, i) => [i, t[4]])
      .filter(([, due]) => due >= TODAY && due <= horizon)
      .sort((a, b) => a[1] - b[1])
      .slice(0, MAX_IN_FLIGHT)
      .map(([i]) => i)
  );

  const statusFor = (i) => {
    if (m.tasks[i][4] < TODAY) return "done";
    return inFlight.has(i) ? "in-progress" : "todo";
  };

  const statuses = m.tasks.map((_, i) => statusFor(i));
  const milestoneStatus = statuses.every((x) => x === "done")
    ? "completed"
    : statuses.some((x) => x !== "todo")
      ? "in-progress"
      : "pending";

  const { insertedId: milestoneId } = await milestones.insertOne({
    project: projectId,
    title: m.title,
    description: m.description,
    status: milestoneStatus,
    dueDate: m.due,
    order,
    developers: team.map((key) => devIds.get(key)),
    createdAt: now,
    updatedAt: now,
  });

  const rows = m.tasks.map(([key, title, description, priority, dueDate], i) => {
    const status = statusFor(i);
    statusTally[status] += 1;
    perDeveloper.set(key, perDeveloper.get(key) + 1);
    taskCount += 1;
    return {
      project: projectId,
      milestone: milestoneId,
      developer: devIds.get(key),
      title,
      description,
      status,
      priority,
      dueDate,
      order: i,
      createdAt: now,
      updatedAt: now,
    };
  });

  await tasks.insertMany(rows);
}

// ---------------------------------------------------------------- summary
const iso = (d) => d.toISOString().slice(0, 10);

console.log("");
console.log(`Seeded "${PROJECT_NAME}"`);
console.log(`  window       ${iso(START)} -> ${iso(endOf(15))}  (15 months)`);
console.log(`  milestones   ${MILESTONES.length}`);
console.log(`  developers   ${DEVELOPERS.length}`);
console.log(
  `  tasks        ${taskCount} (${statusTally.done} done, ${statusTally["in-progress"]} in progress, ${statusTally.todo} to do)`
);
console.log(
  `  progress     ${Math.round((statusTally.done / taskCount) * 100)}% as at ${iso(TODAY)} - only past-due work is complete`
);
console.log("");
console.log("Workload per developer:");
for (const d of DEVELOPERS) {
  console.log(`  ${d.name.padEnd(9)} ${String(perDeveloper.get(d.key)).padStart(3)}  ${d.role}`);
}
console.log("");
console.log("Client access (public site):");
console.log(`  password     ${CLIENT_PASSWORD}`);
console.log("");
console.log(`Developer logins (all share the password "${DEV_PASSWORD}"):`);
for (const d of DEVELOPERS) {
  console.log(`  ${emailOf(d.key)}`);
}

await mongoose.disconnect();
