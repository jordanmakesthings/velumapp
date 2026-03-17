export default function JournalPage() {
  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <h1 className="text-display text-3xl mb-2">Journal</h1>
      <p className="text-ui text-sm mb-8">Daily reflection and self-inquiry.</p>

      <div className="velum-card p-6 mb-6">
        <p className="text-ui text-xs tracking-wide uppercase mb-3">Today's prompt</p>
        <p className="text-foreground font-serif text-lg mb-4">
          What are you holding onto that no longer serves you?
        </p>
        <textarea
          placeholder="Write your reflection..."
          className="w-full bg-secondary rounded-lg p-4 text-foreground text-sm font-sans placeholder:text-muted-foreground/50 resize-none h-32 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow"
        />
        <button className="mt-3 px-6 py-2.5 rounded-lg gold-gradient text-primary-foreground text-sm font-sans font-medium active:scale-95 transition-transform">
          Save
        </button>
      </div>

      <div className="velum-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Past entries will appear here.</p>
      </div>
    </div>
  );
}
