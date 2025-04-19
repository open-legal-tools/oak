import React, { Component, ErrorInfo } from 'react';
import { connect } from 'react-redux';
import { RootState } from '../../store';

export type ErrorType = 'RENDER' | 'LOAD' | 'STATE' | 'NETWORK';
export type RecoveryAction = 'RETRY' | 'RESET' | 'FALLBACK' | 'CLOSE';

interface ErrorRecoveryStrategy {
  type: ErrorType;
  action: RecoveryAction;
  fallback?: React.ComponentType;
}

interface ViewErrorBoundaryProps {
  viewId: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecovery?: (strategy: ErrorRecoveryStrategy) => void;
  children: React.ReactNode;
}

interface ViewErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: ErrorType | null;
}

class ViewErrorBoundary extends Component<ViewErrorBoundaryProps, ViewErrorBoundaryState> {
  constructor(props: ViewErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ViewErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorType: determineErrorType(error)
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details
    console.error(`View Error [${this.props.viewId}]:`, {
      error,
      errorInfo,
      errorType: determineErrorType(error)
    });

    // Notify parent
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRecoveryAction = (action: RecoveryAction) => {
    const strategy: ErrorRecoveryStrategy = {
      type: this.state.errorType || 'RENDER',
      action
    };

    if (this.props.onRecovery) {
      this.props.onRecovery(strategy);
    }

    // Reset error state if retrying
    if (action === 'RETRY') {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorType: null
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="view-error-boundary p-4 bg-white rounded-lg shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-red-600">View Error</h3>
            <p className="text-gray-600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => this.handleRecoveryAction('RETRY')}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={() => this.handleRecoveryAction('RESET')}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset View
            </button>
            <button
              onClick={() => this.handleRecoveryAction('CLOSE')}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Close View
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

function determineErrorType(error: Error): ErrorType {
  if (error instanceof TypeError || error instanceof ReferenceError) {
    return 'RENDER';
  }
  if (error.name === 'NetworkError' || error.message.includes('network')) {
    return 'NETWORK';
  }
  if (error.message.includes('load') || error.message.includes('fetch')) {
    return 'LOAD';
  }
  return 'STATE';
}

// Connect to Redux store if needed for state management
export default ViewErrorBoundary; 