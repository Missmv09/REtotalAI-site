import React from 'react';

async function getHealth() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed');
    }
    return res.json();
  } catch {
    return { error: true } as const;
  }
}

async function getTrialStatus() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trial/status`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Failed');
    }
    return res.json();
  } catch {
    return { error: true } as const;
  }
}

export default async function StatusPage() {
  const [health, trial] = await Promise.all([getHealth(), getTrialStatus()]);
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold mb-4">System Status</h1>
      <div className="space-y-4">
        <div className="rounded-xl border p-4 flex items-center justify-between">
          <div className="font-medium">API Health</div>
          {"error" in health ? (
            <span className="px-2 py-1 rounded bg-red-100 text-red-800">Error</span>
          ) : health.ok ? (
            <span className="px-2 py-1 rounded bg-green-100 text-green-800">OK</span>
          ) : (
            <span className="px-2 py-1 rounded bg-red-100 text-red-800">Down</span>
          )}
        </div>
        <div className="rounded-xl border p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">Trial Status</div>
            {!("error" in trial) && trial.active && trial.endsAt && (
              <div className="text-sm opacity-70">Ends {new Date(trial.endsAt).toLocaleDateString()}</div>
            )}
          </div>
          {"error" in trial ? (
            <span className="px-2 py-1 rounded bg-red-100 text-red-800">Error</span>
          ) : trial.active ? (
            <span className="px-2 py-1 rounded bg-green-100 text-green-800">Active</span>
          ) : (
            <span className="px-2 py-1 rounded bg-red-100 text-red-800">inactive</span>
          )}
        </div>
      </div>
    </div>
  );
}

