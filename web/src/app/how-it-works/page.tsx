"use client";

import { useState } from "react";
import { PIPELINE, MARKETS } from "@/lib/protocol";
import { ResolutionConsole } from "@/components/ResolutionConsole";

export default function HowItWorksPage() {
  const [pipelineStep, setPipelineStep] = useState(0);
  const [selected] = useState(MARKETS[1] ?? MARKETS[0]);

  return (
    <main className="grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-14">
        <div className="fade-up max-w-3xl">
          <span className="pill pill-glow inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)] pulse-dot" />
            Protocol
          </span>
          <h1 className="heading mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            How live resolution{" "}
            <span className="text-gradient">actually works</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
            At <span className="mono text-[var(--text)]">resolveBlock</span> the Scheduler
            wakes the contract: <span className="text-[var(--teal)]">TEE</span> →{" "}
            <span className="text-[var(--teal)]">HTTP</span> →{" "}
            <span className="text-[var(--teal)]">jq</span> → compare. Failures retry up to
            three times, then <span className="text-[var(--rose)]">Invalid + refund</span> —
            never treat a failed read as NO.
          </p>
        </div>

        <section className="fade-up fade-up-1 space-y-4">
          <div className="glow-ring panel panel-hover p-4 md:p-6">
            <div className="grid gap-2 md:grid-cols-6">
              {PIPELINE.map((step, i) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setPipelineStep(i)}
                  className={`group relative rounded-xl border p-3 text-left transition-all duration-200 ${
                    pipelineStep === i
                      ? "border-[var(--teal)]/50 bg-[var(--teal)]/10 shadow-[0_0_24px_-8px_rgba(62,224,197,0.5)]"
                      : "border-[var(--line)] bg-black/20 hover:border-[var(--teal)]/25 hover:bg-white/[0.03]"
                  }`}
                >
                  <div
                    className={`mono text-[10px] transition-colors ${
                      pipelineStep === i ? "text-[var(--teal)]" : "text-[var(--muted)]"
                    }`}
                  >
                    0{i + 1}
                  </div>
                  <div className="heading mt-1 text-sm font-medium">{step.label}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-black/30 p-5">
              <div className="heading text-sm font-medium text-[var(--teal)]">
                {PIPELINE[pipelineStep].label}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {PIPELINE[pipelineStep].detail}
              </p>
            </div>
          </div>
        </section>

        <section className="fade-up fade-up-2 space-y-4">
          <div>
            <span className="pill inline-block">Simulation</span>
            <h2 className="heading mt-3 text-2xl font-semibold md:text-3xl">
              Run resolution live
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              Streams Scheduler → TEE → HTTP → jq → compare in your browser — the same
              path exercised by the Hardhat test suite.
            </p>
          </div>
          <ResolutionConsole market={selected} />
        </section>
      </div>
    </main>
  );
}
