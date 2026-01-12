import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ToastProvider } from './contexts/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Overview } from './pages/Overview';
import { RunsList } from './pages/RunsList';
import { RunDetail } from './pages/RunDetail';
import { ToolCalls } from './pages/ToolCalls';
import { X402Inspector } from './pages/X402Inspector';
import { MemoryViewer } from './pages/MemoryViewer';
import { ComplianceAudit } from './pages/ComplianceAudit';
import { Embeddings } from './pages/Embeddings';
import { VectorSearch } from './pages/VectorSearch';
import { Tables } from './pages/Tables';
import { TableDetail } from './pages/TableDetail';
import { RowDetail } from './pages/RowDetail';
import { Agents } from './pages/Agents';
import { Documents } from './pages/Documents';
import { X402Discovery } from './pages/X402Discovery';
import { SignatureDebugger } from './pages/SignatureDebugger';
import { DemoDashboard } from './pages/DemoDashboard';
import { Login } from './pages/Login';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service in production
        if (import.meta.env.PROD) {
          console.error('Application Error:', error, errorInfo);
          // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <ProjectProvider>
                      <Layout />
                    </ProjectProvider>
                  </ProtectedRoute>
                }>
                  <Route index element={<Overview />} />
                  <Route path="runs" element={<RunsList />} />
                  <Route path="runs/:runId" element={<RunDetail />} />
                  <Route path="runs/:runId/tools" element={<ToolCalls />} />
                  <Route path="runs/:runId/x402" element={<X402Inspector />} />
                  <Route path="runs/:runId/memory" element={<MemoryViewer />} />
                  <Route path="runs/:runId/audit" element={<ComplianceAudit />} />
                  <Route path="agents" element={<Agents />} />
                  <Route path="embeddings" element={<Embeddings />} />
                  <Route path="vector-search" element={<VectorSearch />} />
                  <Route path="documents" element={<Documents />} />
                  <Route path="tables" element={<Tables />} />
                  <Route path="tables/:tableId" element={<TableDetail />} />
                  <Route path="tables/:tableId/rows/:rowId" element={<RowDetail />} />
                  <Route path="x402-discovery" element={<X402Discovery />} />
                  <Route path="signature-debugger" element={<SignatureDebugger />} />
                  <Route path="demos" element={<DemoDashboard />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
