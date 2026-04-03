import React from 'react'
import { slideLeft } from '../Services/Animation'
import {  motion } from "motion/react"

const Card = () => {
  return (
    <motion.div {...slideLeft}
      className="relative w-full rounded-3xl overflow-hidden group shadow-[0_0_15px_rgba(0,255,128,0.5),0_0_40px_rgba(0,255,128,0.2),0_0_80px_rgba(0,255,128,0.1)]">

      {/* Animated glowing border */}
      <div className="absolute inset-0 rounded-3xl p-[1.5px] z-0"
        style={{
          background: 'linear-gradient(135deg, #FF9933 0%, #138808 50%, #FF9933 100%)',
          backgroundSize: '300% 300%',
          animation: 'borderSpin 4s linear infinite',
        }}
      >
        <div className="w-full h-full rounded-3xl bg-[#0e0e0e]" />
      </div>

      {/* Glow blur behind border */}
      <div className="absolute inset-0 rounded-3xl -z-10 blur-xl opacity-40"
        style={{
          background: 'linear-gradient(135deg, #FF9933, #138808)',
          animation: 'borderSpin 4s linear infinite',
          backgroundSize: '300% 300%',
        }}
      />

      {/* Card body */}
      <div className="relative z-10 rounded-3xl bg-[#0e0e0e] px-8 py-5 flex flex-row items-center gap-7">

        {/* Left tricolor bar — sirf saffron aur green, white nahi */}
        <div className="flex flex-col h-16 w-0.75 rounded-full overflow-hidden gap-0.5 shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        {/* Ashoka Chakra */}
        <div className="shrink-0" style={{ animation: 'spinChakra 8s linear infinite' }}>
          <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="#1a47b8" strokeWidth="2" fill="none" />
            <circle cx="28" cy="28" r="5" stroke="#1a47b8" strokeWidth="2" fill="none" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const rad = (angle * Math.PI) / 180;
              const x1 = 28 + 5 * Math.cos(rad);
              const y1 = 28 + 5 * Math.sin(rad);
              const x2 = 28 + 22 * Math.cos(rad);
              const y2 = 28 + 22 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a47b8" strokeWidth="1.2" strokeLinecap="round" />;
            })}
          </svg>
        </div>

        {/* Main text */}
        <div className="flex flex-col gap-0.5 flex-1">
          <p className="text-[9px] tracking-[0.35em] text-white/35 uppercase font-medium">Built with pride</p>
          <h2 className="text-xl font-black tracking-tight text-white leading-none"
            style={{ fontFamily: "'Georgia', serif", textShadow: '0 0 30px rgba(255,153,51,0.4)' }}>
            Proudly Made
          </h2>
          <p className="text-2xl font-black tracking-widest leading-tight"
            style={{
              fontFamily: "'Georgia', serif",
              background: 'linear-gradient(90deg, #FF9933 0%, #ffffff 50%, #138808 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            IN INDIA
          </p>
        </div>

        <div className="w-px h-12 bg-white/10 shrink-0" />

        {/* Tether branding */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, #2979ff, #7c3aed)', boxShadow: '0 0 8px rgba(41,121,255,0.9)' }} />
          <span className="text-[9px] tracking-widest text-white/50 uppercase font-medium">Tether Chat</span>
        </div>

        {/* Right tricolor bar */}
        <div className="flex flex-col h-16 w-0.75 rounded-full overflow-hidden gap-0.5 shrink-0">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </div>

      <style>{`
    @keyframes borderSpin {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes spinChakra {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `}</style>
    </motion.div>
  )
}

export default Card
