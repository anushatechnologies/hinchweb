import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, isInitializing, user } = useAuthStore();

  // 1. Wait for session restoration to complete before evaluating guards
  if (isInitializing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-industrial-200 text-center max-w-sm w-full">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-industrial-900">Verifying Secure Session</h3>
          <p className="text-xs text-industrial-500 mt-1">
            Authorizing access with HinchMart security gateway...
          </p>
        </div>
      </div>
    );
  }

  // 2. Redirect unauthenticated users
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. Role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || 'CUSTOMER').toUpperCase();
    const normalizedUserRole = userRole === 'BUYER' ? 'CUSTOMER' : userRole;

    const hasPermission = allowedRoles.some((allowed) => {
      const normalizedAllowed = allowed.toUpperCase() === 'BUYER' ? 'CUSTOMER' : allowed.toUpperCase();
      // An ADMIN always has access to seller and customer areas
      if (normalizedUserRole === 'ADMIN') return true;
      return normalizedUserRole === normalizedAllowed;
    });

    if (!hasPermission) {
      return (
        <Navigate
          to="/access-denied"
          state={{
            attemptedPath: location.pathname,
            userRole: user.role,
            requiredRoles: allowedRoles,
          }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
};

export const AccessDeniedInline: React.FC<{ requiredRole?: string }> = ({ requiredRole = 'ADMIN' }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-lg border border-red-200">
      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-industrial-950">Access Denied</h2>
      <p className="text-xs text-industrial-600 mt-2">
        Your current authenticated account role does not have permission to access this portal. This area requires authoritative <strong>{requiredRole}</strong> role permissions.
      </p>
    </div>
  </div>
);
