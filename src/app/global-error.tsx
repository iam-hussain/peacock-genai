"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="p-6">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <button
          type="button"
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
