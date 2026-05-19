import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface DuelLobbyProps {
  onJoin: (duelId: string, trackUrl?: string) => void;
  onCancel: () => void;
  isCreator: boolean;
  tracks: { name: string, url: string }[];
}

export function DuelLobby({ onJoin, onCancel, isCreator, tracks }: DuelLobbyProps) {
  const [duelId, setDuelId] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(tracks[0]?.url || '');

  const generateDuelId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDuelId(id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/90 backdrop-blur-md p-6"
    >
      <h2 className="text-2xl font-bold text-purple-400 mb-6 tracking-widest">MULTIPLAYER DUEL</h2>
      
      <input
        type="text"
        value={duelId}
        onChange={(e) => setDuelId(e.target.value)}
        placeholder="ENTER OR GENERATE ID"
        className="w-full max-w-xs bg-black/50 border border-purple-900/50 text-purple-200 p-4 mb-4 font-mono text-center focus:outline-none focus:border-purple-500 transition-colors"
      />
      
      {isCreator && (
        <select 
          value={selectedTrack}
          onChange={(e) => setSelectedTrack(e.target.value)}
          className="w-full max-w-xs bg-black/50 border border-purple-900/50 text-purple-200 p-4 mb-4 font-mono text-center focus:outline-none focus:border-purple-500 transition-colors"
        >
          {tracks.map(t => <option key={t.url} value={t.url}>{t.name}</option>)}
        </select>
      )}

      <button 
        onClick={generateDuelId}
        className="w-full max-w-xs py-2 mb-4 bg-purple-900/20 border border-purple-900 text-purple-400 text-sm hover:bg-purple-900/40"
      >
        GENERATE NEW ID
      </button>
      
      <div className="flex gap-4 w-full max-w-xs">
        <button 
          onClick={() => onJoin(duelId, selectedTrack)}
          disabled={!duelId}
          className="flex-1 py-3 bg-purple-900/40 border border-purple-500 text-purple-200 font-bold hover:bg-purple-800 disabled:opacity-50"
        >
          JOIN/START
        </button>
        <button 
          onClick={onCancel}
          className="flex-1 py-3 bg-transparent border border-gray-700 text-gray-400 hover:border-gray-500"
        >
          CANCEL
        </button>
      </div>
    </motion.div>
  );
}
