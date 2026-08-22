"use client";

import { useEffect, useMemo, useState } from "react";

type MarketState = "OPEN" | "RESOLVED" | "CLOSING";

type Market = {
  id: string;
  category: string;
  question: string;
  yes: number;
  no: number;
  volume: string;
  liquidity: string;
  resolution: string;
  oracle: string;
  path: string;
  target: string;
  observed: string;
  state: MarketState;
  result?: "YES" | "NO";
};

const markets: Market[] = [
  {
    id: "#001",
    category: "CRYPTO",
    question: "Will ETH price be ≥ $4,000?",
    yes: 64,
    no: 36,
    volume: "$842.6K",
    liquidity: "$218.4K",
    resolution: "Resolved",
    oracle: "price-feed.eth",
    path: "price",
    target: "$4,000",
    observed: "$4,126",
    state: "RESOLVED",
    result: "YES",
  },
  {
    id: "#002",
    category: "CRYPTO",
    question: "Will BTC price be ≥ $120,000?",
    yes: 41,
    no: 59,
    volume: "$1.24M",
    liquidity: "$394.8K",
    resolution: "Resolved",
    oracle: "price-feed.btc",
    path: "price",
    target: "$120,000",
    observed: "$118,420",
    state: "RESOLVED",
    result: "NO",
  },
  {
    id: "#003",
    category: "NETWORK",
    question: "Will ETH gas be < 20 gwei?",
    yes: 57,
    no: 43,
    volume: "$126.8K",
    liquidity: "$48.2K",
    resolution: "2h 14m",
    oracle: "network-gas.eth",
    path: "gas",
    target: "20 gwei",
    observed: "14 gwei",
    state: "OPEN",
  },
  {
    id: "#004",
    category: "CRYPTO",
    question: "Will SOL price be ≥ $210?",
    yes: 48,
    no: 52,
    volume: "$317.2K",
    liquidity: "$91.6K",
    resolution: "5h 42m",
    oracle: "price-feed.sol",
    path: "price",
    target: "$210",
    observed: "$204.17",
    state: "OPEN",
  },
  {
    id: "#005",
    category: "NETWORK",
    question: "Will Bitcoin mempool fees exceed 25 sat/vB?",
    yes: 33,
    no: 67,
    volume: "$94.7K",
    liquidity: "$31.5K",
    resolution: "Closing",
    oracle: "network.btc",
    path: "feeRate",
    target: "25 sat/vB",
    observed: "18 sat/vB",
    state: "CLOSING",
  },
];

const activity = [
  ["ETH ≥ $4,000", "YES", "$420", "2m ago"],
  ["BTC ≥ $120,000", "NO", "$1,250", "5m ago"],
  ["ETH gas < 20", "YES", "$85", "8m ago"],
  ["SOL ≥ $210", "NO", "$300", "11m ago"],
  ["BTC fees > 25", "NO", "$720", "14m ago"],
];

const stages = [
  {
    number: "01",
    short: "SCHED",
    name: "Scheduler",
    icon: "◷",
    description: "Resolution job triggered",
  },
  {
    number: "02",
    short: "TEE",
    name: "TEE",
    icon: "◇",
    description: "Trusted execution initialized",
  },
  {
    number: "03",
    short: "HTTP",
    name: "HTTP",
    icon: "↗",
    description: "External oracle response received",
  },
  {
    number: "04",
    short: "jq",
    name: "jq",
    icon: "⌘",
    description: "Value extracted from JSON",
  },
  {
    number: "05",
    short: "CMP",
    name: "Comparator",
    icon: "≥",
    description: "Target condition evaluated",
  },
  {
    number: "06",
    short: "RES",
    name: "Resolution",
    icon: "✓",
    description: "YES / NO outcome finalized",
  },
  {
    number: "07",
    short: "PAY",
    name: "Settlement",
    icon: "₿",
    description: "Payout or refund becomes available",
  },
];

