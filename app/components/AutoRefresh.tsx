"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const scheduleRefresh = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      
      // Calculate milliseconds until the next 30-second mark
      let msUntilNext30 = 0;
      if (seconds < 30) {
        msUntilNext30 = (30 - seconds) * 1000 - now.getMilliseconds();
      } else {
        msUntilNext30 = (90 - seconds) * 1000 - now.getMilliseconds();
      }

      timeoutId = setTimeout(() => {
        // Trigger a soft refresh to re-fetch Server Components
        router.refresh();
        
        // After the first accurate hit, just interval every exactly 60 seconds
        intervalId = setInterval(() => {
          router.refresh();
        }, 60000);
      }, msUntilNext30);
    };

    scheduleRefresh();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [router]);

  return null;
}
