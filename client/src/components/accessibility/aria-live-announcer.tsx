import { useEffect, useRef } from "react";

interface AriaLiveAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive" | "off";
  clearAfter?: number;
}

export function AriaLiveAnnouncer({ 
  message, 
  priority = "polite", 
  clearAfter = 1000 
}: AriaLiveAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announcerRef.current) {
      announcerRef.current.textContent = message;
      
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          if (announcerRef.current) {
            announcerRef.current.textContent = "";
          }
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  return (
    <div
      ref={announcerRef}
      className="sr-only"
      aria-live={priority}
      aria-atomic="true"
      role="status"
    />
  );
}

export default AriaLiveAnnouncer;