export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Invoice Generator
          </h1>

          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Login
            </a>

            <a
              href="/login"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            Invoice Generator SaaS
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Create professional invoices in minutes
          </h2>

          <p className="mt-4 text-lg leading-7 text-gray-600">
            A modern, easy-to-use invoice generator built for freelancers and small businesses.
            Create, manage, and send invoices with confidence.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Start Free
            </a>

            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Feature Preview */}
      <section id="features" className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Fast</h3>
            <p className="mt-2 text-sm text-gray-600">
              Build invoices with a clean, guided form.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Professional</h3>
            <p className="mt-2 text-sm text-gray-600">
              Beautiful layout ready to print or PDF.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Secure</h3>
            <p className="mt-2 text-sm text-gray-600">
              Save invoices safely in your account.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