function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span className={`status-dot ${active ? "active" : ""}`}>
      <span />
    </span>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#" className="brand">
          <span className="brand-mark">R</span>
          <span>
            <strong>RitualPredict</strong>
            <small>Prediction Markets</small>
          </span>
        </a>

        <nav>
          <a href="#markets">Markets</a>
          <a href="#activity">Activity</a>
          <a href="#protocol">Protocol</a>
          <a href="#about">About</a>
        </nav>

        <div className="header-status">
          <StatusDot />
          <span>Network operational</span>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">
          <StatusDot />
          SIMULATION ENVIRONMENT · NO LIVE SETTLEMENT
        </div>

        <h1>
          Trade the future.
          <br />
          <span>Verify the outcome.</span>
        </h1>

        <p>
          RitualPredict is a prediction-market interface demonstrating how
          external information can travel through a programmable resolution
          pipeline before producing a deterministic market outcome.
        </p>

        <div className="hero-actions">
          <a href="#markets" className="button primary">
            Explore markets <span>↓</span>
          </a>
          <a href="#protocol" className="button secondary">
            View protocol
          </a>
        </div>
      </div>

      <div className="hero-terminal">
        <div className="terminal-top">
          <div>
            <span className="terminal-light" />
            <span className="terminal-light" />
            <span className="terminal-light" />
          </div>
          <span>RESOLUTION ENGINE</span>
          <span>LIVE</span>
        </div>

        <div className="terminal-content">
          <div className="terminal-label">CURRENT EXECUTION</div>
          <div className="terminal-market">
            MARKET <strong>#001</strong>
          </div>

          <div className="terminal-question">
            Will ETH price be ≥ $4,000?
          </div>

          <div className="terminal-flow">
            {stages.map((stage, index) => (
              <div className="terminal-stage" key={stage.short}>
                <span>{stage.icon}</span>
                <div>
                  <small>{stage.short}</small>
                  <strong>{stage.name}</strong>
                </div>
                {index < stages.length - 1 && <i>→</i>}
              </div>
            ))}
          </div>

          <div className="terminal-result">
            <div>
              <small>OBSERVED VALUE</small>
              <strong>4,126</strong>
            </div>
            <div>
              <small>COMPARATOR</small>
              <strong>≥ 4,000</strong>
            </div>
            <div className="result-yes">
              <small>OUTCOME</small>
              <strong>YES</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats">
      <div>
        <span>SIMULATED VOLUME</span>
        <strong>$2.62M</strong>
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
        <span>RESOLUTION ENGINE</span>
        <strong>TEE</strong>
        <small>Deterministic execution</small>
      </div>
    </section>
  );
}

