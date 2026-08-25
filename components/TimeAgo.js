"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/constants";

/**
 * Renders the relative time only after mount. "3m ago" computed on the server
 * would not match the browser's clock, so the first paint stays blank instead
 * of tripping a hydration mismatch.
 */
export default function TimeAgo({ ts, className }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => setLabel(timeAgo(ts));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [ts]);

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  );
}
