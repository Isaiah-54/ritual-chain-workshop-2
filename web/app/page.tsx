"use client";

import { useMemo, useState } from "react";

type MarketState = "Open" | "Closed" | "Resolving" | "Resolved" | "Invalid";
type Outcome = "Yes" | "No" | null;

type Market = {
  id: number;
  question: string;
  category: string;
  target: string;
  comparator: string;
  oracle: string;
  jsonPath: string;
  state: MarketState;
  outcome: Outcome;
  observed: string;
  yesPool: number;
  noPool: number;
  closeIn: string;
  attempts: number;
  invalidReason?: string;
};

const initialMarkets: Market[] = [
  {
    id: 1,
    question: "Will ETH close above $4,000?",
    category: "Crypto",
    target: "$4,000",
    comparator: "≥",
    oracle: "HTTP Oracle",
    jsonPath: "price",
    state: "Open",
    outcome: null,
    observed: "—",
    yesPool: 4.82,
    noPool: 2.31,
    closeIn: "18m",
    attempts: 0,
  },
  {
    id: 2,
    question: "Will BTC remain above $110,000?",
    category: "Crypto",
    target: "$110,000",
    comparator: "≥",
    oracle: "HTTP Oracle",
    jsonPath: "price",
    state: "Resolving",
    outcome: null,
    observed: "—",
    yesPool: 7.42,
    noPool: 5.18,
    closeIn: "Closed",
    attempts: 2,
  },
  {
    id: 3,
    question: "Will Ritual publish a mainnet announcement?",
    category: "Ritual",
    target: "1",
    comparator: "≥",
    oracle: "HTTP Oracle",
    jsonPath: "announcement",
    state: "Resolved",
    outcome: "Yes",
    observed: "1",
    yesPool: 8.15,
    noPool: 3.44,
    closeIn: "Resolved",
    attempts: 1,
  },
  {
    id: 4,
    question: "Will the oracle return a valid numeric value?",
    category: "Oracle",
    target: "100",
    comparator: "≥",
    oracle: "HTTP Oracle",
    jsonPath: "value",
    state: "Invalid",
    outcome: null,
    observed: "—",
    yesPool: 2.2,
    noPool: 1.8,
    closeIn: "Invalid",
    attempts: 3,
    invalidReason: "Oracle response could not be validated after maximum attempts.",
  },
];

function shortNumber(value: number) {
  return value.toFixed(2);
}

function stateClass(state: MarketState) {
  switch (state) {
    case "Open":
      return "status-open";
    case "Closed":
      return "status-closed";
    case "Resolving":
      return "status-resolving";
    case "Resolved":
      return "status-resolved";
    case "Invalid":
      return "status-invalid";
  }
}

