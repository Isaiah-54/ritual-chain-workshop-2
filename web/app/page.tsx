"use client";

import { useMemo, useState } from "react";

type MarketState = "OPEN" | "CLOSING" | "RESOLVED";

type Market = {
  id: number;
  category: string;
  question: string;
  yes: number;
  no: number;
  volume: number;
  liquidity: number;
  state: MarketState;
  resolution: string;
  observed: string;
  comparator: string;
  target: string;
  jsonPath: string;
  oracle: string;
};

type Activity = {
  id: number;
  market: string;
  side: "YES" | "NO";
  amount: number;
  time: string;
};

const INITIAL_MARKETS: Market[] = [
  {
    id: 1,
    category: "CRYPTO",
    question: "Will ETH price be ≥ $4,000?",
    yes: 64,
    no: 36,
    volume: 842600,
    liquidity: 218400,
    state: "RESOLVED",
    resolution: "Resolved",
    observed: "4126",
    comparator: "≥",
    target: "4000",
    jsonPath: ".price",
    oracle: "api.example.com/eth",
  },
  {
    id: 2,
    category: "CRYPTO",
    question: "Will BTC price be ≥ $120,000?",
    yes: 41,
    no: 59,
    volume: 1240000,
    liquidity: 394800,
    state: "RESOLVED",
    resolution: "Resolved",
    observed: "118420",
    comparator: "≥",
    target: "120000",
    jsonPath: ".price",
    oracle: "api.example.com/btc",
  },
  {
    id: 3,
    category: "NETWORK",
    question: "Will ETH gas be < 20 gwei?",
    yes: 57,
    no: 43,
    volume: 126800,
    liquidity: 48200,
    state: "OPEN",
    resolution: "2h 14m",
    observed: "14",
    comparator: "<",
    target: "20",
    jsonPath: ".gas",
    oracle: "api.example.com/gas",
  },
  {
    id: 4,
    category: "CRYPTO",
    question: "Will SOL price be ≥ $210?",
    yes: 48,
    no: 52,
    volume: 317200,
    liquidity: 91600,
    state: "OPEN",
    resolution: "5h 42m",
    observed: "204",
    comparator: "≥",
    target: "210",
    jsonPath: ".price",
    oracle: "api.example.com/sol",
  },
  {
    id: 5,
    category: "NETWORK",
    question: "Will Bitcoin mempool fees exceed 25 sat/vB?",
    yes: 33,
    no: 67,
    volume: 94700,
    liquidity: 31500,
    state: "CLOSING",
    resolution: "Closing",
    observed: "21",
    comparator: ">",
    target: "25",
    jsonPath: ".fee",
    oracle: "api.example.com/mempool",
  },
];

const PIPELINE = [
  {
    number: "01",
    code: "SCHED",
    title: "Scheduler",
    description: "Resolution job triggered",
    icon: "◷",
  },
  {
    number: "02",
    code: "TEE",
    title: "TEE",
    description: "Execution environment verified",
    icon: "◇",
  },
  {
    number: "03",
    code: "HTTP",
    title: "HTTP",
    description: "External oracle response received",
    icon: "↗",
  },
  {
    number: "04",
    code: "jq",
    title: "jq",
    description: "Required value extracted",
    icon: "⌘",
  },
  {
    number: "05",
    code: "CMP",
    title: "Comparator",
    description: "Target condition evaluated",
    icon: "≥",
  },
  {
    number: "06",
    code: "RES",
    title: "Resolution",
    description: "YES / NO outcome finalized",
    icon: "✓",
  },
  {
    number: "07",
    code: "PAY",
    title: "Settlement",
    description: "Winning positions become eligible",
    icon: "₿",
  },
];

const INITIAL_ACTIVITY: Activity[] = [
  { id: 1, market: "ETH ≥ $4,000", side: "YES", amount: 420, time: "12:41:08" },
  { id: 2, market: "BTC ≥ $120,000", side: "NO", amount: 1250, time: "12:40:54" },
  { id: 3, market: "ETH gas < 20", side: "YES", amount: 85, time: "12:40:41" },
  { id: 4, market: "SOL ≥ $210", side: "NO", amount: 300, time: "12:40:29" },
  { id: 5, market: "BTC fees > 25", side: "NO", amount: 720, time: "12:40:12" },
];

function money(value: number) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}

