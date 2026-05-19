import React from 'react';
import { motion } from 'framer-motion';

interface ResultScreenProps {
  bossHealth: number;
  playerHealth: number;
  maxCombo: number;
  onRestart: () => void;
}

export function ResultScreen({ bossHealth, playerHealth, maxCombo, onRestart }: ResultScreenProps) {
  const isVictory = bossHealth <= 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90 backdrop-blur-md"
    >
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <motion.h1 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className={`text-5xl sm:text-6xl font-black text-transparent bg-clip-text mb-8 tracking-[0.2em] text-center ${isVictory ? 'bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]' : 'bg-gradient-to-b from-red-400 to-red-800 drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]'}`}
        >
          {isVictory ? 'TARGET DESTROYED' : 'SYSTEM FAILURE'}
        </motion.h1>
        
        <div className="flex flex-col gap-6 w-full mb-12">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-between items-center border-b border-gray-800 pb-4"
          >
            <span className="text-gray-400 font-mono tracking-widest text-sm uppercase">Max Combo</span>
            <span className="text-cyan-400 font-black text-2xl">{maxCombo}x</span>
          </motion.div>
          
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between items-center border-b border-gray-800 pb-4"
          >
            <span className="text-gray-400 font-mono tracking-widest text-sm uppercase">Integrity</span>
            <span className={`font-black text-2xl ${playerHealth > 50 ? 'text-green-400' : 'text-red-500'}`}>{Math.floor(Math.max(0, playerHealth))}%</span>
          </motion.div>
          
          {!isVictory && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-between items-center border-b border-gray-800 pb-4"
            >
              <span className="text-gray-400 font-mono tracking-widest text-sm uppercase">Target Remaining</span>
              <span className="text-red-500 font-black text-2xl">{Math.floor(bossHealth)} HP</span>
            </motion.div>
          )}
        </div>

        <motion.button 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onRestart}
          className="group relative w-full py-5 bg-black border-2 border-gray-700 text-gray-300 font-bold tracking-[0.3em] overflow-hidden transition-all hover:border-cyan-500 hover:text-cyan-400 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-gray-800/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          <span className="relative z-10">REBOOT SEQUENCE</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
