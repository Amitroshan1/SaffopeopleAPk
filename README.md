# HRMS web app

## Notes

- The employee Leaves page no longer shows the Attendance Regularization card. The request form, history table, and filters were removed from `src/pages/Leaves/Leaves.jsx` for now. The modal file `src/pages/Leaves/RegularizationModal.jsx` is still in the project, and the HR Attendance Regularization review screen is unchanged.
- Apply for Leave is its own screen at `/leaves/apply`, not the bottom-sheet modal. The white header and bottom bar stay on that screen. Open it from the dashboard **Apply for Leave** card or the **Apply Leave** button on the Leaves page. Cancel returns to `/leaves`.
- Browser: the dev server is `npm run dev` in this folder, then open http://localhost:5173/ and press `Ctrl+F5`.
- Android app: this folder’s installed build uses `dist`, so source changes show only after a rebuild:

```powershell
npm run build:mobile
npx cap sync android
npx cap run android
```