export default function Page() {
  const [markets, setMarkets] = useState(initialMarkets);
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("0.10");
  const [activity, setActivity] = useState<string[]>([
    "Demo environment initialized",
    "RitualPredict resolution engine ready",
  ]);

  const stats = useMemo(() => {
    const total = markets.reduce(
      (sum, market) => sum + market.yesPool + market.noPool,
      0,
    );

    return {
      markets: markets.length,
      volume: total,
      resolved: markets.filter((m) => m.state === "Resolved").length,
      resolving: markets.filter((m) => m.state === "Resolving").length,
    };
  }, [markets]);

  function addActivity(message: string) {
    setActivity((items) => [message, ...items].slice(0, 5));
  }

  function connectWallet() {
    setConnected(true);
    addActivity("Demo wallet connected");
  }

  function placeBet(id: number, outcome: "Yes" | "No") {
    if (!connected) {
      connectWallet();
    }

    const amount = Number(betAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      addActivity("Enter a valid demo bet amount");
      return;
    }

    setMarkets((current) =>
      current.map((market) => {
        if (market.id !== id || market.state !== "Open") {
          return market;
        }

        return {
          ...market,
          yesPool:
            outcome === "Yes" ? market.yesPool + amount : market.yesPool,
          noPool:
            outcome === "No" ? market.noPool + amount : market.noPool,
        };
      }),
    );

    addActivity(`Demo bet placed: ${amount.toFixed(2)} RITUAL on ${outcome}`);
  }

  function simulateResolution(id: number) {
    setMarkets((current) =>
      current.map((market) =>
        market.id === id
          ? {
              ...market,
              state: "Resolving",
              attempts: Math.max(1, market.attempts),
              closeIn: "Resolving",
            }
          : market,
      ),
    );

    addActivity("Scheduler started resolution attempt");
  }

  function finishResolution(id: number, outcome: "Yes" | "No") {
    setMarkets((current) =>
      current.map((market) =>
        market.id === id
          ? {
              ...market,
              state: "Resolved",
              outcome,
              observed: market.target,
              closeIn: "Resolved",
              attempts: market.attempts + 1,
            }
          : market,
      ),
    );

    addActivity(`Market #${id} resolved: ${outcome}`);
  }

  function simulateInvalid(id: number) {
    setMarkets((current) =>
      current.map((market) =>
        market.id === id
          ? {
              ...market,
              state: "Invalid",
              outcome: null,
              closeIn: "Invalid",
              attempts: 3,
              invalidReason:
                "Demo failure: oracle response failed validation.",
            }
          : market,
      ),
    );

    addActivity(`Market #${id} marked invalid — refunds available`);
  }

  return (
    <main>
      <nav className="navbar">
        <div className="nav-inner">
          <div className="brand">
            <div className="brand-mark">R</div>
            <span>RitualPredict</span>
            <span className="demo-pill">DEMO</span>
          </div>

          <div className="nav-links">
            <a href="#markets">Markets</a>
            <a href="#resolution">Resolution</a>
            <a href="#architecture">Architecture</a>
          </div>

          <button className="wallet-button" onClick={connectWallet}>
            <span className={connected ? "wallet-dot connected" : "wallet-dot"} />
            {connected ? "0x7A...42F1" : "Connect wallet"}
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse" />
              RITUAL CHAIN · PREDICTION MARKET
            </div>

            <h1>
              Predict.
              <br />
              <span>Resolve.</span>
              <br />
              Settle.
            </h1>

            <p>
              A prediction-market demonstration built around the RitualPredict
              smart-contract architecture, Scheduler execution, TEE
              verification, HTTP oracle data and deterministic resolution.
            </p>

            <div className="hero-actions">
              <a href="#markets" className="primary-button">
                Explore markets
              </a>
              <a href="#resolution" className="secondary-button">
                View resolution flow
              </a>
            </div>
          </div>

          <div className="hero-card">
            <div className="terminal-top">
              <span />
              <span />
              <span />
              <label>ritualpredict / resolution</label>
            </div>

            <div className="terminal-body">
              <div>
                <span className="terminal-muted">$</span> ritualpredict
                resolve --market 42
              </div>
              <div className="terminal-line">
                <span>✓</span> scheduler execution accepted
              </div>
              <div className="terminal-line">
                <span>✓</span> TEE request verified
              </div>
              <div className="terminal-line">
                <span>✓</span> HTTP response received
              </div>
              <div className="terminal-line">
                <span>✓</span> jq path <b>price</b> extracted
              </div>
              <div className="terminal-line">
                <span>✓</span> observed value = <b>4287</b>
              </div>
              <div className="terminal-result">
                <small>COMPARATOR</small>
                <strong>4287 ≥ 4000</strong>
                <em>YES</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat">
          <span>MARKETS</span>
          <strong>{stats.markets}</strong>
        </div>
        <div className="stat">
          <span>DEMO VOLUME</span>
          <strong>{shortNumber(stats.volume)} RITUAL</strong>
        </div>
        <div className="stat">
          <span>RESOLVED</span>
          <strong>{stats.resolved}</strong>
        </div>
        <div className="stat">
          <span>RESOLVING</span>
          <strong>{stats.resolving}</strong>
        </div>
      </section>

      <section id="markets" className="content-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">LIVE DEMONSTRATION</div>
            <h2>Prediction markets</h2>
          </div>
          <span className="section-note">SIMULATED · NO CONTRACT REQUIRED</span>
        </div>

        <div className="demo-banner">
          <div className="banner-icon">!</div>
          <div>
            <strong>Ritual testnet deployment has ended.</strong>
            <p>
              This frontend intentionally runs as a self-contained project
              demo. No deployed contract, wallet balance or live oracle is
              required.
            </p>
          </div>
        </div>

        <div className="market-grid">
          {markets.map((market) => {
            const total = market.yesPool + market.noPool;
            const yesPercent = total === 0 ? 50 : (market.yesPool / total) * 100;

            return (
              <article className="market-card" key={market.id}>
                <div className="market-top">
                  <span className="category">{market.category}</span>
                  <span className={`status ${stateClass(market.state)}`}>
                    {market.state}
                  </span>
                </div>

                <h3>{market.question}</h3>

                <div className="market-target">
                  <span>RESOLUTION CONDITION</span>
                  <strong>
                    {market.comparator} {market.target}
                  </strong>
                </div>

                <div className="pool-bar">
                  <div style={{ width: `${yesPercent}%` }} />
                </div>

                <div className="pool-labels">
                  <span>
                    <b>YES</b> {shortNumber(market.yesPool)}
                  </span>
                  <span>
                    <b>NO</b> {shortNumber(market.noPool)}
                  </span>
                </div>

                <div className="market-meta">
                  <span>
                    Oracle <b>{market.oracle}</b>
                  </span>
                  <span>
                    Path <b>{market.jsonPath}</b>
                  </span>
                  <span>
                    Attempts <b>{market.attempts}</b>
                  </span>
                </div>

                {market.state === "Open" && (
                  <div className="bet-panel">
                    <div className="amount-row">
                      <input
                        value={betAmount}
                        onChange={(event) => setBetAmount(event.target.value)}
                        inputMode="decimal"
                        aria-label="Demo bet amount"
                      />
                      <span>RITUAL</span>
                    </div>

                    <button
                      className="yes-button"
                      onClick={() => placeBet(market.id, "Yes")}
                    >
                      Bet Yes
                    </button>

                    <button
                      className="no-button"
                      onClick={() => placeBet(market.id, "No")}
                    >
                      Bet No
                    </button>
                  </div>
                )}

                {market.state === "Resolving" && (
                  <div className="resolution-controls">
                    <button
                      onClick={() => finishResolution(market.id, "Yes")}
                    >
                      Resolve YES
                    </button>
                    <button
                      onClick={() => finishResolution(market.id, "No")}
                    >
                      Resolve NO
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => simulateInvalid(market.id)}
                    >
                      Mark Invalid
                    </button>
                  </div>
                )}

                {market.state === "Closed" && (
                  <button
                    className="full-button"
                    onClick={() => simulateResolution(market.id)}
                  >
                    Start resolution
                  </button>
                )}

                {market.state === "Resolved" && (
                  <div className="result-box">
                    <span>OBSERVED VALUE</span>
                    <strong>{market.observed}</strong>
                    <em>OUTCOME: {market.outcome}</em>
                  </div>
                )}

                {market.state === "Invalid" && (
                  <div className="invalid-box">
                    <strong>Market invalid</strong>
                    <p>{market.invalidReason}</p>
                    <button
                      onClick={() =>
                        addActivity(
                          `Refund claimed for market #${market.id}`,
                        )
                      }
                    >
                      Claim demo refund
                    </button>
                  </div>
                )}

                <button
                  className="details-button"
                  onClick={() =>
                    setSelected(selected === market.id ? null : market.id)
                  }
                >
                  {selected === market.id ? "Hide details ↑" : "View details →"}
                </button>

                {selected === market.id && (
                  <div className="market-details">
                    <div>
                      <span>Market ID</span>
                      <b>#{market.id}</b>
                    </div>
                    <div>
                      <span>Close status</span>
                      <b>{market.closeIn}</b>
                    </div>
                    <div>
                      <span>JSON path</span>
                      <b>{market.jsonPath}</b>
                    </div>
                    <div>
                      <span>Resolution</span>
                      <b>
                        observed {market.comparator} target
                      </b>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section id="resolution" className="resolution-section">
        <div className="section-heading centered">
          <div>
            <div className="eyebrow">CORE ARCHITECTURE</div>
            <h2>The resolution flow</h2>
            <p>
              Every market follows the same deterministic path from creation
              to settlement.
            </p>
          </div>
        </div>

        <div className="flow">
          <FlowStep number="01" title="Market Creation" text="Question, target, comparator and oracle configuration are stored." />
          <FlowArrow />
          <FlowStep number="02" title="Scheduler" text="A scheduled execution becomes eligible after the market closes." />
          <FlowArrow />
          <FlowStep number="03" title="Betting Closes" text="No further positions can be opened once the close condition is reached." />
          <FlowArrow />
          <FlowStep number="04" title="TEE Executor" text="Trusted execution performs the external-data workflow." />
          <FlowArrow />
          <FlowStep number="05" title="HTTP Oracle" text="The configured endpoint returns the external observation." />
          <FlowArrow />
          <FlowStep number="06" title="jq Extraction" text="The configured JSON path extracts the required value." />
          <FlowArrow />
          <FlowStep number="07" title="Observed Value" text="The extracted value is supplied to the resolution logic." />
          <FlowArrow />
          <FlowStep number="08" title="Comparator" text="The value is compared against the market target." />
          <FlowArrow />
          <div className="flow-final">
            <div className="flow-outcome">
              <span>09</span>
              <strong>Market Resolution</strong>
            </div>
            <div className="outcome-grid">
              <div className="outcome-card yes">
                <b>YES</b>
                <span>Winner payout</span>
              </div>
              <div className="outcome-card no">
                <b>NO</b>
                <span>Winner payout</span>
              </div>
              <div className="outcome-card invalid">
                <b>INVALID</b>
                <span>Refund handling</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="architecture-section">
        <div className="architecture-copy">
          <div className="eyebrow">PROJECT ARCHITECTURE</div>
          <h2>Built to demonstrate the complete protocol flow.</h2>
          <p>
            RitualPredict combines a prediction-market contract with a
            scheduler-driven resolution pipeline. The frontend mirrors the
            contract states and settlement paths without pretending that the
            retired Ritual testnet is still live.
          </p>
        </div>

        <div className="architecture-grid">
          <div>
            <span>01</span>
            <h3>Pari-mutuel pools</h3>
            <p>YES and NO positions form the market pool used for settlement.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Deterministic comparison</h3>
            <p>Observed data is compared against a configured target.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Failure handling</h3>
            <p>Failed resolution can invalidate a market and enable refunds.</p>
          </div>
          <div>
            <span>04</span>
            <h3>Execution funding</h3>
            <p>The architecture accounts for scheduled execution costs.</p>
          </div>
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-heading">
          <div>
            <div className="eyebrow">DEMO ACTIVITY</div>
            <h2>Execution log</h2>
          </div>
          <span>LOCAL SIMULATION</span>
        </div>

        <div className="activity-log">
          {activity.map((item, index) => (
            <div key={`${item}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{item}</p>
              <small>NOW</small>
            </div>
          ))}
        </div>
      </section>

      <footer>
        <div>
          <strong>RitualPredict</strong>
          <span>Ritual Chain prediction-market workshop extension</span>
        </div>
        <span>DEMO MODE · NO LIVE CONTRACT</span>
      </footer>
    </main>
  );
}

function FlowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flow-step">
      <span>{number}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function FlowArrow() {
  return <div className="flow-arrow">↓</div>;
}
