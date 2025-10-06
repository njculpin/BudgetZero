import { useEffect, useState } from "react";

export function usePendingRequests() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(
          "/api/project-asset-references?status=pending",
        );
        if (response.ok) {
          const data = await response.json();
          setCount(data.references?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      }
    };

    fetchCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return count;
}
