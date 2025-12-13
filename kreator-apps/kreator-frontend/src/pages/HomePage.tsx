export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Kreator</h1>
        <p className="text-muted-foreground mt-2">Your creative dashboard for managing projects and content.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Projects</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage your creative projects</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">View your latest updates</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Quick Actions</h3>
          <p className="text-sm text-muted-foreground mt-1">Start something new</p>
        </div>
      </div>
    </div>
  );
}
