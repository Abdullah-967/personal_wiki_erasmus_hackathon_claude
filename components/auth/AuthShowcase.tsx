import { Fraunces, Space_Grotesk } from "next/font/google";
import Link from "next/link";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const interfaceFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const pillars = [
  {
    title: "Capture what you just learned",
    body: "Turn rough notes, pasted fragments, and uploads into a clean page without manual cleanup.",
  },
  {
    title: "See ideas connect themselves",
    body: "New concepts link into the rest of your knowledge so the wiki grows like a map, not a folder.",
  },
  {
    title: "Ask from your own memory",
    body: "Get answers grounded in your pages first, with the system showing which concepts it used.",
  },
];

const signals = [
  "Chat-first capture",
  "PDF, TXT, and Markdown uploads",
  "Auto-linked personal wiki",
];

const flow = [
  {
    label: "Say it naturally",
    detail:
      "Share a lesson, a paper summary, or a messy insight the way you already think about it.",
  },
  {
    label: "Let the system structure it",
    detail:
      "The app writes the page, distills key points, and links it to nearby concepts.",
  },
  {
    label: "Use the knowledge immediately",
    detail:
      "Browse the page, follow the connections, and ask how it fits with what you knew before.",
  },
];

export default function AuthShowcase() {
  return (
    <section
      className={`${interfaceFont.className} relative overflow-hidden rounded-[32px] border border-white/10 bg-[#08111f] px-6 py-6 text-slate-100 shadow-[0_40px_120px_rgba(2,6,23,0.55)] sm:px-8 sm:py-8 lg:px-10 lg:py-10`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_34%),radial-gradient(circle_at_78%_18%,_rgba(245,158,11,0.18),_transparent_22%),linear-gradient(160deg,_rgba(15,23,42,0.98),_rgba(8,17,31,0.92))]" />
      <div className="absolute -left-16 top-14 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-10 right-8 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative flex h-full flex-col justify-between gap-10">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/80">
            <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-[11px]">
              Personal Wikipedia Companion
            </span>
            <span className="text-slate-400">Onboarding</span>
          </div>

          <div className="space-y-5">
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Talk to your learning, and your personal wiki builds itself.
            </p>
            <h1
              className={`${display.className} max-w-2xl text-4xl leading-tight text-white sm:text-5xl lg:text-6xl`}
            >
              Build a living knowledge base from the conversations you already
              have.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Instead of maintaining notes by hand, capture what you learn and
              let the app create, update, and connect the pages for you.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {signals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                Why it lands
              </h2>
              <Link
                href="/signup"
                className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/15"
              >
                Start your wiki
              </Link>
            </div>

            <div className="grid gap-3">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-3xl border border-white/8 bg-slate-950/40 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {pillar.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/45 p-5 backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Flow
            </h2>
            <div className="mt-5 space-y-4">
              {flow.map((step, index) => (
                <div
                  key={step.label}
                  className="rounded-3xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-300/15 text-sm font-semibold text-amber-100">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {step.label}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
