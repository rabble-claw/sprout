import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@sprout-shared/theme/ThemeProvider";
import "./styles/globals.css";
import { AppShell } from "./app/AppShell";
import { initAuth } from "./app/initAuth";

initAuth().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  </React.StrictMode>,
);
});

