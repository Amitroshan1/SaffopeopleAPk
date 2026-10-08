# Module: IT & assets

**Primary files:**

- `src/pages/IT/ITPanel.jsx`
- `src/pages/IT/Data.js` — shared `IT_API_BASE = "/api/it"`
- Assets / inventory / return / NOC subpages under `src/pages/IT/`
- Employee self-service: `EmployeeAssetsDetails.jsx` (My Assets)

**API base:** `/api/it`  
**Tickets overlap:** `/api/query` (Open Ticket / IT panel query list)

## Routes

| Route | Purpose |
|-------|---------|
| `/it` | IT panel hub |
| `/it/inventory/*` | Inventory |
| `/it/OpenTicket` | Open ticket |
| `/it/Assets` | Assets dashboard |
| `/it/AssetsPage/AddEmployee` | Assign / add |
| `/it/employee/:empId` | Employee IT details |
| `/it/return-requests` | Returns |
| `/it/noc-requests` | NOC (`DepartmentNocPanel` with `apiBase="/api/it"`) |

## Conventions

- `Data.js` exposes a helper `fetch(`${IT_API_BASE}${path}`)` with auth headers — prefer that for new IT calls.
- **My Assets** is treated as a **native-first** surface for the Capacitor app (product constraint). Web may still route; do not remove native gating without product sign-off.
- IT panel can list queries via `/api/query/queries?...`.

## HR overlap

HR can also assign assets via `/api/HumanResource/assign-asset` (`HR/AddAssets.jsx`). Different persona, related data.
