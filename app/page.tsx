export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary-light text-xs tracking-wider uppercase">
          Foundation Verified
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-white">
          Aethelgard
        </h1>
        <p className="text-gray-400 font-sans text-base sm:text-lg leading-relaxed">
          Where memories have weight, and love has geography.
        </p>
        <div className="pt-4 border-t border-background-border text-xs text-gray-500 flex justify-center gap-4">
          <span>PostgreSQL 16 Connected</span>
          <span>•</span>
          <span>Zero-Trust Architecture</span>
          <span>•</span>
          <span>Self-Hosted Typography</span>
        </div>
      </div>
    </main>
  );
}
