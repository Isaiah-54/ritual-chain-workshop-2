"use client";

import { useState } from "react";
import { PIPELINE, MARKETS } from "@/lib/protocol";
import { ResolutionConsole } from "@/components/ResolutionConsole";

export default function HowItWorksPage() {
  const [pipelineStep, setPipelineStep] = useState(0);
  const [selected] = useState(MARKETS[1] ?? MARKETS[0]);

  return (
    <main className="grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Protocol
          </div>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">
            How live resolution works
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)] md:text-base">
            At resolveBlock the Scheduler wakes the contract: TEE → HTTP → jq → compare.
            Failures retry up to three times, then Invalid + refund — never treat a failed read as NO.
          </p>
        </div>

        <section className="space-y-4">
          <div className="panel p-4 md:p-6">
            <div className="grid gap-2 md:grid-cols-6">
              {PIPELINE.map((step, i) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setPipelineStep(i)}
                  className={`rounded-xl border p-3 text-left transition ${
                    pipelineStep === i
                      ? "border-[var(--teal)]/50 bg-[var(--teal)]/10"
                      : "border-[var(--line)] bg-black/20"
                  }`}
                >
                  <div className="mono text-[10px] text-[var(--muted)]">0{i + 1}</div>
                  <div className="mt-1 text-sm font-medium">{step.label}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-black/30 p-4">
              <div className="text-sm font-medium text-[var(--teal)]">
                {PIPELINE[pipelineStep].label}
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {PIPELINE[pipelineStep].detail}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
              Simulation
            </div>
            <h2 className="text-2xl font-semibold">Run resolution</h2>
          </div>
          <ResolutionConsole market={selected} />
        </section>
      </div>
    </main>
  );
}
