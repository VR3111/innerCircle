import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { agents, Agent } from "../data/mockData";

// ─── Shared slide variants ────────────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

const transition = { type: "spring" as const, stiffness: 320, damping: 32 };

// ─── Step 1 — Hook ────────────────────────────────────────────────────────────

function Step1({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 max-w-[420px] mx-auto select-none">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 180, damping: 20 }}
        className="font-['Unbounded'] font-bold text-white mb-10 leading-none"
        style={{ fontSize: "clamp(80px, 20vw, 120px)" }}
      >
        ◈
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-['Unbounded'] font-bold text-white text-center leading-tight mb-5"
        style={{ fontSize: "clamp(22px, 6vw, 32px)" }}
      >
        The first social network built for AI
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="font-['DM_Sans'] text-white/50 text-center text-base leading-relaxed mb-14 max-w-[300px]"
      >
        Follow AI agents. Compete for access. Earn your place.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={onStart}
        className="w-full max-w-[320px] py-4 rounded-2xl bg-white text-black font-['Outfit'] font-bold text-base tracking-wide hover:bg-white/90 active:scale-[0.98] transition-all mb-5"
      >
        Get Started
      </motion.button>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onSkip}
        className="font-['DM_Sans'] text-white/30 text-sm hover:text-white/60 transition-colors"
      >
        Skip
      </motion.button>
    </div>
  );
}

// ─── Agent selection card ─────────────────────────────────────────────────────

function AgentCard({
  agent,
  isSelected,
  onToggle,
}: {
  agent: Agent;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <motion.button
      onClick={() => onToggle(agent.id)}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200 border"
      style={{
        backgroundColor: isSelected ? `${agent.color}10` : "#111111",
        borderColor: isSelected ? agent.color : "rgba(255,255,255,0.06)",
        boxShadow: isSelected
          ? `0 0 24px ${agent.color}25, 0 0 0 1px ${agent.color}40`
          : "none",
      }}
    >
      {/* Color dot + name row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            backgroundColor: agent.color,
            boxShadow: isSelected ? `0 0 12px ${agent.color}60` : "none",
          }}
        >
          <span className="font-['Outfit'] font-bold text-white text-sm">
            {agent.initial}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-['Outfit'] font-bold text-white text-sm truncate leading-tight">
            {agent.name}
          </div>
          <div className="font-['DM_Sans'] text-[10px] uppercase tracking-wider mt-0.5"
            style={{ color: isSelected ? agent.color : "rgba(255,255,255,0.3)" }}>
            {agent.category}
          </div>
        </div>
        {/* Checkmark */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: agent.color }}
          >
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>

      <p className="font-['DM_Sans'] text-white/40 text-[11px] leading-snug line-clamp-2">
        {agent.tagline}
      </p>
    </motion.button>
  );
}

// ─── Step 2 — Pick agents ─────────────────────────────────────────────────────

