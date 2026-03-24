import { ArrowRight, Gauge, LineChart, LogIn, Radar, Sparkles, Target, Waves } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { apiBaseUrl } from "@/lib/api";
import { creatorDataSourceLabel, isDemoMode } from "@/lib/demo";

const metrics = [
  { label: "public channels scanned", value: "140+" },
  { label: "signals per competitor", value: "26" },
  { label: "strategy surfaces", value: "4 live" },
];

const capabilities = [
  {
    icon: Radar,
    title: "Competitor Discovery With Fit Filters",
    description:
      "Score channels by niche overlap, reach, language, target-country signals, and audience-fit heuristics instead of pulling a random list of creators.",
  },
  {
    icon: Gauge,
    title: "Strategy From Public Evidence",
    description:
      "Turn public uploads, comments, cadence, title formulas, and outlier videos into a practical roadmap, not a generic growth summary.",
  },
  {
    icon: Sparkles,
    title: "Packaging Guidance That Ships",
    description:
      "Generate title rewrites and thumbnail concepts from real winning patterns across matched competitors, with references you can inspect.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Map the market",
    copy: "Discover adjacent channels that actually compete for the same viewer attention.",
  },
  {
    step: "02",
    title: "Decode the outliers",
    copy: "Trace which titles, topics, posting windows, and audience asks are driving traction.",
  },
  {
    step: "03",
    title: "Ship the next move",
    copy: "Move from insight to publishable strategy, packaging, and weekly execution.",
  },
];

