// src/components/common/ErrorBoundary.jsx
import React from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button.jsx";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-subtle flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-4">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <span className="font-extrabold tracking-[0.2em] border-2 border-ink px-3 py-1 text-sm rounded mb-4">
            VENTORA
          </span>
          <h1 className="text-xl font-bold text-ink mb-2">Something went wrong</h1>
          <p className="text-sm text-ink-muted max-w-md mb-6 leading-relaxed">
            An unexpected error occurred. You can reload the application to restore your session.
          </p>
          <Button variant="primary" size="md" onClick={this.handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reload application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
