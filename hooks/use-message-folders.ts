import { useState, useEffect } from 'react';

export type MessageFolder = {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  _count?: {
    threads: number;
  };
};

export function useMessageFolders() {
  const [folders, setFolders] = useState<MessageFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setFolders(data.folders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string, color?: string, icon?: string) => {
    try {
      const response = await fetch('/api/customer/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, icon }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      await fetchFolders();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateFolder = async (
    folderId: string,
    updates: { name?: string; color?: string; icon?: string }
  ) => {
    try {
      const response = await fetch(`/api/customer/folders/${folderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update folder');
      await fetchFolders();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const response = await fetch(`/api/customer/folders/${folderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete folder');
      await fetchFolders();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  return {
    folders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchFolders,
  };
}