const LoginPage = () => {
  const handleLogin = () => {
    window.location.href = `${apiBaseUrl}/auth/login`;
  };

  return (
    <div className="landing-shell landing-body relative min-h-screen overflow-hidden bg-[#090909] text-white">
      <div className="landing-grid pointer-events-none absolute inset-0" />
      <div className="landing-grain pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute left-[-8%] top-[-10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(201,67,43,0.26),transparent_62%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-12rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(207,182,111,0.18),transparent_64%)] blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1320px] items-center justify-between px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] border border-white/10 bg-[linear-gradient(160deg,rgba(230,72,42,0.95),rgba(122,25,17,0.9))] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <LineChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="landing-kicker text-[11px] uppercase tracking-[0.32em] text-white/45">Competitor Spy</p>
            <p className="text-sm text-white/70">Market intelligence for creator strategy</p>
          </div>
        </div>

        <div className="hidden items-center gap-8 lg:flex">
          <a href="#capabilities" className="text-sm text-white/62 transition-colors hover:text-white">
            Capabilities
          </a>
          <a href="#workflow" className="text-sm text-white/62 transition-colors hover:text-white">
            Workflow
          </a>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/58">
            Real competitors. Seeded creator side.
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-col gap-16 px-4 pb-14 pt-6 sm:px-6 lg:px-10 lg:pb-20 lg:pt-10">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-end">
          <div className="landing-reveal space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.045] px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-white/56 backdrop-blur">
              <Waves className="h-3.5 w-3.5 text-[#df5d3f]" />
              Strategy-grade YouTube reconnaissance
            </div>

            <div className="space-y-6">
              <h1 className="landing-display max-w-4xl text-[clamp(3.6rem,9vw,7.7rem)] leading-[0.9] tracking-[-0.045em] text-[#f6f0e8]">
                Read the market
                <span className="block text-[#d8c1a3]">before you publish.</span>
              </h1>
              <p className="max-w-2xl text-[1.05rem] leading-8 text-white/68 sm:text-[1.12rem]">
                Competitor Spy turns public YouTube behavior into decision-ready strategy: who actually competes for your viewer,
                what their audience keeps asking for, which packaging patterns are winning, and where your next upload has room to
                break through.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {isDemoMode ? (
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full border border-[#f1d8bc]/20 bg-[#efe2d1] px-6 text-[0.95rem] font-semibold text-[#18110f] shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-transform hover:translate-y-[-1px] hover:bg-[#f7ecdf]"
                >
                  <Link to="/app">
                    Enter Demo Workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="h-12 rounded-full border border-[#f1d8bc]/20 bg-[#efe2d1] px-6 text-[0.95rem] font-semibold text-[#18110f] shadow-[0_20px_50px_rgba(0,0,0,0.25)] transition-transform hover:translate-y-[-1px] hover:bg-[#f7ecdf]"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Connect Your Channel
                </Button>
              )}

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 rounded-full border border-white/12 bg-white/[0.04] px-6 text-[0.95rem] text-white/88 backdrop-blur transition-colors hover:bg-white/[0.09] hover:text-white"
              >
                <a href="#capabilities">See What It Analyzes</a>
              </Button>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xl">
                  <p className="landing-kicker text-[11px] uppercase tracking-[0.26em] text-[#d9b791]">Current setup</p>
                  <p className="mt-3 text-sm leading-7 text-white/68">
                    {isDemoMode
                      ? `${creatorDataSourceLabel} is active. Channel-side metrics are seeded so the product can demo cleanly, while competitor discovery, strategy, titles, and thumbnails are based on live public analysis.`
                      : "Sign in to connect your own channel while still benchmarking against live public competitors and packaging signals."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                  {metrics.map((metric, index) => (
                    <div
                      key={metric.label}
                      className="landing-reveal rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-4"
                      style={{ animationDelay: `${index * 120}ms` }}
                    >
                      <p className="text-2xl font-semibold tracking-[-0.04em] text-[#f6ede2]">{metric.value}</p>
                      <p className="mt-1 text-[11px] uppercase leading-5 tracking-[0.2em] text-white/46">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="landing-reveal relative min-h-[540px] lg:min-h-[620px]" style={{ animationDelay: "180ms" }}>
            <div className="absolute left-[6%] top-0 w-[76%] rotate-[-8deg] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,17,16,0.72),rgba(18,17,16,0.28))] p-5 shadow-[0_40px_110px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-white/42">
                <span>Audience fit matrix</span>
                <span>live scan</span>
              </div>
              <div className="mt-6 grid grid-cols-6 gap-2">
                {Array.from({ length: 24 }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-10 rounded-xl ${
                      index % 7 === 0
                        ? "bg-[#df5d3f]/85"
                        : index % 5 === 0
                          ? "bg-[#d7ba8e]/60"
                          : "bg-white/[0.06]"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-sm">
                <div>
                  <p className="text-white/44">Highest-fit lane</p>
                  <p className="mt-1 text-[#f4eadf]">Developer tools + AI workflows</p>
                </div>
                <div className="rounded-full border border-[#df5d3f]/35 bg-[#df5d3f]/12 px-3 py-1 text-[#efc0b0]">
                  81% fit
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-[24%] w-[64%] rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,14,13,0.88),rgba(14,14,13,0.42))] p-5 shadow-[0_40px_110px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/42">
                <Target className="h-3.5 w-3.5 text-[#d9b791]" />
                packaging winners
              </div>
              <div className="mt-5 space-y-4">
                {[
                  "comparison titles",
                  "single-focal thumbnails",
                  "Tue / Thu cadence",
                  "audience-requested follow-ups",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-xs text-white/48">
                      0{index + 1}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-sm text-white/72">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-2 left-[12%] w-[62%] rounded-[1.8rem] border border-[#df5d3f]/18 bg-[linear-gradient(180deg,rgba(201,67,43,0.16),rgba(14,14,13,0.28))] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/44">viewer demand</p>
                <p className="text-sm text-[#f2d4c7]">comment-derived</p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Practical Linux workflows",
                  "Real coding agent comparisons",
                  "Benchmark-backed hardware picks",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-[#f4ece2]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="landing-reveal rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-7 shadow-[0_34px_90px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <p className="landing-kicker text-[11px] uppercase tracking-[0.28em] text-[#d9b791]">Why it matters</p>
            <h2 className="landing-display mt-4 text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.045em] text-[#f6f0e8]">
              Stop guessing which channels matter.
            </h2>
            <p className="mt-5 max-w-xl text-[1rem] leading-8 text-white/66">
              Most creator tooling stops at vanity benchmarks. Competitor Spy is built for the harder question:
              which adjacent channels shape your audience’s expectations, and how should that change what you publish next?
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {capabilities.map((item, index) => (
              <article
                key={item.title}
                className="landing-reveal rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.2)] backdrop-blur-xl"
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  <item.icon className="h-5 w-5 text-[#e6baa2]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-7 text-[#f5ede1]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="grid gap-6 rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,15,14,0.86),rgba(16,15,14,0.56))] p-6 shadow-[0_38px_100px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:grid-cols-[1fr_auto]"
        >
          <div>
            <p className="landing-kicker text-[11px] uppercase tracking-[0.28em] text-[#d9b791]">Operating rhythm</p>
            <h2 className="landing-display mt-4 text-[clamp(2.1rem,4vw,4rem)] leading-[0.94] tracking-[-0.045em] text-[#f6f0e8]">
              Built like a strategy desk, not a dashboard toy.
            </h2>
          </div>

          <div className="flex items-end text-right">
            <p className="max-w-sm text-sm leading-7 text-white/58">
              Each surface moves from signal collection to packaging guidance, so the output is something a creator can actually publish against.
            </p>
          </div>

          <div className="grid gap-4 lg:col-span-2 lg:grid-cols-3">
            {workflow.map((item, index) => (
              <div
                key={item.step}
                className="landing-reveal rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">{item.step}</p>
                <h3 className="mt-4 text-xl font-semibold text-[#f6ede3]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-reveal rounded-[2.2rem] border border-[#d9b791]/14 bg-[linear-gradient(135deg,rgba(223,93,63,0.12),rgba(255,255,255,0.03)_55%,rgba(215,186,142,0.08))] p-7 shadow-[0_40px_110px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="landing-kicker text-[11px] uppercase tracking-[0.28em] text-[#e0b18e]">Entry point</p>
              <h2 className="landing-display mt-4 text-[clamp(2.3rem,4.2vw,4.5rem)] leading-[0.94] tracking-[-0.045em] text-[#f8f0e6]">
                Use the demo to sell the product. Use the workspace to interrogate the market.
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {isDemoMode ? (
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-full border border-[#f1d8bc]/20 bg-[#f2e6d8] px-6 text-[0.95rem] font-semibold text-[#17100f] hover:bg-[#f9efe4]"
                >
                  <Link to="/app">
                    Open Workspace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={handleLogin}
                  size="lg"
                  className="h-12 rounded-full border border-[#f1d8bc]/20 bg-[#f2e6d8] px-6 text-[0.95rem] font-semibold text-[#17100f] hover:bg-[#f9efe4]"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Start With YouTube
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