function marketStatusClass(state: MarketState) {
  if (state === "OPEN") return "status-open";
  if (state === "CLOSING") return "status-closing";
  return "status-resolved";
}

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS);
  const [selectedId, setSelectedId] = useState(3);
  const [filter, setFilter] = useState<"ALL" | MarketState>("ALL");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [stake, setStake] = useState("0.50");
  const [pipelineStep, setPipelineStep] = useState(4);
  const [activity, setActivity] = useState<Activity[]>(INITIAL_ACTIVITY);
  const [notice, setNotice] = useState("");

  const selected =
    markets.find((market) => market.id === selectedId) ?? markets[0];

  const filteredMarkets = useMemo(() => {
    if (filter === "ALL") return markets;
    return markets.filter((market) => market.state === filter);
  }, [filter, markets]);

  const totalVolume = markets.reduce((sum, market) => sum + market.volume, 0);

  function simulateBet() {
    const amount = Number(stake);

    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice("Enter a valid simulated position size.");
      return;
    }

    const activityItem: Activity = {
      id: Date.now(),
      market: selected.question.replace("Will ", ""),
      side,
      amount: amount * 1000,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setActivity((items) => [activityItem, ...items].slice(0, 8));

    setMarkets((items) =>
      items.map((market) => {
        if (market.id !== selected.id) return market;

        const extraVolume = amount * 1000;

        return {
          ...market,
          volume: market.volume + extraVolume,
          liquidity: market.liquidity + amount * 250,
          yes:
            side === "YES"
              ? Math.min(99, market.yes + 1)
              : Math.max(1, market.yes - 1),
          no:
            side === "NO"
              ? Math.min(99, market.no + 1)
              : Math.max(1, market.no - 1),
        };
      }),
    );

    setNotice(
      `Simulated ${side} position submitted · ${amount.toFixed(
        2,
      )} ETH · no blockchain transaction`,
    );
  }

  function simulateResolution() {
    setPipelineStep(0);
    setNotice("Resolution engine started · processing market #001");

    let step = 0;

    const timer = window.setInterval(() => {
      step += 1;
      setPipelineStep(step);

      if (step >= PIPELINE.length - 1) {
        window.clearInterval(timer);
        setNotice(
          "Resolution completed · market #001 resolved YES · settlement eligible",
        );
      }
    }, 650);
  }

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="navbar">
        <a href="#" className="brand">
          <span className="brand-mark">R</span>
          <span>
            <strong>RitualPredict</strong>
            <small>Prediction Markets</small>
          </span>
        </a>

        <div className="nav-links">
          <a href="#markets">Markets</a>
          <a href="#protocol">Protocol</a>
          <a href="#activity">Activity</a>
        </div>

        <div className="nav-status">
          <span className="pulse" />
          SIMULATION ENVIRONMENT
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            RITUAL CHAIN / ACADEMY PROJECT
            <span>NO LIVE SETTLEMENT</span>
          </div>

          <h1>
            Trade the future.
            <br />
            <em>Verify the outcome.</em>
          </h1>

          <p className="hero-text">
            RitualPredict demonstrates how external information travels
            through a programmable resolution pipeline before producing a
            deterministic market outcome.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#markets">
              Explore markets <span>↓</span>
            </a>
            <a className="button button-secondary" href="#protocol">
              View protocol
            </a>
          </div>
        </div>

        <div className="execution-card">
          <div className="card-topline">
            <span>RESOLUTION ENGINE</span>
            <span className="live-badge">
              <i /> ONLINE
            </span>
          </div>

          <div className="execution-title">
            <span>CURRENT EXECUTION</span>
            <strong>MARKET #001</strong>
          </div>

          <div className="execution-question">
            Will ETH price be ≥ $4,000?
          </div>

          <div className="mini-pipeline">
            {PIPELINE.map((step, index) => (
              <div className="mini-step" key={step.code}>
                <span className="mini-icon">{step.icon}</span>
                <small>{step.code}</small>
                {index < PIPELINE.length - 1 && <b>→</b>}
              </div>
            ))}
          </div>

          <div className="execution-result">
            <div>
              <span>OBSERVED VALUE</span>
              <strong>4,126</strong>
            </div>
            <div>
              <span>COMPARATOR</span>
              <strong>≥ 4,000</strong>
            </div>
            <div>
              <span>OUTCOME</span>
              <strong className="yes-text">YES</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div>
          <span>SIMULATED VOLUME</span>
          <strong>{money(totalVolume)}</strong>
          <small>Across all markets</small>
        </div>
        <div>
          <span>ACTIVE MARKETS</span>
          <strong>03</strong>
          <small>Currently trading</small>
        </div>
        <div>
          <span>RESOLUTIONS</span>
          <strong>184</strong>
          <small>Successfully processed</small>
        </div>
        <div>
          <span>EXECUTION ENGINE</span>
          <strong>TEE</strong>
          <small>Deterministic execution</small>
        </div>
      </section>

      <section id="markets" className="section">
        <div className="section-heading">
          <div>
            <span className="section-number">01 / MARKETS</span>
            <h2>Prediction markets.</h2>
            <p>
              Markets where probabilities become positions and external data
              determines the final outcome.
            </p>
          </div>

          <div className="filters">
            {(["ALL", "OPEN", "CLOSING", "RESOLVED"] as const).map(
              (item) => (
                <button
                  key={item}
                  className={filter === item ? "filter active" : "filter"}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="market-layout">
          <div className="market-list">
            {filteredMarkets.map((market) => (
              <button
                key={market.id}
                className={
                  selected.id === market.id
                    ? "market-card selected"
                    : "market-card"
                }
                onClick={() => setSelectedId(market.id)}
              >
                <div className="market-header">
                  <span className="market-id">
                    #{String(market.id).padStart(3, "0")}
                  </span>
                  <span className={`status ${marketStatusClass(market.state)}`}>
                    {market.state}
                  </span>
                  <span className="category">{market.category}</span>
                </div>

                <h3>{market.question}</h3>

                <div className="probability-bar">
                  <span style={{ width: `${market.yes}%` }} />
                </div>

                <div className="market-probabilities">
                  <span>
                    YES <strong>{market.yes}%</strong>
                  </span>
                  <span>
                    NO <strong>{market.no}%</strong>
                  </span>
                </div>

                <div className="market-meta">
                  <span>
                    VOLUME <strong>{money(market.volume)}</strong>
                  </span>
                  <span>
                    LIQUIDITY <strong>{money(market.liquidity)}</strong>
                  </span>
                  <span>
                    RESOLUTION <strong>{market.resolution}</strong>
                  </span>
                </div>
              </button>
            ))}
          </div>

          <aside className="trade-panel">
            <div className="panel-label">
              MARKET #{String(selected.id).padStart(3, "0")}
              <span className={`status ${marketStatusClass(selected.state)}`}>
                {selected.state}
              </span>
            </div>

            <h3>{selected.question}</h3>

            <div className="price-grid">
              <button
                className={side === "YES" ? "price-card yes selected" : "price-card yes"}
                onClick={() => setSide("YES")}
              >
                <span>YES</span>
                <strong>{selected.yes}¢</strong>
                <small>{selected.yes}% probability</small>
              </button>

              <button
                className={side === "NO" ? "price-card no selected" : "price-card no"}
                onClick={() => setSide("NO")}
              >
                <span>NO</span>
                <strong>{selected.no}¢</strong>
                <small>{selected.no}% probability</small>
              </button>
            </div>

            <label className="input-label">POSITION SIZE</label>

            <div className="stake-input">
              <span>ETH</span>
              <input
                value={stake}
                onChange={(event) => setStake(event.target.value)}
                inputMode="decimal"
                placeholder="0.50"
              />
            </div>

            <div className="trade-summary">
              <div>
                <span>EST. PROBABILITY</span>
                <strong>{side === "YES" ? selected.yes : selected.no}%</strong>
              </div>
              <div>
                <span>MAX PAYOUT</span>
                <strong>
                  {Number(stake || 0) > 0
                    ? (Number(stake) / ((side === "YES" ? selected.yes : selected.no) / 100)).toFixed(2)
                    : "0.00"}{" "}
                  ETH
                </strong>
              </div>
            </div>

            <button
              className="trade-button"
              onClick={simulateBet}
              disabled={selected.state !== "OPEN"}
            >
              {selected.state === "OPEN"
                ? `Buy ${side}`
                : "Market not tradable"}
            </button>

            <p className="simulation-note">
              Simulation only · No wallet connection · No blockchain
              transaction.
            </p>

            {notice && <div className="notice">{notice}</div>}
          </aside>
        </div>
      </section>

      <section id="protocol" className="section protocol-section">
        <div className="section-heading">
          <div>
            <span className="section-number">02 / PROTOCOL</span>
            <h2>The resolution engine.</h2>
            <p>
              A programmable pipeline transforms external information into a
              deterministic market result.
            </p>
          </div>

          <button className="resolve-button" onClick={simulateResolution}>
            Run simulated resolution
          </button>
        </div>

        <div className="pipeline">
          {PIPELINE.map((step, index) => (
            <button
              key={step.code}
              className={
                index <= pipelineStep
                  ? "pipeline-step complete"
                  : "pipeline-step"
              }
              onClick={() => setPipelineStep(index)}
            >
              <span className="pipeline-number">{step.number}</span>
              <span className="pipeline-icon">{step.icon}</span>
              <strong>{step.title}</strong>
              <small>{step.code}</small>
              <p>{step.description}</p>
            </button>
          ))}
        </div>

        <div className="protocol-console">
          <div className="console-header">
            <span>PROTOCOL EXECUTION</span>
            <span>MARKET #001 · RESOLUTION JOB</span>
          </div>

          <div className="console-body">
            <div className="console-stage">
              <span className="console-stage-number">
                STEP {String(pipelineStep + 1).padStart(2, "0")}
              </span>
              <strong>{PIPELINE[pipelineStep].title}</strong>
              <p>{PIPELINE[pipelineStep].description}</p>
            </div>

            <div className="console-data">
              <div>
                <span>INPUT</span>
                <code>price = 4126</code>
              </div>
              <div>
                <span>RULE</span>
                <code>4126 ≥ 4000</code>
              </div>
              <div>
                <span>STATUS</span>
                <strong className="success">SUCCESS</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="activity" className="section">
        <div className="section-heading">
          <div>
            <span className="section-number">03 / ACTIVITY</span>
            <h2>Market activity.</h2>
            <p>
              A local simulation of positions entering the prediction market.
            </p>
          </div>

          <span className="activity-live">
            <i /> LIVE SIMULATION
          </span>
        </div>

        <div className="activity-table">
          <div className="activity-row activity-head">
            <span>MARKET</span>
            <span>SIDE</span>
            <span>SIZE</span>
            <span>TIME</span>
          </div>

          {activity.map((item) => (
            <div className="activity-row" key={item.id}>
              <strong>{item.market}</strong>
              <span className={item.side === "YES" ? "side-yes" : "side-no"}>
                {item.side}
              </span>
              <span>{money(item.amount)}</span>
              <span className="activity-time">{item.time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="resolution-section">
        <div className="resolution-copy">
          <span className="section-number">04 / RECENT RESOLUTION</span>
          <h2>ETH price ≥ $4,000</h2>
          <span className="status status-resolved">RESOLVED</span>
        </div>

        <div className="resolution-trace">
          {[
            ["01", "SCHEDULER", "JOB TRIGGERED", "12:40:51"],
            ["02", "TEE", "EXECUTION VERIFIED", "12:40:53"],
            ["03", "HTTP", "DATA RECEIVED", "price: 4126"],
            ["04", "jq", "VALUE EXTRACTED", ".price → 4126"],
            ["05", "COMPARATOR", "CONDITION TRUE", "4126 ≥ 4000"],
          ].map(([number, name, event, detail]) => (
            <div className="trace-row" key={number}>
              <span>{number}</span>
              <strong>{name}</strong>
              <div>
                <b>{event}</b>
                <small>{detail}</small>
              </div>
            </div>
          ))}

          <div className="final-outcome">
            <span>FINAL OUTCOME</span>
            <strong>YES</strong>
            <small>Settlement eligible</small>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark">R</span>
          <div>
            <strong>RitualPredict</strong>
            <span>Prediction market architecture</span>
          </div>
        </div>

        <p>
          Programmable prediction-market infrastructure demonstrating
          deterministic resolution through external data.
        </p>

        <div className="footer-links">
          <a href="#markets">Markets</a>
          <a href="#protocol">Protocol</a>
          <a href="#activity">Activity</a>
          <a
            href="https://ritual-chain-workshop-2-njyc-inky.vercel.app/"
            target="_blank"
            rel="noreferrer"
          >
            Live site ↗
          </a>
        </div>

        <div className="footer-bottom">
          <span>RITUAL CHAIN ACADEMY PROJECT</span>
          <span>SIMULATION · NO LIVE CONTRACT</span>
          <span>© 2026 RitualPredict</span>
        </div>
      </footer>
    </main>
  );
}
