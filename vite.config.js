import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No `base` override needed here: Render's static sites are served from
// the root of their own domain (e.g. https://tour-ledger-app.onrender.com/),
// unlike GitHub Pages which needed "/<repo-name>/".
export default defineConfig({
  plugins: [react()],
});
