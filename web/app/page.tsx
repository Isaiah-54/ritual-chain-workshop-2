"use client";

import { useEffect, useState } from "react";

type Stage = {
  name: string;
  short: string;
  description: string;
};

const stages: Stage[] = [
  {
    name: "Scheduler",
    short: "SCHED",
    description: "Triggers the market resolution job at the configured block.",
  },
  {
    name: "TEE",
    short: "TEE",
    description: "Executes the resolution workflow in a trusted environment.",
  },
  {
    name: "HTTP",
    short: "HTTP",
    description: "Fetches the external data source requested by the market.",
  },
  {
    name: "jq",
    short: "jq",
    description: "Extracts the required value from the HTTP response.",
  },
  {
    name: "Comparator",
    short: "CMP",
    description: "Evaluates the observed value against the market condition.",
  },
  {
    name: "Resolution",
    short: "RES",
    description: "Produces the final Yes / No outcome.",
  },
  {
    name: "Payout / Refund",
    short: "PAY",
    description: "Winners receive their payout; invalid markets are refundable.",
  },
];

const demoMarkets = [
  {
    id: "#001",
    question: "Will ETH price be ≥ $4,000?",
    source: "api.example.com/eth",
    path: "price",
    target: "$4,000",
    observed: "$4,126",
    outcome: "YES",
    yes: 68,
    no: 32,
    status: "RESOLVED",
  },
  {
    id: "#002",
    question: "Will BTC price be ≥ $120,000?",
    source: "api.example.com/btc",
    path: "price",
    target: "$120,000",
    observed: "$118,450",
    outcome: "NO",
    yes: 41,
    no: 59,
    status: "RESOLVED",
  },
  {
    id: "#003",
    question: "Will ETH gas be < 20 gwei?",
    source: "api.example.com/gas",
    path: "gas",
    target: "20",
    observed: "14",
    outcome: "YES",
    yes: 57,
    no: 43,
    status: "OPEN",
  },
];

