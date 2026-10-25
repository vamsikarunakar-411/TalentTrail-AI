import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TalentTrail AI caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF9FE',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E9D5FF',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.1)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#1E1B4B',
              marginBottom: '0.75rem'
            }}>
              Something went wrong
            </h2>

            <p style={{
              fontSize: '0.9rem',
              color: '#6B7280',
              lineHeight: 1.6,
              marginBottom: '1.25rem'
            }}>
              TalentTrail AI encountered a display issue. Click below to reset stored application state and reload with default settings.
            </p>

            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                color: '#DC2626',
                fontFamily: 'monospace',
                overflowX: 'auto',
                maxHeight: '160px',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>Error: </strong> {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#8B5CF6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <RotateCcw size={16} />
              Reset & Reload TalentTrail AI
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
