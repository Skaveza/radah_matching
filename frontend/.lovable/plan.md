

# Team Architecture Improvement Plan

## Overview

This plan addresses the key weaknesses in the Intake-to-Team-to-Purchase flow: hardcoded experience levels, static skill mappings, no pricing tier integration, localStorage-only persistence, generic role suggestions, and a bare loading experience.

---

## 1. Smarter AI Team Generation (generate-team edge function)

**Problem:** Experience is hardcoded to "5+ years" for every role. Industry is passed through raw. The AI only picks a template -- it doesn't customize roles.

**Fix:** Update the system prompt to have the AI return experience levels, skill tags, and industry context per role. The edge function will merge AI-personalized data with templates instead of ignoring it.

Changes to `supabase/functions/generate-team/index.ts`:
- Expand the system prompt to request per-role `experienceLevel` and `skillFocus` fields in the JSON response
- Pass budget data to the AI so it can calibrate seniority (e.g., "under $5k" budget shouldn't get all senior roles)
- Replace the hardcoded `experience: "5+ years"` with AI-returned values (with sensible fallbacks)
- Add `skillFocus` field to each role in the response

---

## 2. Dynamic TeamPreview (remove static mappings)

**Problem:** `TeamPreview.tsx` uses static dictionaries (`getSkillFocus`, `getIndustryBackground`) instead of data from the AI.

**Fix:** Read `skillFocus` and industry data directly from the team data stored in localStorage. Remove the static mapping functions entirely.

Changes to `src/pages/TeamPreview.tsx`:
- Remove `getSkillFocus()` and `getIndustryBackground()` functions
- Read skills and industry from each role object in `team.roles`
- Simplify the `AnonymizedProfessional` interface to use role data directly

---

## 3. Pricing Tier Integration

**Problem:** `create-payment` hardcodes a single `PRICE_ID` for $199. The new 3-tier pricing model isn't connected to checkout.

**Fix:** Accept a `tier` parameter from the frontend, map it to the correct Stripe price, and pass it through to checkout.

Changes to `supabase/functions/create-payment/index.ts`:
- Accept `tier` in the request body (`blueprint`, `pro`, or `membership`)
- Map each tier to its Stripe price ID (you'll need to create these products in Stripe first)
- Set checkout `mode` to `subscription` for the membership tier
- Store the tier in checkout metadata

Changes to `src/pages/TeamPreview.tsx`:
- Add tier selection UI (3 cards matching the landing page tiers)
- Pass selected tier to the `create-payment` function
- Update price display based on selected tier

---

## 4. Contextual Add Role Dialog

**Problem:** `AddRoleDialog.tsx` has a static list of 8 generic roles unrelated to the selected team template.

**Fix:** Make the available roles context-aware based on the current team type.

Changes to `src/components/team/AddRoleDialog.tsx`:
- Accept a `teamType` prop (e.g., `mvp_build`, `launch_gtm`)
- Show roles that are relevant to the team template but not already selected
- Pull role suggestions from the same template definitions used by the AI
- Keep the search functionality for discoverability

---

## 5. Better Loading UX for Team Generation

**Problem:** Users see a plain spinner for 5-15 seconds during AI generation with no sense of progress.

**Fix:** Replace the spinner with an animated multi-step loading sequence.

Changes to `src/pages/TeamBuilder.tsx`:
- Create a `TeamBuilderSkeleton` component with animated steps:
  - "Analyzing your project requirements..."
  - "Identifying skill gaps..."
  - "Designing optimal team structure..."
  - "Matching experience levels..."
- Cycle through steps on a timer to give a sense of progression
- Add skeleton cards that preview the layout users will see

---

## 6. Persist Intake Data to Database

**Problem:** Intake data lives only in localStorage. It's lost on browser clear, can't be analyzed, and can't be tied to user accounts.

**Fix:** Save intake submissions to the database for returning users and analytics.

Database migration:
- Create `intake_submissions` table with columns: `id`, `user_id` (nullable), `session_id`, `business_type`, `project_stage`, `industry`, `timeline`, `budget`, `description`, `created_at`
- Add RLS: authenticated users can read their own submissions; service role can insert

Changes to `src/pages/Intake.tsx`:
- On "Generate My Team", save to the database (if user is logged in) alongside localStorage
- Generate a session ID for anonymous users to link data later

Changes to `src/pages/TeamBuilder.tsx`:
- Also persist the generated team result back to the database for the same intake submission

---

## 7. Role Data Model Enhancement

**Problem:** Role objects only have `experience` (hardcoded) and `industry` (raw passthrough). No skills data.

**Fix:** Extend the `Role` interface across all components.

Changes across `TeamBuilder.tsx`, `TeamPreview.tsx`, `RoleCard.tsx`, `AddRoleDialog.tsx`:
- Add `skillFocus: string` to the Role interface
- Update `RoleCard` to display skill tags as badges
- Keep backward compatibility with optional fields

---

## Implementation Sequence

1. Database migration (intake_submissions table)
2. Edge function update (generate-team with smarter AI output)
3. Role interface + RoleCard updates (skill badges)
4. TeamBuilder loading UX
5. TeamPreview dynamic data + tier selection
6. create-payment tier support (requires Stripe product creation first)
7. Contextual AddRoleDialog
8. Intake persistence

---

## Technical Notes

- The Stripe price IDs for the Pro ($399) and Membership ($149/mo) tiers need to be created in Stripe before the create-payment changes can work. This can be done via the Stripe tools during implementation.
- The generate-team function will use the same Lovable AI gateway (gemini-2.5-flash) -- only the prompt changes.
- All existing localStorage behavior is preserved as a fallback; database persistence is additive.

