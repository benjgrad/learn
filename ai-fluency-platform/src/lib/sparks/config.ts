import type { SparkEconConfig, SparkPurchaseTier } from "@/types/sparks";
import { isSparkGatingEnabled } from "./feature-flags";

export const SPARK_CONFIG: SparkEconConfig = {
  lessonReward: 10,
  lessonRepeatReward: 5,
  lessonRepeatMaxRewards: 3,
  quizBaseReward: 5,
  quizPerCorrectBonus: 2,
  quizPerfectBonus: 5,
  streakBonusTable: { 7: 20, 14: 35, 21: 50, 30: 75 },
  weeklyMilestoneReward: 10,
  dailyEarnCap: 500,
  subscriberDailyEarnCap: 1000,
  subscriberMultiplier: 2,
  subscriberDailyBonus: 5,
  cooldownHours: 0,
  freeLessonsPerDay: Infinity,
  cooldownSkipCost: 25,
  streakFreezeCost: 50,
  startingBalance: 1000,
  coursePrices: {
    "web-fundamentals": 0,
    "react-literacy": 0,
    "claude-code": 0,
    "system-design": 0,
    "cfa-1": 0,
    "cfa-2": 0,
    "cfa-3": 0,
  },
  freeCourses: [
    "ai-fluency",
    "texas-holdem",
    "web-fundamentals",
    "react-literacy",
    "claude-code",
    "system-design",
    "cfa-1",
    "cfa-2",
    "cfa-3",
  ],
  diminishingReturnsThreshold: 3,
  diminishingReturnsMultiplier: 0.5,
};

const BEN_CONFIG_OVERRIDES: Partial<SparkEconConfig> = {
  cooldownHours: 20,
  freeLessonsPerDay: 5,
  coursePrices: {
    "web-fundamentals": 75,
    "react-literacy": 100,
    "claude-code": 100,
    "system-design": 100,
    "cfa-1": 50,
    "cfa-2": 75,
    "cfa-3": 75,
  },
  freeCourses: ["ai-fluency", "texas-holdem"],
};

export function getEffectiveConfig(email: string | null | undefined): SparkEconConfig {
  if (!isSparkGatingEnabled(email)) return SPARK_CONFIG;
  return { ...SPARK_CONFIG, ...BEN_CONFIG_OVERRIDES } as SparkEconConfig;
}

export const PURCHASE_TIERS: SparkPurchaseTier[] = [
  { id: "starter", sparks: 50, priceUsd: 0.99, bonusSparks: 25, label: "Starter" },
  { id: "explorer", sparks: 300, priceUsd: 4.99, bonusSparks: 100, label: "Explorer" },
  { id: "adventurer", sparks: 700, priceUsd: 9.99, bonusSparks: 200, label: "Adventurer" },
  { id: "champion", sparks: 2000, priceUsd: 24.99, bonusSparks: 500, label: "Champion" },
  { id: "legend", sparks: 4500, priceUsd: 49.99, bonusSparks: 1000, label: "Legend" },
];
