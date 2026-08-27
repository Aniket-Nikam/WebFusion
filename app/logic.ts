import type { NeedAnalysis, PlatformFeeConfig, Resource, User } from "./types";
const conditionScore = {
  "Like new": 100,
  Excellent: 92,
  Good: 78,
  Fair: 62,
} as const;
export function getMatchScore(resource: Resource, owner: User, urgent = false) {
  const availability = resource.availableNow ? 100 : 45,
    distance = Math.max(25, 100 - resource.distance / 12),
    trust = owner.trust,
    rating = owner.rating * 20,
    condition = conditionScore[resource.condition],
    price = resource.donation ? 100 : Math.max(30, 100 - resource.charge / 3);
  const w = urgent
    ? { a: 0.32, d: 0.25, t: 0.18, c: 0.08, r: 0.12, p: 0.05 }
    : { a: 0.24, d: 0.18, t: 0.2, c: 0.13, r: 0.15, p: 0.1 };
  return Math.round(
    availability * w.a +
      distance * w.d +
      trust * w.t +
      condition * w.c +
      rating * w.r +
      price * w.p,
  );
}
export function matchReason(resource: Resource, owner: User) {
  const d =
    resource.distance < 400
      ? `${resource.distance}m away`
      : `${(resource.distance / 1000).toFixed(1)}km away`;
  return `${resource.availableNow && resource.distance < 400 ? "Excellent" : "Strong"} match — ${resource.availableNow ? "available now" : "available shortly"}, ${d}, with a ${owner.trust}/100 trusted owner.`;
}
export function analyseNeed(query: string): NeedAnalysis {
  const t = query.toLowerCase();
  if (/reel|film|video|shoot|interview|content/.test(t))
    return {
      intent: "Create polished video content",
      urgency: /tomorrow|tonight|urgent/.test(t) ? "High" : "Normal",
      categories: ["Cameras", "Audio"],
      requiredItems: [
        "Camera",
        "Tripod",
        "Wireless microphone",
        "LED lighting kit",
      ],
      optionalItems: ["Laptop for editing"],
      keywords: ["camera", "tripod", "microphone", "lighting"],
      explanation:
        "A stable camera setup, clean audio and controlled light cover the complete production workflow.",
    };
  if (/arduino|iot|circuit|electronics|prototype/.test(t))
    return {
      intent: "Prototype and test an electronics circuit",
      urgency: /tomorrow|today|urgent/.test(t) ? "High" : "Normal",
      categories: ["Electronics", "Tools"],
      requiredItems: [
        "Arduino kit",
        "Breadboard",
        "Jumper wires",
        "Multimeter",
      ],
      optionalItems: ["Laptop"],
      keywords: ["arduino", "multimeter", "electronics"],
      explanation:
        "The kit supplies the controller and components; the multimeter verifies power and connections.",
    };
  if (/exam|calculator|math|calculus/.test(t))
    return {
      intent: "Prepare for a technical examination",
      urgency: /tomorrow|today|urgent/.test(t) ? "High" : "Normal",
      categories: ["Study", "Books"],
      requiredItems: ["Scientific calculator"],
      optionalItems: ["Engineering Mathematics textbook"],
      keywords: ["calculator", "mathematics"],
      explanation:
        "A reliable exam-ready calculator is the priority, with a textbook as optional revision support.",
    };
  if (/guitar|rehearsal|music|perform/.test(t))
    return {
      intent: "Prepare for a music rehearsal or performance",
      urgency: /tonight|today|urgent/.test(t) ? "High" : "Normal",
      categories: ["Instruments", "Audio"],
      requiredItems: ["Acoustic guitar"],
      optionalItems: ["Wireless microphone"],
      keywords: ["guitar", "microphone"],
      explanation:
        "The instrument covers rehearsal, while a microphone is useful for a live performance.",
    };
  return {
    intent: "Find the closest suitable campus resource",
    urgency: /tomorrow|today|urgent|now/.test(t) ? "High" : "Normal",
    categories: [],
    requiredItems: [query.trim() || "Requested resource"],
    optionalItems: [],
    keywords: t.split(/\s+/).filter((w) => w.length > 3),
    explanation:
      "Results are ranked using availability, proximity, condition, price and owner trust.",
  };
}
export const formatDistance = (m: number) =>
  m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
export const walkingMinutes = (m: number) => Math.max(1, Math.round(m / 80));

export const defaultFeeConfig: PlatformFeeConfig = {
  percentRate: 5,
  minFee: 10,
  enabled: true,
};

export function calculatePlatformFee(
  dailyCharge: number,
  days: number = 1,
  config: PlatformFeeConfig = defaultFeeConfig,
): number {
  if (!config.enabled || dailyCharge <= 0) return 0;
  const rawFee = Math.round((dailyCharge * days * config.percentRate) / 100);
  return Math.max(rawFee, config.minFee);
}

export function calculateTotalTransaction(
  dailyCharge: number,
  deposit: number,
  days: number = 1,
  config: PlatformFeeConfig = defaultFeeConfig,
) {
  const fee = calculatePlatformFee(dailyCharge, days, config);
  const rental = dailyCharge * days;
  const total = rental + fee + deposit;
  return { rental, fee, deposit, total };
}

