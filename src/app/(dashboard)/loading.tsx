export default function DashboardLoading() {
  return (
    <div className="animate-fade-in space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted sm:w-56" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted/70 sm:w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border bg-card"
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-border bg-card sm:h-80" />
    </div>
  );
}
