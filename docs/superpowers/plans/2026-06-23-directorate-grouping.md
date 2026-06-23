# Directorate-Based Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a management user logs in, they see only their directorate's thematic areas grouped by Strategic Objective, instead of the flat SO 2×2 grid.

**Architecture:** Add a nullable `directorate` column to the `users` DB table and return it from auth endpoints. On the frontend, parse the directorate code already embedded in thematic area names (e.g. `"11. Centre of Excellence (GSL)"` → `"GSL"`) and use it to filter and group the management home view. DG dashboard is untouched.

**Tech Stack:** FastAPI + SQLAlchemy (async) + PostgreSQL (backend); React 18 + Zustand + Vite + Tailwind CSS (frontend); framer-motion for animations; lucide-react for icons.

## Global Constraints

- Backend root: `D:\GSL\backend\app\`
- Frontend root: `D:\GSL\clet-dashboard\src\`
- Frontend dev server: `http://localhost:5174` (run `npm run dev` in `D:\GSL\clet-dashboard`)
- Backend dev server: run with `uv run fastapi dev app/main.py` (or equivalent) from `D:\GSL\backend`
- The `directorate` column is nullable — existing users without one set must not be locked out
- Never re-index thematic areas — `ThematicAreaPage` looks up areas by their position in the full unfiltered sorted list
- DGDashboard, ThematicAreaPage, TaskDetailPage, routing: no changes
- Colour tokens: navy `#0A1F3D`, gold `#B8943A`, muted gold `#806014`
- All text uses `font-sans` class; monospace labels use `font-mono`

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `app/models.py` | Modify | Add `directorate: Mapped[str \| None]` to `User` |
| `app/schemas.py` | Modify | Add `directorate: str \| None` to `TokenResponse` and `UserOut` |
| `app/routers/auth.py` | Modify | Return `user.directorate` from `/login` and `/me` |
| `app/seed.py` | Modify | Add `directorate` to USERS entries |
| `src/utils/helpers.js` | Modify | Add `parseDirectorateFromArea()` + `DIRECTORATE_NAMES` |
| `src/store/useDataStore.js` | Modify | Add `getDirectorateAreas(directorate)` selector |
| `src/context/AuthContext.jsx` | Modify | Store `directorate` in session object |
| `src/components/management/ManagementHome.jsx` | Rewrite | DirectorateHero + SOSection layout |
| `src/components/management/SODetailPage.jsx` | Modify | Filter thematic groups by user's directorate |

---

## Task 1: Backend — directorate field on User

**Files:**
- Modify: `app/models.py`
- Modify: `app/schemas.py`
- Modify: `app/routers/auth.py`
- Modify: `app/seed.py`

**Interfaces:**
- Produces: `GET /auth/me` and `POST /auth/login` both return `{ directorate: string | null }` alongside existing fields

- [ ] **Step 1: Add `directorate` column to the User model**

