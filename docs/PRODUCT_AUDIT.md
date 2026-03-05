# Radah Works – Product Audit & Breakdown Report

## 1. What the Project Is About

**Radah Works** is an AI-powered team architecture platform that helps founders understand *who* to hire *before* they hire anyone. It positions itself as a strategic team intelligence platform—not a freelance marketplace.

**Core flow:**
1. Founder describes their project (industry, stage, budget, description)
2. AI recommends an optimal team structure (4–7 roles) with reasoning
3. Founder customizes roles and gets matched to pre-vetted professionals
4. One-time payment ($199) unlocks full contact details
5. Founder hires directly; Radah does not take a cut of work payments

---

## 2. Value Proposition

| Claim | Detail |
|-------|--------|
| **vs. Agencies** | Replaces $10,000+ discovery fees with $199 |
| **vs. DIY** | Saves 40+ hours of research |
| **vs. ChatGPT** | Stage-specific, budget-aware recommendations + vetted contacts |
| **vs. Upwork** | No marketplace noise; curated, pre-vetted professionals |

**Differentiation:** "Team intelligence platform"—focuses on *who* and *why* to hire, then connects to vetted talent.

---

## 3. Users & Market

### Primary: Entrepreneurs / Founders

- Pre-MVP to growth-stage
- Need to build a team but lack hiring experience
- Want to avoid agency fees and marketplace noise

### Secondary: Professionals

- Developers, designers, PMs, etc.
- Apply to join the network
- Get matched to projects; no fee to join

### Market

- Early-stage founders, bootstrapped and funded
- Trust bar: Y Combinator, Techstars, 500 Startups, Indie Hackers, Product Hunt (social proof only, not verified)

---

## 4. Business Model

| Revenue Stream | Price | Notes |
|----------------|-------|-------|
| **Team Blueprint** | $199 one-time | Main product; 4–7 roles, vetted contacts |
| **Team Blueprint Pro** | $399 one-time | Concierge intros, 2 scenarios, 30-day support |
| **Team Architect** | $149/month | Unlimited architectures, serial founders |
| **Placement fee** | 5% (capped $2,500) | Per FAQ, when hiring through the platform |

**Current implementation:** Stripe checkout for one-time and subscription; placement fee not clearly implemented in code.

---

## 5. UX Flow

### Entrepreneur Journey

```
Landing → Login/Signup → Choose Role (Entrepreneur) → Dashboard
  → Intake (4-step project form) → Team Builder (AI roles + customize)
  → Team Preview (locked contacts) → Stripe Checkout ($199) → Unlocked contacts
```

### Professional Journey

```
Landing → Login/Signup → Choose Role (Professional) → Professional Application
  → Pending Admin Review → Approved → View matches in dashboard
```

### Key Pages

| Page | Purpose |
|------|---------|
| `/` | Landing: Hero, How It Works, Pricing, FAQ, Testimonials |
| `/login`, `/signup` | Auth |
| `/choose-role` | Entrepreneur vs Professional |
| `/intake` | 4-step project intake |
| `/team-builder` | AI roles, add/remove, generate team |
| `/team-preview` | Locked contacts; Stripe checkout |
| `/dashboard` | Entrepreneur projects |
| `/professional-dashboard` | Professional matches |
| `/professional-apply` | Professional application |
| `/admin` | Approve/reject professionals, manage network |

---

## 6. Technical Architecture (Summary)

- **Frontend:** React 18, Vite, TypeScript, Tailwind, shadcn/ui
- **Backend:** PHP 8+, regex routing, Firestore, Stripe
- **Auth:** Firebase Auth (email + Google)
- **Matching:** NLP extraction, TF-IDF similarity, multi-factor scoring
- **Payments:** Stripe Checkout (one-time + subscription)

---

## 7. Current Gaps & Issues

### UX / Conversion

| Gap | Severity | Description |
|-----|----------|-------------|
| **Sign Up tab empty** | High | Login page "Sign Up" tab shows blank content; must use `/signup` directly |
| **No Sign Up in header** | Medium | Header only has "Sign In"; no "Sign Up" link |
| **Free Assessment fake** | High | Form shows "Check your email" but does not send anything; no backend |
| **Stale urgency** | Medium | Countdown targets "February 28, 2026" (already past) |
| **"Compare all features" dead** | Low | Button has no target or behavior |

### Navigation & Routing

| Gap | Severity | Description |
|-----|----------|-------------|
| **Footer `/professionals`** | Medium | Links to `/professionals`; actual route is `/professional-apply` |
| **Footer Admin link** | Low | Public link to `/admin`; protected by auth but still exposed |
| **Edit Project** | Medium | "Edit Project" goes to new intake, not edit of existing project |

### Product / Feature

| Gap | Severity | Description |
|-----|----------|-------------|
| **PDF export** | High | FAQ mentions "comprehensive PDF"; no export implemented |
| **Placement fee** | Medium | 5% fee mentioned in FAQ; not clearly implemented |
| **Concierge intros (Pro)** | Medium | Pro tier mentions concierge; unclear if implemented |
| **Team refresh** | Low | Pro mentions "1 free team refresh within 90 days"; unclear |

### Data & Trust

| Gap | Severity | Description |
|-----|----------|-------------|
| **Testimonials** | Medium | Names/companies look placeholder; no verification |
| **Trust bar** | Low | YC, Techstars, etc. are labels only; no real affiliation |
| **Stats** | Low | "1,247 founders", "94% match rate"—source unclear |

### Technical

| Gap | Severity | Description |
|-----|----------|-------------|
| **CORS** | Fixed | `localhost:8080` was missing; now added |
| **Empty professional pool** | High | New Firebase project has no professionals; matching will fail or be empty |
| **Stripe config** | Medium | Needs `STRIPE_*` env vars for live payments |

---

## 8. Recommendations (Priority)

1. **Fix Sign Up tab** – Add `TabsContent` for signup or use a `Link` to `/signup`
2. **Implement Free Assessment** – Backend + email (or at least a clear "coming soon")
3. **Update urgency** – Fix countdown date or remove if no longer relevant
4. **Fix Footer links** – Point "For Professionals" to `/professional-apply`
5. **Seed professionals** – Add sample professionals for demos and testing
6. **Clarify testimonials** – Mark as examples or replace with real, verified ones
7. **PDF export** – Implement or remove from FAQ until ready

---

## 9. Summary

Radah Works targets founders who want structured team advice and vetted contacts at a fraction of agency cost. The core flow (intake → team builder → preview → checkout) is in place, but several UX, trust, and feature gaps can hurt conversion and credibility. Addressing the Sign Up flow, Free Assessment, and professional pool will have the biggest impact for early users.