function MarketCard({
  market,
  selected,
  onSelect,
}: {
  market: Market;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`market-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <div className="market-card-top">
        <span className="market-id">{market.id}</span>
        <span className={`market-state ${market.state.toLowerCase()}`}>
          <StatusDot active={market.state !== "RESOLVED"} />
          {market.state}
        </span>
      </div>

      <span className="market-category">{market.category}</span>

      <h3>{market.question}</h3>

      <div className="probability">
        <div className="probability-header">
          <span>YES</span>
          <strong>{market.yes}%</strong>
          <span>NO</span>
          <strong>{market.no}%</strong>
        </div>
        <div className="probability-bar">
          <div style={{ width: `${market.yes}%` }} />
        </div>
      </div>

      <div className="market-meta">
        <div>
          <span>VOLUME</span>
          <strong>{market.volume}</strong>
        </div>
        <div>
          <span>LIQUIDITY</span>
          <strong>{market.liquidity}</strong>
        </div>
        <div>
          <span>RESOLUTION</span>
          <strong>{market.resolution}</strong>
        </div>
      </div>
    </button>
  );
}

function TradingPanel({ market }: { market: Market }) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("100");
  const [message, setMessage] = useState("");

  const probability = side === "YES" ? market.yes : market.no;

  function simulateTrade() {
    setMessage(
      `Simulated ${side} position of $${amount} placed successfully.`
    );
  }

  return (
    <div className="trading-panel">
      <div className="panel-heading">
        <div>
          <span>MARKET {market.id}</span>
          <h2>{market.question}</h2>
        </div>
        <span className={`pill ${market.state.toLowerCase()}`}>
          {market.state}
        </span>
      </div>

      <div className="trade-tabs">
        <button
          className={side === "YES" ? "yes active" : "yes"}
          onClick={() => setSide("YES")}
        >
          YES
          <strong>{market.yes}¢</strong>
        </button>
        <button
          className={side === "NO" ? "no active" : "no"}
          onClick={() => setSide("NO")}
        >
          NO
          <strong>{market.no}¢</strong>
        </button>
      </div>

      <div className="trade-form">
        <label>
          <span>POSITION SIZE</span>
          <div className="amount-input">
            <span>$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </label>

        <div className="trade-preview">
          <div>
            <span>EST. PROBABILITY</span>
            <strong>{probability}%</strong>
          </div>
          <div>
            <span>MAX PAYOUT</span>
            <strong>
              ${amount && !Number.isNaN(Number(amount))
                ? (Number(amount) / (probability / 100)).toFixed(2)
                : "0.00"}
            </strong>
          </div>
        </div>

        <button
          className={`trade-button ${side === "YES" ? "trade-yes" : "trade-no"}`}
          onClick={simulateTrade}
          disabled={market.state === "RESOLVED"}
        >
          {market.state === "RESOLVED"
            ? "Market resolved"
            : `Buy ${side}`}
        </button>

        <small className="trade-note">
          Simulation only · No wallet or blockchain transaction
        </small>

        {message && <div className="trade-message">{message}</div>}
      </div>
    </div>
  );
}

function MarketsSection() {
  const [selectedId, setSelectedId] = useState("#003");
  const [filter, setFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return markets;
    return markets.filter((market) => market.state === filter);
  }, [filter]);

  const selected =
    markets.find((market) => market.id === selectedId) ?? markets[0];

  return (
    <section id="markets" className="section markets-section">
      <div className="section-heading">
        <div>
          <div className="section-number">01 / MARKETS</div>
          <h2>Prediction markets.</h2>
          <p>
            Markets where probabilities become positions and external data
            determines the final outcome.
          </p>
        </div>

        <div className="market-filters">
          {["ALL", "OPEN", "CLOSING", "RESOLVED"].map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="markets-layout">
        <div className="market-list">
          {filtered.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              selected={market.id === selectedId}
              onSelect={() => setSelectedId(market.id)}
            />
          ))}
        </div>

        <TradingPanel market={selected} />
      </div>
    </section>
  );
}

function ProtocolSection() {
  const [active, setActive] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % stages.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const stage = stages[active];

  return (
    <section id="protocol" className="section protocol-section">
      <div className="section-heading">
        <div>
          <div className="section-number">02 / PROTOCOL</div>
          <h2>The resolution engine.</h2>
          <p>
            A programmable pipeline transforms external information into a
            deterministic market result.
          </p>
        </div>

        <div className="protocol-status">
          <StatusDot />
          EXECUTION ENGINE ONLINE
        </div>
      </div>

      <div className="pipeline">
        {stages.map((item, index) => (
          <button
            key={item.number}
            className={`pipeline-stage ${active === index ? "active" : ""} ${
              index < active ? "complete" : ""
            }`}
            onClick={() => setActive(index)}
          >
            <div className="pipeline-number">{item.number}</div>
            <div className="pipeline-icon">{item.icon}</div>
            <div>
              <small>{item.short}</small>
              <strong>{item.name}</strong>
            </div>
            {index < stages.length - 1 && <span className="pipeline-arrow">→</span>}
          </button>
        ))}
      </div>

      <div className="execution-console">
        <div className="console-header">
          <div>
            <span className="console-label">PROTOCOL EXECUTION</span>
            <strong>MARKET #001 · RESOLUTION JOB</strong>
          </div>
          <span className="processing">
            <StatusDot /> PROCESSING
          </span>
        </div>

        <div className="console-body">
          <div className="console-stage">
            <span className="big-stage-icon">{stage.icon}</span>
            <div>
              <span>STEP {stage.number}</span>
              <h3>{stage.name}</h3>
              <p>{stage.description}</p>
            </div>
          </div>

          <div className="console-data">
            <div>
              <span>INPUT</span>
              <code>
                {active === 0
                  ? "scheduler.trigger()"
                  : active === 1
                    ? "trusted.execute(job)"
                    : active === 2
                      ? "GET /api/eth"
                      : active === 3
                        ? ".price"
                        : active === 4
                          ? "4126 >= 4000"
                          : active === 5
                            ? "OUTCOME.YES"
                            : "settle(position)"}
              </code>
            </div>
            <div>
              <span>STATUS</span>
              <strong className="success">SUCCESS</strong>
            </div>
          </div>
        </div>

        <div className="console-log">
          <span>12:41:03</span>
          <span className="log-ok">✓</span>
          <span>{stage.description}</span>
        </div>
      </div>
    </section>
  );
}

function ActivitySection() {
  return (
    <section id="activity" className="section activity-section">
      <div className="section-heading compact">
        <div>
          <div className="section-number">03 / ACTIVITY</div>
          <h2>Market activity.</h2>
        </div>
        <span className="live-label">
          <StatusDot /> LIVE SIMULATION
        </span>
      </div>

      <div className="activity-table">
        <div className="activity-head">
          <span>MARKET</span>
          <span>SIDE</span>
          <span>SIZE</span>
          <span>TIME</span>
        </div>

        {activity.map(([market, side, size, time]) => (
          <div className="activity-row" key={`${market}-${time}`}>
            <strong>{market}</strong>
            <span className={side === "YES" ? "side-yes" : "side-no"}>
              {side}
            </span>
            <span>{size}</span>
            <span>{time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResolutionSection() {
  return (
    <section className="section resolution-section">
      <div className="resolution-card">
        <div className="resolution-top">
          <div>
            <span className="section-number">04 / RECENT RESOLUTION</span>
            <h2>ETH price ≥ $4,000</h2>
          </div>
          <span className="resolved-badge">
            <StatusDot active={false} /> RESOLVED
          </span>
        </div>

        <div className="resolution-grid">
          <div className="resolution-step">
            <span>01</span>
            <small>SCHEDULER</small>
            <strong>JOB TRIGGERED</strong>
            <em>12:40:51</em>
          </div>

          <div className="resolution-step">
            <span>02</span>
            <small>TEE</small>
            <strong>EXECUTION VERIFIED</strong>
            <em>12:40:53</em>
          </div>

          <div className="resolution-step">
            <span>03</span>
            <small>HTTP</small>
            <strong>DATA RECEIVED</strong>
            <em>price: 4126</em>
          </div>

          <div className="resolution-step">
            <span>04</span>
            <small>jq</small>
            <strong>VALUE EXTRACTED</strong>
            <em>.price → 4126</em>
          </div>

          <div className="resolution-step">
            <span>05</span>
            <small>COMPARATOR</small>
            <strong>CONDITION TRUE</strong>
            <em>4126 ≥ 4000</em>
          </div>

          <div className="resolution-final">
            <small>FINAL OUTCOME</small>
            <strong>YES</strong>
            <span>Settlement eligible</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="about" className="footer">
      <div className="footer-main">
        <div>
          <a href="#" className="brand">
            <span className="brand-mark">R</span>
            <span>
              <strong>RitualPredict</strong>
              <small>Prediction Markets</small>
            </span>
          </a>
          <p>
            Programmable prediction-market infrastructure demonstrating
            deterministic resolution through external data.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <span>PRODUCT</span>
            <a href="#markets">Markets</a>
            <a href="#activity">Activity</a>
            <a href="#protocol">Protocol</a>
          </div>
          <div>
            <span>TECHNOLOGY</span>
            <a href="#protocol">Scheduler</a>
            <a href="#protocol">TEE</a>
            <a href="#protocol">Resolution</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>RITUAL CHAIN ACADEMY PROJECT</span>
        <span>SIMULATION · NO LIVE CONTRACT</span>
        <span>© 2026 RitualPredict</span>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <Stats />
        <MarketsSection />
        <ProtocolSection />
        <ActivitySection />
        <ResolutionSection />
      </main>

      <Footer />
    </>
  );
}
