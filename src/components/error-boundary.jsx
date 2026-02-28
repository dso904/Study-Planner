'use client';

import React from 'react';

/**
 * L4-FIX: React Error Boundary — catches rendering errors anywhere in the tree
 * and shows a recovery UI instead of a blank white screen.
 *
 * React Error Boundaries must be class components — there is no hook equivalent.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: 'oklch(0.16 0.015 280)',
                    color: '#e2e8f0',
                    fontFamily: "'Inter', system-ui, sans-serif",
                    gap: '16px',
                    padding: '24px',
                }}>
                    <div style={{
                        fontSize: '48px',
                        lineHeight: 1,
                    }}>⚠️</div>
                    <h1 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#f87171',
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    }}>
                        Something went wrong
                    </h1>
                    <p style={{
                        fontSize: '14px',
                        color: '#a1a1aa',
                        maxWidth: '400px',
                        textAlign: 'center',
                    }}>
                        An unexpected error occurred. Your data is safe — click below to try again.
                    </p>
                    <pre style={{
                        fontSize: '11px',
                        color: '#71717a',
                        fontFamily: "'JetBrains Mono', monospace",
                        background: 'rgba(255,255,255,0.05)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        maxWidth: '500px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}>
                        {this.state.error?.message || 'Unknown error'}
                    </pre>
                    <button
                        onClick={this.handleReset}
                        style={{
                            marginTop: '8px',
                            padding: '10px 24px',
                            background: 'transparent',
                            border: '1px solid rgba(244, 114, 182, 0.5)',
                            borderRadius: '6px',
                            color: '#f472b6',
                            fontSize: '12px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
