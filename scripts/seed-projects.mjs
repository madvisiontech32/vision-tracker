/**
 * Seeds the six smaller client projects alongside the NOVA programme: Gora Taxi
 * Partner, the pharmacy delivery suite, Izi Morroco, Hkili, Ananta and Mokaala.
 *
 *   npm run seed:projects          (local)
 *   npm run seed:projects:prod     (Atlas, via .env.atlas)
 *
 * Each runs on a three or four month window and is already part-built, so the
 * completed share is stated per project and the dates are derived to match:
 * every finished task lands before today and everything outstanding after it.
 * Nothing due today or later is ever seeded as complete.
 *
 * This script only ever touches its own projects and reuses the existing
 * developers by email - the NOVA programme is left exactly as it is. Set
 * SEED_ONLY="Ananta" to re-seed a single project and leave the rest alone.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI missing. Copy .env.example to .env.local first.");
  process.exit(1);
}

const TODAY = new Date(`${process.env.SEED_TODAY ?? "2026-09-02"}T00:00:00.000Z`);
const DEV_PASSWORD = process.env.SEED_DEV_PASSWORD ?? "nova12345";
const EMAIL_DOMAIN = "novaterminal.com";
const IN_FLIGHT_DAYS = 30;
const MAX_IN_FLIGHT = 5;

const d = (iso) => new Date(`${iso}T00:00:00.000Z`);

// Developers are shared with the NOVA seed; any that do not exist yet are
// created here so this script also works on its own.
const TEAM = {
  axit: { name: "Axit", role: "Platform & Multi-tenancy Lead", color: "#4a4a4a", skills: ["Next.js", "PostgreSQL", "System design"] },
  manoj: { name: "Manoj", role: "Core Services & Order Engine", color: "#5a5a5a", skills: ["Next.js", "Node.js", "Realtime"] },
  priyank: { name: "Priyank", role: "Integrations Lead", color: "#6b6b6b", skills: ["Payments", "Maps", "REST"] },
  vivek: { name: "Vivek", role: "Flutter Developer", color: "#7c7c7c", skills: ["Flutter", "Dart", "Riverpod"] },
  ankit: { name: "Ankit", role: "Realtime & Data", color: "#8d8d8d", skills: ["WebSockets", "Streaming", "Geo"] },
  nirmal: { name: "Nirmal", role: "Intelligence & AI", color: "#9e9e9e", skills: ["LLM", "Prompting", "TTS"] },
  navneet: { name: "NavNeet", role: "Infrastructure & SRE", color: "#afafaf", skills: ["CI/CD", "Cloud", "Observability"] },
  kinjal: { name: "Kinjal", role: "Frontend & Web Experience", color: "#5f5f5f", skills: ["Next.js", "React", "Admin UX"] },
  kruti: { name: "Kruti", role: "Mobile & Design System", color: "#707070", skills: ["Flutter", "Design systems", "Push"] },
  neha: { name: "Neha", role: "Quality & Release", color: "#818181", skills: ["Test automation", "Store release", "QA"] },
};

// ------------------------------------------------------------- the projects
// Milestone `done` counts are what drive the stated completion percentage.
const PROJECTS = [
  {
    name: "Gora Taxi Partner",
    client: "Gora Mobility",
    password: "gora2026",
    target: 70,
    start: d("2026-06-15"),
    end: d("2026-10-14"),
    description:
      "A Rapido and Ola style ride-hailing platform: a Flutter rider app, a Flutter captain app, and a Next.js admin console and API behind both. Booking, live tracking, fare engine, wallet and payouts, driver onboarding and dispatch. Four-month build.",
    milestones: [
      {
        title: "M1 - Rider App & Booking Core",
        description:
          "The Flutter rider app and the Next.js API behind it: sign-in, place picker, ride estimate, request and cancel. The booking flow works end to end before anything else is built on top of it.",
        from: d("2026-06-15"),
        to: d("2026-07-20"),
        done: 11,
        tasks: [
          ["axit", "Design the ride, driver and trip data model", "Trip states, driver availability and the fare snapshot stored per ride.", "high"],
          ["manoj", "Build the Next.js booking API and trip state machine", "Requested, accepted, arrived, started, completed and cancelled, with only legal transitions.", "high"],
          ["kruti", "Scaffold the Flutter rider app and design system", "Shared theme, typography and component set used by both apps.", "high"],
          ["vivek", "Build phone OTP sign-in and the rider profile", "Number verification, session storage and profile edit.", "high"],
          ["vivek", "Build the pickup and drop place picker", "Map search, saved places and drag-to-adjust pin.", "high"],
          ["priyank", "Integrate the maps and geocoding provider", "Places autocomplete, reverse geocoding and route polylines behind one service.", "high"],
          ["priyank", "Build the distance and ETA service", "Route distance and duration used by the estimate and the fare engine.", "medium"],
          ["vivek", "Build the vehicle class picker and fare estimate screen", "Bike, auto and cab options with an up-front price.", "high"],
          ["manoj", "Build ride request, accept and cancel endpoints", "Including cancellation windows and who bears the fee.", "high"],
          ["ankit", "Build the driver availability index", "Which drivers are online, where, and which classes they can serve.", "high"],
          ["neha", "Write the booking flow end-to-end tests", "Request through to completion, run on every build.", "medium"],
        ],
      },
      {
        title: "M2 - Captain App & Live Tracking",
        description:
          "The Flutter captain app and the realtime layer: online and offline state, ride offers with an accept timer, turn-by-turn navigation handoff, and live location streamed to the rider throughout the trip.",
        from: d("2026-07-21"),
        to: d("2026-08-25"),
        done: 10,
        tasks: [
          ["kruti", "Build the Flutter captain app shell", "Online toggle, earnings header and trip card on one screen.", "high"],
          ["vivek", "Build the ride offer screen with an accept countdown", "Offer, timer, accept and auto-decline.", "high"],
          ["ankit", "Build the live location pipeline", "Captain location streamed to the server and fanned out to the rider.", "high"],
          ["ankit", "Add location batching and battery-safe intervals", "Accurate tracking without draining the captain's phone.", "high"],
          ["vivek", "Build the trip screen with navigation handoff", "Hand the route to the device navigation app and come back cleanly.", "high"],
          ["manoj", "Build the dispatch and matching service", "Nearest suitable captain first, with a retry ladder when nobody accepts.", "high"],
          ["manoj", "Handle offer timeouts and re-dispatch", "A declined or ignored offer moves on without stranding the rider.", "high"],
          ["vivek", "Build rider-side live tracking on the map", "Captain marker, route and live ETA.", "high"],
          ["kruti", "Add push notifications to both apps", "Offer, arrival, start and completion events.", "medium"],
          ["neha", "Test tracking accuracy and reconnect behaviour", "Tunnels, app backgrounding and network drops.", "high"],
        ],
      },
      {
        title: "M3 - Fares, Payments & Wallet",
        description:
          "The money layer: the fare engine with surge and waiting charges, in-app payments and cash reconciliation, the captain wallet, commission and weekly payouts.",
        from: d("2026-08-26"),
        to: d("2026-09-20"),
        done: 7,
        tasks: [
          ["manoj", "Build the fare engine", "Base, distance, time, waiting charge and the night multiplier.", "high"],
          ["manoj", "Add surge pricing by zone and demand", "Multiplier derived from live supply and demand, capped and disclosed up front.", "high"],
          ["priyank", "Integrate the payment gateway", "Cards, UPI and wallet, with the payment captured on completion.", "high"],
          ["manoj", "Build cash trip reconciliation", "Cash collected by the captain settled against commission owed.", "high"],
          ["axit", "Build the captain wallet and ledger", "Every credit and debit recorded and reconcilable.", "high"],
          ["axit", "Build the commission and weekly payout run", "Automated payouts with a statement per captain.", "high"],
          ["vivek", "Build the fare breakdown and receipt screen", "Every charge itemised for the rider.", "medium"],
          ["priyank", "Handle refunds and failed payment retries", "A failed capture must not lose the trip record.", "high"],
          ["neha", "Test the fare engine against a pricing matrix", "Distance, time, surge and waiting combinations asserted.", "high"],
        ],
      },
      {
        title: "M4 - Admin Console, Safety & Store Release",
        description:
          "The Next.js admin console for operations, the safety features riders expect, and the release: driver onboarding and verification, live dispatch board, SOS and trip sharing, ratings, then both apps to the stores.",
        from: d("2026-09-21"),
        to: d("2026-10-14"),
        done: 0,
        tasks: [
          ["kinjal", "Build the driver onboarding and document verification console", "Licence, RC and insurance reviewed and approved in one queue.", "high"],
          ["kinjal", "Build the live dispatch and trip monitoring board", "Every active trip on a map with intervention controls.", "high"],
          ["kinjal", "Build the fare, zone and surge configuration screens", "Operations can tune pricing without a deploy.", "medium"],
          ["vivek", "Build the SOS button and emergency contacts", "One tap raises an alert with the live trip location.", "high"],
          ["vivek", "Build trip sharing by link", "A rider can share a live trip with anyone.", "high"],
          ["kruti", "Build ratings and feedback on both apps", "Two-way rating captured at the end of every trip.", "medium"],
          ["navneet", "Set up the production environment and CI/CD", "Build, test and deploy on merge, with rollback.", "high"],
          ["navneet", "Add crash reporting and release-health monitoring", "A bad release is visible before the store reviews are.", "medium"],
          ["neha", "Run device-matrix testing on both Flutter apps", "The real spread of Android devices the fleet actually uses.", "high"],
          ["neha", "Prepare and submit both store listings", "Play Store and App Store review checklists cleared.", "high"],
        ],
      },
    ],
  },

  {
    name: "Pharmacy Delivery Suite",
    client: "Pharmacy Delivery",
    password: "pharma2026",
    target: 66,
    start: d("2026-07-01"),
    end: d("2026-10-31"),
    description:
      "Three Flutter apps on one Next.js backend: a patient app for ordering medicines, a pharmacy app for accepting orders and managing stock, and a rider app for pickup and delivery. Prescription upload, live order tracking and payments included. Four-month build.",
    milestones: [
      {
        title: "M1 - Catalogue, Auth & Patient App",
        description:
          "The Next.js backend and the Flutter patient app: medicine catalogue and search, cart and checkout, addresses, and the prescription upload that a pharmacist reviews before dispensing.",
        from: d("2026-07-01"),
        to: d("2026-07-28"),
        done: 12,
        tasks: [
          ["axit", "Design the catalogue, order and prescription data model", "Medicines, batches, orders, order items and prescription reviews.", "high"],
          ["manoj", "Build the Next.js API and the order state machine", "Placed, accepted, packed, picked up, delivered and cancelled.", "high"],
          ["kruti", "Scaffold the three Flutter apps on a shared design system", "One component library used by patient, pharmacy and rider.", "high"],
          ["vivek", "Build patient sign-up, OTP login and profile", "Phone verification and a saved medical profile.", "high"],
          ["manoj", "Build the medicine catalogue and search API", "Name, salt and brand search with substitute suggestions.", "high"],
          ["vivek", "Build the catalogue browse and search screens", "Categories, search, and the product detail page.", "high"],
          ["vivek", "Build the cart and checkout flow", "Quantity limits, substitutes and the order summary.", "high"],
          ["vivek", "Build address management and delivery slots", "Saved addresses with a serviceability check per pincode.", "medium"],
          ["vivek", "Build prescription upload from camera or gallery", "Image capture, crop and upload against an order.", "high"],
          ["priyank", "Build image storage and the secure prescription URL service", "Prescriptions readable only by the assigned pharmacist.", "high"],
          ["axit", "Enforce prescription-required rules per medicine", "A schedule H item cannot be ordered without a valid prescription.", "high"],
          ["neha", "Write the ordering flow end-to-end tests", "Search through to a placed order.", "medium"],
        ],
      },
      {
        title: "M2 - Pharmacy App: Orders & Inventory",
        description:
          "The Flutter pharmacy app: incoming order queue, prescription review and dispense, inventory with batches and expiry, substitutions, and the packing flow that hands the order to a rider.",
        from: d("2026-07-29"),
        to: d("2026-08-20"),
        done: 12,
        tasks: [
          ["kruti", "Build the pharmacy app shell and order queue", "New, preparing and ready, on one screen.", "high"],
          ["vivek", "Build the order detail and accept or reject flow", "With a reason captured on every rejection.", "high"],
          ["vivek", "Build the prescription review screen", "Pharmacist views the upload, approves or asks for a clearer copy.", "high"],
          ["manoj", "Build the inventory API with batches and expiry", "Stock tracked per batch so expired stock cannot be dispensed.", "high"],
          ["vivek", "Build stock entry, adjustment and low-stock alerts", "The pharmacist keeps stock accurate from the app.", "high"],
          ["manoj", "Build the substitution engine", "Same-salt alternatives offered when a brand is out of stock.", "medium"],
          ["vivek", "Build the substitution approval flow", "The patient approves any substitution before it is packed.", "high"],
          ["vivek", "Build the packing checklist and ready-for-pickup handoff", "Item-by-item confirmation before a rider is called.", "high"],
          ["manoj", "Build multi-pharmacy routing by serviceability", "The order goes to a pharmacy that can actually fulfil it.", "high"],
          ["kinjal", "Build the pharmacy onboarding and licence verification console", "Drug licence checked and approved before a pharmacy goes live.", "high"],
          ["ankit", "Build the order event stream", "Every status change published for tracking and analytics.", "medium"],
          ["neha", "Test the dispense flow against prescription rules", "No scheduled medicine leaves without an approved prescription.", "high"],
        ],
      },
      {
        title: "M3 - Rider App: Pickup & Delivery",
        description:
          "The Flutter rider app and live order tracking: delivery offers, pickup confirmation at the pharmacy, navigation to the patient, proof of delivery, and the tracking the patient watches throughout.",
        from: d("2026-08-21"),
        to: d("2026-09-01"),
        done: 9,
        tasks: [
          ["kruti", "Build the rider app shell and duty toggle", "Online and offline with an earnings summary.", "high"],
          ["vivek", "Build the delivery offer and accept flow", "Offer with pickup and drop distance, and an accept timer.", "high"],
          ["vivek", "Build the pickup confirmation at the pharmacy", "Order code scanned or entered before handover.", "high"],
          ["ankit", "Build rider live location streaming", "Position streamed from acceptance to delivery.", "high"],
          ["vivek", "Build patient-side live order tracking", "Rider on the map with a live ETA.", "high"],
          ["vivek", "Build proof of delivery", "OTP from the patient, or a photo where OTP is not possible.", "high"],
          ["manoj", "Build rider assignment and re-assignment", "A dropped delivery is re-offered without losing the order.", "high"],
          ["manoj", "Handle failed deliveries and returns to pharmacy", "Unreachable patient, refused order and the return trip.", "medium"],
          ["neha", "Test the full three-app order journey", "Patient order through pharmacy dispense to rider delivery.", "high"],
        ],
      },
      {
        title: "M4 - Payments, Refunds & Notifications",
        description:
          "Money and communication: online payment and cash on delivery, refunds for unavailable items, rider and pharmacy settlements, and the notifications that keep all three parties in step.",
        from: d("2026-09-02"),
        to: d("2026-09-30"),
        done: 0,
        tasks: [
          ["priyank", "Integrate the payment gateway", "Cards, UPI and wallet, captured on delivery.", "high"],
          ["manoj", "Build cash on delivery and rider cash reconciliation", "Cash collected settled against what the rider owes.", "high"],
          ["manoj", "Build partial refunds for unavailable items", "Only what was actually dispensed is charged.", "high"],
          ["axit", "Build pharmacy and rider settlement runs", "Weekly payouts with a statement for each.", "high"],
          ["kruti", "Build push notifications across all three apps", "Order accepted, packed, picked up, arriving and delivered.", "high"],
          ["manoj", "Build SMS and email order updates", "For patients who do not have the app open.", "medium"],
          ["kinjal", "Build the invoice and order history screens", "Every order retrievable with its invoice.", "medium"],
          ["priyank", "Handle payment failures and retries", "A failed capture must never lose the order.", "high"],
          ["neha", "Test payments, refunds and settlement arithmetic", "Every money path asserted against a fixture set.", "high"],
        ],
      },
      {
        title: "M5 - Compliance, Admin & Store Release",
        description:
          "The Next.js operations console, the regulatory obligations that come with dispensing medicine, and getting all three Flutter apps through store review.",
        from: d("2026-10-01"),
        to: d("2026-10-31"),
        done: 0,
        tasks: [
          ["kinjal", "Build the operations console", "Live orders, pharmacies, riders and interventions in one place.", "high"],
          ["kinjal", "Build the reporting and reconciliation dashboards", "Daily orders, fulfilment rate and settlement position.", "medium"],
          ["axit", "Build prescription retention and audit records", "Retained for the statutory period and traceable per order.", "high"],
          ["neha", "Complete the data privacy review", "Health data handling, consent and retention signed off.", "high"],
          ["navneet", "Set up the production environment and CI/CD", "Build, test and deploy on merge with rollback.", "high"],
          ["navneet", "Add crash reporting and uptime monitoring", "Across the backend and all three apps.", "medium"],
          ["neha", "Run device-matrix testing on all three apps", "Patient, pharmacy and rider on the real device spread.", "high"],
          ["neha", "Prepare and submit three store listings", "Health-app review requirements addressed up front.", "high"],
        ],
      },
    ],
  },

  {
    name: "Izi Morroco",
    client: "Izi Games",
    password: "izi2026",
    target: 73,
    start: d("2026-07-01"),
    end: d("2026-09-30"),
    description:
      "A Flutter mobile game with a Next.js backend for accounts, progression and leaderboards. Level-based play, daily challenges, rewards and social scores, with monetisation through ads and in-app purchases. Three-month build.",
    milestones: [
      {
        title: "M1 - Game Core & Flutter Setup",
        description:
          "The playable core: game loop, input, physics and scoring running at a stable frame rate on mid-range Android, with the project structure and asset pipeline the rest of the build depends on.",
        from: d("2026-07-01"),
        to: d("2026-07-22"),
        done: 8,
        tasks: [
          ["kruti", "Scaffold the Flutter game project and asset pipeline", "Sprite atlases, audio and fonts loaded through one pipeline.", "high"],
          ["vivek", "Build the game loop and render layer", "Fixed timestep update with a stable sixty frames per second.", "high"],
          ["vivek", "Build the input and gesture handling", "Tap, swipe and hold, with the same feel across devices.", "high"],
          ["vivek", "Build the collision and physics layer", "Deterministic, so a replay always produces the same result.", "high"],
          ["vivek", "Build the scoring and combo system", "Score, streaks and multipliers.", "high"],
          ["kruti", "Build the HUD and pause menu", "Score, lives, pause and resume without dropping frames.", "medium"],
          ["ankit", "Add frame-time profiling on mid-range Android", "The performance floor the game is actually tuned against.", "high"],
          ["neha", "Set up automated gameplay smoke tests", "The core loop verified on every build.", "medium"],
        ],
      },
      {
        title: "M2 - Levels, Assets & Gameplay Loop",
        description:
          "Content and progression: the level format and editor, the first level pack, difficulty curve, power-ups, and the art and audio that make it feel finished.",
        from: d("2026-07-23"),
        to: d("2026-08-15"),
        done: 8,
        tasks: [
          ["vivek", "Design the level format and loader", "Levels as data, so new content ships without a new build.", "high"],
          ["vivek", "Build the internal level editor", "Design and test a level without touching code.", "medium"],
          ["kruti", "Produce and integrate the first level pack", "Thirty levels with a tuned difficulty curve.", "high"],
          ["vivek", "Build the power-up and booster system", "Earned and purchasable, with clear rules.", "high"],
          ["kruti", "Integrate the art set and animations", "Characters, backgrounds and transitions.", "high"],
          ["kruti", "Integrate music and sound effects", "With a mute that persists across sessions.", "medium"],
          ["vivek", "Build the level select and progression map", "What is unlocked, what is next, and stars earned.", "high"],
          ["neha", "Playtest and tune the difficulty curve", "Where players actually drop off, measured rather than guessed.", "high"],
        ],
      },
      {
        title: "M3 - Accounts, Progress & Leaderboards",
        description:
          "The Next.js backend: player accounts, cloud-saved progress, daily challenges, and leaderboards that cannot be gamed by editing local state.",
        from: d("2026-08-16"),
        to: d("2026-09-10"),
        done: 6,
        tasks: [
          ["axit", "Design the player, progress and score data model", "Levels completed, stars, currency and streaks.", "high"],
          ["manoj", "Build the Next.js accounts and session API", "Guest play with an optional upgrade to a real account.", "high"],
          ["vivek", "Build cloud save and device migration", "Progress follows the player to a new phone.", "high"],
          ["manoj", "Build the leaderboard service", "Daily, weekly and all-time boards.", "high"],
          ["manoj", "Add server-side score validation", "A score that could not have been achieved is rejected.", "high"],
          ["vivek", "Build the daily challenge and streak system", "A reason to open the game tomorrow.", "high"],
          ["kruti", "Build the friends and share-your-score flow", "Scores shared out to social apps.", "medium"],
          ["neha", "Test progress sync across reinstall and device change", "No player should ever lose progress.", "high"],
        ],
      },
      {
        title: "M4 - Monetisation, Polish & Store Release",
        description:
          "Ads, in-app purchases and the release: rewarded video, a remove-ads purchase, coin packs, analytics, final polish and both store submissions.",
        from: d("2026-09-11"),
        to: d("2026-09-30"),
        done: 0,
        tasks: [
          ["priyank", "Integrate rewarded video and interstitial ads", "Rewarded by choice, interstitials capped so they do not sour the game.", "high"],
          ["priyank", "Integrate in-app purchases", "Remove ads, coin packs and the booster bundle, receipts verified server-side.", "high"],
          ["manoj", "Build purchase verification and entitlement grants", "A purchase is only honoured once the receipt validates.", "high"],
          ["ankit", "Add gameplay and funnel analytics", "Where players stop, and what they buy.", "medium"],
          ["navneet", "Set up CI/CD, crash reporting and release health", "A bad build is caught before the reviews arrive.", "high"],
          ["neha", "Run device-matrix testing and prepare store listings", "Screenshots, ratings questionnaire and both submissions.", "high"],
        ],
      },
    ],
  },

  {
    name: "Hkili",
    client: "Hkili Studio",
    password: "hkili2026",
    target: 55,
    start: d("2026-06-25"),
    end: d("2026-10-24"),
    description:
      "A Flutter storytelling app with a Next.js backend that writes stories automatically. A reader gives a theme, characters and an age range, and the app generates an illustrated, narratable story it can save, continue and share. Four-month build.",
    milestones: [
      {
        title: "M1 - Foundation & Story Data Model",
        description:
          "The Next.js backend and the story model everything else builds on: stories, chapters, characters and themes, with accounts and a library per reader.",
        from: d("2026-06-25"),
        to: d("2026-07-20"),
        done: 8,
        tasks: [
          ["axit", "Design the story, chapter and character data model", "A story as structured chapters rather than one blob of text.", "high"],
          ["manoj", "Build the Next.js API and story service", "Create, read, continue and delete a story.", "high"],
          ["kruti", "Scaffold the Flutter app and design system", "Typography-led reading experience, light and dark.", "high"],
          ["vivek", "Build sign-up, login and the reader profile", "Email and social sign-in with an age setting.", "high"],
          ["axit", "Build the theme, genre and age-range taxonomy", "The vocabulary the generator is steered with.", "medium"],
          ["manoj", "Build the story library and folders API", "Saved, in-progress and finished stories.", "medium"],
          ["navneet", "Set up the project infrastructure and CI", "Environments, pipelines and preview builds.", "medium"],
          ["neha", "Write the API contract tests", "Every endpoint asserted before the app depends on it.", "medium"],
        ],
      },
      {
        title: "M2 - AI Story Generation Pipeline",
        description:
          "The heart of the product: a prompt and generation pipeline that turns a theme, characters and an age range into a coherent multi-chapter story, with safety filtering and the ability to continue an existing story in the same voice.",
        from: d("2026-07-21"),
        to: d("2026-08-20"),
        done: 8,
        tasks: [
          ["nirmal", "Build the prompt and context assembly pipeline", "Theme, characters, age range and tone assembled deterministically.", "high"],
          ["nirmal", "Build multi-chapter generation with a story outline", "Outline first, then chapters, so long stories stay coherent.", "high"],
          ["nirmal", "Build the continue-this-story flow", "New chapters that keep the established characters and voice.", "high"],
          ["nirmal", "Build age-appropriate safety filtering", "Content bounded by the reader age on every generation.", "high"],
          ["nirmal", "Add streaming generation to the API", "The reader sees the story appear rather than waiting on a spinner.", "high"],
          ["nirmal", "Build the model fallback and retry path", "A provider outage degrades speed, not availability.", "medium"],
          ["manoj", "Add generation cost and rate limiting per account", "Usage bounded per tier and visible per account.", "high"],
          ["neha", "Build the generation quality evaluation set", "Coherence, age fit and safety scored on a fixed prompt set.", "high"],
        ],
      },
      {
        title: "M3 - Flutter Reader & Library",
        description:
          "The reading experience: the story creation flow, a typography-led reader with progress and bookmarks, and the library where a reader keeps everything they have made.",
        from: d("2026-08-21"),
        to: d("2026-09-15"),
        done: 6,
        tasks: [
          ["vivek", "Build the story creation flow", "Theme, characters, age and length in a few taps.", "high"],
          ["vivek", "Build the streaming generation screen", "Chapters appearing live, cancellable mid-way.", "high"],
          ["kruti", "Build the reader with typography controls", "Font size, spacing, and light and dark reading modes.", "high"],
          ["vivek", "Build reading progress and bookmarks", "Resume exactly where the reader stopped, on any device.", "high"],
          ["vivek", "Build the library with search and folders", "Saved, in-progress and finished, all searchable.", "high"],
          ["kruti", "Build offline reading for saved stories", "A downloaded story reads with no connection.", "medium"],
          ["vivek", "Build the edit and regenerate-chapter flow", "The reader can reject a chapter and ask for another.", "medium"],
          ["neha", "Test the reader across screen sizes and text scales", "Including the largest accessibility text settings.", "high"],
        ],
      },
      {
        title: "M4 - Narration, Illustrations & Sharing",
        description:
          "What turns a generated story into something worth keeping: per-chapter illustrations, text-to-speech narration with word highlighting, and sharing or exporting a finished story.",
        from: d("2026-09-16"),
        to: d("2026-10-05"),
        done: 0,
        tasks: [
          ["nirmal", "Build per-chapter illustration generation", "An image per chapter, consistent with the characters described.", "high"],
          ["nirmal", "Keep character appearance consistent across chapters", "The same character should not change face between images.", "high"],
          ["nirmal", "Integrate text-to-speech narration", "Natural narration with a choice of voices.", "high"],
          ["vivek", "Build the narration player with word highlighting", "Follow-along reading for younger readers.", "high"],
          ["vivek", "Build background playback and sleep timer", "Bedtime listening with the screen off.", "medium"],
          ["kruti", "Build story sharing and PDF export", "A finished story shared as a link or saved as a book.", "medium"],
          ["manoj", "Build image storage and delivery", "Illustrations cached and served at the right size per device.", "medium"],
          ["neha", "Test narration and illustration generation end to end", "Including failure paths when a provider is slow.", "high"],
        ],
      },
      {
        title: "M5 - Accounts, Monetisation & Store Release",
        description:
          "Subscriptions, the parent-facing controls a children's app needs, and getting the Flutter app through both store reviews.",
        from: d("2026-10-06"),
        to: d("2026-10-24"),
        done: 0,
        tasks: [
          ["priyank", "Integrate subscriptions and in-app purchases", "Free tier with a story limit, and an unlimited subscription.", "high"],
          ["manoj", "Build entitlement checks and the free-tier limit", "Enforced server-side, not in the app.", "high"],
          ["kinjal", "Build the parent controls and age settings", "Content bounds a child cannot change.", "high"],
          ["kinjal", "Build the Next.js admin and content review console", "Flagged generations reviewed by a human.", "medium"],
          ["navneet", "Set up production infrastructure and monitoring", "Uptime, generation latency and cost tracked.", "high"],
          ["navneet", "Add crash reporting and release health", "Regressions visible before the reviews land.", "medium"],
          ["neha", "Complete the children's privacy review", "Data collection and consent for a young audience.", "high"],
          ["neha", "Prepare and submit both store listings", "Kids-category requirements addressed up front.", "high"],
        ],
      },
    ],
  },
  {
    name: "Ananta",
    client: "Ananta Live",
    password: "ananta2026",
    target: 100,
    status: "completed",
    start: d("2026-02-01"),
    end: d("2026-05-31"),
    description:
      "A live streaming app: a Flutter app for both broadcasters and viewers, with a Next.js backend and moderation console behind it. Low-latency ingest and playback, live chat, gifts and a coin wallet, follows and discovery, creator payouts and moderation. Delivered and released to both stores.",
    milestones: [
      {
        title: "M1 - Foundation, Auth & Profiles",
        description:
          "The Next.js backend and the Flutter app shell: accounts, creator and viewer profiles, follows, and the data model the streaming layer is built on. Delivered.",
        from: d("2026-02-01"),
        to: d("2026-02-25"),
        done: 8,
        tasks: [
          ["axit", "Design the user, channel and stream data model", "Viewers, creators, channels, sessions and the stream history kept per channel.", "high"],
          ["manoj", "Build the Next.js API and session service", "Accounts, tokens and the session lifecycle every client depends on.", "high"],
          ["kruti", "Scaffold the Flutter app and design system", "One dark-first component set shared by the viewer and broadcaster surfaces.", "high"],
          ["vivek", "Build phone and social sign-in", "OTP and social providers with a single account identity behind both.", "high"],
          ["vivek", "Build creator and viewer profiles", "Avatar, bio, links and the channel a creator broadcasts on.", "high"],
          ["manoj", "Build the follow and follower-count service", "Follows written once and counted without a scan.", "medium"],
          ["navneet", "Set up the environments and CI/CD", "Build, test and deploy on merge, with rollback.", "medium"],
          ["neha", "Write the API contract tests", "Every endpoint asserted before the app is built against it.", "medium"],
        ],
      },
      {
        title: "M2 - Live Streaming Core",
        description:
          "The part that has to be right: RTMP and WebRTC ingest, transcoding to adaptive bitrates, low-latency HLS playback in the Flutter app, and graceful recovery when a broadcaster drops. Delivered.",
        from: d("2026-02-26"),
        to: d("2026-03-25"),
        done: 9,
        tasks: [
          ["ankit", "Build the RTMP and WebRTC ingest service", "One ingest path whichever protocol the broadcaster uses.", "high"],
          ["ankit", "Build the transcoding ladder and adaptive bitrates", "One upload, several renditions, chosen by the viewer connection.", "high"],
          ["ankit", "Build low-latency HLS playback delivery", "Glass-to-glass latency kept inside a few seconds.", "high"],
          ["vivek", "Build the Flutter broadcaster screen", "Camera, mic, front and back switch, beauty filter and a go-live check.", "high"],
          ["vivek", "Build the Flutter viewer player", "Player, quality selector and a reconnect that does not lose the stream.", "high"],
          ["ankit", "Handle broadcaster disconnect and stream resume", "A dropped connection resumes into the same session, not a new one.", "high"],
          ["manoj", "Build stream start, stop and viewer-count tracking", "Live concurrency counted accurately without hammering the database.", "high"],
          ["navneet", "Set up the CDN and edge delivery", "Playback served near the viewer rather than from origin.", "high"],
          ["neha", "Test playback across networks and devices", "3G, 4G, wifi and the real Android device spread.", "high"],
        ],
      },
      {
        title: "M3 - Chat, Gifts & Wallet",
        description:
          "What makes a stream social and pays for it: realtime chat that holds up at scale, animated gifts, the coin wallet, in-app purchases and creator earnings. Delivered.",
        from: d("2026-03-26"),
        to: d("2026-04-20"),
        done: 9,
        tasks: [
          ["ankit", "Build the realtime chat service", "WebSocket fan-out that stays responsive in a busy room.", "high"],
          ["vivek", "Build the chat UI with reactions and mentions", "Readable over video, with tap-to-mention.", "high"],
          ["ankit", "Add chat rate limiting and spam control", "One user cannot flood a room.", "high"],
          ["kruti", "Build the animated gift overlay", "Gift animations layered over the player without dropping frames.", "high"],
          ["manoj", "Build the coin wallet and gift ledger", "Every coin bought, spent and earned recorded and reconcilable.", "high"],
          ["priyank", "Integrate in-app purchases for coin packs", "Receipts verified server-side before coins are granted.", "high"],
          ["manoj", "Build creator earnings and payout runs", "Gifts converted to earnings with a statement per creator.", "high"],
          ["vivek", "Build the wallet, gift shop and earnings screens", "Buy, send and withdraw in one place.", "medium"],
          ["neha", "Test the wallet and gift arithmetic", "Purchase, gift, refund and payout paths asserted end to end.", "high"],
        ],
      },
      {
        title: "M4 - Discovery, Follows & Notifications",
        description:
          "Getting viewers to the right stream: a live feed ranked by what is worth watching, categories and search, follow notifications, and the push that tells a follower a creator has gone live. Delivered.",
        from: d("2026-04-21"),
        to: d("2026-05-10"),
        done: 7,
        tasks: [
          ["manoj", "Build the live feed ranking service", "Live now, ranked by viewers, recency and affinity.", "high"],
          ["vivek", "Build the home feed and category browse", "Live thumbnails with viewer counts.", "high"],
          ["manoj", "Build creator and stream search", "Name, handle and category search.", "medium"],
          ["kruti", "Build go-live push notifications", "Followers told the moment a creator starts.", "high"],
          ["vivek", "Build the following tab and notification centre", "Everything a viewer follows, in one place.", "medium"],
          ["ankit", "Add feed and watch-time analytics", "What gets watched, and for how long.", "medium"],
          ["neha", "Test notification delivery and feed freshness", "A live stream must appear promptly, every time.", "medium"],
        ],
      },
      {
        title: "M5 - Moderation, Admin Console & Store Release",
        description:
          "What a live platform cannot ship without: reporting, bans and stream takedown, the Next.js moderation console, and both store submissions. Delivered and released.",
        from: d("2026-05-11"),
        to: d("2026-05-31"),
        done: 7,
        tasks: [
          ["vivek", "Build in-app reporting for streams, chat and users", "One tap to report, with the context attached.", "high"],
          ["kinjal", "Build the Next.js moderation console", "Report queue, live stream preview and takedown in one screen.", "high"],
          ["kinjal", "Build bans, mutes and stream takedown", "Acting on a live stream within seconds, with an audit trail.", "high"],
          ["axit", "Build the creator verification and payout approval flow", "Identity and bank details checked before a payout runs.", "high"],
          ["navneet", "Set up production monitoring and stream health alerts", "Ingest failures and playback errors page someone.", "high"],
          ["neha", "Run device-matrix testing on the Flutter app", "Broadcast and playback on the real device spread.", "high"],
          ["neha", "Prepare and submit both store listings", "Live-content review requirements addressed up front.", "high"],
        ],
      },
    ],
  },
  {
    name: "Mokaala",
    client: "Mokaala Live Events",
    password: "mokaala2026",
    target: 45,
    start: d("2026-07-10"),
    end: d("2026-11-09"),
    description:
      "A concert booking app: a Flutter app where people find concerts and book seats, and a Next.js backend and organiser console behind it. Event and venue catalogue, artist pages, interactive seat maps, held seats with an expiry, payments, QR tickets and entry scanning at the gate. Four-month build.",
    milestones: [
      {
        title: "M1 - Foundation, Events & Venue Catalogue",
        description:
          "The Next.js backend and the data everything else reads: events, venues, artists, ticket tiers and seat maps, with the Flutter app shell and accounts on top.",
        from: d("2026-07-10"),
        to: d("2026-08-05"),
        done: 9,
        tasks: [
          ["axit", "Design the event, venue, seat and ticket data model", "Events, shows, venue sections, seats, tiers and the inventory held against each.", "high"],
          ["manoj", "Build the Next.js events and catalogue API", "Events, shows and availability read by the app and the console.", "high"],
          ["kruti", "Scaffold the Flutter app and design system", "Shared theme, typography and components used across every screen.", "high"],
          ["vivek", "Build sign-up, OTP login and the attendee profile", "Phone verification with a saved profile and past bookings.", "high"],
          ["axit", "Build the venue and seat-map data format", "Sections, rows and seats stored as data so a new venue needs no code.", "high"],
          ["manoj", "Build the ticket tier and pricing model", "General, silver, gold and VIP with per-tier inventory and price.", "high"],
          ["kinjal", "Build the venue and seat-map import tool", "Operations load a venue layout without an engineer.", "medium"],
          ["navneet", "Set up the environments and CI/CD", "Build, test and deploy on merge with rollback.", "medium"],
          ["neha", "Write the catalogue API contract tests", "Every endpoint asserted before the app depends on it.", "medium"],
        ],
      },
      {
        title: "M2 - Discovery, Artist Pages & Search",
        description:
          "How someone finds a concert worth going to: a browsable home feed, city and date filters, artist and venue pages, search, and the follow that tells a fan when their artist announces a show.",
        from: d("2026-08-06"),
        to: d("2026-09-01"),
        done: 9,
        tasks: [
          ["vivek", "Build the home feed with featured and upcoming concerts", "Hero carousel, trending and near-you sections.", "high"],
          ["manoj", "Build event search and filtering", "By city, date range, genre, artist and price band.", "high"],
          ["vivek", "Build the city and date filter sheet", "Filters that survive navigation and can be cleared in one tap.", "medium"],
          ["vivek", "Build the artist page", "Bio, gallery, upcoming shows and a follow button.", "high"],
          ["vivek", "Build the venue page with directions", "Layout, facilities and a map handoff for directions.", "medium"],
          ["vivek", "Build the event detail page", "Line-up, timing, tiers, price range and the book action.", "high"],
          ["manoj", "Build the artist follow and announcement service", "Followers told the moment a new show goes on sale.", "high"],
          ["kruti", "Build push notifications for on-sale and reminders", "On-sale alerts, and a reminder the day before the show.", "medium"],
          ["neha", "Test discovery across empty, sparse and busy catalogues", "The feed must read well with three events or three hundred.", "medium"],
        ],
      },
      {
        title: "M3 - Seat Selection, Booking & Holds",
        description:
          "The part that has to be exactly right: an interactive seat map, a seat hold with a visible timer, and booking logic that can never sell the same seat twice - including when two people tap at the same instant.",
        from: d("2026-09-02"),
        to: d("2026-09-30"),
        done: 0,
        tasks: [
          ["vivek", "Build the interactive seat map in Flutter", "Pan, zoom and select on a large venue without dropping frames.", "high"],
          ["ankit", "Build live seat availability streaming", "Seats grey out as other people take them, without a refresh.", "high"],
          ["manoj", "Build the seat hold service with expiry", "A held seat is reserved for a few minutes, then released automatically.", "high"],
          ["manoj", "Make seat allocation atomic under concurrency", "Two simultaneous bookings for one seat: exactly one wins.", "high"],
          ["vivek", "Build the hold countdown and expiry handling", "The attendee always knows how long they have left.", "high"],
          ["manoj", "Build general-admission quantity booking", "Standing sections booked by count rather than by seat.", "medium"],
          ["axit", "Enforce per-booking ticket limits", "Anti-scalping caps applied per event and per account.", "high"],
          ["neha", "Load-test concurrent booking on a popular on-sale", "The moment tickets drop is the only moment that matters.", "high"],
        ],
      },
      {
        title: "M4 - Payments, Tickets & Entry Scanning",
        description:
          "From payment to the gate: checkout and refunds, the QR ticket in the wallet, transfers to a friend, and the scanner app that admits people at the venue - including when the network there is bad.",
        from: d("2026-10-01"),
        to: d("2026-10-25"),
        done: 0,
        tasks: [
          ["priyank", "Integrate the payment gateway", "Cards, UPI and wallet, captured only once seats are confirmed.", "high"],
          ["manoj", "Release held seats on payment failure or timeout", "A failed payment must never leave a seat stranded.", "high"],
          ["vivek", "Build the QR ticket and in-app wallet", "One scannable ticket per seat, saved offline.", "high"],
          ["manoj", "Build signed, single-use QR ticket codes", "A screenshot of someone else's ticket cannot get anyone in.", "high"],
          ["vivek", "Build ticket transfer to another attendee", "Transferred tickets re-issue the code and void the old one.", "medium"],
          ["kruti", "Build the entry scanner mode for staff", "Scan, admit and reject, with a running admitted count.", "high"],
          ["ankit", "Add offline scanning with later sync", "Venue wifi fails; the gate must not.", "high"],
          ["manoj", "Build cancellations and the refund policy engine", "Refund windows and fees applied per event policy.", "high"],
        ],
      },
      {
        title: "M5 - Organiser Console & Store Release",
        description:
          "The Next.js console an event organiser actually runs their show from - listings, inventory, sales and settlement - and getting the Flutter app through both store reviews.",
        from: d("2026-10-26"),
        to: d("2026-11-09"),
        done: 0,
        tasks: [
          ["kinjal", "Build the organiser event and show management console", "Create a show, set tiers, open and close sales.", "high"],
          ["kinjal", "Build the live sales and inventory dashboard", "Sold, held and remaining per tier, in real time.", "high"],
          ["kinjal", "Build the attendee list and check-in report", "Who booked, who turned up, exportable after the show.", "medium"],
          ["axit", "Build organiser settlement and payout runs", "Gross sales less fees and refunds, with a statement per show.", "high"],
          ["neha", "Run device-matrix testing on the Flutter app", "Seat map and scanner on the real device spread.", "high"],
          ["neha", "Prepare and submit both store listings", "Ticketing review requirements addressed up front.", "high"],
        ],
      },
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
// SEED_ONLY="Ananta,Hkili" seeds just those, leaving every other project -
// including the ones this script owns - exactly as it found them.
const only = (process.env.SEED_ONLY ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const selected = only.length
  ? PROJECTS.filter((p) => only.includes(p.name))
  : PROJECTS;

if (only.length && selected.length !== only.length) {
  const known = PROJECTS.map((p) => p.name).join(", ");
  console.error(`SEED_ONLY did not match. Known projects: ${known}`);
  process.exit(1);
}

const names = selected.map((p) => p.name);

// Replace only the selected projects; everything else is untouched.
const existing = await projects.find({ name: { $in: names } }).toArray();
if (existing.length) {
  const ids = existing.map((p) => p._id);
  await Promise.all([
    milestones.deleteMany({ project: { $in: ids } }),
    tasks.deleteMany({ project: { $in: ids } }),
    projects.deleteMany({ _id: { $in: ids } }),
  ]);
  console.log(`Removed ${existing.length} previously seeded project(s).`);
}

await developers.createIndex(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $gt: "" } } }
);

const devPasswordHash = await bcrypt.hash(DEV_PASSWORD, 10);
const devIds = new Map();
let devsCreated = 0;

for (const [key, d0] of Object.entries(TEAM)) {
  const email = emailOf(key);
  const found = await developers.findOne({ email }, { projection: { _id: 1 } });
  if (found) {
    devIds.set(key, found._id);
    continue;
  }
  const { insertedId } = await developers.insertOne({
    name: d0.name,
    email,
    role: d0.role,
    skills: d0.skills,
    color: d0.color,
    active: true,
    passwordHash: devPasswordHash,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });
  devIds.set(key, insertedId);
  devsCreated += 1;
}

const DAY = 86400000;

/** `count` dates spread evenly across [from, to], inclusive. */
function spread(count, from, to) {
  if (count <= 0) return [];
  if (count === 1) return [new Date(from.getTime())];
  const step = (to.getTime() - from.getTime()) / (count - 1);
  return Array.from(
    { length: count },
    (_, i) => new Date(from.getTime() + Math.round(i * step))
  );
}

