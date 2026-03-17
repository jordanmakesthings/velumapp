import { Link } from "react-router-dom";

export default function LibraryPage() {
  return (
    <div className="px-4 lg:px-8 pt-14 pb-8 max-w-2xl mx-auto">
      <h1 className="text-display text-3xl mb-2">Library</h1>
      <p className="text-ui text-sm mb-8">Your complete wellness toolkit.</p>
      <div className="velum-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Sessions, favorites, and courses will appear here once the backend is connected.</p>
      </div>
    </div>
  );
}
