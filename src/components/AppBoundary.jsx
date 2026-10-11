import React from "react";
import { reportError } from "../monitoring";
export class AppBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    reportError("render");
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const my = document.documentElement.lang === "my";
    return (
      <main className="error-recovery" role="alert">
        <h1>
          {my
            ? "စာမျက်နှာ ပြန်ဖွင့်ရန် လိုအပ်ပါသည်။"
            : "Please reload this page."}
        </h1>
        <p>
          {my
            ? "ယာယီ အမှား ဖြစ်ပေါ်နေပါသည်။"
            : "Something interrupted the page. Your saved information is unchanged."}
        </p>
        <button type="button" onClick={() => location.reload()}>
          {my ? "ပြန်ဖွင့်ရန်" : "Reload page"}
        </button>
        <p>
          <a href="/contact">
            {my ? "ကျောင်းကို ဆက်သွယ်ရန်" : "Contact the school"}
          </a>
        </p>
      </main>
    );
  }
}
