const steps = [
  {
    step: "01",
    title: "Admin creates the board",
    description:
      "Sign up as an admin and configure your Kanban columns to match your team's workflow — To Do, In Progress, Review, Done — or anything custom.",
  },
  {
    step: "02",
    title: "Invite your team",
    description:
      "Send invite links to team members via email. They verify their account, choose a password or sign in with Google, and they're in.",
  },
  {
    step: "03",
    title: "Create and assign tasks",
    description:
      "Create tasks with titles, descriptions, priorities, due dates, and labels. Assign them to any team member in one click.",
  },
  {
    step: "04",
    title: "Drag, ship, repeat",
    description:
      "Move cards across columns as work progresses. Comment, track activity, and watch your team's throughput grow in the analytics view.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-white py-24 dark:bg-slate-950 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Up and running in minutes
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, idx) => (
            <div key={s.step} className="relative">
              {/* connector line */}
              {idx < steps.length - 1 && (
                <div className="absolute left-8 top-5 hidden h-px w-[calc(100%+2rem)] bg-slate-200 dark:bg-slate-800 lg:block" />
              )}
              <div className="relative flex flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-black text-white shadow shadow-sky-500/30">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {s.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
