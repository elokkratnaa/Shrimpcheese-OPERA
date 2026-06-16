import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';

type SessionStatus = 'ingested' | 'processing' | 'completed' | 'failed';

export function useSessionGuard(
  sessionId: string,
  checkFn: (status: SessionStatus) => boolean,
  redirectPath: string
) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
          router.push('/home');
          return;
        }
        const session = await response.json();
        
        if (checkFn(session.current_status)) {
          router.push(redirectPath);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Guard error:', err);
        router.push('/home');
      }
    }
    checkStatus();
  }, [sessionId, checkFn, redirectPath, router]);

  return { isLoading };
}
