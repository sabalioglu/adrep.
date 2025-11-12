import { useEffect, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';

interface JobStatusProps {
  jobId: string;
  onCompleted: () => void;
}

export function JobStatus({ jobId, onCompleted }: JobStatusProps) {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(checkStatus, 5000);
    checkStatus();

    return () => clearInterval(interval);
  }, [jobId]);

  async function checkStatus() {
    setChecking(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-scraping-status?jobId=${jobId}`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      const data = await response.json();

      if (data.status === 'completed') {
        onCompleted();
      }
    } catch (err) {
      console.error('Error checking status:', err);
    } finally {
      setChecking(false);
    }
  }

  if (!jobId) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
          {checking ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Clock className="w-5 h-5 text-white" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scraping Job Status</h3>
          <p className="text-sm text-gray-600">Job ID: {jobId.slice(0, 8)}...</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Scraping in progress...</p>
            <p className="text-xs text-blue-700">This may take a few minutes depending on the number of results.</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Status updates every 5 seconds. Ads will appear below once completed.
        </p>
      </div>
    </div>
  );
}
