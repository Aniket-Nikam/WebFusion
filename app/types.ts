export type Category =
  | "Cameras"
  | "Computing"
  | "Books"
  | "Electronics"
  | "Audio"
  | "Tools"
  | "Instruments"
  | "Study";
export type CampusLocation =
  | "Main Building"
  | "Library"
  | "Engineering Block"
  | "Hostel Gate"
  | "Canteen"
  | "Innovation Lab";
export type User = {
  id: string;
  name: string;
  initials: string;
  department: string;
  year: string;
  verified: boolean;
  trust: number;
  rating: number;
  exchanges: number;
  onTime: number;
  lateReturns: number;
  disputes: number;
  responseMinutes: number;
  memberSince: string;
  badges: string[];
  suspended?: boolean;
};
export type Resource = {
  id: string;
  title: string;
  category: Category;
  description: string;
  ownerId: string;
  location: CampusLocation;
  distance: number;
  condition: "Like new" | "Excellent" | "Good" | "Fair";
  availableNow: boolean;
  unavailableDates: string[];
  charge: number;
  deposit: number;
  accessories: string[];
  conditions: string[];
  successfulBorrows: number;
  tags: string[];
  pickupOptions: string[];
  image: string;
  donation?: boolean;
};
export type ExchangeStage =
  | "Requested"
  | "Approved"
  | "Pickup scheduled"
  | "In use"
  | "Return due"
  | "Returned"
  | "Deposit settled"
  | "Disputed";
export type Exchange = {
  id: string;
  resourceIds: string[];
  ownerId: string;
  borrowerId: string;
  startDate: string;
  endDate: string;
  pickup: string;
  stage: ExchangeStage;
  createdAt: string;
  pickupCode: string;
  returnCode: string;
  conditionBefore: Record<string, boolean>;
  conditionAfter?: Record<string, boolean>;
  platformFee?: number;
};
export type CommunityRequest = {
  id: string;
  title: string;
  category: Category;
  details: string;
  neededBy: string;
  requesterId: string;
  status: "Open" | "Matched";
  createdAt: string;
};
export type Dispute = {
  id: string;
  exchangeId: string;
  reporterId: string;
  reason: string;
  details: string;
  evidenceImage?: string;
  claimedDepositDeduction: number;
  submittedAt: string;
  status: "Open" | "Resolved" | "Under Review";
};
export type PlatformFeeConfig = {
  percentRate: number;
  minFee: number;
  enabled: boolean;
};
export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  tone: "green" | "amber" | "blue";
};
export type NeedAnalysis = {
  intent: string;
  urgency: string;
  categories: Category[];
  requiredItems: string[];
  optionalItems: string[];
  keywords: string[];
  explanation: string;
};

