import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold tracking-tight">
          ChitChat 💬
        </h1>

        <p className="mt-6 text-lg text-muted-foreground">
          Chat with your friends.
          Simple, fast, and private.
        </p>

        <div className="mt-8">
          <Link
            href="/auth"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}