"use client";

import { useEffect, useState } from "react";

const stages = [
  {
    number: "01",
    short: "SCHED",
    name: "Scheduler",
    icon: "◷",
    description: "Resolution job triggered",
    detail: "A scheduled task starts the resolution process.",
  },
  {
    number: "02",
    short: "TEE",
    name: "TEE",
    icon: "◇",
    description: "Trusted execution environment initialized",
    detail: "The computation runs inside a trusted environment.",
  },
  {
    number: "03",
    short: "HTTP",
    name: "HTTP",
    icon: "↗",
    description: "External oracle response received",
    detail: "The resolver fetches data from an external HTTP endpoint.",
  },
  {
    number: "04",
    short: "jq",
    name: "jq",
    icon: "⌘",
    description: "Value extracted from response",
    detail: "A JSON query extracts the value required for evaluation.",
  },
  {
    number: "05",
    short: "CMP",
    name: "Comparator",
    icon: "≥",
    description: "Condition evaluated",
    detail: "The extracted value is compared against the market target.",
  },
  {
    number: "06",
    short: "RES",
    name: "Resolution",
    icon: "✓",
    description: "Outcome finalized",
    detail: "The market becomes YES or NO.",
  },
  {
    number: "07",
    short: "PAY",
    name: "Payout / Refund",
    icon: "₿",
    description: "Settlement becomes available",
    detail: "Winning positions receive payout; invalid markets receive refunds.",
  },
];

const markets = [
  {
    id: "#001",
    question: "Will ETH price be ≥ $4,000?",
    oracle: "api.example.com/eth",
    path: "price",
    target: "4,000",
    observed: "4,126",
    yes: 76,
    no: 24,
    status: "RESOLVED",
    outcome: "YES",
  },
  {
    id: "#002",
    question: "Will BTC price be ≥ $120,000?",
    oracle: "api.example.com/btc",
    path: "price",
    target: "120,000",
    observed: "117,420",
    yes: 38,
    no: 62,
    status: "RESOLVED",
    outcome: "NO",
  },
  {
    id: "#003",
    question: "Will ETH gas be < 20 gwei?",
    oracle: "api.example.com/gas",
    path: "gas",
    target: "20",
    observed: "14",
    yes: 57,
    no: 43,
    status: "OPEN",
    outcome: null,
  },
];

