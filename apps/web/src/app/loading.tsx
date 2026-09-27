// Shown instantly on navigation while the next route loads, so clicks never feel unresponsive.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="skeleton h-10 w-1/3" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton aspect-[3/4]" />)}
      </div>
    </div>
  );
}
