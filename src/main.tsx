import "leaflet/dist/leaflet.css";
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store'
import './index.css'
import App from './App.tsx'
import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, background: '#1a1a1a', color: '#ff5555', height: '100vh', overflow: 'auto' }}>
                    <h1>Algo salió mal.</h1>
                    <pre>{this.state.error?.toString()}</pre>
                    <pre>{this.state.error?.stack}</pre>
                    <button onClick={() => window.location.reload()} style={{ padding: 10, marginTop: 20 }}>Recargar</button>
                </div>
            );
        }

        return this.props.children;
    }
}

const rootElement = document.getElementById('root');
if (rootElement) {
    // @ts-ignore
    if (!window._ReactRoot) {
        // @ts-ignore
        window._ReactRoot = createRoot(rootElement);
    }
    // @ts-ignore
    window._ReactRoot.render(
        <ErrorBoundary>
            <Provider store={store}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </Provider>
        </ErrorBoundary>
    );
} else {
    console.error("No root element found");
}


