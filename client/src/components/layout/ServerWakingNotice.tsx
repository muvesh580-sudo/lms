import React, { useEffect, useState } from 'react';
import { onServerWaking } from '../../services/api';

// Shown while the client waits for a sleeping backend to start
const ServerWakingNotice: React.FC = () => {
  const [waking, setWaking] = useState(false);

  useEffect(() => onServerWaking(setWaking), []);

  if (!waking) return null;

  return (
    <div className="bg-amber-50 px-4 py-3 text-center text-sm text-amber-800" role="status">
      <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent align-middle" aria-hidden="true" />
      The server is waking up. This can take up to a minute, please wait.
    </div>
  );
};

export default ServerWakingNotice;