export default function Home() {
  const [activeStage, setActiveStage] = useState(0);
  const [selectedMarket, setSelectedMarket] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((current) => (current + 1) % stages.length);
    }, 2400);

    return () => clearInterval(timer);
  }, []);

  const market = markets[selectedMarket];

  return (
    <main>
      <nav className="nav">
        <a href="#" className="brand">
          <span className="brand-mark">R</span>
          <span>RitualPredict</span>
        </a>

        <div className="nav-links">
          <a href="#architecture">Architecture</a>
          <a href="#markets">Markets</a>
          <a href="#resolution">Resolution</a>
        </div>

        <div className="demo-pill">
          <span className="live-dot" />
          DEMO MODE
        </div>
      </nav>

      <section className="hero">
        <div className="hero-grid" />

        <div className="hero-content">
          <div className="eyebrow">
            <span>RITUAL CHAIN</span>
            <span className="separator">/</span>
            <span>ACADEMY PROJECT</span>
          </div>

          <h1>
            Prediction markets
            <br />
            <span>with verifiable resolution.</span>
          </h1>

          <p className="hero-copy">
            RitualPredict demonstrates how prediction markets can be resolved
            through a programmable Scheduler → TEE → HTTP → jq → Comparator
            pipeline.
          </p>

          <div className="hero-actions">
            <a href="#markets" className="button button-primary">
              Explore markets <span>↓</span>
            </a>
            <a href="#architecture" className="button button-secondary">
              View architecture
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>07</strong>
              <span>PIPELINE STAGES</span>
            </div>
            <div>
              <strong>03</strong>
              <span>DEMO MARKETS</span>
            </div>
            <div>
              <strong>TEE</strong>
              <span>RESOLUTION ENGINE</span>
            </div>
            <div>
              <strong>HTTP</strong>
              <span>DATA SOURCE</span>
            </div>
          </div>
        </div>

        <div className="hero-engine">
          <div className="engine-header">
            <div>
              <span className="tiny-label">RESOLUTION ENGINE</span>
              <h3>Protocol execution</h3>
            </div>
            <span className="engine-status">
              <span className="live-dot" />
              SIMULATED
            </span>
          </div>

          <div className="engine-visual">
            {stages.map((stage, index) => (
              <div className="engine-stage-wrap" key={stage.short}>
                <div
                  className={`engine-stage ${
                    activeStage === index ? "active" : ""
                  } ${index < activeStage ? "passed" : ""}`}
                  onClick={() => setActiveStage(index)}
                >
                  <span className="stage-icon">{stage.icon}</span>
                  <span className="stage-number">{stage.number}</span>
                  <strong>{stage.short}</strong>
                </div>

                {index < stages.length - 1 && (
                  <div
                    className={`engine-line ${
                      index < activeStage ? "filled" : ""
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="engine-detail">
            <div className="detail-number">{stages[activeStage].number}</div>
            <div>
              <span>{stages[activeStage].short}</span>
              <strong>{stages[activeStage].name}</strong>
              <p>{stages[activeStage].description}</p>
            </div>
            <div className="processing">
              <span className="processing-dot" />
              PROCESSING
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="section">
        <div className="section-heading">
          <div>
            <span className="section-number">01 / ARCHITECTURE</span>
            <h2>From trigger to outcome.</h2>
          </div>
          <p>
            Every stage of the resolution lifecycle is represented as a
            programmable protocol step.
          </p>
        </div>

        <div className="pipeline">
          {stages.map((stage, index) => (
            <button
              key={stage.short}
              className={`pipeline-card ${
                activeStage === index ? "selected" : ""
              }`}
              onClick={() => setActiveStage(index)}
            >
              <div className="pipeline-top">
                <span>{stage.number}</span>
                <span>{stage.icon}</span>
              </div>
              <strong>{stage.name}</strong>
              <span>{stage.short}</span>
              <p>{stage.detail}</p>
            </button>
          ))}
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

        <div className="markets-layout">
          <div className="market-list">
            {markets.map((item, index) => (
              <button
                key={item.id}
                className={`market-list-item ${
                  selectedMarket === index ? "selected" : ""
                }`}
                onClick={() => setSelectedMarket(index)}
              >
                <span className="market-id">{item.id}</span>
                <span className="market-question">{item.question}</span>
                <span
                  className={`market-status ${
                    item.status === "OPEN" ? "open" : ""
                  }`}
                >
                  {item.status}
                </span>
              </button>
            ))}
          </div>

          <div className="market-detail-card">
            <div className="market-card-header">
              <div>
                <span className="tiny-label">MARKET {market.id}</span>
                <h3>{market.question}</h3>
              </div>
              <span
                className={`status-badge ${
                  market.status === "OPEN" ? "open" : ""
                }`}
              >
                <span />
                {market.status}
              </span>
            </div>

            <div className="probability">
              <div className="probability-labels">
                <span>YES</span>
                <strong>{market.yes}%</strong>
                <span>NO</span>
                <strong>{market.no}%</strong>
              </div>

              <div className="probability-bar">
                <div style={{ width: `${market.yes}%` }} />
              </div>
            </div>

            <div className="market-data">
              <div>
                <span>ORACLE SOURCE</span>
                <strong>{market.oracle}</strong>
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

            <div className="market-result">
              <div>
                <span>RESOLUTION RESULT</span>
                <strong
                  className={market.outcome === "YES" ? "yes" : "no"}
                >
                  {market.outcome || "AWAITING RESOLUTION"}
                </strong>
              </div>

              <div className="demo-position">
                <span>DEMO POSITION</span>
                <strong>No blockchain transaction</strong>
              </div>
            </div>

            <div className="bet-actions">
              <button className="bet-yes">Bet YES</button>
              <button className="bet-no">Bet NO</button>
            </div>

            <div className="simulation-note">
              <span>i</span>
              Actions are simulated locally. No wallet or contract is required.
            </div>
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
            Follow a complete resolution trace from scheduled execution to
            final settlement.
          </p>
        </div>

        <div className="trace">
          <div className="trace-header">
            <div>
              <span className="tiny-label">RESOLUTION TRACE</span>
              <h3>MARKET #001</h3>
            </div>
            <span className="trace-state">
              <span className="live-dot" />
              RESOLVED
            </span>
          </div>

          <div className="trace-body">
            <TraceRow
              number="01"
              title="SCHEDULER"
              text="Resolution job triggered"
              value="JOB #8F21"
            />
            <TraceRow
              number="02"
              title="TEE"
              text="Trusted execution environment initialized"
              value="VERIFIED"
            />
            <TraceRow
              number="03"
              title="HTTP"
              text="External oracle response received"
              value="200 OK"
            />
            <TraceRow
              number="04"
              title="jq"
              text="Value extracted: price = 4126"
              value=".price → 4126"
            />
            <TraceRow
              number="05"
              title="COMPARATOR"
              text="4126 ≥ 4000 → TRUE"
              value="TRUE"
            />
            <TraceRow
              number="06"
              title="RESOLUTION"
              text="Outcome finalized: YES"
              value="YES"
              highlight
            />
            <TraceRow
              number="07"
              title="PAYOUT"
              text="Winning positions eligible for settlement"
              value="READY"
            />
          </div>
        </div>
      </section>

      <section className="section architecture-summary">
        <div className="summary-card">
          <div className="summary-icon">∞</div>
          <div>
            <span className="tiny-label">RITUALPREDICT</span>
            <h2>Resolution without an oracle committee.</h2>
            <p>
              The demonstration shows how external data can move through a
              deterministic resolution pipeline before producing a market
              outcome.
            </p>
          </div>
        </div>

        <div className="summary-grid">
          <div>
            <span>TRIGGER</span>
            <strong>Scheduler</strong>
          </div>
          <div>
            <span>EXECUTION</span>
            <strong>TEE</strong>
          </div>
          <div>
            <span>DATA</span>
            <strong>HTTP</strong>
          </div>
          <div>
            <span>TRANSFORM</span>
            <strong>jq</strong>
          </div>
          <div>
            <span>LOGIC</span>
            <strong>Comparator</strong>
          </div>
          <div>
            <span>SETTLEMENT</span>
            <strong>Payout / Refund</strong>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark">R</span>
          <div>
            <strong>RitualPredict</strong>
            <span>prediction market architecture demo</span>
          </div>
        </div>

        <div className="footer-note">
          <strong>About this demonstration</strong>
          <p>
            The Ritual testnet used during development has ended. This
            frontend intentionally operates as a polished simulation of the
            RitualPredict architecture and does not require a deployed smart
            contract, wallet connection, RPC endpoint, or live oracle.
          </p>
        </div>

        <div className="footer-bottom">
          <span>BUILT FOR THE RITUAL CHAIN ACADEMY PROJECT</span>
          <span>SIMULATION / NO LIVE CONTRACT</span>
        </div>
      </footer>
    </main>
  );
}

function TraceRow({
  number,
  title,
  text,
  value,
  highlight = false,
}: {
  number: string;
  title: string;
  text: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`trace-row ${highlight ? "highlight" : ""}`}>
      <span className="trace-number">{number}</span>
      <span className="trace-check">✓</span>
      <div className="trace-copy">
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      <code>{value}</code>
    </div>
  );
}
