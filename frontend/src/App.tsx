import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewInvestigationPage } from './pages/NewInvestigationPage';
import { InvestigationHistoryPage } from './pages/InvestigationHistoryPage';
import { InvestigationDetailsPage } from './pages/InvestigationDetailsPage';
import { NetworkPage } from './pages/NetworkPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { ComplaintHistoryPage } from './pages/ComplaintHistoryPage';
import { NewComplaintPage } from './pages/NewComplaintPage';
import { ComplaintDetailsPage } from './pages/ComplaintDetailsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicOnlyRoute>
                  <ForgotPasswordPage />
                </PublicOnlyRoute>
              }
            />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigate"
              element={
                <ProtectedRoute>
                  <NewInvestigationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scans"
              element={
                <ProtectedRoute>
                  <NewInvestigationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigations"
              element={
                <ProtectedRoute>
                  <InvestigationHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dossiers"
              element={
                <ProtectedRoute>
                  <InvestigationHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investigations/:id"
              element={
                <ProtectedRoute>
                  <InvestigationDetailsPage />
                </ProtectedRoute>
              }
            />

            {/* Incident Escalation Routes */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:reportId"
              element={
                <ProtectedRoute>
                  <ReportDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints"
              element={
                <ProtectedRoute>
                  <ComplaintHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/new/:investigationId"
              element={
                <ProtectedRoute>
                  <NewComplaintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints/:complaintId"
              element={
                <ProtectedRoute>
                  <ComplaintDetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ledger"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/legal"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/network"
              element={
                <ProtectedRoute>
                  <NetworkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/threats"
              element={
                <ProtectedRoute>
                  <NetworkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
