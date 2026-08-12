import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you deploy this to GitHub Pages at https://<user>.github.io/<repo>/,
// uncomment and set base to "/<repo>/" so assets resolve correctly.
export default defineConfig({
  plugins: [react()],
  // base: "/tour-ledger/",
});
