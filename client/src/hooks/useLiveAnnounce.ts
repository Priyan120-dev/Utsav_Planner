import { useState, useCallback } from 'react';

export function useLiveAnnounce() {
  const [announcement, setAnnouncement] = useState<string>('');

  const announce = useCallback((message: string) => {
    // Clear first to ensure screen reader picks up identical repeats
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  }, []);

  return { announcement, announce };
}
