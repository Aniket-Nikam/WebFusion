"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  IndianRupee,
  Leaf,
  MapPin,
  PackageCheck,
  QrCode,
  Recycle,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { analyseNeed, formatDistance, getMatchScore } from "./logic";
import { useDialogFocus } from "./modal-a11y";
import { currentUser, ownerFor, resources, users } from "./data";
import type {
  AppNotification,
  Category,
  Exchange,
  ExchangeStage,
  CommunityRequest,
  Dispute,
  NeedAnalysis,
  PlatformFeeConfig,
  UserPreferences,
  Resource,
} from "./types";

const stages: ExchangeStage[] = [
  "Requested",
  "Approved",
  "Pickup scheduled",
  "In use",
  "Return due",
  "Returned",
  "Deposit settled",
];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function TinyResource({ resource }: { resource: Resource }) {
  return (
    <div className="tiny-resource">
      <div className="tiny-image">
        <img src={resource.image} alt="" />
      </div>
      <div>
        <b>{resource.title}</b>
        <span>
          {resource.location} · {formatDistance(resource.distance)}
        </span>
      </div>
      <strong>{resource.donation ? "Free" : `₹${resource.charge}`}</strong>
    </div>
  );
}

export function AiFinder({
  onRequest,
  onCommunityRequest,
  initialQuery = "I need to make a reel for my club event tomorrow.",
}: {
  onRequest: (items: Resource[]) => void;
  onCommunityRequest: (prefill: string) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(
    initialQuery || "I need to make a reel for my club event tomorrow.",
  );
  const [analysis, setAnalysis] = useState<NeedAnalysis | null>(null);
  const [phase, setPhase] = useState("");
  const [usedFallback, setUsedFallback] = useState(false);
  const run = async () => {
    if (!query.trim()) return;
    setAnalysis(null);
    setUsedFallback(false);
    setPhase("Understanding your requirement…");
    await delay(650);
    setPhase("Building the best campus setup…");
    let result: NeedAnalysis | null = null;
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (response.ok) result = (await response.json()) as NeedAnalysis;
    } catch {}
    if (!result) {
      result = analyseNeed(query);
      setUsedFallback(true);
    }
    await delay(550);
    setAnalysis(result);
    setPhase("");
  };
  const bundle = useMemo(() => {
    if (!analysis) return [];
    const wanted = analysis.keywords;
    const reel = /video content/.test(analysis.intent);
    const electronics = /electronics circuit/.test(analysis.intent);
    if (reel)
      return resources.filter((r) => ["r1", "r3", "r4", "r5"].includes(r.id));
    if (electronics)
      return resources.filter((r) => ["r9", "r10", "r8"].includes(r.id));
    return resources
      .filter(
        (r) =>
          analysis.categories.includes(r.category) ||
          r.tags.some((tag) =>
            wanted.some((k) => tag.toLowerCase().includes(k.toLowerCase())),
          ),
      )
      .slice(0, 4);
  }, [analysis]);
  const total = bundle.reduce((sum, r) => sum + r.charge, 0),
    deposit = bundle.reduce((sum, r) => sum + r.deposit, 0);
  const alternatives = useMemo(() => {
    if (!analysis) return [];
    return resources
      .filter((r) => !bundle.some((b) => b.id === r.id))
      .map((r) => ({
        resource: r,
        score: getMatchScore(r, ownerFor(r), false),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [analysis, bundle]);
  return (
    <section className="feature-page ai-page">
      <div className="feature-hero">
        <span className="section-label">
          <Sparkles /> SIGNATURE FEATURE
        </span>
        <h1>
          Describe the outcome.
          <br />
          <em>We build the setup.</em>
        </h1>
        <p>
          Natural-language discovery translates a real campus need into an
          available, trusted bundle.
        </p>
      </div>
      <div className="ai-workbench">
        <div className="ai-compose">
          <span className="ai-compose-icon">
            <Bot aria-hidden="true" />
          </span>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tell us what you need to achieve…"
          />
          <button onClick={run} disabled={!!phase}>
            {phase || "Build my setup"}
            <ArrowRight />
          </button>
        </div>
        <div className="example-row">
          {[
            "Film a club reel tomorrow",
            "Prototype an IoT circuit",
            "Calculator for tomorrow’s exam",
            "Guitar for tonight",
          ].map((text) => (
            <button key={text} onClick={() => setQuery(text)}>
              {text}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {phase && (
          <motion.div
            className="ai-loading"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="loader-orbit">
              <Bot />
            </div>
            <h2>{phase}</h2>
            <p>Checking 16 resources, availability and member trust.</p>
          </motion.div>
        )}
        {analysis && (
          <motion.div
            className="analysis-grid"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <article className="intent-card">
              <div className="intent-top">
                <span>
                  <Bot /> NEED INTERPRETATION
                </span>
                <b className={analysis.urgency === "High" ? "high" : ""}>
                  {analysis.urgency} urgency
                </b>
              </div>
              <h2>{analysis.intent}</h2>
              <p>{analysis.explanation}</p>
              <div className="need-columns">
                <div>
                  <small>REQUIRED</small>
                  {analysis.requiredItems.map((item) => (
                    <span key={item}>
                      <Check />
                      {item}
                    </span>
                  ))}
                </div>
                <div>
                  <small>OPTIONAL</small>
                  {analysis.optionalItems.map((item) => (
                    <span key={item}>
                      <span>+</span>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <footer>
                {usedFallback ? (
                  <>
                    <RotateCcw /> Offline fallback produced this result safely.
                  </>
                ) : (
                  <>
                    <Sparkles /> A clear setup built around your need.
                  </>
                )}
              </footer>
            </article>
            <article className="bundle-card">
              <div className="bundle-heading">
                <div>
                  <span>SMART BUNDLE</span>
                  <h2>
                    {/video/.test(analysis.intent)
                      ? "Club Reel Kit"
                      : /electronics/.test(analysis.intent)
                        ? "IoT Prototype Kit"
                        : "Campus Need Kit"}
                  </h2>
                </div>
                <strong>
                  {bundle.every((r) => r.availableNow)
                    ? "ALL AVAILABLE"
                    : "PARTIAL AVAILABILITY"}
                </strong>
              </div>
              <div className="bundle-items">
                {bundle.map((r) => (
                  <TinyResource key={r.id} resource={r} />
                ))}
              </div>
              <div className="bundle-summary">
                <div>
                  <span>Borrowing total</span>
                  <b>₹{total} / day</b>
                </div>
                <div>
                  <span>Refundable deposit</span>
                  <b>₹{deposit}</b>
                </div>
                <div>
                  <span>Farthest pickup</span>
                  <b>
                    {bundle.length
                      ? formatDistance(
                          Math.max(...bundle.map((r) => r.distance)),
                        )
                      : "—"}
                  </b>
                </div>
              </div>
              <button
                className="primary-wide"
                onClick={() => onRequest(bundle)}
                disabled={!bundle.length}
              >
                Request entire bundle <ArrowRight />
              </button>
            </article>
            <article className="matching-alternatives">
              <span className="section-label">
                SMART MATCHING &amp; ALTERNATIVES
              </span>
              <h3>Keep a backup plan.</h3>
              {alternatives.map(({ resource, score }) => (
                <div className="alternative-row" key={resource.id}>
                  <div>
                    <b>{resource.title}</b>
                    <span>
                      {resource.location} · ₹{resource.charge}/day
                    </span>
                  </div>
                  <strong>{score}% match</strong>
                </div>
              ))}
              <button
                className="community-cta"
                onClick={() => onCommunityRequest(query)}
              >
                Post a community request <ArrowRight size={16} />
              </button>
            </article>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function RequestWizard({
  items,
  onClose,
  onComplete,
  onViewExchanges,
  feeConfig,
}: {
  items: Resource[];
  onClose: () => void;
  onComplete: (exchange: Exchange) => void;
  onViewExchanges?: () => void;
  feeConfig: PlatformFeeConfig;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const [step, setStep] = useState(0);
  const [start, setStart] = useState("2026-08-28");
  const [end, setEnd] = useState("2026-08-29");
  const [pickup, setPickup] = useState(
    items[0]?.pickupOptions[0] || "Main Building meetup",
  );
  const [accepted, setAccepted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<Exchange["paymentMethod"]>("UPI / QR");
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success"
  >("idle");
  const [upiId, setUpiId] = useState("ananya@campus");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const total = items.reduce((s, r) => s + r.charge, 0),
    deposit = items.reduce((s, r) => s + r.deposit, 0),
    platformFee =
      feeConfig.enabled && total > 0
        ? Math.max(
            feeConfig.minFee,
            Math.round((total * feeConfig.percentRate) / 100),
          )
        : 0,
    owner = items[0] ? ownerFor(items[0]) : users[0];
  const send = () => {
    const createdAt = new Date().toISOString();
    const seed = `${items.map((item) => item.id).join("-")}-${start}-${end}-${createdAt}`;
    const numericCode = Array.from(seed).reduce(
      (score, character) => (score * 31 + character.charCodeAt(0)) % 9000,
      1000,
    );
    const exchange: Exchange = {
      id: `CC-${numericCode.toString().padStart(4, "0")}`,
      resourceIds: items.map((r) => r.id),
      ownerId: owner.id,
      borrowerId: "me",
      startDate: start,
      endDate: end,
      pickup,
      stage: "Requested",
      createdAt,
      pickupCode: `CC-${numericCode.toString().padStart(4, "0")}`,
      returnCode: `RT-${(((numericCode * 7) % 9000) + 1000).toString().padStart(4, "0")}`,
      conditionBefore: {
        "Body intact": true,
        "Primary function tested": true,
        "Accessories included": true,
        "No visible damage": true,
      },
      platformFee,
      paymentMethod,
      paymentStatus: "Paid",
      depositStatus: "Held",
    };
    onComplete(exchange);
    setSuccess(true);
  };
  const simulatePayment = () => {
    setPaymentStatus("processing");
    window.setTimeout(() => {
      setPaymentStatus("success");
      setStep(5);
    }, 700);
  };
  const labels = [
    "Dates",
    "Pickup",
    "Conditions",
    "Charges",
    "Payment",
    "Send",
  ];
  return (
    <div className="modal-backdrop">
      <motion.div
        ref={dialogRef}
        className="wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-wizard-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close request form"
        >
          <X />
        </button>
        {success ? (
          <div className="success-state">
            <div>
              <CheckCircle2 />
            </div>
            <span>REQUEST SENT</span>
            <h2>Request sent to {owner.name.split(" ")[0]}.</h2>
            <p>
              Estimated response: ~{owner.responseMinutes} minutes. It is now
              saved in My Exchanges.
            </p>
            <button onClick={onViewExchanges || onClose}>
              View my exchange <ArrowRight />
            </button>
          </div>
        ) : (
          <>
            <div className="wizard-head">
              <span>REQUEST {items.length > 1 ? "BUNDLE" : "RESOURCE"}</span>
              <h2 id="request-wizard-title">
                {items.length > 1
                  ? `${items.length}-item campus setup`
                  : items[0]?.title}
              </h2>
            </div>
            <div className="wizard-steps">
              {labels.map((label, i) => (
                <div key={label} className={i <= step ? "active" : ""}>
                  <span>{i < step ? <Check /> : i + 1}</span>
                  <b>{label}</b>
                </div>
              ))}
            </div>
            <div className="wizard-body">
              {step === 0 && (
                <div className="form-step">
                  <h3>When do you need it?</h3>
                  <p>
                    Eligibility updates immediately against mock availability.
                  </p>
                  <div className="date-grid">
                    <label>
                      START DATE
                      <input
                        type="date"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                      />
                    </label>
                    <label>
                      RETURN DATE
                      <input
                        type="date"
                        min={start}
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="availability-ok">
                    <CheckCircle2 />
                    <div>
                      <b>All items available</b>
                      <span>for the selected duration</span>
                    </div>
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="form-step">
                  <h3>Choose a pickup point</h3>
                  <p>Meet inside campus at a public, familiar location.</p>
                  {[...new Set(items.flatMap((r) => r.pickupOptions))].map(
                    (option) => (
                      <label
                        className={`option-card ${pickup === option ? "selected" : ""}`}
                        key={option}
                      >
                        <input
                          type="radio"
                          checked={pickup === option}
                          onChange={() => setPickup(option)}
                        />
                        <MapPin />
                        <div>
                          <b>{option}</b>
                          <span>Verified campus pickup point</span>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              )}
              {step === 2 && (
                <div className="form-step">
                  <h3>Borrow responsibly</h3>
                  <p>
                    These conditions protect both students and keep the exchange
                    clear.
                  </p>
                  <div className="conditions-list">
                    {[...new Set(items.flatMap((r) => r.conditions))].map(
                      (item) => (
                        <span key={item}>
                          <ShieldCheck />
                          {item}
                        </span>
                      ),
                    )}
                  </div>
                  <label className="accept-row">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <span>
                      I understand the conditions and accept responsibility for
                      the resources.
                    </span>
                  </label>
                </div>
              )}
              {step === 3 && (
                <div className="form-step">
                  <h3>Review charges</h3>
                  <div className="charge-sheet">
                    {items.map((r) => (
                      <div key={r.id}>
                        <span>{r.title}</span>
                        <b>₹{r.charge}/day</b>
                      </div>
                    ))}
                    <div className="charge-total">
                      <span>Total borrowing cost</span>
                      <b>₹{total}/day</b>
                    </div>
                    <div>
                      <span>Campus Circular platform fee (5%)</span>
                      <b>₹{platformFee}</b>
                    </div>
                    <div className="charge-total">
                      <span>Total due per day</span>
                      <b>₹{total + platformFee}/day</b>
                    </div>
                    <div>
                      <span>Refundable deposit</span>
                      <b>₹{deposit}</b>
                    </div>
                  </div>
                  <p className="deposit-note">
                    <CircleDollarSign /> The deposit is simulated and released
                    after condition-confirmed return.
                  </p>
                  <p className="payment-demo-note">
                    Demo checkout · no real payment gateway is connected.
                  </p>
                </div>
              )}
              {step === 4 && (
                <div className="form-step payment-step">
                  <h3>Choose how to pay</h3>
                  <p>Demo payment only — no money leaves your account.</p>
                  <div className="payment-methods">
                    {(
                      ["UPI / QR", "Credit card", "Cash at pickup"] as const
                    ).map((method) => (
                      <button
                        key={method}
                        className={paymentMethod === method ? "selected" : ""}
                        onClick={() => setPaymentMethod(method)}
                      >
                        {method === "UPI / QR" ? (
                          <QrCode />
                        ) : method === "Credit card" ? (
                          <CircleDollarSign />
                        ) : (
                          <PackageCheck />
                        )}
                        <b>{method}</b>
                        <span>
                          {method === "UPI / QR"
                            ? "Scan a demo QR"
                            : method === "Credit card"
                              ? "Use test card details"
                              : "Settle at handoff"}
                        </span>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === "UPI / QR" && (
                    <div className="payment-detail">
                      <div className="demo-qr">
                        <QrCode />
                        <span>DEMO QR</span>
                      </div>
                      <label>
                        UPI ID
                        <input
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="name@upi"
                        />
                      </label>
                    </div>
                  )}
                  {paymentMethod === "Credit card" && (
                    <div className="payment-detail card-fields">
                      <label>
                        CARD NUMBER
                        <input
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                        />
                      </label>
                      <div>
                        <label>
                          EXPIRY
                          <input
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM / YY"
                          />
                        </label>
                        <label>
                          CVV
                          <input
                            inputMode="numeric"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                          />
                        </label>
                      </div>
                      <small>
                        Use any test values — this is a local simulation.
                      </small>
                    </div>
                  )}
                  {paymentMethod === "Cash at pickup" && (
                    <div className="cash-detail">
                      <PackageCheck />
                      <div>
                        <b>Pay at verified handoff</b>
                        <span>
                          We’ll mark the simulated payment as pending until
                          pickup is confirmed.
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="payment-summary">
                    <span>Borrowing + service fee</span>
                    <b>₹{total + platformFee}</b>
                    <span>Refundable deposit</span>
                    <b>₹{deposit}</b>
                    <strong>
                      Total simulated payment · ₹{total + platformFee + deposit}
                    </strong>
                  </div>
                  {paymentStatus === "processing" && (
                    <p className="payment-status">
                      Processing secure demo payment…
                    </p>
                  )}
                </div>
              )}
              {step === 5 && (
                <div className="form-step final-review">
                  <PackageCheck />
                  <h3>Ready to send</h3>
                  <p>
                    {items.length} item{items.length > 1 ? "s" : ""} · {start}{" "}
                    to {end}
                    <br />
                    {pickup}
                    <br />₹{total + platformFee}/day incl. ₹{platformFee}{" "}
                    platform fee + ₹{deposit} refundable
                  </p>
                </div>
              )}
            </div>
            <div className="wizard-footer">
              <button
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
              <button
                className="primary"
                disabled={
                  (step === 2 && !accepted) ||
                  !items.length ||
                  paymentStatus === "processing"
                }
                onClick={() =>
                  step === 4
                    ? simulatePayment()
                    : step === 5
                      ? send()
                      : setStep((s) => s + 1)
                }
              >
                {step === 4
                  ? paymentStatus === "processing"
                    ? "Processing…"
                    : `Pay ₹${total + platformFee + deposit}`
                  : step === 5
                    ? "Send request"
                    : "Continue"}
                <ArrowRight />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export function CompareTray({
  ids,
  catalog,
  onRemove,
  onClose,
  onRequest,
}: {
  ids: string[];
  catalog: Resource[];
  onRemove: (id: string) => void;
  onClose: () => void;
  onRequest: (items: Resource[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const closeCompare = () => {
    setExpanded(false);
    onClose();
  };
  const dialogRef = useDialogFocus<HTMLDivElement>(closeCompare, expanded);
  const items = ids
    .map((id) => catalog.find((r) => r.id === id)!)
    .filter(Boolean);
  if (!items.length) return null;
  return (
    <>
      <div className="compare-tray">
        <div>
          <b>Compare resources</b>
          <span>{items.length}/3 selected</span>
        </div>
        <div className="compare-pills">
          {items.map((r) => (
            <span key={r.id}>
              {r.title}
              <button onClick={() => onRemove(r.id)}>
                <X />
              </button>
            </span>
          ))}
        </div>
        <button onClick={() => setExpanded(true)} disabled={items.length < 2}>
          Compare now <ArrowRight />
        </button>
      </div>
      {expanded && (
        <div className="modal-backdrop">
          <motion.div
            ref={dialogRef}
            className="compare-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-title"
            tabIndex={-1}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              className="modal-close"
              onClick={closeCompare}
              aria-label="Close comparison"
            >
              <X />
            </button>
            <span className="section-label">SIDE-BY-SIDE</span>
            <h2 id="compare-title">Choose with confidence.</h2>
            <div className="compare-table">
              <div className="compare-row header">
                <span>Criteria</span>
                {items.map((r) => (
                  <b key={r.id}>{r.title}</b>
                ))}
              </div>
              {[
                [
                  "Match score",
                  (r: Resource) => `${getMatchScore(r, ownerFor(r))}%`,
                ],
                ["Distance", (r: Resource) => formatDistance(r.distance)],
                ["Charge", (r: Resource) => `₹${r.charge}/day`],
                ["Deposit", (r: Resource) => `₹${r.deposit}`],
                ["Condition", (r: Resource) => r.condition],
                ["Owner trust", (r: Resource) => `${ownerFor(r).trust}/100`],
                [
                  "Availability",
                  (r: Resource) => (r.availableNow ? "Now" : "Later"),
                ],
                ["Accessories", (r: Resource) => String(r.accessories.length)],
              ].map(([label, get]) => (
                <div className="compare-row" key={label as string}>
                  <span>{label as string}</span>
                  {items.map((r, i) => {
                    const values = items.map((x) =>
                      (get as (r: Resource) => string)(x),
                    );
                    const best =
                      label === "Distance" ||
                      label === "Charge" ||
                      label === "Deposit"
                        ? Math.min(
                            ...values.map((v) =>
                              parseInt(v.replace(/\D/g, "")),
                            ),
                          )
                        : Math.max(
                            ...values.map(
                              (v) => parseInt(v.replace(/\D/g, "")) || 0,
                            ),
                          );
                    const val = (get as (r: Resource) => string)(r);
                    return (
                      <b
                        key={r.id}
                        className={
                          (parseInt(val.replace(/\D/g, "")) || 0) === best
                            ? "best"
                            : ""
                        }
                      >
                        {val}
                        {i === 0 && false}
                      </b>
                    );
                  })}
                </div>
              ))}
            </div>
            <button
              className="primary-wide"
              onClick={() => onRequest([items[0]])}
            >
              Request best match <ArrowRight />
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}

export function ExchangesPage({
  exchanges,
  onAdvance,
  onSubmitDispute,
}: {
  exchanges: Exchange[];
  onAdvance: (
    exchange: Exchange,
    next: ExchangeStage,
    after?: Record<string, boolean>,
  ) => void;
  onSubmitDispute: (dispute: Dispute) => void;
}) {
  const [tab, setTab] = useState<"Borrowing" | "Lending" | "Completed">(
    "Borrowing",
  );
  const visible = exchanges.filter((e) =>
    tab === "Completed"
      ? e.stage === "Deposit settled"
      : tab === "Lending"
        ? e.ownerId === "me" && e.stage !== "Deposit settled"
        : e.borrowerId === "me" && e.stage !== "Deposit settled",
  );
  return (
    <section className="feature-page exchanges-page">
      <div className="feature-hero split">
        <div>
          <span className="section-label">COMPLETE LIFECYCLE</span>
          <h1>My exchanges.</h1>
        </div>
        <p>
          Requests don’t disappear after checkout. Track every handoff, return
          and deposit settlement.
        </p>
      </div>
      <div className="tabs">
        {(["Borrowing", "Lending", "Completed"] as const).map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            <span>
              {
                exchanges.filter((e) =>
                  t === "Completed"
                    ? e.stage === "Deposit settled"
                    : t === "Lending"
                      ? e.ownerId === "me"
                      : e.borrowerId === "me",
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      {visible.length ? (
        <div className="exchange-list">
          {visible.map((exchange) => (
            <ExchangeCard
              key={exchange.id}
              exchange={exchange}
              onAdvance={onAdvance}
              onSubmitDispute={onSubmitDispute}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Recycle />
          <h2>No {tab.toLowerCase()} exchanges yet.</h2>
          <p>Activity will appear here as soon as a request is created.</p>
        </div>
      )}
    </section>
  );
}
function ExchangeCard({
  exchange,
  onAdvance,
  onSubmitDispute,
}: {
  exchange: Exchange;
  onAdvance: (
    e: Exchange,
    n: ExchangeStage,
    a?: Record<string, boolean>,
  ) => void;
  onSubmitDispute: (dispute: Dispute) => void;
}) {
  const [idx] = [stages.indexOf(exchange.stage)];
  const item = resources.find((r) => r.id === exchange.resourceIds[0])!;
  const owner = users.find((u) => u.id === exchange.ownerId)!;
  const [showCondition, setShowCondition] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("Item condition changed");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>(
    exchange.conditionBefore,
  );
  const next = stages[Math.min(idx + 1, stages.length - 1)];
  const action =
    exchange.stage === "Requested"
      ? "Simulate owner approval"
      : exchange.stage === "Approved"
        ? "Schedule pickup"
        : exchange.stage === "Pickup scheduled"
          ? "Confirm QR handoff"
          : exchange.stage === "In use"
            ? "Mark return due"
            : exchange.stage === "Return due"
              ? "Start return check"
              : exchange.stage === "Returned"
                ? "Settle deposit"
                : "Completed";
  return (
    <article className="exchange-card">
      <div className="exchange-top">
        <div className="tiny-image">
          <img src={item.image} alt="" />
        </div>
        <div>
          <span>{exchange.id}</span>
          <h2>
            {exchange.resourceIds.length > 1
              ? `${exchange.resourceIds.length}-item campus bundle`
              : item.title}
          </h2>
          <p>
            with {owner.name} · {exchange.startDate} → {exchange.endDate}
          </p>
        </div>
        <b className="stage-pill">{exchange.stage}</b>
      </div>
      <div className="timeline">
        {stages.map((stage, i) => (
          <div key={stage} className={i <= idx ? "done" : ""}>
            <span>{i < idx ? <Check /> : i + 1}</span>
            <b>{stage}</b>
          </div>
        ))}
      </div>
      {["Approved", "Pickup scheduled"].includes(exchange.stage) && (
        <div className="handoff-token">
          <QrCode />
          <div>
            <span>PICKUP VERIFICATION</span>
            <b>{exchange.pickupCode}</b>
            <small>{exchange.pickup}</small>
          </div>
          <i>{exchange.pickupCode.slice(-2)}</i>
        </div>
      )}
      {showCondition && (
        <div className="condition-box">
          <div>
            <span>RETURN CONDITION CHECK</span>
            <b>Compare with pickup record</b>
          </div>
          {Object.entries(checks).map(([key, value]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={value}
                onChange={() => setChecks((c) => ({ ...c, [key]: !value }))}
              />
              <span>{key}</span>
              <b>{value ? "Matches" : "Changed"}</b>
            </label>
          ))}
          {Object.values(checks).some((v) => !v) && (
            <>
              <p>
                <AlertTriangle /> Condition discrepancy detected — submit
                evidence before settlement.
              </p>
              {!disputeSubmitted && (
                <button
                  className="dispute-open"
                  onClick={() => setShowDispute((value) => !value)}
                >
                  Open dispute form
                </button>
              )}
              {showDispute && !disputeSubmitted && (
                <div className="dispute-form">
                  <label>
                    REASON
                    <select
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                    >
                      <option>Item condition changed</option>
                      <option>Accessory missing</option>
                      <option>Return timing disagreement</option>
                    </select>
                  </label>
                  <label>
                    EVIDENCE / DETAILS
                    <textarea
                      value={disputeDetails}
                      onChange={(e) => setDisputeDetails(e.target.value)}
                      placeholder="Describe what changed and what evidence you have…"
                    />
                  </label>
                  <button
                    className="dispute-submit"
                    onClick={() => {
                      onSubmitDispute({
                        id: `DSP-${Date.now()}`,
                        exchangeId: exchange.id,
                        reporterId: currentUser.id,
                        reason: disputeReason,
                        details: disputeDetails,
                        claimedDepositDeduction: 100,
                        submittedAt: new Date().toISOString(),
                        status: "Open",
                      });
                      setDisputeSubmitted(true);
                      setShowDispute(false);
                    }}
                  >
                    Submit evidence &amp; open dispute
                  </button>
                </div>
              )}
              {disputeSubmitted && (
                <span className="dispute-confirmed">
                  Dispute submitted · evidence queued for admin review.
                </span>
              )}
            </>
          )}
          <button onClick={() => onAdvance(exchange, "Returned", checks)}>
            Confirm return condition
          </button>
        </div>
      )}
      <div className="exchange-footer">
        <div>
          <Clock3 />
          <span>NEXT ACTION</span>
          <b>{action}</b>
        </div>
        <button
          disabled={exchange.stage === "Deposit settled"}
          onClick={() =>
            exchange.stage === "Return due"
              ? setShowCondition(true)
              : onAdvance(exchange, next)
          }
        >
          {action}
          <ChevronRight />
        </button>
      </div>
    </article>
  );
}

export function ImpactPage({ exchanges }: { exchanges: Exchange[] }) {
  const settled = exchanges.filter((e) => e.stage === "Deposit settled").length;
  const active = exchanges.filter(
    (e) => !["Returned", "Deposit settled"].includes(e.stage),
  ).length;
  return (
    <section className="feature-page impact-page">
      <div className="feature-hero">
        <span className="section-label">
          <Leaf /> SIMULATED PROTOTYPE METRICS
        </span>
        <h1>
          Access creates
          <br />
          <em>measurable impact.</em>
        </h1>
        <p>
          Campus Circular turns idle resources into savings, utility and avoided
          consumption.
        </p>
      </div>
      <div className="impact-cards">
        <article className="impact-main">
          <span>CAMPUS CIRCULARITY SCORE</span>
          <div className="score-dial">
            <strong>{87 + Math.min(settled, 5)}</strong>
            <small>/100</small>
          </div>
          <p>
            Excellent momentum. Resource reuse is growing faster than new
            listings.
          </p>
          <div className="score-factors">
            <span>
              <i style={{ width: "92%" }} />
              Access efficiency
            </span>
            <span>
              <i style={{ width: "84%" }} />
              Return reliability
            </span>
            <span>
              <i style={{ width: "78%" }} />
              Category coverage
            </span>
          </div>
        </article>
        {[
          [IndianRupee, "₹12,480", "saved by students"],
          [Recycle, "48", "successful exchanges"],
          [Leaf, "23.4 kg", "estimated waste avoided"],
          [Users, String(34 + active), "resources idle nearby"],
        ].map(([Icon, value, label]) => (
          <article className="metric-card" key={label as string}>
            {typeof Icon !== "string" && <Icon />}
            <strong>{value as string}</strong>
            <span>{label as string}</span>
            <small>+{settled + 4}% this month</small>
          </article>
        ))}
      </div>
      <div className="impact-detail">
        <article>
          <div className="panel-title">
            <div>
              <span>MOST SHARED CATEGORIES</span>
              <h2>Where access wins.</h2>
            </div>
            <BarChart3 />
          </div>
          {[
            ["Cameras", 86],
            ["Electronics", 72],
            ["Books", 63],
            ["Computing", 54],
            ["Tools", 38],
          ].map(([label, value]) => (
            <div className="bar-row" key={label as string}>
              <span>{label as string}</span>
              <div>
                <i style={{ width: `${value}%` }} />
              </div>
              <b>{value}</b>
            </div>
          ))}
        </article>
        <article className="idle-card">
          <span>LIVE OPPORTUNITY</span>
          <h2>{34 + active} resources are idle within a 10-minute walk.</h2>
          <p>
            Activating just 20% could save students an estimated ₹8,200 this
            week.
          </p>
          <div className="orbit-number">
            {34 + active}
            <small>NEARBY</small>
          </div>
        </article>
      </div>
    </section>
  );
}

export function ProfilePage({
  activeRole = "student",
}: {
  activeRole?: "student" | "admin";
}) {
  const factors = [
    ["College identity verified", 20, 20],
    ["4.8 member rating", 20, 20],
    ["27 successful exchanges", 23, 25],
    ["96% on-time returns", 19, 20],
    ["No active disputes", 7, 7],
    ["Fast response record", 2, 8],
  ];
  return (
    <section className="feature-page profile-page">
      <div className="profile-hero">
        <div className="profile-identity">
          <div className="avatar huge">{currentUser.initials}</div>
          <div>
            <div className="profile-name-row">
              <h1>{currentUser.name}</h1>
              <span className="profile-badge">
                <BadgeCheck />
                {activeRole === "admin" ? "ADMIN" : "VERIFIED"}
              </span>
            </div>
            <p>
              {currentUser.department} · {currentUser.year}
              <br />
              Member since {currentUser.memberSince}
            </p>
          </div>
        </div>
        <div className="profile-stats">
          <div>
            <strong>{currentUser.rating}</strong>
            <span>rating</span>
          </div>
          <div>
            <strong>{currentUser.exchanges}</strong>
            <span>exchanges</span>
          </div>
          <div>
            <strong>{currentUser.onTime}%</strong>
            <span>on time</span>
          </div>
        </div>
      </div>
      <div className="passport-grid">
        <article className="trust-passport">
          <div className="passport-head">
            <div>
              <span>TRUST PASSPORT</span>
              <h2>Reliability, made legible.</h2>
            </div>
            <div className="passport-score">
              <strong>{currentUser.trust}</strong>
              <small>/100</small>
            </div>
          </div>
          <div className="trust-factors">
            {factors.map(([label, value, max]) => (
              <div key={label as string}>
                <span>
                  <CheckCircle2 />
                  {label as string}
                </span>
                <div>
                  <i
                    style={{ width: `${(Number(value) / Number(max)) * 100}%` }}
                  />
                </div>
                <b>+{value as number}</b>
              </div>
            ))}
          </div>
          <footer>
            <ShieldCheck />
            <p>
              <b>No active disputes</b>
              <span>
                Identity and exchange history verified on this device.
              </span>
            </p>
          </footer>
        </article>
        <article className="badge-panel">
          <span>TRUST BADGES</span>
          <h2>Earned through action.</h2>
          <div>
            {currentUser.badges.map((badge, i) => (
              <span key={badge}>
                <i>
                  {
                    [
                      <BadgeCheck key="a" />,
                      <Trophy key="b" />,
                      <Zap key="c" />,
                      <Leaf key="d" />,
                    ][i % 4]
                  }
                </i>
                <b>{badge}</b>
                <small>
                  {i === 0
                    ? "College identity confirmed"
                    : i === 1
                      ? "Consistent return history"
                      : i === 2
                        ? "Replies under 15 minutes"
                        : "Reduced campus consumption"}
                </small>
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export function SettingsModal({
  onClose,
  activeRole,
  onRoleChange,
  onOpenAdmin,
  feeConfig,
  onUpdateFeeConfig,
  preferences,
  onUpdatePreferences,
}: {
  onClose: () => void;
  activeRole: "student" | "admin";
  onRoleChange: (role: "student" | "admin") => void;
  onOpenAdmin: () => void;
  feeConfig: PlatformFeeConfig;
  onUpdateFeeConfig: (config: PlatformFeeConfig) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (preferences: UserPreferences) => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);

  return (
    <div className="notification-backdrop" onClick={onClose}>
      <motion.aside
        ref={dialogRef}
        className="filter-drawer settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span>PREFERENCES &amp; CONTROLS</span>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button onClick={onClose} aria-label="Close settings">
            <X />
          </button>
        </header>

        <div className="settings-body">
          <section className="settings-section">
            <span className="field-group-label">CURRENT ROLE</span>
            <div className="role-switch-grid">
              <button
                className={`role-card ${activeRole === "student" ? "active" : ""}`}
                onClick={() => onRoleChange("student")}
              >
                <div className="role-icon">
                  <UserCheck size={20} />
                </div>
                <div>
                  <b>Student</b>
                  <small>Standard campus account</small>
                </div>
                {activeRole === "student" && (
                  <CheckCircle2 className="role-check" size={18} />
                )}
              </button>

              <button
                className={`role-card ${activeRole === "admin" ? "active" : ""}`}
                onClick={() => onRoleChange("admin")}
              >
                <div className="role-icon admin">
                  <Shield size={20} />
                </div>
                <div>
                  <b>Admin</b>
                  <small>Campus operations access</small>
                </div>
                {activeRole === "admin" && (
                  <CheckCircle2 className="role-check" size={18} />
                )}
              </button>
            </div>

            {activeRole === "admin" && (
              <div className="admin-launch-box">
                <div>
                  <ShieldCheck size={20} />
                  <div>
                    <b>Admin Console</b>
                    <span>
                      Manage stats, approvals, disputes &amp; platform fees
                    </span>
                  </div>
                </div>
                <button
                  className="primary-wide"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                >
                  Launch Admin Console <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>

          {activeRole === "admin" && (
            <section className="settings-section">
              <span className="field-group-label">PLATFORM SERVICE FEE</span>
              <label className="switch-row">
                <span>
                  <b>Enable service fee</b>
                  <small>
                    Apply percentage service fee to borrowing exchanges
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={feeConfig.enabled}
                  onChange={(e) =>
                    onUpdateFeeConfig({
                      ...feeConfig,
                      enabled: e.target.checked,
                    })
                  }
                />
              </label>

              {feeConfig.enabled && (
                <>
                  <label className="slider-label">
                    Service fee <b>{feeConfig.percentRate}%</b>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="1"
                      value={feeConfig.percentRate}
                      onChange={(e) =>
                        onUpdateFeeConfig({
                          ...feeConfig,
                          percentRate: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="slider-label">
                    Minimum fee <b>₹{feeConfig.minFee}</b>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={feeConfig.minFee}
                      onChange={(e) =>
                        onUpdateFeeConfig({
                          ...feeConfig,
                          minFee: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </>
              )}
            </section>
          )}

          <section className="settings-section">
            <span className="field-group-label">NOTIFICATIONS</span>
            <label className="switch-row">
              <span>
                <b>All notifications</b>
                <small>Keep important activity visible</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    notifications: e.target.checked,
                  })
                }
              />
            </label>
            <label className="switch-row">
              <span>
                <b>Payment updates</b>
                <small>Alert when a simulated checkout succeeds or fails</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.notifyPayments}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    notifyPayments: e.target.checked,
                  })
                }
              />
            </label>
            <label className="switch-row">
              <span>
                <b>Deposit and refund updates</b>
                <small>Alert when a held deposit is released</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.notifyDeposits}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    notifyDeposits: e.target.checked,
                  })
                }
              />
            </label>
            <label className="switch-row">
              <span>
                <b>Exchange Status Updates</b>
                <small>Alert when requests are approved or scheduled</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.notifyExchanges}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    notifyExchanges: e.target.checked,
                  })
                }
              />
            </label>
            <label className="switch-row">
              <span>
                <b>Return Due Reminders</b>
                <small>Alert 24 hours before borrowing period expires</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.notifyReturns}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    notifyReturns: e.target.checked,
                  })
                }
              />
            </label>
            <label className="switch-row">
              <span>
                <b>Community Request Alerts</b>
                <small>
                  Alert when students request items in your categories
                </small>
              </span>
              <input
                type="checkbox"
                checked={preferences.notifyCommunity}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    notifyCommunity: e.target.checked,
                  })
                }
              />
            </label>
          </section>
          <section className="settings-section">
            <span className="field-group-label">
              APPEARANCE &amp; ACCESSIBILITY
            </span>
            <label className="settings-select-row">
              <span>
                <b>Theme</b>
                <small>Choose how Campus Circular looks</small>
              </span>
              <select
                value={preferences.theme}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    theme: e.target.value as UserPreferences["theme"],
                  })
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            <label className="switch-row">
              <span>
                <b>Reduced motion</b>
                <small>Use calmer transitions throughout the app</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    reducedMotion: e.target.checked,
                  })
                }
              />
            </label>
            <label className="switch-row">
              <span>
                <b>Show profile information</b>
                <small>Let borrowers and lenders see your campus profile</small>
              </span>
              <input
                type="checkbox"
                checked={preferences.showProfile}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    showProfile: e.target.checked,
                  })
                }
              />
            </label>
          </section>
        </div>

        <footer>
          <button className="primary-wide" onClick={onClose}>
            Save Preferences <Check size={18} />
          </button>
        </footer>
      </motion.aside>
    </div>
  );
}

export function NotificationPanel({
  items,
  onRead,
  onClose,
}: {
  items: AppNotification[];
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return (
    <div className="notification-backdrop" onClick={onClose}>
      <motion.aside
        ref={dialogRef}
        className="notification-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
        tabIndex={-1}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span>ACTIVITY</span>
            <h2 id="notifications-title">Notifications</h2>
          </div>
          <button onClick={onClose} aria-label="Close notifications">
            <X />
          </button>
        </header>
        <div className="notification-list">
          {items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                className={item.read ? "read" : ""}
                onClick={() => onRead(item.id)}
              >
                <i className={item.tone} />
                <div>
                  <b>{item.title}</b>
                  <p>{item.body}</p>
                  <span>{item.time}</span>
                </div>
                {!item.read && <em />}
              </button>
            ))
          ) : (
            <div className="empty-state">
              <Bell />
              <h2>You’re all caught up.</h2>
            </div>
          )}
        </div>
        <button
          className="mark-all"
          onClick={() => items.forEach((item) => onRead(item.id))}
        >
          Mark everything read
        </button>
      </motion.aside>
    </div>
  );
}

export function FilterDrawer({
  filters,
  setFilters,
  onClose,
}: {
  filters: {
    available: boolean;
    free: boolean;
    condition: string;
    maxCharge: number;
    maxDeposit: number;
    minTrust: number;
  };
  setFilters: (value: {
    available: boolean;
    free: boolean;
    condition: string;
    maxCharge: number;
    maxDeposit: number;
    minTrust: number;
  }) => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return (
    <div className="notification-backdrop" onClick={onClose}>
      <motion.aside
        ref={dialogRef}
        className="filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-title"
        tabIndex={-1}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <span>REFINE RESULTS</span>
            <h2 id="filters-title">Filters</h2>
          </div>
          <button onClick={onClose} aria-label="Close filters">
            <X />
          </button>
        </header>
        <label className="switch-row">
          <span>
            <b>Available now</b>
            <small>Hide reserved resources</small>
          </span>
          <input
            type="checkbox"
            checked={filters.available}
            onChange={(e) =>
              setFilters({ ...filters, available: e.target.checked })
            }
          />
        </label>
        <label className="switch-row">
          <span>
            <b>Free / donation</b>
            <small>Show zero-charge resources</small>
          </span>
          <input
            type="checkbox"
            checked={filters.free}
            onChange={(e) => setFilters({ ...filters, free: e.target.checked })}
          />
        </label>
        <label>
          CONDITION
          <select
            value={filters.condition}
            onChange={(e) =>
              setFilters({ ...filters, condition: e.target.value })
            }
          >
            <option>All</option>
            <option>Like new</option>
            <option>Excellent</option>
            <option>Good</option>
            <option>Fair</option>
          </select>
        </label>
        <label>
          MAX DAILY CHARGE <b>₹{filters.maxCharge}</b>
          <input
            type="range"
            min="0"
            max="250"
            step="10"
            value={filters.maxCharge}
            onChange={(e) =>
              setFilters({ ...filters, maxCharge: Number(e.target.value) })
            }
          />
        </label>
        <label>
          MAX DEPOSIT <b>₹{filters.maxDeposit}</b>
          <input
            type="range"
            min="0"
            max="3000"
            step="100"
            value={filters.maxDeposit}
            onChange={(e) =>
              setFilters({ ...filters, maxDeposit: Number(e.target.value) })
            }
          />
        </label>
        <label>
          MIN OWNER TRUST <b>{filters.minTrust}</b>
          <input
            type="range"
            min="0"
            max="95"
            step="5"
            value={filters.minTrust}
            onChange={(e) =>
              setFilters({ ...filters, minTrust: Number(e.target.value) })
            }
          />
        </label>
        <footer>
          <button
            onClick={() =>
              setFilters({
                available: false,
                free: false,
                condition: "All",
                maxCharge: 250,
                maxDeposit: 3000,
                minTrust: 0,
              })
            }
          >
            Clear all
          </button>
          <button onClick={onClose}>
            Show results <ArrowRight />
          </button>
        </footer>
      </motion.aside>
    </div>
  );
}

export function ListResourceModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (resource: Resource) => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Study");
  const [location, setLocation] = useState<Resource["location"]>("Library");
  const [charge, setCharge] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [donation, setDonation] = useState(false);
  const submit = () => {
    if (!title.trim()) return;
    onComplete({
      id: `listed-${Date.now()}`,
      title: title.trim(),
      category,
      description: `Shared by ${currentUser.name} for trusted campus access.`,
      ownerId: "me",
      location,
      distance: 180,
      condition: "Good",
      availableNow: true,
      unavailableDates: [],
      charge: donation ? 0 : charge,
      deposit: donation ? 0 : deposit,
      accessories: ["Owner-confirmed contents"],
      conditions: donation
        ? ["Free to keep"]
        : ["Return in the same condition"],
      successfulBorrows: 0,
      tags: [title.toLowerCase(), category.toLowerCase()],
      pickupOptions: [`${location} meetup`],
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=82",
      donation,
    });
  };
  return (
    <div className="modal-backdrop">
      <motion.div
        ref={dialogRef}
        className="wizard listing-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close resource form"
        >
          <X />
        </button>
        <div className="wizard-head">
          <span>SHARE A RESOURCE</span>
          <h2 id="listing-title">Put something idle back to work.</h2>
        </div>
        <div className="wizard-body listing-form">
          <section className="form-group">
            <span className="field-group-label">RESOURCE DETAILS</span>
            <label>
              RESOURCE TITLE
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Scientific calculator"
                autoFocus
                data-autofocus
              />
            </label>
            <div className="date-grid">
              <label>
                CATEGORY
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as Category)
                  }
                >
                  {[
                    "Cameras",
                    "Computing",
                    "Books",
                    "Electronics",
                    "Audio",
                    "Tools",
                    "Instruments",
                    "Study",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                PICKUP LOCATION
                <select
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value as Resource["location"])
                  }
                >
                  {[
                    "Main Building",
                    "Library",
                    "Engineering Block",
                    "Hostel Gate",
                    "Canteen",
                    "Innovation Lab",
                  ].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <section className="form-group">
            <span className="field-group-label">PRICING</span>
            <label className="switch-row">
              <span>
                <b>Free / donation</b>
                <small>Offer this resource free to keep</small>
              </span>
              <input
                type="checkbox"
                checked={donation}
                onChange={(event) => setDonation(event.target.checked)}
              />
            </label>
            {!donation && (
              <div className="date-grid">
                <label>
                  CHARGE PER DAY
                  <input
                    type="number"
                    min="0"
                    value={charge}
                    onChange={(event) => setCharge(Number(event.target.value))}
                  />
                </label>
                <label>
                  REFUNDABLE DEPOSIT
                  <input
                    type="number"
                    min="0"
                    value={deposit}
                    onChange={(event) => setDeposit(Number(event.target.value))}
                  />
                </label>
              </div>
            )}
          </section>
          <section className="form-group trust-group">
            <span className="field-group-label">TRUST</span>
            <div className="availability-ok">
              <ShieldCheck />
              <div>
                <b>Your verified profile will be shown</b>
                <span>
                  Trust score {currentUser.trust}/100 · campus identity
                  confirmed
                </span>
              </div>
            </div>
          </section>
        </div>
        <div className="wizard-footer">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={!title.trim()} onClick={submit}>
            Publish resource <ArrowRight />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function CommunityRequestModal({
  initialNeed,
  onClose,
  onSubmit,
}: {
  initialNeed: string;
  onClose: () => void;
  onSubmit: (request: CommunityRequest) => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const [title, setTitle] = useState(initialNeed);
  const [category, setCategory] = useState<Category>("Electronics");
  const [neededBy, setNeededBy] = useState("2026-08-30");
  const [details, setDetails] = useState("");
  return (
    <div className="modal-backdrop">
      <motion.div
        ref={dialogRef}
        className="wizard community-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-request-title"
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close community request"
        >
          <X />
        </button>
        <div className="wizard-head">
          <span>COMMUNITY REQUEST</span>
          <h2 id="community-request-title">Ask campus to help.</h2>
          <p>Post a need and let verified owners respond with alternatives.</p>
        </div>
        <div className="community-form">
          <label>
            WHAT DO YOU NEED?
            <input
              data-autofocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A projector for our club showcase"
            />
          </label>
          <div className="date-grid">
            <label>
              CATEGORY
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {[
                  "Cameras",
                  "Computing",
                  "Books",
                  "Electronics",
                  "Audio",
                  "Tools",
                  "Instruments",
                  "Study",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              NEEDED BY
              <input
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
              />
            </label>
          </div>
          <label>
            CONTEXT / DETAILS
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add timing, preferred specs, or pickup constraints…"
            />
          </label>
        </div>
        <div className="wizard-footer">
          <button onClick={onClose}>Cancel</button>
          <button
            className="primary"
            disabled={!title.trim()}
            onClick={() =>
              onSubmit({
                id: `REQ-${Date.now()}`,
                title,
                category,
                details,
                neededBy,
                requesterId: currentUser.id,
                status: "Open",
                createdAt: new Date().toISOString(),
              })
            }
          >
            Post request <ArrowRight />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function AdminPage({
  resources: inventory,
  exchanges,
  communityRequests,
  disputes,
}: {
  resources: Resource[];
  exchanges: Exchange[];
  communityRequests: CommunityRequest[];
  disputes: Dispute[];
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("admin@campus.circular");
  if (!authenticated)
    return (
      <section className="feature-page admin-page">
        <div className="admin-login">
          <span className="section-label">ADMIN ACCESS</span>
          <h1>Campus operations.</h1>
          <p>
            Review community requests, disputes, and exchange health from one
            calm control room.
          </p>
          <input
            aria-label="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            aria-label="Admin password"
            type="password"
            placeholder="Demo password"
          />
          <button
            className="primary-wide"
            onClick={() => setAuthenticated(true)}
          >
            Enter admin console <ArrowRight />
          </button>
          <small>Frontend demo access · no real credentials are stored.</small>
        </div>
      </section>
    );
  const openRequests = communityRequests.filter((r) => r.status === "Open");
  const openDisputes = disputes.filter((d) => d.status === "Open");
  const fees = exchanges.reduce((sum, e) => sum + (e.platformFee || 0), 0);
  return (
    <section className="feature-page admin-page">
      <div className="feature-hero split">
        <div>
          <span className="section-label">ADMIN CONSOLE</span>
          <h1>Campus operations.</h1>
        </div>
        <p>One view for trust, inventory, requests, and settlements.</p>
      </div>
      <div className="admin-kpis">
        <div>
          <span>ACTIVE RESOURCES</span>
          <b>{inventory.length}</b>
        </div>
        <div>
          <span>OPEN EXCHANGES</span>
          <b>{exchanges.filter((e) => e.stage !== "Deposit settled").length}</b>
        </div>
        <div>
          <span>COMMUNITY REQUESTS</span>
          <b>{openRequests.length}</b>
        </div>
        <div>
          <span>FEES TRACKED</span>
          <b>₹{fees}</b>
        </div>
      </div>
      <div className="admin-queues">
        <div className="admin-queue">
          <div className="section-heading">
            <div>
              <span className="section-label">INBOX</span>
              <h2>Community requests</h2>
            </div>
            <span className="admin-badge">{openRequests.length} open</span>
          </div>
          {openRequests.length ? (
            openRequests.map((r) => (
              <div className="admin-row" key={r.id}>
                <div>
                  <b>{r.title}</b>
                  <span>
                    {r.category} · needed by {r.neededBy}
                  </span>
                </div>
                <strong>Open</strong>
              </div>
            ))
          ) : (
            <p className="admin-note">No requests waiting for a match.</p>
          )}
        </div>
        <div className="admin-queue">
          <div className="section-heading">
            <div>
              <span className="section-label">TRUST &amp; SAFETY</span>
              <h2>Dispute queue</h2>
            </div>
            <span className="admin-badge amber">
              {openDisputes.length} open
            </span>
          </div>
          {openDisputes.length ? (
            openDisputes.map((d) => (
              <div className="admin-row" key={d.id}>
                <div>
                  <b>
                    {d.exchangeId} · {d.reason}
                  </b>
                  <span>{d.details || "No additional details"}</span>
                </div>
                <strong>Review</strong>
              </div>
            ))
          ) : (
            <p className="admin-note">No disputes require review.</p>
          )}
        </div>
      </div>
    </section>
  );
}
