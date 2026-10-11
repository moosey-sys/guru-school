import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import PublicApp from "./PublicApp";
import { PreferencesProvider } from "./preferences";
import "./styles.css";
const root = document.getElementById("root");
const app = (
  <PreferencesProvider>
    <PublicApp path={location.pathname} />
  </PreferencesProvider>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
