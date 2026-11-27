import Link from "next/link";

const tiers = [
  {
    name: "Free",
    price: "\$0",
    period: "forever",
    description: "Perfect for small teams getting started.",
    features: [
      "Up to 5 team members",
      "3 Kanban columns",
      "Task comments",
      "Basic activity log",
      "Email support",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "\$12",
    period: "per user / month",
    description: "For growing teams that need more power.",
    features: [
      "Unlimited team members",
      "Custom columns",
      "Labels & priorities",
      "Due dates & reminders",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Pro trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "Dedicated setup for large organisations.",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Audit logs",
      "Custom integrations",
      "SLA & dedicated CSM",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-slate-50 py-24 dark:bg-slate-900 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            Pricing
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-400">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlight
                  ? "border-sky-500 bg-gradient-to-b from-sky-500/5 to-blue-600/5 shadow-xl shadow-sky-500/10 dark:border-sky-500 dark:from-sky-900/20 dark:to-blue-900/10"
                  : "border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1 text-xs font-bold text-white shadow">
                    Most popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {tier.name}
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {tier.price}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {tier.period}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {tier.description}
                </p>
              </div>

              <ul className="mb-8 flex flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href="/login"
                  className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all ${
                    tier.highlight
                      ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow shadow-sky-500/25 hover:opacity-90"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
