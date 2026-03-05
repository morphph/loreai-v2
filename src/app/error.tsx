'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        Something went wrong
      </h1>
      <p className="mb-8 text-muted">
        An unexpected error occurred. Please try again or head back to the homepage.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-surface"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
