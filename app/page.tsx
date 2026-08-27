"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Heart,
  Laptop,
  MapPin,
  Menu,
  Mic2,
  PackagePlus,
  Recycle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { currentUser, initialNotifications, ownerFor, resources } from "./data";
import {
  formatDistance,
  getMatchScore,
  matchReason,
  walkingMinutes,
} from "./logic";
import { usePersistentState } from "./persistence";
import { useDialogFocus } from "./modal-a11y";
import {
  AiFinder,
  AdminPage,
  CommunityRequestModal,
  CompareTray,
  ExchangesPage,
  FilterDrawer,
  ImpactPage,
  ListResourceModal,
  NotificationPanel,
  ProfilePage,
  RequestWizard,
} from "./workflows";
import type {
  AppNotification,
  Category,
  Exchange,
  ExchangeStage,
  Resource,
  CommunityRequest,
  Dispute,
} from "./types";

type View =
  "home" | "explore" | "ai" | "exchanges" | "impact" | "profile" | "admin";
type Filters = {
  available: boolean;
  free: boolean;
  condition: string;
  maxCharge: number;
  maxDeposit: number;
  minTrust: number;
};
const blankFilters: Filters = {
  available: false,
  free: false,
  condition: "All",
  maxCharge: 250,
  maxDeposit: 3000,
  minTrust: 0,
};
const categories: { name: Category; icon: typeof Camera }[] = [
  { name: "Cameras", icon: Camera },
  { name: "Computing", icon: Laptop },
  { name: "Electronics", icon: Zap },
  { name: "Books", icon: BookOpen },
  { name: "Audio", icon: Mic2 },
  { name: "Tools", icon: Wrench },
];
const seedExchanges: Exchange[] = [
  {
    id: "CC-4821",
    resourceIds: ["r9"],
    ownerId: "u2",
    borrowerId: "me",
    startDate: "2026-08-26",
    endDate: "2026-08-28",
    pickup: "Innovation Lab meetup",
    stage: "Return due",
    createdAt: "2026-08-25T10:00:00.000Z",
    pickupCode: "CC-4821",
    returnCode: "RT-9134",
    conditionBefore: {
      "Body intact": true,
      "Primary function tested": true,
      "Accessories included": true,
      "No visible damage": true,
    },
  },
  {
    id: "CC-7390",
    resourceIds: ["r3"],
    ownerId: "u1",
    borrowerId: "me",
    startDate: "2026-08-28",
    endDate: "2026-08-29",
    pickup: "Main Building meetup",
    stage: "Approved",
    createdAt: "2026-08-27T07:00:00.000Z",
    pickupCode: "CC-7390",
    returnCode: "RT-3652",
    conditionBefore: {
      "Body intact": true,
      "Primary function tested": true,
      "Accessories included": true,
      "No visible damage": true,
    },
  },
];

function ResourceVisual({ resource }: { resource: Resource }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="resource-visual">
      {!failed && (
        <img src={resource.image} alt="" onError={() => setFailed(true)} />
      )}
      <span>{resource.category.slice(0, 2).toUpperCase()}</span>
      {resource.donation && <b>FREE TO KEEP</b>}
    </div>
  );
}
function MatchBadge({
  resource,
  urgent = false,
}: {
  resource: Resource;
  urgent?: boolean;
}) {
  const score = getMatchScore(resource, ownerFor(resource), urgent);
  return (
    <div className={`match-badge ${score >= 90 ? "top" : ""}`}>
      <strong>{score}%</strong>
      <span>MATCH</span>
    </div>
  );
}

