export type RiskStyle = "Conservative" | "Balanced" | "Aggressive";
export type InvestmentHorizon = "Short swing" | "Positional" | "Long term";
export type InvestmentGoal = "Capital preservation" | "Steady compounding" | "Growth";

export interface InvestorProfile {
  riskStyle: RiskStyle;
  horizon: InvestmentHorizon;
  goal: InvestmentGoal;
}

export const DEFAULT_INVESTOR_PROFILE: InvestorProfile = {
  riskStyle: "Balanced",
  horizon: "Positional",
  goal: "Steady compounding",
};

export function formatInvestorProfile(profile: InvestorProfile): string {
  return `${profile.riskStyle} risk, ${profile.horizon.toLowerCase()} horizon, ${profile.goal.toLowerCase()} goal`;
}
