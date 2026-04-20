// src/lib/navigation/flowRules.ts

export type ProjectState = {
  teamMembers: any[];
  milestones: any[];
  financials: any[];
};

export function getNextRoute(state: ProjectState): string {
  if (!state.teamMembers.length) return "/TeamArchitecture";

  if (state.teamMembers.length < 3) return "/CandidatePipeline";

  if (!state.milestones.length) return "/ProjectExecution";

  if (!state.financials.length) return "/BudgetRunway";

  return "/InvestorReadiness";
}

export function getFlowStep(state: ProjectState) {
  if (!state.teamMembers.length) {
    return { step: 1, total: 5, label: "Unlock Team" };
  }

  if (state.teamMembers.length < 3) {
    return { step: 2, total: 5, label: "Build Team" };
  }

  if (!state.milestones.length) {
    return { step: 3, total: 5, label: "Define Execution" };
  }

  if (!state.financials.length) {
    return { step: 4, total: 5, label: "Track Finances" };
  }

  return { step: 5, total: 5, label: "Investor Ready" };
}