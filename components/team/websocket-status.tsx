'use client';

import { Wifi, WifiOff } from 'lucide-react';

interface WebSocketStatusProps {
  isConnected: boolean;
  className?: string;
}

export function WebSocketStatus({ isConnected, className = '' }: WebSocketStatusProps) {
  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-green-500">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Disconnected</span>
        </>
      )}
    </div>
  );
}