# Module: Apply Query (Tickets)

**Primary files:**

- `src/pages/Query/Queries.jsx` — employee Apply Query + chat
- `src/pages/Query/DepartmentQueryInbox.jsx` — department inbox
- IT Open Ticket also uses `/api/query`

**API base:** `/api/query`  
**Master options:** `/api/auth/master-options`  
**Routes:** `/queries`, `/queries/inbox`

## Purpose

Employees raise department queries (title, department, description, optional media), chat replies, close tickets, and preview/download attachments.

## Core APIs

| Action | Method | Path |
|--------|--------|------|
| My list | GET | `/api/query/queries/my?page=&limit=` |
| Dept / filtered list | GET | `/api/query/queries?...` |
| Create | POST | `/api/query/queries` (often **FormData**) |
| Detail | GET | `/api/query/queries/:id` |
| Reply | POST | `/api/query/queries/:id/reply` |
| Close | POST | `/api/query/queries/:id/close` |
| Mark read | POST | `/api/query/queries/:id/mark-read` |
| Attachment | GET | `/api/query/.../files/...` (binary) |
| Notifications | POST | `/api/notifications/mark-read` |
| Departments | GET | `/api/auth/master-options` |

## Native / FormData critical path

Creating a query with attachments uses `FormData`. On Android the shim must send CapacitorHttp with `dataType: 'formData'`. Missing fields (`title`, `department`, `query_text`) usually means FormData never reached the server correctly.

Attachment downloads use `/files/` paths — shim treats them as binary (`responseType` blob / base64 → Blob).

## UI conventions (mobile)

- History as cards; status chips; **Closed** near Chat action
- Media: in-app image preview; video play when MIME/blob correct
- Validation / API **error text above Submit**, not floating above the whole card
- Fonts inherit app theme (avoid hard-coded oversized inputs on “Describe your issue”)
- Back affordance on Apply Query header

## Dashboard entry

Home card **Apply Query** → `/queries`.
