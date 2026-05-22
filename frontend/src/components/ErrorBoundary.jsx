import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p className="font-semibold">Error en esta pantalla</p>
          <p className="mt-2">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-coop-green px-4 py-2 text-white"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
