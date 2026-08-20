import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-rose-500 bg-space-900 border border-rose-500 rounded-xl overflow-auto m-4">
          <h1 className="text-xl font-bold mb-4">Something went wrong.</h1>
          <p className="font-mono text-sm whitespace-pre-wrap">{this.state.error && this.state.error.toString()}</p>
          <pre className="mt-4 text-xs font-mono whitespace-pre-wrap text-space-400">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children; 
  }
}
