import { AppBoundary } from "./components/AppBoundary";
import { installMonitoring } from "./monitoring";
import React from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "./AdminApp";
import { PreferencesProvider } from "./preferences";
import "./admin.css";
installMonitoring();
createRoot(document.getElementById("root")).render(
  <AppBoundary>
    <PreferencesProvider admin>
      <AdminApp />
    </PreferencesProvider>
  </AppBoundary>,
);
