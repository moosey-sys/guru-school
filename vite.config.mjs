import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "school-page-routes",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split("?")[0] === "/admin")
            req.url = req.url.replace("/admin", "/admin.html");
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const route = req.url?.split("?")[0];
          if (
            /^\/(about|programmes|life|campus|team|gallery|news|contact|admin)$/.test(
              route,
            )
          )
            req.url = req.url.replace(route, route + ".html");
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        admin: "admin.html",
        privacy: "privacy.html",
      },
    },
  },
  server: { proxy: { "/api": "http://localhost:5175" } },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{js,jsx}"],
    setupFiles: ["src/test-setup.js"],
  },
});
