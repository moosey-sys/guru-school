import React from "react";
import { hydrateRoot } from "react-dom/client";
import Privacy from "./Privacy";
import { PreferencesProvider } from "./preferences";
import "./admin.css";
hydrateRoot(
  document.getElementById("root"),
  <PreferencesProvider>
    <Privacy />
  </PreferencesProvider>,
);
