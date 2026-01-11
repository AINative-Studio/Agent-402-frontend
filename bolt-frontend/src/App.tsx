import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Layout } from './components/layout/Layout';
import { Overview } from './pages/Overview';
import { RunsList } from './pages/RunsList';
import { RunDetail } from './pages/RunDetail';
import { X402Inspector } from './pages/X402Inspector';
import { MemoryViewer } from './pages/MemoryViewer';
import { ComplianceAudit } from './pages/ComplianceAudit';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="runs" element={<RunsList />} />
            <Route path="runs/:runId" element={<RunDetail />} />
            <Route path="runs/:runId/x402" element={<X402Inspector />} />
            <Route path="runs/:runId/memory" element={<MemoryViewer />} />
            <Route path="runs/:runId/audit" element={<ComplianceAudit />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
