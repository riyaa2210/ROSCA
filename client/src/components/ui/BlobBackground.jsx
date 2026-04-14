export default function BlobBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      {/* Blob 1 */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full
        bg-brand-200/40 dark:bg-brand-900/20 blur-3xl animate-blob" />
      {/* Blob 2 */}
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full
        bg-purple-200/40 dark:bg-purple-900/20 blur-3xl animate-blob [animation-delay:2s]" />
      {/* Blob 3 */}
      <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full
        bg-saffron-200/30 dark:bg-saffron-900/10 blur-3xl animate-blob [animation-delay:4s]" />
      {/* Mesh grid overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
    </div>
  );
}
