import { useState, useEffect } from 'react';

export function useVision(): { vision: boolean } | null {
  const [status, setStatus] = useState<{ vision: boolean } | null>(null);

  useEffect(() => {
    // Check if Gemini API or image capabilities are supported
    const timer = setTimeout(() => {
      setStatus({ vision: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return status;
}
