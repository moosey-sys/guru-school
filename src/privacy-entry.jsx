import { AppBoundary } from "./components/AppBoundary";
import { installMonitoring } from "./monitoring";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import Privacy from "./Privacy";
import { PreferencesProvider } from "./preferences";
import "./admin.css";
installMonitoring();
hydrateRoot(
  document.getElementById("root"),
  <AppBoundary>
    <PreferencesProvider>
      <Privacy />
    </PreferencesProvider>
  </AppBoundary>,
);
