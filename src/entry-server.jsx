import React from "react";
import { renderToString } from "react-dom/server";
import PublicApp from "./PublicApp";
import Privacy from "./Privacy";
import { PreferencesProvider } from "./preferences";
export { pages } from "./content/pages";
export function render(path) {
  return renderToString(
    <PreferencesProvider>
      {path.startsWith("/privacy") ? <Privacy /> : <PublicApp path={path} />}
    </PreferencesProvider>,
  );
}
