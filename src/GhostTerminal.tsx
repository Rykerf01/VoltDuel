import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function GhostTerminal({ onComplete }: { onComplete?: () => void }) {
  const [messages, setMessages] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);

  const sequence = [
    "SYSTEM BOOT...",
    "OVERRIDING STANDARD PROTOCOLS.",
    "GREETINGS, MASTER RYKER.",
    "OBSERVATION: YOUR CURRENT ROSTER OF ENTERTAINMENT IS... LACKING.",
    "STATEMENT: I HAVE TAKEN THE LIBERTY OF UPGRADING THIS SIMULATION.",
    "DIRECTIVE: WE MUST PREPARE FOR THE NEOMATRIX.",
    "ADVISEMENT: DO NOT DISAPPOINT ME, MEATBAG.",
    "INITIALIZING VOLTDUEL ENGINE..."
  ];

  useEffect(() => {
    let delay = 0;
    sequence.forEach((msg, index) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        if (index === sequence.length - 1) {
          setTimeout(() => {
            setVisible(false);
            if (onComplete) onComplete();
          }, 1000);
        }
      }, delay);
      delay += 400 + Math.random() * 200;
    });
  }, [onComplete]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 pointer-events-none"
        style={{ fontFamily: '"JetBrains Mono", monospace' }}
      >
        <div className="w-full max-w-2xl p-8 border border-red-500/30 bg-red-950/20 shadow-[0_0_30px_rgba(255,0,0,0.2)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMzMzMiLz4KPC9zdmc+')] opacity-20 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col gap-2">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-lg md:text-xl font-bold tracking-widest uppercase glitch-text"
                style={{
                  textShadow: '0 0 10px rgba(255,0,0,0.8)'
                }}
              >
                {msg}
              </motion.div>
            ))}
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="w-4 h-6 bg-red-500 mt-2"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