/**
 * Due dates for one milestone: the `done` tasks land before today and the rest
 * on or after it, so the completed share is exactly what the project declares
 * and nothing dated today or later can ever read as finished.
 */
function dueDates(count, done, from, to) {
  const lastPast = new Date(Math.min(to.getTime(), TODAY.getTime() - DAY));
  const firstFuture = new Date(Math.max(from.getTime(), TODAY.getTime()));
  return [
    ...spread(done, from, lastPast),
    ...spread(count - done, firstFuture, to),
  ];
}

const summary = [];

for (const project of selected) {
  const { insertedId: projectId } = await projects.insertOne({
    // Position on the home page; the NOVA programme sits at 0.
    order: PROJECTS.indexOf(project) + 1,
    name: project.name,
    client: project.client,
    description: project.description,
    status: project.status ?? "active",
    startDate: project.start,
    endDate: project.end,
    accessPasswordHash: await bcrypt.hash(project.password, 10),
    visible: true,
    createdAt: now,
    updatedAt: now,
  });

  let total = 0;
  let doneCount = 0;
  let inProgressCount = 0;

  for (const [order, m] of project.milestones.entries()) {
    const dates = dueDates(m.tasks.length, m.done, m.from, m.to);
    const horizon = new Date(TODAY.getTime() + IN_FLIGHT_DAYS * DAY);

    const inFlight = new Set(
      dates
        .map((due, i) => [i, due])
        .filter(([, due]) => due >= TODAY && due <= horizon)
        .sort((a, b) => a[1] - b[1])
        .slice(0, MAX_IN_FLIGHT)
        .map(([i]) => i)
    );

    const statuses = dates.map((due, i) =>
      due < TODAY ? "done" : inFlight.has(i) ? "in-progress" : "todo"
    );

    const milestoneStatus = statuses.every((s) => s === "done")
      ? "completed"
      : statuses.some((s) => s !== "todo")
        ? "in-progress"
        : "pending";

    const team = [...new Set(m.tasks.map(([key]) => key))];

    const { insertedId: milestoneId } = await milestones.insertOne({
      project: projectId,
      title: m.title,
      description: m.description,
      status: milestoneStatus,
      dueDate: m.to,
      order,
      developers: team.map((key) => devIds.get(key)),
      createdAt: now,
      updatedAt: now,
    });

    await tasks.insertMany(
      m.tasks.map(([key, title, description, priority], i) => {
        total += 1;
        if (statuses[i] === "done") doneCount += 1;
        if (statuses[i] === "in-progress") inProgressCount += 1;
        return {
          project: projectId,
          milestone: milestoneId,
          developer: devIds.get(key),
          title,
          description,
          status: statuses[i],
          priority,
          dueDate: dates[i],
          order: i,
          createdAt: now,
          updatedAt: now,
        };
      })
    );
  }

  summary.push({
    name: project.name,
    password: project.password,
    milestones: project.milestones.length,
    total,
    doneCount,
    inProgressCount,
    pct: Math.round((doneCount / total) * 100),
    target: project.target,
    start: project.start,
    end: project.end,
  });
}

// ---------------------------------------------------------------- summary
const iso = (x) => x.toISOString().slice(0, 10);
const months = (a, b) =>
  Math.round((b.getTime() - a.getTime()) / (30.44 * DAY));

console.log("");
console.log(
  `Seeded ${summary.length} projects (developers reused: ${
    Object.keys(TEAM).length - devsCreated
  }, created: ${devsCreated})`
);
console.log("");
for (const s of summary) {
  const flag = s.pct === s.target ? "" : `  (target ${s.target}%)`;
  console.log(`  ${s.name}`);
  console.log(
    `    ${iso(s.start)} -> ${iso(s.end)}  (${months(s.start, s.end)} months)`
  );
  console.log(
    `    ${s.milestones} milestones - ${s.total} tasks - ${s.doneCount} done, ${s.inProgressCount} in progress - ${s.pct}%${flag}`
  );
  console.log(`    client password: ${s.password}`);
  console.log("");
}
console.log(`Developer logins are unchanged: <name>@${EMAIL_DOMAIN}`);
console.log(`Nothing dated ${iso(TODAY)} or later is seeded as complete.`);

await mongoose.disconnect();
