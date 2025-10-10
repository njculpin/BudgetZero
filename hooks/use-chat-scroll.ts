import { useEffect, useRef } from "react";

// TODO: Implement actual chat scroll hook
export function useChatScroll<T>(_dep?: T) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [_dep]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  return { containerRef, scrollToBottom };
}
