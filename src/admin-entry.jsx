import React from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "./AdminApp";
import { PreferencesProvider } from "./preferences";
import "./admin.css";
createRoot(document.getElementById("root")).render(
  <PreferencesProvider admin>
    <AdminApp />
  </PreferencesProvider>,
);
