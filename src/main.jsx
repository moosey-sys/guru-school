import { AppBoundary } from "./components/AppBoundary";
import { installMonitoring } from "./monitoring";
import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import PublicApp from "./PublicApp";
import { PreferencesProvider } from "./preferences";
import "./styles.css";
installMonitoring();
const root = document.getElementById("root");
const app = (
  <AppBoundary>
    <PreferencesProvider>
      <PublicApp path={location.pathname} />
    </PreferencesProvider>
  </AppBoundary>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
