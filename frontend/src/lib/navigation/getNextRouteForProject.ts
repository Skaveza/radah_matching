// src/lib/navigation/getNextRouteForProject.ts

import { listItems, RESOURCES } from "@/lib/projectApi";
import { getNextRoute, getFlowStep } from "@/lib/navigation/flowRules";

export async function getNextRouteForProject(projectId: string) {
  const [teamMembers, milestones, financials] = await Promise.all([
    listItems(RESOURCES.TEAM_MEMBERS, projectId),
    listItems(RESOURCES.MILESTONES, projectId),
    listItems(RESOURCES.FINANCIAL_ENTRIES, projectId),
  ]);

  const state = { teamMembers, milestones, financials };

  return getNextRoute(state);
}

export async function getProjectFlow(projectId: string) {
  const [teamMembers, milestones, financials] = await Promise.all([
    listItems(RESOURCES.TEAM_MEMBERS, projectId),
    listItems(RESOURCES.MILESTONES, projectId),
    listItems(RESOURCES.FINANCIAL_ENTRIES, projectId),
  ]);

  const state = { teamMembers, milestones, financials };

  return {
    route: getNextRoute(state),
    step: getFlowStep(state),
  };
}