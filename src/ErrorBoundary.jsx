// src/ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:"16px", fontFamily:"ui-sans-serif,system-ui", color:"#fff", background:"#b91c1c"}}>
          <div style={{fontWeight:700, marginBottom:8}}>Errore runtime</div>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error?.message || this.state.error)}</pre>
          <div style={{marginTop:8, fontSize:12, opacity:.9}}>
            Controlla anche la console (F12 → Console) per lo stack.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
