import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "Silence in the Sanctuary",
  description,
  actionHref,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-background-border/80 bg-background-surface/30 p-12 text-center"
    >
      <div className="w-12 h-12 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary-light text-xl mb-4">
        ✦
      </div>
      <h3 className="font-serif text-lg font-medium text-white tracking-wide">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-400 leading-relaxed">
        {description}
      </p>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-background-elevated border border-background-border text-xs font-medium text-gray-200 hover:bg-background-border hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          {actionLabel}
        </Link>
      )}

      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-background-elevated border border-background-border text-xs font-medium text-gray-200 hover:bg-background-border hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
