import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldAlert, ArrowLeft, Home, UserCheck, ShieldCheck } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const state = location.state as {
    attemptedPath?: string;
    userRole?: string;
    requiredRoles?: string[];
  } | null;

  const userRole = (user.role || state?.userRole || 'CUSTOMER').toUpperCase();
  const requiredRoles = state?.requiredRoles?.join(', ') || 'ADMINISTRATOR';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 md:p-10 shadow-xl border border-red-200 text-center relative overflow-hidden">
        {/* Top visual banner */}
        <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800 uppercase tracking-wider mb-3">
          HTTP 403 Forbidden
        </span>

        <h1 className="text-2xl font-black text-industrial-950 tracking-tight">
          Access Restricted
        </h1>

        <p className="text-xs text-industrial-600 mt-2 max-w-sm mx-auto leading-relaxed">
          You do not have permission to access the requested resource{' '}
          {state?.attemptedPath && (
            <code className="bg-industrial-100 px-1.5 py-0.5 rounded text-industrial-800 font-mono text-[11px]">
              {state.attemptedPath}
            </code>
          )}.
        </p>

        {/* Current Identity Details */}
        <div className="my-6 p-4 bg-industrial-50 rounded-2xl border border-industrial-200 text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-industrial-500 font-medium">Signed In As:</span>
            <span className="font-bold text-industrial-900">{user.email || user.phone || 'Authenticated User'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-industrial-500 font-medium">Assigned Role:</span>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-200 text-slate-800">
              {userRole}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-industrial-500 font-medium">Required Role:</span>
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-amber-100 text-amber-900">
              {requiredRoles}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-industrial-500 mb-6">
          Authorization permissions are enforced authoritatively by the HinchMart security backend. If you believe you should have access, please contact your organization administrator.
        </p>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-industrial-300 text-industrial-700 hover:bg-industrial-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Return to Marketplace</span>
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-industrial-100 flex items-center justify-center gap-4 text-[10px] text-industrial-400">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-industrial-500" />
            Session Preserved
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Role-Guarded Endpoint
          </span>
        </div>
      </div>
    </div>
  );
};
