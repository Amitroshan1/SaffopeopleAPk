# Module: Profile

**Primary files:**

- `src/pages/Profile/` (view + section components)
- `src/pages/Profile/utils/profileApi.js` — API mapping layer
- `src/pages/Profile/ChangePassword.jsx`

**API base:** `/api/auth` (profile), `/api/HumanResource` (password reset helpers where used)  
**Route:** `/profile`, `/change-password`

## Purpose

View/edit personal info, address, bank, education, previous employment, documents, photo.

## Key APIs (`profileApi.js`)

| Action | Method | Path |
|--------|--------|------|
| Load profile | GET | `/api/auth/employee/profile` |
| Save employee fields | POST | (employee update via `postEmployee`) |
| Education replace | POST | education replace helper |
| Previous companies | POST | previous companies helper |
| Upload docs | POST | docs upload helper |
| Upload photo | POST | `/api/auth/employee/upload-photo` |
| Pincode lookup | (external/helper) | `fetchPincodeDetails` |

Mappers:

- `mapProfileFromApi` — backend → UI state  
- `buildEmployeePayload`, `buildDocPayload`, etc. — UI → backend  

Photo URLs may be normalized from `/public/...` to app-relative paths.

## Settings

`/settings` exists for web; on native the logo dropdown entry is hidden. Prefer documenting native-safe settings changes if re-enabled.