Open `app/models.py`. The current `User` class ends at `created_at`. Add one line after `role`:

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    directorate: Mapped[str | None] = mapped_column(String(20), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
```

- [ ] **Step 2: Add `directorate` to the Pydantic schemas**

Open `app/schemas.py`. Make these two changes:

`TokenResponse` — add one field:
```python
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str
    directorate: str | None = None
```

`UserOut` — add one field:
```python
class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    directorate: str | None = None

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: Return directorate from both auth endpoints**

Open `app/routers/auth.py`. Update the `/login` endpoint to include `directorate` in the `TokenResponse`:

```python
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(
        access_token=token,
        role=user.role,
        name=user.name,
        email=user.email,
        directorate=user.directorate,
    )
```

The `/me` endpoint already returns the `User` ORM object via `UserOut` — because `UserOut` now includes `directorate` and has `from_attributes = True`, it will be included automatically. No change needed there.

- [ ] **Step 4: Update seed.py to set directorates for management users**

Open `app/seed.py`. Replace the `USERS` list with one that includes directorate. Add as many directorate-specific users as needed. The example below seeds one DG (no directorate) and one management user per directorate:

```python
USERS = [
    {"email": "dg@clet.gov.gh",           "name": "Director General",        "password": "CLET@DG2026",    "role": "dg",         "directorate": None},
    {"email": "gsl@clet.gov.gh",           "name": "GSL Management",          "password": "CLET@GSL2026",   "role": "management", "directorate": "GSL"},
    {"email": "dti@clet.gov.gh",           "name": "DTI Management",          "password": "CLET@DTI2026",   "role": "management", "directorate": "DTI"},
    {"email": "cdt@clet.gov.gh",           "name": "CDT Management",          "password": "CLET@CDT2026",   "role": "management", "directorate": "CDT"},
    {"email": "aqai@clet.gov.gh",          "name": "AQAI Management",         "password": "CLET@AQAI2026",  "role": "management", "directorate": "AQAI"},
    {"email": "lrks@clet.gov.gh",          "name": "LRKS Management",         "password": "CLET@LRKS2026",  "role": "management", "directorate": "LRKS"},
    {"email": "ccp@clet.gov.gh",           "name": "CCP Management",          "password": "CLET@CCP2026",   "role": "management", "directorate": "CCP"},
    {"email": "pc@clet.gov.gh",            "name": "P&C Management",          "password": "CLET@PC2026",    "role": "management", "directorate": "P&C"},
    {"email": "rmf@clet.gov.gh",           "name": "RMF Management",          "password": "CLET@RMF2026",   "role": "management", "directorate": "RMF"},
    {"email": "sfl@clet.gov.gh",           "name": "SF&L Management",         "password": "CLET@SFL2026",   "role": "management", "directorate": "SF&L"},
    {"email": "ca@clet.gov.gh",            "name": "C&A Management",          "password": "CLET@CA2026",    "role": "management", "directorate": "C&A"},
    {"email": "management@clet.gov.gh",    "name": "Management User",         "password": "CLET@Mgmt2026",  "role": "management", "directorate": None},
]
```

Update the user creation loop to pass `directorate`:

```python
async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for u in USERS:
            exists = await db.execute(select(User).where(User.email == u["email"]))
            if not exists.scalar_one_or_none():
                db.add(User(
                    email=u["email"],
                    name=u["name"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    directorate=u["directorate"],
                ))
                print(f"  ✓ Created user: {u['email']}")
            else:
                print(f"  – User already exists: {u['email']}")

        for so in SOS:
            exists = await db.execute(select(SOVisibility).where(SOVisibility.so_number == so))
            if not exists.scalar_one_or_none():
                db.add(SOVisibility(so_number=so, is_visible=True))
                print(f"  ✓ Created visibility row: {so}")

        await db.commit()
    print("Seed complete.")
```

- [ ] **Step 5: Apply the DB migration**

The `directorate` column is new — `create_all` won't add it to an existing table. Run this SQL against your PostgreSQL database (use psql, TablePlus, DBeaver, or any client):

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS directorate VARCHAR(20);
```

Verify it was added:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'directorate';
```

Expected output: one row with `directorate | character varying | YES`.

- [ ] **Step 6: Run the seed to create directorate users**

```bash
cd D:\GSL\backend
uv run python -m app.seed
```

Expected output: lines like `✓ Created user: gsl@clet.gov.gh` (or `– User already exists` for users that already exist).

- [ ] **Step 7: Verify the login endpoint returns directorate**

Start the backend server, then in a terminal or browser:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gsl@clet.gov.gh","password":"CLET@GSL2026"}'
```

Expected response includes `"directorate": "GSL"`:
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "role": "management",
  "name": "GSL Management",
  "email": "gsl@clet.gov.gh",
  "directorate": "GSL"
}
```

- [ ] **Step 8: Commit**

```bash
cd D:\GSL\backend
git add app/models.py app/schemas.py app/routers/auth.py app/seed.py
git commit -m "feat: add directorate field to User model and auth responses"
```

---

## Task 2: Frontend utilities — helpers.js

**Files:**
- Modify: `src/utils/helpers.js`

**Interfaces:**
- Produces:
  - `parseDirectorateFromArea(areaName: string): string | null` — extracts directorate code from thematic area name
  - `DIRECTORATE_NAMES: Record<string, string>` — maps code → full name

- [ ] **Step 1: Add the utility function and names map**

Open `src/utils/helpers.js`. Append these two exports at the end of the file (after `formatDateTime`):

```js
export function parseDirectorateFromArea(areaName) {
  const m = areaName?.match(/\(([^)]+)\)\s*$/)
  return m ? m[1].trim() : null
}

export const DIRECTORATE_NAMES = {
  GSL:   'Ghana School of Law',
  CDT:   'Curriculum Development & Training',
  AQAI:  'Accreditation, Quality Assurance & Inspectorate',
  LRKS:  'Learning, Research & Knowledge Services',
  DTI:   'Digital Transformation & Innovation',
  CCP:   'Communications, Comms & Partnerships',
  'P&C': 'People & Culture',
  RMF:   'Resource Mobilisation & Finance',
  'SF&L':'Safety, Facilities & Logistics',
  'C&A': 'Compliance & Audit',
}
```

- [ ] **Step 2: Verify in browser console**

Start the frontend dev server (`npm run dev` in `D:\GSL\clet-dashboard`). Open the app in the browser, open DevTools console, and run:

```js
// Import via module (paste into console after app loads)
// Or simply check the function works by looking at the network tab for any errors
```

Since Vite bundles modules, the easiest verification is to temporarily add a log to `ManagementHome.jsx` in the next task and confirm it outputs correctly. Proceed to Task 3.

- [ ] **Step 3: Commit**

```bash
cd D:\GSL\clet-dashboard
git add src/utils/helpers.js
git commit -m "feat: add parseDirectorateFromArea utility and DIRECTORATE_NAMES map"
```

---

## Task 3: Data store — getDirectorateAreas selector

**Files:**
- Modify: `src/store/useDataStore.js`

**Interfaces:**
- Consumes: `parseDirectorateFromArea` from `../../utils/helpers`, `SO_SHORT_TITLES` from `../../utils/helpers`
- Produces: `getDirectorateAreas(directorate: string): Array<{ so_number, so_title, areas: Array<{ area, idx, total, completed, in_progress, at_risk, progress_pct }> }>`
  - `idx` is the area's position in the **full** sorted area list for that SO (not its position among directorate-filtered results)
  - Returns only SOs that have at least one matching area
  - Returns `[]` if no tasks loaded yet

- [ ] **Step 1: Add the import and selector**

Open `src/store/useDataStore.js`. At the top, add the import:

```js
import { parseDirectorateFromArea, SO_SHORT_TITLES } from '../utils/helpers'
```

Inside the `create((set, get) => ({ ... }))` object, add `getDirectorateAreas` after `getSOSummaries`:

```js
getDirectorateAreas: (directorate) => {
  const tasks = get().tasks
  const result = []

  for (const so of ['SO1', 'SO2', 'SO3', 'SO4']) {
    const soTasks = tasks.filter(t => t.so_number === so)
    const allAreas = [...new Set(soTasks.map(t => t.thematic_area).filter(Boolean))]
      .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))

    const dirAreas = allAreas
      .map((area, idx) => {
        if (parseDirectorateFromArea(area) !== directorate) return null
        const areaTasks = soTasks.filter(t => t.thematic_area === area)
        return {
          area,
          idx,
          total:       areaTasks.length,
          completed:   areaTasks.filter(t => t.status === 'Completed').length,
          in_progress: areaTasks.filter(t => t.status === 'In Progress').length,
          at_risk:     areaTasks.filter(t => t.status === 'At Risk').length,
          progress_pct: areaTasks.length
            ? Math.round(areaTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / areaTasks.length)
            : 0,
        }
      })
      .filter(Boolean)

    if (dirAreas.length > 0) {
      result.push({
        so_number: so,
        so_title: soTasks[0]?.so_title || SO_SHORT_TITLES[so] || so,
        areas: dirAreas,
      })
    }
  }
  return result
},
```

- [ ] **Step 2: Commit**

```bash
cd D:\GSL\clet-dashboard
git add src/store/useDataStore.js
git commit -m "feat: add getDirectorateAreas selector to data store"
```

---

## Task 4: AuthContext — store directorate in session

**Files:**
- Modify: `src/context/AuthContext.jsx`

**Interfaces:**
- Consumes: backend `/auth/login` response now includes `directorate`
- Produces: `useAuth()` returns `{ user: { userId, role, name, email, directorate }, login, logout }`

- [ ] **Step 1: Update the login function to store directorate**

Open `src/context/AuthContext.jsx`. In the `login` callback, update the session object to include `directorate`:

```js
const login = useCallback(async (email, password) => {
  try {
    const data = await api.post('/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.access_token)
    const session = {
      userId: null,
      role: data.role,
      name: data.name,
      email: data.email,
      directorate: data.directorate ?? null,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return true
  } catch {
    return false
  }
}, [])
```

- [ ] **Step 2: Update the /auth/me validation to include directorate**

In the same file, update the `useEffect` that validates the stored token on mount:

```js
useEffect(() => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) { setUser(null); return }
  api.get('/auth/me')
    .then(data => {
      const session = {
        userId: data.id,
        role: data.role,
        name: data.name,
        email: data.email,
        directorate: data.directorate ?? null,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
    })
    .catch(() => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(SESSION_KEY)
      setUser(null)
    })
}, [])
```

- [ ] **Step 3: Verify in browser**

Log in with `gsl@clet.gov.gh` / `CLET@GSL2026`. Open DevTools → Application → Local Storage → find `clet_session`. It should contain:

```json
{
  "userId": null,
  "role": "management",
  "name": "GSL Management",
  "email": "gsl@clet.gov.gh",
  "directorate": "GSL"
}
```

- [ ] **Step 4: Commit**

```bash
cd D:\GSL\clet-dashboard
git add src/context/AuthContext.jsx
git commit -m "feat: include directorate in auth session"
```

---

## Task 5: ManagementHome — directorate view

**Files:**
- Rewrite: `src/components/management/ManagementHome.jsx`

**Interfaces:**
- Consumes:
  - `useAuth()` → `user.directorate: string | null`
  - `useDataStore(s => s.getDirectorateAreas(directorate))` → `Array<{ so_number, so_title, areas }>`
  - `useDataStore(s => s.getSOSummaries())` → for the no-directorate fallback
  - `DIRECTORATE_NAMES[code]` → full directorate name string
  - `getAreaAbbrev(areaName)` → short abbreviation for card header
  - `parseDirectorateFromArea` is used in the store, not here directly
- Produces: renders the directorate-grouped home for management users; falls back to the original SO grid when `user.directorate` is null

- [ ] **Step 1: Replace ManagementHome.jsx with the new implementation**

Overwrite `src/components/management/ManagementHome.jsx` with:

```jsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Header } from '../layout/Header'
import { ProgressRing } from '../dashboard/ProgressRing'
import { useAuth } from '../../context/AuthContext'
import useDataStore from '../../store/useDataStore'
import { SO_SHORT_TITLES, DIRECTORATE_NAMES, getAreaAbbrev } from '../../utils/helpers'
import { useRealtimeSync } from '../../hooks/useRealtimeSync'

function DirectorateHero({ code, name, totalAreas, totalTasks, progressPct }) {
  return (
    <div className="mb-8 rounded-2xl bg-[#0A1F3D] px-6 py-5 flex items-center gap-6">
      <ProgressRing value={progressPct} size={68} strokeWidth={6} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#B8943A] uppercase tracking-widest font-sans">{code}</span>
        </div>
        <h2 className="font-sans font-bold text-white text-lg leading-snug">{name}</h2>
        <p className="text-xs text-white/50 font-sans mt-0.5">
          {totalAreas} thematic {totalAreas === 1 ? 'area' : 'areas'} · {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
        </p>
      </div>
    </div>
  )
}

function DirectorateAreaCard({ area, animDelay, onClick }) {
  const areaLabel = area.area
    .replace(/^\d+\.\s*/, '')
    .replace(/\([^)]+\)\s*$/, '')
    .trim()
  const abbrev = getAreaAbbrev(area.area)

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, type: 'spring', stiffness: 200, damping: 22 }}
      className="rounded-2xl border border-[var(--line)] overflow-hidden text-left bg-[var(--bg)] hover:border-[#B8943A] hover:shadow-xl transition-all duration-300 group cursor-pointer"
    >
      <div className="px-4 py-3 bg-[#0A1F3D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold text-[#B8943A] tracking-widest">{abbrev}</span>
          {area.at_risk > 0 && (
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/40 text-red-300 font-sans">
              <AlertTriangle size={8} /> {area.at_risk} at risk
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-sans">
          <CheckCircle2 size={8} className="text-green-400" />
          {area.completed}/{area.total}
        </span>
      </div>

      <div className="p-4 flex items-start gap-3">
        <ProgressRing value={area.progress_pct} size={52} strokeWidth={5} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-sans font-semibold text-[var(--text)] text-sm leading-snug line-clamp-2 mb-2">
            {areaLabel}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              ['Completed',   area.completed,   'text-green-600 dark:text-green-400'],
              ['In Progress', area.in_progress, 'text-[#B8943A]'],
            ].map(([label, val, cls]) => (
              <span key={label} className="flex items-baseline gap-1">
                <span className={`text-xs font-bold font-sans ${cls}`}>{val}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-sans">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-[var(--line-soft)] bg-[var(--bg-soft)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)] font-sans">
          {area.total} {area.total === 1 ? 'task' : 'tasks'}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#806014] font-sans group-hover:gap-2 transition-all">
          Open <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.button>
  )
}

function SOSection({ soNumber, soTitle, areas, onAreaClick }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-bold text-[#B8943A] uppercase tracking-widest font-sans">{soNumber}</span>
        <span className="text-sm font-semibold text-[var(--text)] font-sans">{soTitle}</span>
        <div className="flex-1 h-px bg-[var(--line)]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {areas.map((area, i) => (
          <DirectorateAreaCard
            key={area.area}
            area={area}
            animDelay={i * 0.08}
            onClick={() => onAreaClick(soNumber, area.idx)}
          />
        ))}
      </div>
    </div>
  )
}

function AllSOsView({ summaries, soVisibility, navigate }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {summaries.map((s, i) => {
        const visible = soVisibility[s.so_number]
        return (
          <motion.button
            key={s.so_number}
            onClick={() => navigate(`/management/so/${s.so_number}`)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 22 }}
            className="rounded-2xl border border-[var(--line)] overflow-hidden text-left bg-[var(--bg)] hover:border-[#B8943A] hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="px-5 py-4 bg-[#0A1F3D]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#B8943A] uppercase tracking-widest">{s.so_number}</span>
                  <p className="text-[10px] text-white/50 font-sans mt-0.5">{SO_SHORT_TITLES[s.so_number]}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold font-sans ${
                  visible ? 'bg-green-700/40 text-green-300' : 'bg-white/10 text-white/40'
                }`}>
                  {visible ? <Eye size={10} /> : <EyeOff size={10} />}
                  {visible ? 'Published' : 'Hidden'}
                </div>
              </div>
            </div>
            <div className="p-5 flex items-start gap-4">
              <ProgressRing value={s.overall_progress_pct} size={72} strokeWidth={6} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-sans font-semibold text-[var(--text)] text-sm leading-snug mb-3 line-clamp-3">
                  {s.so_title || SO_SHORT_TITLES[s.so_number]}
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ['Completed',   s.completed,   'text-green-600 dark:text-green-400'],
                    ['In Progress', s.in_progress, 'text-[#B8943A]'],
                    ['Not Started', s.not_started, 'text-[var(--text-muted)]'],
                    ['At Risk',     s.at_risk,     'text-red-500 dark:text-red-400'],
                  ].map(([label, val, cls]) => (
                    <div key={label} className="flex items-baseline gap-1.5">
                      <span className={`text-sm font-bold font-sans ${cls}`}>{val}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-sans leading-none">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-2.5 border-t border-[var(--line-soft)] bg-[var(--bg-soft)] flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)] font-sans">
                {s.total_tasks} tasks · {s.overall_progress_pct}% complete
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-[#806014] font-sans group-hover:gap-2 transition-all">
                Open <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

export function ManagementHome() {
  useRealtimeSync()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const directorate  = user?.directorate ?? null
  const dirName      = DIRECTORATE_NAMES[directorate] || directorate || ''

  const summaries    = useDataStore(s => s.getSOSummaries())
  const soVisibility = useDataStore(s => s.soVisibility)
  const dirGroups    = useDataStore(s => directorate ? s.getDirectorateAreas(directorate) : [])

  const heroStats = useMemo(() => {
    if (!directorate || dirGroups.length === 0) return { totalAreas: 0, totalTasks: 0, overallPct: 0 }
    const allAreas  = dirGroups.flatMap(g => g.areas)
    const totalTasks = allAreas.reduce((s, a) => s + a.total, 0)
    const overallPct = totalTasks
      ? Math.round(allAreas.reduce((s, a) => s + a.progress_pct * a.total, 0) / totalTasks)
      : 0
    return { totalAreas: allAreas.length, totalTasks, overallPct }
  }, [directorate, dirGroups])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <Header title="CLET Management Portal" />
      <main className="flex-1 overflow-auto bg-white dark:bg-[var(--bg)]">
        <div className="p-8 max-w-4xl mx-auto">

          {directorate ? (
            <>
              <DirectorateHero
                code={directorate}
                name={dirName}
                totalAreas={heroStats.totalAreas}
                totalTasks={heroStats.totalTasks}
                progressPct={heroStats.overallPct}
              />

              {dirGroups.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">📂</p>
                  <p className="text-base font-semibold text-[var(--text)] font-sans">
                    No thematic areas found for your directorate
                  </p>
                  <p className="text-sm text-[var(--text-muted)] font-sans mt-1">
                    Data may not be imported yet.
                  </p>
                </div>
              ) : (
                dirGroups.map(group => (
                  <SOSection
                    key={group.so_number}
                    soNumber={group.so_number}
                    soTitle={group.so_title}
                    areas={group.areas}
                    onAreaClick={(soNum, idx) => navigate(`/management/so/${soNum}/area/${idx}`)}
                  />
                ))
              )}
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h2 className="font-sans text-2xl font-bold text-[var(--text)] mb-1">
                  Strategic Objectives
                </h2>
                <p className="text-sm text-[var(--text-muted)] font-sans">
                  Select a Strategic Objective to manage its tasks, activities, and dashboard visibility
                </p>
              </div>
              <AllSOsView summaries={summaries} soVisibility={soVisibility} navigate={navigate} />
            </>
          )}

        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser — GSL user**

Log in as `gsl@clet.gov.gh`. Expected:
- Navy `DirectorateHero` bar at top with "GSL — Ghana School of Law"
- One `SOSection` per SO that contains GSL thematic areas (e.g. "SO2 — Curriculum & Training")
- Thematic area cards within each section
- Clicking a card navigates to the correct thematic area page

- [ ] **Step 3: Verify in browser — no-directorate user**

Log in as `management@clet.gov.gh` (directorate: null). Expected:
- Old SO 2×2 grid with "Strategic Objectives" heading
- All four SO cards visible
- Clicking a card navigates to the SO detail page

- [ ] **Step 4: Commit**

```bash
cd D:\GSL\clet-dashboard
git add src/components/management/ManagementHome.jsx
git commit -m "feat: directorate-grouped thematic area view on management home"
```

---

## Task 6: SODetailPage — filter thematic areas by directorate

**Files:**
- Modify: `src/components/management/SODetailPage.jsx`

**Interfaces:**
- Consumes:
  - `useAuth()` → `user.role`, `user.directorate`
  - `parseDirectorateFromArea(area)` from `../../utils/helpers`
- Produces: management users with a directorate set only see their directorate's thematic areas on this page; DG users see all areas; index values are preserved (never re-indexed)

- [ ] **Step 1: Add imports**

Open `src/components/management/SODetailPage.jsx`. Add two imports to the existing import block:

```js
import { useAuth } from '../../context/AuthContext'
import { SO_SHORT_TITLES, getAreaAbbrev, parseDirectorateFromArea } from '../../utils/helpers'
```

(The `SO_SHORT_TITLES` and `getAreaAbbrev` imports are already there — only add `parseDirectorateFromArea` to that line, and add the `useAuth` import.)

- [ ] **Step 2: Read user from auth context**

Inside `SODetailPage()`, after the existing `useRealtimeSync()` call, add:

```js
const { user } = useAuth()
```

- [ ] **Step 3: Filter thematicGroups without re-indexing**

Find the existing `thematicGroups` useMemo (around line 91). Replace it entirely with:

```js
const thematicGroups = useMemo(() => {
  const areas = [...new Set(soTasks.map(t => t.thematic_area).filter(Boolean))]
    .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))

  const allGroups = areas.map((area, idx) => {
    const areaTasks = soTasks.filter(t => t.thematic_area === area)
    return {
      area,
      idx,
      abbrev:      getAreaAbbrev(area),
      tasks:       areaTasks,
      total:       areaTasks.length,
      completed:   areaTasks.filter(t => t.status === 'Completed').length,
      in_progress: areaTasks.filter(t => t.status === 'In Progress').length,
      not_started: areaTasks.filter(t => t.status === 'Not Started').length,
      at_risk:     areaTasks.filter(t => t.status === 'At Risk').length,
      progress_pct: areaTasks.length
        ? Math.round(areaTasks.reduce((s, t) => s + (t.progress_pct || 0), 0) / areaTasks.length)
        : 0,
    }
  })

  if (user?.role === 'management' && user?.directorate) {
    return allGroups.filter(g => parseDirectorateFromArea(g.area) === user.directorate)
  }
  return allGroups
}, [soTasks, user?.role, user?.directorate])
```

- [ ] **Step 4: Update the useMemo dependency array for summary**

The `summary` useMemo depends on `soTasks` (all tasks for the SO). This is intentional — the page header still shows full SO stats (total tasks, progress) even when filtered to a directorate. No change needed there.

- [ ] **Step 5: Verify in browser — GSL user drills into an SO**

From the management home (logged in as GSL user), click a thematic area card. Confirm it navigates to the correct ThematicAreaPage. Then navigate back and go to `/management/so/SO2` directly in the URL bar. Confirm only GSL thematic areas are shown.

- [ ] **Step 6: Verify in browser — DG user sees all areas**

Log in as `dg@clet.gov.gh`. Navigate to `/dashboard`. Confirm the DG dashboard is unchanged. (DG cannot reach `/management` — the route is protected — so no further check needed.)

Log in as `management@clet.gov.gh` (no directorate). Navigate to `/management/so/SO2`. Confirm all thematic areas are visible.

- [ ] **Step 7: Verify index stability**

Log in as a GSL user. From the management home, click a thematic area card. Note the URL — e.g. `/management/so/SO2/area/3`. The `3` should be the area's position in the full sorted list for SO2, not its position among GSL areas. Confirm the ThematicAreaPage loads the correct area (the title matches the card you clicked).

- [ ] **Step 8: Commit**

```bash
cd D:\GSL\clet-dashboard
git add src/components/management/SODetailPage.jsx
git commit -m "feat: filter SODetailPage thematic areas by user directorate"
```

---

## Verification Checklist

After all tasks are complete, run through this end-to-end:

- [ ] **GSL login** → management home shows DirectorateHero with "GSL — Ghana School of Law" + GSL thematic areas grouped by SO
- [ ] **DTI login** → management home shows DTI areas (different from GSL)
- [ ] **No-directorate login** (`management@clet.gov.gh`) → old SO 2×2 grid shown
- [ ] **DG login** → DG dashboard unchanged, cannot reach `/management`
- [ ] **Direct URL** `/management/so/SO2` as GSL user → only GSL areas in SO2 shown
- [ ] **Navigation** → clicking a thematic area card lands on the correct ThematicAreaPage (area title matches)
- [ ] **Empty directorate** → log in as a directorate user whose areas haven't been imported → empty state message shown
- [ ] **Dark mode** → toggle dark mode, confirm DirectorateHero and SOSection render correctly
