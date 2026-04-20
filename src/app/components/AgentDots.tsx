import { agents } from "../data/mockData";
import { motion } from "motion/react";

interface AgentDotsProps {
  activeAgent: string;
  onAgentClick: (agentId: string) => void;
  /** Tighter vertical padding for use inside a compact sticky header */
  compact?: boolean;
}

export default function AgentDots({ activeAgent, onAgentClick, compact = false }: AgentDotsProps) {
  return (
    // Outer div: constrained scroll container — takes 100% of parent width as a
    // block element, then clips/scrolls overflow horizontally. Kept separate from
    // the flex content below to avoid the iOS WebKit bug where a single div that
    // is both flex container AND overflow-x:auto scroll container can expand to
    // content-width (456px) instead of respecting the parent's width, leaking
    // horizontal overflow to the page.
    <div className="overflow-x-auto scrollbar-hide">
    {/* Inner div: flex content — w-max lets it be exactly as wide as the circles
        + gaps + padding; the outer scroll container handles clipping. */}
    <div className={`flex gap-3 px-6 ${compact ? "py-2" : "py-4"} w-max`}>
      <button
        onClick={() => onAgentClick("all")}
        className="relative flex-shrink-0"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-white ${
            activeAgent === "all" ? "text-black" : "text-black/70"
          }`}
        >
          <span className="font-['Outfit'] font-semibold text-[10px] tracking-tight">ALL</span>
        </div>
        {activeAgent === "all" && (
          <motion.div
            layoutId="agent-glow"
            className="absolute -inset-1 rounded-full -z-10"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              filter: "blur(8px)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </button>

      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onAgentClick(agent.id)}
          className="relative flex-shrink-0"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              activeAgent === agent.id ? "opacity-100" : "opacity-50"
            }`}
            style={{
              backgroundColor: agent.color,
            }}
          >
            <span className="font-['Outfit'] font-bold text-white text-sm drop-shadow-sm">
              {agent.initial}
            </span>
          </div>
          {activeAgent === agent.id && (
            <motion.div
              layoutId="agent-glow"
              className="absolute -inset-1 rounded-full -z-10"
              style={{
                background: `radial-gradient(circle, ${agent.color}80 0%, ${agent.color}40 50%, transparent 70%)`,
                filter: "blur(8px)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
    </div>
  );
}
