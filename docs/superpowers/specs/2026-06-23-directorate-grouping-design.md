# Directorate-Based Grouping — Design Spec
**Date:** 2026-06-23
**Project:** CLET M&E Dashboard (clet-dashboard)
**Status:** Approved

---

## Problem

The Management Home currently shows all 4 Strategic Objectives (SO1–SO4) in a flat 2×2 grid to every management user. Users must scroll through all SOs and all thematic areas regardless of which directorate they belong to. There is no concept of a user's directorate in the system.

## Goal

When a management user logs in, they immediately see only the thematic areas that belong to their directorate, grouped under their parent Strategic Objectives — so they can navigate straight to their work without wading through other directorates' tasks.

---

## Source of Truth for Directorate Ownership

The thematic area name already encodes the owning directorate in parentheses at the end:

```
"11. Centre of Excellence (GSL)"   → GSL directorate
"3. ICT Infrastructure (DTI)"      → DTI directorate
"7. Accreditation Standards (AQAI)" → AQAI directorate
```

This is the authoritative mapping — no separate lookup table is needed.

---

## CLET Directorates (from Act 1170, §30A.9.3 C)

| Code | Full Name |
|------|-----------|
| GSL  | Ghana School of Law |
| CDT  | Curriculum Development & Training |
| AQAI | Accreditation, Quality Assurance & Inspectorate |
| LRKS | Learning, Research & Knowledge Services |
| DTI  | Digital Transformation & Innovation |
| CCP  | Communications, Comms & Partnerships |
| P&C  | People & Culture |
| RMF  | Resource Mobilisation & Finance |
| SF&L | Safety, Facilities & Logistics |
| C&A  | Compliance & Audit |

---

## Architecture

### Backend (3 changes)

1. **`app/models.py`** — add nullable `directorate` column to `User`:
   ```python
   directorate: Mapped[str | None] = mapped_column(String(20), nullable=True, default=None)
   ```

2. **`app/routers/auth.py`** — return `directorate` in both `/auth/login` and `/auth/me` responses.

3. **`app/seed.py`** — set `directorate` for existing management users when re-seeding.

> Migration: the column is nullable with no default — existing rows are unaffected until explicitly set.

### Frontend (focused changes)

| File | Change |
|------|--------|
| `src/context/AuthContext.jsx` | Include `directorate` in the session object stored in localStorage |
| `src/utils/helpers.js` | Add `parseDirectorateFromArea(name)` utility + `DIRECTORATE_NAMES` map |
| `src/components/management/ManagementHome.jsx` | Replace 2×2 SO grid with directorate-grouped thematic area view |
| `src/components/management/SODetailPage.jsx` | Filter thematic area list to user's directorate for `management` role |
| `src/store/useDataStore.js` | Add `getDirectorateAreas(directorate)` selector |

**No changes to:** DGDashboard, ThematicAreaPage, TaskDetailPage, routing, import/export, visibility controls.

---

## UI Design

### Management Home — new layout

```
┌─────────────────────────────────────────────────────────┐
│ CLET Management Portal                        [header]  │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  GSL  Ghana School of Law              ◯ 58%      │  │
│  │  3 thematic areas · 13 tasks                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  SO2 — Curriculum & Training                            │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Centre of       │  │ Student Welfare  │              │
│  │ Excellence      │  │                 │              │
│  │ ◯ 62%  4 tasks  │  │ ◯ 30%  6 tasks  │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  SO3 — Standards & Regulation                           │
│  ┌─────────────────┐                                    │
│  │ GSL Accreditation│                                   │
│  │ ◯ 80%  3 tasks  │                                    │
│  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────┘
```

**Components:**

- **`DirectorateHero`** (new) — directorate code badge + full name, overall progress ring, total areas + tasks count
- **`SOSection`** (new) — section header per SO (number + short title), contains thematic area cards
- **`AreaCard`** — reused from SODetailPage; clicking navigates to `/management/so/{soNumber}/area/{areaIndex}`

### SODetailPage — directorate filter

When `user.role === 'management'` and `user.directorate` is set, the thematic groups rendered are pre-filtered to areas where `parseDirectorateFromArea(area) === user.directorate`. DG users continue to see all areas.

> **Index stability:** `ThematicAreaPage` resolves `areaIndex` from the URL against the **full unfiltered** sorted areas list (`sortedAreas[Number(areaIndex)]`). Therefore, filtering must never re-index: always build the complete `thematicGroups` array first (preserving each group's position in the full list as its `idx`), then filter which cards are rendered. The same rule applies to navigation links generated in `ManagementHome` — each thematic area card must carry the index it holds in the full SO-level sorted list, not its position among the directorate-filtered subset.

---

## New Utilities (`helpers.js`)

```js
// Extract directorate code from thematic area name
// "11. Centre of Excellence (GSL)" → "GSL"
// Returns null if no parenthesised suffix found
export function parseDirectorateFromArea(areaName) {
  const m = areaName?.match(/\(([^)]+)\)\s*$/)
  return m ? m[1].trim() : null
}

export const DIRECTORATE_NAMES = {
  GSL:  'Ghana School of Law',
  CDT:  'Curriculum Development & Training',
  AQAI: 'Accreditation, Quality Assurance & Inspectorate',
  LRKS: 'Learning, Research & Knowledge Services',
  DTI:  'Digital Transformation & Innovation',
  CCP:  'Communications, Comms & Partnerships',
  'P&C': 'People & Culture',
  RMF:  'Resource Mobilisation & Finance',
  'SF&L': 'Safety, Facilities & Logistics',
  'C&A': 'Compliance & Audit',
}
```

---

## Data Flow

```
Login
  → POST /auth/login → { role, name, email, directorate: "GSL", access_token }
  → AuthContext stores { role, name, email, directorate } in localStorage

ManagementHome mounts
  → reads user.directorate from AuthContext
  → reads tasks from useDataStore
  → filters tasks: parseDirectorateFromArea(task.thematic_area) === user.directorate
  → groups by so_number → sorted by SO number
  → renders DirectorateHero + one SOSection per group

SODetailPage mounts
  → if user.role === 'management' && user.directorate
    → thematicGroups filtered to user's directorate before render
  → else (DG): all thematic groups rendered as before
```

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Management user has no `directorate` set | Falls back to showing all SOs and all thematic areas (no lockout) |
| Directorate has no thematic areas in loaded data | Empty state: "No thematic areas found for your directorate. Data may not be imported yet." |
| Thematic area name has no `(CODE)` suffix | `parseDirectorateFromArea` returns `null`; area excluded from filtered views, still visible to DG |
| DG visits `/management` | Protected by `allowedRoles` — DG routes to `/dashboard` unchanged |
| Management user visits `/management/so/:soNumber` via direct URL | SODetailPage filters to their directorate — only their thematic areas shown |
| Unknown directorate code returned from backend | Full name lookup returns the raw code — no crash |

---

## Out of Scope

- Admin UI to assign directorates to users (done via seed script or direct DB for now)
- Directorate-level visibility toggle (separate future feature)
- Any changes to the DG dashboard