export default function Page() {
  const [activeStage, setActiveStage] = useState(0);
  const [selectedMarket, setSelectedMarket] = useState(2);
  const [amount, setAmount] = useState("0.10");
  const [side, setSide] = useState<"YES" | "NO" | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((value) => (value + 1) % stages.length);
    }, 2200);

    return () => clearInterval(timer);
  }, []);

  const market = demoMarkets[selectedMarket];

  function placeDemoBet(choice: "YES" | "NO") {
    setSide(choice);
    setNotice(
      `Demo position created: ${amount || "0"} RITUAL on ${choice}. No transaction is sent.`
    );
  }

  return (
    <main className="min-h-screen">
      <nav className="nav">
        <div className="brand">
          <span className="brand-mark">R</span>
          <div>
            <strong>RitualPredict</strong>
            <span>protocol demonstration</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="#markets">Markets</a>
          <a href="#architecture">Architecture</a>
          <a href="#resolution">Resolution</a>
        </div>

        <div className="demo-pill">
          <span className="status-dot" />
          DEMO MODE
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span>RITUAL CHAIN</span>
            <span className="slash">/</span>
            <span>ACADEMY PROJECT</span>
          </div>

          <h1>
            Prediction markets
            <br />
            <span>with verifiable resolution.</span>
          </h1>

          <p className="hero-text">
            RitualPredict demonstrates how prediction markets can be resolved
            through a programmable Scheduler → TEE → HTTP → jq → Comparator
            pipeline.
          </p>

          <div className="hero-actions">
            <a className="primary-btn" href="#markets">
              Explore markets <span>↓</span>
            </a>
            <a className="secondary-btn" href="#architecture">
              View architecture
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="orb">
            <div className="orb-ring ring-one" />
            <div className="orb-ring ring-two" />
            <div className="orb-core">
              <span>RITUAL</span>
              <strong>∞</strong>
              <small>RESOLUTION</small>
            </div>
          </div>

          <div className="floating-card card-top">
            <span className="mini-label">ORACLE</span>
            <strong>HTTP → jq</strong>
            <small>external data</small>
          </div>

          <div className="floating-card card-bottom">
            <span className="mini-label">RESULT</span>
            <strong>YES</strong>
            <small>verified outcome</small>
          </div>
        </div>
      </section>

      <section className="stats">
        <div>
          <span>MARKETS</span>
          <strong>03</strong>
        </div>
        <div>
          <span>RESOLUTION ENGINE</span>
          <strong>TEE</strong>
        </div>
        <div>
          <span>DATA SOURCE</span>
          <strong>HTTP</strong>
        </div>
        <div>
          <span>CONTRACT</span>
          <strong>SIMULATED</strong>
        </div>
      </section>

      <section id="architecture" className="section">
        <div className="section-heading">
          <div>
            <span className="section-number">01 / ARCHITECTURE</span>
            <h2>From trigger to outcome.</h2>
          </div>
          <p>
            The entire resolution lifecycle is represented below as an
            interactive protocol pipeline.
          </p>
        </div>

        <div className="pipeline">
          {stages.map((stage, index) => (
            <button
              key={stage.name}
              className={`pipeline-node ${
                activeStage === index ? "active" : ""
              }`}
              onClick={() => setActiveStage(index)}
            >
              <div className="node-top">
                <span>0{index + 1}</span>
                {index < stages.length - 1 && <i />}
              </div>

              <div className="node-icon">
                {index === 0 && "◷"}
                {index === 1 && "◇"}
                {index === 2 && "↗"}
                {index === 3 && "⌘"}
                {index === 4 && "≥"}
                {index === 5 && "✓"}
                {index === 6 && "₿"}
              </div>

              <strong>{stage.name}</strong>
              <small>{stage.short}</small>
            </button>
          ))}
        </div>

        <div className="stage-detail">
          <div className="stage-number">STEP 0{activeStage + 1}</div>
          <div>
            <h3>{stages[activeStage].name}</h3>
            <p>{stages[activeStage].description}</p>
          </div>
          <div className="stage-status">
            <span className="status-dot" />
            PROCESSING
          </div>
        </div>
      </section>

      <section id="markets" className="section markets-section">
        <div className="section-heading">
          <div>
            <span className="section-number">02 / MARKETS</span>
            <h2>Prediction markets.</h2>
          </div>
          <p>
            Explore simulated markets and experience the complete prediction
            flow without a deployed contract.
          </p>
        </div>

        <div className="market-layout">
          <div className="market-list">
            {demoMarkets.map((item, index) => (
              <button
                key={item.id}
                className={`market-row ${
                  selectedMarket === index ? "selected" : ""
                }`}
                onClick={() => setSelectedMarket(index)}
              >
                <div className="market-id">{item.id}</div>

                <div className="market-question">
                  <strong>{item.question}</strong>
                  <span>
                    {item.status} · {item.source}
                  </span>
                </div>

                <div className="market-outcome">
                  <strong className={item.outcome === "YES" ? "yes" : "no"}>
                    {item.outcome}
                  </strong>
                  <span>outcome</span>
                </div>
              </button>
            ))}
          </div>

          <div className="market-detail">
            <div className="market-header">
              <div>
                <span className="live-tag">
                  {market.status === "OPEN" ? "● OPEN" : "✓ RESOLVED"}
                </span>
                <span className="market-id">{market.id}</span>
              </div>
              <span className="market-chain">RITUALPREDICT</span>
            </div>

            <h3>{market.question}</h3>

            <div className="data-grid">
              <div>
                <span>ORACLE SOURCE</span>
                <strong>{market.source}</strong>
              </div>
              <div>
                <span>JSON PATH</span>
                <strong>{market.path}</strong>
              </div>
              <div>
                <span>TARGET</span>
                <strong>{market.target}</strong>
              </div>
              <div>
                <span>OBSERVED VALUE</span>
                <strong>{market.observed}</strong>
              </div>
            </div>

            <div className="distribution">
              <div className="distribution-head">
                <span>MARKET DISTRIBUTION</span>
                <span>{market.yes}% / {market.no}%</span>
              </div>

              <div className="distribution-bar">
                <div style={{ width: `${market.yes}%` }} />
              </div>

              <div className="distribution-labels">
                <span>YES {market.yes}%</span>
                <span>NO {market.no}%</span>
              </div>
            </div>

            {market.status === "OPEN" ? (
              <div className="bet-box">
                <div className="bet-title">
                  <span>DEMO POSITION</span>
                  <small>No blockchain transaction</small>
                </div>

                <div className="bet-controls">
                  <div className="amount">
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      inputMode="decimal"
                    />
                    <span>RITUAL</span>
                  </div>

                  <button
                    className={`bet-yes ${side === "YES" ? "chosen" : ""}`}
                    onClick={() => placeDemoBet("YES")}
                  >
                    BET YES
                  </button>

                  <button
                    className={`bet-no ${side === "NO" ? "chosen" : ""}`}
                    onClick={() => placeDemoBet("NO")}
                  >
                    BET NO
                  </button>
                </div>

                {notice && <div className="notice">{notice}</div>}
              </div>
            ) : (
              <div className="resolved-box">
                <div>
                  <span>RESOLUTION</span>
                  <strong>{market.outcome}</strong>
                </div>
                <div>
                  <span>SETTLEMENT</span>
                  <strong>PAYOUT</strong>
                </div>
                <div>
                  <span>VERIFICATION</span>
                  <strong>COMPLETE</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="resolution" className="section resolution-section">
        <div className="section-heading">
          <div>
            <span className="section-number">03 / RESOLUTION</span>
            <h2>See the protocol think.</h2>
          </div>
          <p>
            A visual representation of the resolution lifecycle used by the
            RitualPredict architecture.
          </p>
        </div>

        <div className="resolution-console">
          <div className="console-header">
            <span>
              <i />
              RESOLUTION TRACE
            </span>
            <span>MARKET #001</span>
          </div>

          <div className="console-body">
            {[
              ["SCHEDULER", "Resolution job triggered", "08:42:11"],
              ["TEE", "Trusted execution environment initialized", "08:42:12"],
              ["HTTP", "External oracle response received", "08:42:13"],
              ["jq", "Value extracted: price = 4126", "08:42:13"],
              ["COMPARATOR", "4126 ≥ 4000 → TRUE", "08:42:14"],
              ["RESOLUTION", "Outcome finalized: YES", "08:42:14"],
              ["PAYOUT", "Winning positions eligible for settlement", "08:42:15"],
            ].map(([label, text, time], index) => (
              <div className="trace-row" key={label}>
                <span className="trace-index">0{index + 1}</span>
                <strong>{label}</strong>
                <span>{text}</span>
                <time>{time}</time>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="demo-note">
        <div className="note-icon">i</div>
        <div>
          <strong>About this demonstration</strong>
          <p>
            The Ritual testnet used during development has ended. This
            frontend intentionally operates as a polished simulation of the
            RitualPredict architecture and does not require a deployed smart
            contract, wallet connection, RPC endpoint, or live oracle.
          </p>
        </div>
      </section>

      <footer>
        <div className="brand">
          <span className="brand-mark">R</span>
          <div>
            <strong>RitualPredict</strong>
            <span>prediction market architecture demo</span>
          </div>
        </div>

        <span>Built for the Ritual Chain Academy project</span>
      </footer>
    </main>
  );
}