function ResourceCard({
  resource,
  onOpen,
  urgent,
  favorite,
  onFavorite,
  compared,
  onCompare,
}: {
  resource: Resource;
  onOpen: (r: Resource) => void;
  urgent?: boolean;
  favorite: boolean;
  onFavorite: (id: string) => void;
  compared: boolean;
  onCompare: (id: string) => void;
}) {
  const owner = ownerFor(resource);
  return (
    <motion.article
      className="resource-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpen(resource)}
    >
      <ResourceVisual resource={resource} />
      <div className="resource-card-body">
        <div className="card-meta">
          <span className={resource.availableNow ? "available" : "reserved"}>
            {resource.availableNow ? "Available now" : "Reserved today"}
          </span>
          <MatchBadge resource={resource} urgent={urgent} />
        </div>
        <h3>{resource.title}</h3>
        <p className="location-line">
          <MapPin size={14} />
          {resource.location} · {formatDistance(resource.distance)} ·{" "}
          {walkingMinutes(resource.distance)} min
        </p>
        <p className="match-reason">{matchReason(resource, owner)}</p>
        <div className="owner-line">
          <span className="avatar small">{owner.initials}</span>
          <div>
            <b>{owner.name}</b>
            <small>
              <ShieldCheck size={12} />
              {owner.trust} trust · {owner.rating} ★
            </small>
          </div>
          <button
            className={favorite ? "saved" : ""}
            aria-label={`Save ${resource.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(resource.id);
            }}
          >
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="card-actions">
          <button
            className={compared ? "selected" : ""}
            onClick={(e) => {
              e.stopPropagation();
              onCompare(resource.id);
            }}
          >
            {compared ? (
              <>
                <Check /> Added to compare
              </>
            ) : (
              "Compare"
            )}
          </button>
          <div className="price-line">
            <div>
              <strong>
                {resource.donation ? "Free" : `₹${resource.charge}`}
              </strong>
              <span>{resource.donation ? "donation" : "/ day"}</span>
            </div>
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Header({
  view,
  setView,
  onNotifications,
  unread,
}: {
  view: View;
  setView: (v: View) => void;
  onNotifications: () => void;
  unread: number;
}) {
  const [mobile, setMobile] = useState(false);
  const links: [View, string][] = [
    ["home", "Home"],
    ["explore", "Explore"],
    ["ai", "AI Finder"],
    ["exchanges", "My Exchanges"],
    ["impact", "Impact"],
    ["admin", "Admin"],
  ];
  return (
    <header className="app-header">
      <button className="brand" onClick={() => setView("home")}>
        <span>
          <Recycle size={19} />
        </span>
        <div>
          <b>CAMPUS</b>
          <b>CIRCULAR</b>
        </div>
      </button>
      <nav>
        {links.map(([id, label]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="icon-button"
          aria-label="Notifications"
          onClick={onNotifications}
        >
          <Bell size={18} />
          {unread > 0 && <i />}
        </button>
        <button className="profile-chip" onClick={() => setView("profile")}>
          <span className="avatar">{currentUser.initials}</span>
          <div>
            <b>{currentUser.name.split(" ")[0]}</b>
            <small>{currentUser.trust} trust</small>
          </div>
          <ChevronDown size={14} />
        </button>
        <button
          className="mobile-menu"
          aria-label="Open navigation"
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? <X /> : <Menu />}
        </button>
      </div>
      {mobile && (
        <div className="mobile-nav">
          {links.map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setView(id);
                setMobile(false);
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => {
              setView("profile");
              setMobile(false);
            }}
          >
            Profile
          </button>
        </div>
      )}
    </header>
  );
}

function DetailPanel({
  resource,
  onClose,
  favorite,
  onFavorite,
  compared,
  onCompare,
  onRequest,
}: {
  resource: Resource;
  onClose: () => void;
  favorite: boolean;
  onFavorite: (id: string) => void;
  compared: boolean;
  onCompare: (id: string) => void;
  onRequest: (items: Resource[]) => void;
}) {
  const owner = ownerFor(resource);
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  return (
    <motion.div
      className="detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        ref={dialogRef}
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-detail-title"
        tabIndex={-1}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close resource details"
        >
          <X />
        </button>
        <ResourceVisual resource={resource} />
        <div className="detail-content">
          <span className="section-label">
            {resource.category} · {resource.condition}
          </span>
          <h2 id="resource-detail-title">{resource.title}</h2>
          <p>{resource.description}</p>
          <div className="detail-action-row">
            <button
              onClick={() => onFavorite(resource.id)}
              className={favorite ? "active" : ""}
            >
              <Heart fill={favorite ? "currentColor" : "none"} />
              {favorite ? "Saved" : "Save"}
            </button>
            <button
              onClick={() => onCompare(resource.id)}
              className={compared ? "active" : ""}
            >
              <SlidersHorizontal />
              {compared ? "Comparing" : "Compare"}
            </button>
          </div>
          <div className="detail-stats">
            <div>
              <MapPin />
              <b>{formatDistance(resource.distance)}</b>
              <span>{resource.location}</span>
            </div>
            <div>
              <Clock3 />
              <b>{walkingMinutes(resource.distance)} min</b>
              <span>Walk from you</span>
            </div>
            <div>
              <ShieldCheck />
              <b>{owner.trust}/100</b>
              <span>Owner trust</span>
            </div>
          </div>
          <div className="trust-mini">
            <div className="avatar">{owner.initials}</div>
            <div>
              <small>SHARED BY</small>
              <b>{owner.name}</b>
              <span>{owner.department}</span>
            </div>
            <div className="trust-ring">{owner.trust}</div>
          </div>
          <h3>Included with this item</h3>
          <div className="accessory-list">
            {resource.accessories.map((item) => (
              <span key={item}>
                <Check size={14} />
                {item}
              </span>
            ))}
          </div>
          <h3>Borrowing conditions</h3>
          <div className="accessory-list">
            {resource.conditions.map((item) => (
              <span key={item}>
                <ShieldCheck size={14} />
                {item}
              </span>
            ))}
          </div>
          <div className="availability-head">
            <div>
              <h3>Availability</h3>
              <p>Next seven days</p>
            </div>
            <div>
              <span>
                <i className="available" />
                Available
              </span>
              <span>
                <i className="reserved" />
                Reserved
              </span>
            </div>
          </div>
          <div className="availability-calendar">
            {[
              "Thu 27",
              "Fri 28",
              "Sat 29",
              "Sun 30",
              "Mon 31",
              "Tue 01",
              "Wed 02",
            ].map((day, index) => (
              <button
                key={day}
                className={
                  index === 2 || (!resource.availableNow && index === 0)
                    ? "reserved"
                    : "available"
                }
              >
                <span>{day.split(" ")[0]}</span>
                <b>{day.split(" ")[1]}</b>
                <small>
                  {index === 2 || (!resource.availableNow && index === 0)
                    ? "Reserved"
                    : "Available"}
                </small>
              </button>
            ))}
          </div>
          <div className="detail-price">
            <div>
              <small>BORROWING CHARGE</small>
              <b>
                {resource.donation
                  ? "Free to keep"
                  : `₹${resource.charge} / day`}
              </b>
              <span>+ ₹{resource.deposit} refundable deposit</span>
            </div>
            <button onClick={() => onRequest([resource])}>
              Request to borrow <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}

export default function Home() {
  const reduce = useReducedMotion();
  const [view, setViewState] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [urgent, setUrgent] = useState(false);
  const [selected, setSelected] = useState<Resource | null>(null);
  const [sort, setSort] = useState("recommended");
  const [filters, setFilters] = useState<Filters>(blankFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [requestItems, setRequestItems] = useState<Resource[] | null>(null);
  const [communityRequestPrefill, setCommunityRequestPrefill] = useState<
    string | null
  >(null);
  const [favorites, setFavorites] = usePersistentState<string[]>(
    "cc:favorites",
    [],
  );
  const [compare, setCompare] = usePersistentState<string[]>("cc:compare", []);
  const [exchanges, setExchanges] = usePersistentState<Exchange[]>(
    "cc:exchanges",
    seedExchanges,
  );
  const [notifications, setNotifications] = usePersistentState<
    AppNotification[]
  >("cc:notifications", initialNotifications);
  const [recentSearches, setRecentSearches] = usePersistentState<string[]>(
    "cc:recent-searches",
    [],
  );
  const [customResources, setCustomResources] = usePersistentState<Resource[]>(
    "cc:listed-resources",
    [],
  );
  const [communityRequests, setCommunityRequests] = usePersistentState<
    CommunityRequest[]
  >("cc:community-requests", []);
  const [disputes, setDisputes] = usePersistentState<Dispute[]>(
    "cc:disputes",
    [],
  );
  const inventory = useMemo(
    () => [...customResources, ...resources],
    [customResources],
  );
  const setView = (next: View) => {
    setViewState(next);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  const toggleFavorite = (id: string) =>
    setFavorites((list) =>
      list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
    );
  const toggleCompare = (id: string) =>
    setCompare((list) =>
      list.includes(id)
        ? list.filter((item) => item !== id)
        : list.length < 3
          ? [...list, id]
          : list,
    );
  const goExplore = (preset = "") => {
    setQuery(preset);
    if (preset.trim())
      setRecentSearches((list) =>
        [preset, ...list.filter((item) => item !== preset)].slice(0, 5),
      );
    setView("explore");
  };
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const list = inventory.filter(
      (resource) =>
        (category === "All" || resource.category === category) &&
        (!q ||
          `${resource.title} ${resource.description} ${resource.tags.join(" ")}`
            .toLowerCase()
            .includes(q)) &&
        (!filters.available || resource.availableNow) &&
        (!filters.free || resource.charge === 0) &&
        (filters.condition === "All" ||
          resource.condition === filters.condition) &&
        resource.charge <= filters.maxCharge &&
        resource.deposit <= filters.maxDeposit &&
        ownerFor(resource).trust >= filters.minTrust,
    );
    return [...list].sort((a, b) =>
      sort === "nearest"
        ? a.distance - b.distance
        : sort === "lowest"
          ? a.charge - b.charge
          : sort === "trust"
            ? ownerFor(b).trust - ownerFor(a).trust
            : getMatchScore(b, ownerFor(b), urgent) -
              getMatchScore(a, ownerFor(a), urgent),
    );
  }, [query, category, sort, urgent, filters, inventory]);
  const completeRequest = (exchange: Exchange) => {
    setExchanges((list) => [exchange, ...list]);
    setNotifications((list) => [
      {
        id: `n-${Date.now()}`,
        title: "Request sent",
        body: `Your request ${exchange.id} is waiting for owner approval.`,
        time: "Just now",
        read: false,
        tone: "blue",
      },
      ...list,
    ]);
  };
  const advanceExchange = (
    exchange: Exchange,
    next: ExchangeStage,
    after?: Record<string, boolean>,
  ) => {
    setExchanges((list) =>
      list.map((item) =>
        item.id === exchange.id
          ? {
              ...item,
              stage: next,
              conditionAfter: after || item.conditionAfter,
            }
          : item,
      ),
    );
    setNotifications((list) => [
      {
        id: `n-${Date.now()}`,
        title: `Exchange ${next.toLowerCase()}`,
        body: `${exchange.id} advanced to ${next}.`,
        time: "Just now",
        read: false,
        tone: next === "Deposit settled" ? "green" : "blue",
      },
      ...list,
    ]);
  };
  const submitDispute = (dispute: Dispute) => {
    setDisputes((list) => [dispute, ...list]);
    setNotifications((list) => [
      {
        id: `n-${Date.now()}`,
        title: "Dispute submitted",
        body: `${dispute.exchangeId} is queued for admin review.`,
        time: "Just now",
        read: false,
        tone: "amber",
      },
      ...list,
    ]);
  };
  const submitCommunityRequest = (request: CommunityRequest) => {
    setCommunityRequests((list) => [request, ...list]);
    setNotifications((list) => [
      {
        id: `n-${Date.now()}`,
        title: "Community request posted",
        body: `${request.title} is now visible to verified owners.`,
        time: "Just now",
        read: false,
        tone: "green",
      },
      ...list,
    ]);
    setCommunityRequestPrefill(null);
  };
  const common = {
    onOpen: setSelected,
    onFavorite: toggleFavorite,
    onCompare: toggleCompare,
  };
  let content: React.ReactNode;
  if (view === "home")
    content = (
      <motion.div
        key="home"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow">
              <i /> FROM OWNERSHIP TO ACCESS
            </div>
            <h1>
              Why buy what
              <br />
              someone nearby
              <br />
              <em>already has?</em>
            </h1>
            <p>
              Borrow, lend, donate and discover trusted resources inside your
              campus community.
            </p>
            <div className="hero-actions">
              <button onClick={() => goExplore()}>
                Find a resource <ArrowRight />
              </button>
              <button
                className="secondary"
                onClick={() => setListingOpen(true)}
              >
                <PackagePlus /> Share something
              </button>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack">
                <span>AM</span>
                <span>MN</span>
                <span>KS</span>
                <span>+48</span>
              </div>
              <p>
                <b>48 exchanges this month</b>
                <span>between verified campus members</span>
              </p>
            </div>
          </div>
          <div className="finder-panel">
            <div className="finder-top">
              <span>
                <Sparkles /> CAMPUS NEED ASSISTANT
              </span>
              <small>Groq-ready · offline safe</small>
            </div>
            <h2>
              Tell us what you need,
              <br />
              not what to search.
            </h2>
            <div className="ai-input">
              <Bot />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setView("ai")}
                placeholder="I need to film a club reel tomorrow…"
              />
              <button onClick={() => setView("ai")} aria-label="Open AI finder">
                <ArrowRight />
              </button>
            </div>
            <div className="prompt-grid">
              {[
                "Film a club reel tomorrow",
                "Calculator for my exam",
                "Arduino project equipment",
                "Guitar for tonight's rehearsal",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setQuery(prompt);
                    setView("ai");
                  }}
                >
                  {prompt}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <div className="finder-result">
              <span>
                <Zap /> AVAILABLE NEAR YOU
              </span>
              <div>
                <b>Sony α6400 + Tripod + Mic</b>
                <small>Complete reel setup · 3–7 min walk</small>
              </div>
              <strong>94%</strong>
            </div>
          </div>
        </section>
        <section className="impact-strip">
          <div>
            <strong>₹12.4L</strong>
            <span>saved by students</span>
          </div>
          <div>
            <strong>1,284</strong>
            <span>successful exchanges</span>
          </div>
          <div>
            <strong>23.4 kg</strong>
            <span>e-waste avoided</span>
          </div>
          <div>
            <strong>94%</strong>
            <span>on-time returns</span>
          </div>
        </section>
        <section className="home-section">
          <div className="section-heading">
            <div>
              <span className="section-label">BROWSE BY NEED</span>
              <h2>
                Everything campus life
                <br />
                asks from you.
              </h2>
            </div>
            <button onClick={() => goExplore()}>
              View all resources <ArrowRight />
            </button>
          </div>
          <div className="category-grid">
            {categories.map(({ name, icon: Icon }, index) => (
              <button
                key={name}
                onClick={() => {
                  setCategory(name);
                  goExplore();
                }}
              >
                <span>0{index + 1}</span>
                <Icon />
                <b>{name}</b>
                <small>
                  {inventory.filter((r) => r.category === name).length} nearby
                </small>
                <ArrowRight />
              </button>
            ))}
          </div>
        </section>
        <section className="home-section nearby">
          <div className="section-heading">
            <div>
              <span className="section-label">AVAILABLE RIGHT NOW</span>
              <h2>
                Closer than a delivery.
                <br />
                Trusted like a friend.
              </h2>
            </div>
            <button onClick={() => goExplore()}>
              Explore campus <Compass />
            </button>
          </div>
          <div className="resource-grid">
            {inventory
              .filter((r) => r.availableNow)
              .slice(0, 3)
              .map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  {...common}
                  favorite={favorites.includes(r.id)}
                  compared={compare.includes(r.id)}
                />
              ))}
          </div>
        </section>
      </motion.div>
    );
  else if (view === "explore")
    content = (
      <motion.section
        key="explore"
        className="explore-page"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="explore-hero">
          <span className="section-label">CAMPUS INVENTORY · LIVE</span>
          <h1>
            Find what you need.
            <br />
            <em>Nearby.</em>
          </h1>
          <p>
            Every result is ranked by availability, proximity, condition, price
            and owner trust.
          </p>
        </div>
        <div className="explore-toolbar">
          <div className="search-field">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cameras, books, tools…"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className={urgent ? "urgent active" : "urgent"}
            onClick={() => setUrgent(!urgent)}
          >
            <Zap /> Need it urgently
          </button>
          <button onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort resources"
          >
            <option value="recommended">Recommended</option>
            <option value="nearest">Nearest</option>
            <option value="lowest">Lowest charge</option>
            <option value="trust">Highest trust</option>
          </select>
        </div>
        {recentSearches.length > 0 && (
          <div className="recent-row">
            <span>RECENT</span>
            {recentSearches.map((item) => (
              <button key={item} onClick={() => setQuery(item)}>
                {item}
              </button>
            ))}
          </div>
        )}
        <div className="chip-row">
          {(["All", ...categories.map((i) => i.name)] as const).map((item) => (
            <button
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="results-meta">
          <p>
            <b>{filtered.length}</b> resources found{" "}
            {urgent && <span>· urgent ranking active</span>}
          </p>
          <small>Within 1 km of Main Building</small>
        </div>
        {filtered.length ? (
          <div className="resource-grid explore-grid">
            {filtered.map((r) => (
              <ResourceCard
                key={r.id}
                resource={r}
                {...common}
                favorite={favorites.includes(r.id)}
                compared={compare.includes(r.id)}
                urgent={urgent}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search />
            <h2>No campus resource matched that search.</h2>
            <p>Try a broader term or clear the category filter.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All");
                setFilters(blankFilters);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.section>
    );
  else if (view === "ai")
    content = (
      <AiFinder
        initialQuery={query}
        onRequest={(items) => setRequestItems(items)}
        onCommunityRequest={(prefill) => setCommunityRequestPrefill(prefill)}
      />
    );
  else if (view === "exchanges")
    content = (
      <ExchangesPage
        exchanges={exchanges}
        onAdvance={advanceExchange}
        onSubmitDispute={submitDispute}
      />
    );
  else if (view === "impact") content = <ImpactPage exchanges={exchanges} />;
  else if (view === "admin")
    content = (
      <AdminPage
        resources={inventory}
        exchanges={exchanges}
        communityRequests={communityRequests}
        disputes={disputes}
      />
    );
  else content = <ProfilePage />;
  return (
    <main>
      <Header
        view={view}
        setView={setView}
        onNotifications={() => setNotificationOpen(true)}
        unread={notifications.filter((n) => !n.read).length}
      />
      <AnimatePresence mode="wait">{content}</AnimatePresence>
      <AnimatePresence>
        {selected && (
          <DetailPanel
            resource={selected}
            onClose={() => setSelected(null)}
            favorite={favorites.includes(selected.id)}
            onFavorite={toggleFavorite}
            compared={compare.includes(selected.id)}
            onCompare={toggleCompare}
            onRequest={(items) => {
              setSelected(null);
              setRequestItems(items);
            }}
          />
        )}
      </AnimatePresence>
      {filterOpen && (
        <FilterDrawer
          filters={filters}
          setFilters={setFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}
      <CompareTray
        ids={compare}
        catalog={inventory}
        onRemove={toggleCompare}
        onClose={() => {}}
        onRequest={(items) => setRequestItems(items)}
      />
      {requestItems && (
        <RequestWizard
          items={requestItems}
          onClose={() => setRequestItems(null)}
          onViewExchanges={() => {
            setRequestItems(null);
            setView("exchanges");
          }}
          onComplete={completeRequest}
        />
      )}
      {communityRequestPrefill !== null && (
        <CommunityRequestModal
          initialNeed={communityRequestPrefill}
          onClose={() => setCommunityRequestPrefill(null)}
          onSubmit={submitCommunityRequest}
        />
      )}
      {listingOpen && (
        <ListResourceModal
          onClose={() => setListingOpen(false)}
          onComplete={(resource) => {
            setCustomResources((list) => [resource, ...list]);
            setNotifications((list) => [
              {
                id: `n-${Date.now()}`,
                title: "Resource listed",
                body: `${resource.title} is now visible in campus inventory.`,
                time: "Just now",
                read: false,
                tone: "green",
              },
              ...list,
            ]);
            setListingOpen(false);
            setView("explore");
          }}
        />
      )}
      {notificationOpen && (
        <NotificationPanel
          items={notifications}
          onRead={(id) =>
            setNotifications((list) =>
              list.map((n) => (n.id === id ? { ...n, read: true } : n)),
            )
          }
          onClose={() => setNotificationOpen(false)}
        />
      )}
    </main>
  );
}
