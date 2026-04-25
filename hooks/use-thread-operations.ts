import { useState } from 'react';

export function useThreadOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moveToFolder = async (threadId: string, folderId: string | null) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/messages/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (!response.ok) throw new Error('Failed to move thread');
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const archiveThread = async (threadId: string, isArchived: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/messages/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived }),
      });
      if (!response.ok) throw new Error('Failed to archive thread');
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/messages/${threadId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete thread');
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    moveToFolder,
    archiveThread,
    deleteThread,
  };
}
