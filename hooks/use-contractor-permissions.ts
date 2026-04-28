'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ContractorPermission } from '@/lib/config/contractor-roles';

interface ContractorPermissions {
  contractorId: string | null;
  isOwner: boolean;
  permissions: ContractorPermission[];
  tier: string;
  employeeId: string | null;
  roleName: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and cache the current user's contractor permissions.
 * Use `can('jobs.view')` to check a specific permission.
 */
export function useContractorPermissions() {
  const [state, setState] = useState<ContractorPermissions>({
    contractorId: null,
    isOwner: false,
    permissions: [],
    tier: 'starter',
    employeeId: null,
    roleName: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/contractor/permissions');
        if (!res.ok) throw new Error('Failed to load permissions');
        const data = await res.json();
        if (!cancelled) {
          setState({
            contractorId: data.contractorId,
            isOwner: data.isOwner,
            permissions: data.permissions,
            tier: data.tier,
            employeeId: data.employeeId,
            roleName: data.roleName,
            loading: false,
            error: null,
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false, error: err.message }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const can = useCallback(
    (permission: ContractorPermission): boolean => {
      return state.permissions.includes(permission);
    },
    [state.permissions],
  );

  const canAny = useCallback(
    (...perms: ContractorPermission[]): boolean => {
      return perms.some((p) => state.permissions.includes(p));
    },
    [state.permissions],
  );

  return { ...state, can, canAny };
}