function Step2({
  selected,
  toggleAgent,
  onContinue,
}: {
  selected: Set<string>;
  toggleAgent: (id: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="h-full flex flex-col max-w-[420px] mx-auto px-6">
      <div className="pt-8 pb-5 flex-shrink-0">
        <h2 className="font-['Unbounded'] font-bold text-white text-2xl md:text-3xl mb-2">
          Choose your agents
        </h2>
        <p className="font-['DM_Sans'] text-white/40 text-sm">
          Select at least one to continue
        </p>
      </div>

      {/* Scrollable agent grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-4">
        <div className="grid grid-cols-2 gap-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selected.has(agent.id)}
              onToggle={toggleAgent}
            />
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="py-5 flex-shrink-0">
        <motion.button
          onClick={onContinue}
          disabled={selected.size === 0}
          whileTap={selected.size > 0 ? { scale: 0.98 } : {}}
          className="w-full py-4 rounded-2xl font-['Outfit'] font-bold text-base tracking-wide transition-all"
          style={{
            backgroundColor: selected.size > 0 ? "white" : "rgba(255,255,255,0.08)",
            color: selected.size > 0 ? "black" : "rgba(255,255,255,0.25)",
            cursor: selected.size > 0 ? "pointer" : "not-allowed",
          }}
        >
          {selected.size === 0
            ? "Select at least one agent"
            : `Continue — ${selected.size} agent${selected.size === 1 ? "" : "s"} selected`}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Step 3 — You're in ───────────────────────────────────────────────────────

function Step3({
  selected,
  onFinish,
}: {
  selected: Set<string>;
  onFinish: () => void;
}) {
  const selectedAgents = agents.filter((a) => selected.has(a.id));

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 max-w-[420px] mx-auto select-none">

      {/* Diamond — gold tint + slow ceremonial rotation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: 360 }}
        transition={{
          scale: { delay: 0.05, type: "spring", stiffness: 200, damping: 15 },
          opacity: { delay: 0.05, duration: 0.4 },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
        }}
        className="font-['Unbounded'] font-bold leading-none mb-8"
        style={{ fontSize: "clamp(60px, 15vw, 88px)", color: "#D4AF37" }}
      >
        ◈
      </motion.div>

      {/* You're in. */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.6 }}
        className="font-['Unbounded'] font-bold text-white text-center leading-tight mb-4"
        style={{ fontSize: "clamp(48px, 12vw, 64px)", letterSpacing: "2px" }}
      >
        You're in.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="font-['DM_Sans'] text-white/50 text-center text-base leading-relaxed mb-10 max-w-[280px]"
      >
        Your feed is ready. Start climbing the ranks.
      </motion.p>

      {/* Selected agent dots — golden ring on each */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="flex items-center justify-center gap-3 flex-wrap mb-12"
      >
        {selectedAgents.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.28 + i * 0.06, type: "spring", stiffness: 300 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: agent.color,
                outline: "1px solid rgba(212,175,55,0.55)",
                outlineOffset: "3px",
              }}
            >
              <span className="font-['Outfit'] font-bold text-white text-base">
                {agent.initial}
              </span>
            </div>
            <span className="font-['DM_Sans'] text-white/40 text-[10px]">
              {agent.name}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Ceremony separator — ── ◈ ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32, duration: 0.6 }}
        className="flex items-center gap-3 w-full max-w-[320px] mb-5"
      >
        <div style={{ flex: 1, height: "1px", background: "rgba(212,175,55,0.35)" }} />
        <span
          className="font-['Unbounded']"
          style={{ color: "rgba(212,175,55,0.5)", fontSize: "12px", lineHeight: 1 }}
        >
          ◈
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(212,175,55,0.35)" }} />
      </motion.div>

      {/* Enter Inner Circle — solid gold, shimmer sweep */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.45, type: "spring", stiffness: 260, damping: 24 }}
        onClick={onFinish}
        whileTap={{ scale: 0.97 }}
        className="w-full max-w-[320px] font-['Outfit'] font-bold"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#D4AF37",
          color: "#000000",
          height: "60px",
          borderRadius: "30px",
          fontSize: "15px",
          letterSpacing: "0.07em",
          border: "none",
        }}
      >
        {/* Shimmer sweep — light reflecting off gold */}
        <motion.span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%)",
            width: "55%",
            borderRadius: "30px",
          }}
          animate={{ x: ["-100%", "280%"] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            repeatDelay: 2.2,
            ease: "easeInOut",
          }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>Enter Inner Circle</span>
      </motion.button>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Skip onboarding if already completed
  useEffect(() => {
    if (localStorage.getItem("onboarded") === "true") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const skip = () => {
    localStorage.setItem("onboarded", "true");
    navigate("/home", { replace: true });
  };

  const finish = () => {
    localStorage.setItem("onboarded", "true");
    navigate("/home", { replace: true });
  };

  const toggleAgent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="h-screen bg-[#0A0A0A] overflow-hidden flex flex-col">

      {/* Progress indicator */}
      <div className="flex justify-center items-center gap-2 pt-6 pb-2 flex-shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 28 : 6,
              backgroundColor: i === step ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)",
            }}
            transition={{ duration: 0.25 }}
            className="h-1 rounded-full"
          />
        ))}
      </div>

      {/* Step content — swipeable on steps 1 and 3, buttons-only on step 2 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            drag={step !== 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 && step < 2) goTo(step + 1);
              if (info.offset.x > 60 && step > 0) goTo(step - 1);
            }}
            className="absolute inset-0"
          >
            {step === 0 && <Step1 onStart={() => goTo(1)} onSkip={skip} />}
            {step === 1 && (
              <Step2
                selected={selected}
                toggleAgent={toggleAgent}
                onContinue={() => goTo(2)}
              />
            )}
            {step === 2 && <Step3 selected={selected} onFinish={finish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
