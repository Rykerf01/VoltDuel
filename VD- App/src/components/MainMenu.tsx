import React from 'react';
import { motion } from 'framer-motion';

interface MainMenuProps {
  onStart: () => void;
  onToggleMultiplayer: () => void;
  isMultiplayer: boolean;
  fileName: string | null;
  saberFileName: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBgFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mode: 'NEO' | 'VOLTA';
  onToggleMode: () => void;
  tracks: any[];
  currentTrack: any;
  onSelectTrack: (track: any) => void;
  enemies: any[];
  currentEnemy: any;
  onSelectEnemy: (enemy: any) => void;
  controlMode: 'MOBILE' | 'DESKTOP';
  onToggleControlMode: () => void;
  mobileClashOnRelease: boolean;
  onToggleMobileClashMode: () => void;
  onShuffleTrack: () => void;
  onShuffleEnemy: () => void;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  onDifficultyChange: (val: 'EASY' | 'MEDIUM' | 'HARD') => void;
  swipeMode: boolean;
  onToggleSwipeMode: () => void;
}

export function MainMenu({
  onStart,
  onToggleMultiplayer,
  isMultiplayer,
  fileName,
  saberFileName,
  onFileChange,
  onSaberChange,
  onBgFileChange,
  mode,
  onToggleMode,
  tracks,
  currentTrack,
  onSelectTrack,
  enemies,
  currentEnemy,
  onSelectEnemy,
  controlMode,
  onToggleControlMode,
  mobileClashOnRelease,
  onToggleMobileClashMode,
  onShuffleTrack,
  onShuffleEnemy,
  difficulty,
  onDifficultyChange,
  swipeMode,
  onToggleSwipeMode,
}: MainMenuProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const saberInputRef = React.useRef<HTMLInputElement>(null);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 backdrop-blur-sm"
    >
      <div className="absolute inset-0 bg-[url('https://dl.dropboxusercontent.com/scl/fi/muixnxustd5m24xzyjafm/Screenshot_Sketch_20260227_175247.jpg?rlkey=plmwz1qngvkakw6lnzawo1zw1&st=ddu3l5ve')] bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6 mt-48">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full flex flex-col gap-4"
        >
          <button 
            onClick={onStart} 
            className="group relative w-full py-5 bg-cyan-950/40 border-2 border-cyan-500/50 text-cyan-400 font-bold tracking-[0.3em] overflow-hidden transition-all hover:border-cyan-400 hover:bg-cyan-900/60 hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10">INITIALIZE COMBAT</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onToggleMultiplayer} 
              className={`w-full py-3 border-2 font-bold tracking-[0.1em] text-xs transition-all ${isMultiplayer ? 'bg-purple-900/60 border-purple-500 text-purple-200' : 'bg-transparent border-purple-500/30 text-purple-400 hover:border-purple-400'}`}
            >
              {isMultiplayer ? "MULTI: ON" : "MULTI: OFF"}
            </button>
            <button 
              onClick={onToggleMode} 
              className={`w-full py-3 border-2 font-bold tracking-[0.1em] text-xs transition-all ${mode === 'VOLTA' ? 'bg-yellow-900/60 border-yellow-500 text-yellow-200' : 'bg-transparent border-cyan-500/30 text-cyan-400 hover:border-cyan-400'}`}
            >
              MODE: {mode}
            </button>
            <button 
              onClick={onToggleControlMode} 
              className={`w-full py-3 border-2 font-bold tracking-[0.1em] text-xs transition-all bg-transparent border-green-500/30 text-green-400 hover:border-green-400 ${controlMode === 'MOBILE' ? 'col-span-1' : 'col-span-2'}`}
            >
              CONTROL: {controlMode}
            </button>
            <button 
              onClick={onToggleSwipeMode} 
              className={`w-full py-3 border-2 font-bold tracking-[0.1em] text-xs transition-all ${swipeMode ? 'bg-orange-900/60 border-orange-500 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-transparent border-orange-500/30 text-orange-400 hover:border-orange-400'}`}
            >
              SWIPE MODE: {swipeMode ? 'ON' : 'OFF'}
            </button>
            {controlMode === 'MOBILE' && (
              <button 
                onClick={onToggleMobileClashMode} 
                className={`w-full py-3 border-2 font-bold tracking-[0.1em] text-[10px] transition-all bg-transparent border-orange-500/30 text-orange-400 hover:border-orange-400 col-span-1`}
              >
                CLASH: {mobileClashOnRelease ? 'RELEASE' : 'TAP'}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-4 w-full">
            <div className="flex flex-col gap-1 w-full relative group">
              <span className="text-[10px] text-cyan-500 tracking-widest font-mono uppercase">Track Selection</span>
              <div className="flex gap-2">
                <select 
                  value={currentTrack?.url || ''} 
                  onChange={(e) => {
                    const t = tracks.find(x => x.url === e.target.value);
                    if (t) onSelectTrack(t);
                  }}
                  className="flex-1 bg-black/60 border border-gray-800 text-yellow-400 text-xs p-3 font-mono focus:outline-none focus:border-yellow-500 truncate"
                >
                  {tracks.map((t, i) => (
                    <option key={i} value={t.url} className="bg-black text-yellow-400">{t.name}</option>
                  ))}
                </select>
                <button 
                  onClick={onShuffleTrack}
                  className="px-4 bg-yellow-900/40 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-800/60 rounded-sm transition-colors text-[10px] font-mono"
                  title="Shuffle Track"
                >
                  SHUFFLE
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full relative group">
              <span className="text-[10px] text-cyan-500 tracking-widest font-mono uppercase">Enemy Selection</span>
              <div className="flex gap-2">
                <select 
                  value={currentEnemy?.url || ''} 
                  onChange={(e) => {
                    const t = enemies.find(x => x.url === e.target.value);
                    if (t) onSelectEnemy(t);
                  }}
                  className="flex-1 bg-black/60 border border-gray-800 text-red-500 text-xs p-3 font-mono focus:outline-none focus:border-red-500 truncate"
                >
                  {enemies.map((t, i) => (
                    <option key={i} value={t.url} className="bg-black text-red-500">{t.name}</option>
                  ))}
                </select>
                <button 
                  onClick={onShuffleEnemy}
                  className="px-4 bg-red-900/40 border border-red-500/50 text-red-500 hover:bg-red-800/60 rounded-sm transition-colors text-[10px] font-mono"
                  title="Shuffle Enemy"
                >
                  SHUFFLE
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full relative group">
              <span className="text-[10px] text-cyan-500 tracking-widest font-mono uppercase">Difficulty Profile</span>
              <div className="flex gap-2">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onDifficultyChange(d)}
                    className={`flex-1 py-1 text-[8px] font-mono border transition-all ${
                      difficulty === d 
                        ? 'bg-purple-900/60 border-purple-400 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                        : 'bg-black/40 border-gray-800 text-gray-500 hover:border-purple-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between w-full mt-2">
              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-yellow-400/50 bg-black/60 py-2 px-2 border border-yellow-800/20 hover:border-yellow-600 transition-colors font-mono max-w-[32%] truncate">
                {fileName ? `[ AUDIO: ${fileName} ]` : "[ UP AUDIO ]"}
              </button>
              <button onClick={() => bgInputRef.current?.click()} className="text-[10px] text-red-400/50 bg-black/60 py-2 px-2 border border-red-800/20 hover:border-red-600 transition-colors font-mono max-w-[32%] truncate">
                {currentEnemy ? `[ BG: ${currentEnemy.name} ]` : "[ UP ARENA ]"}
              </button>
              <button className="text-[10px] text-cyan-400/50 bg-black/60 py-2 px-2 border border-cyan-800/20 hover:border-cyan-600 transition-colors font-mono max-w-[31%]">
                [ GUIDE ]
              </button>
            </div>
          </div>
        </motion.div>

        <input type="file" ref={fileInputRef} onChange={onFileChange} accept="audio/*" className="hidden" />
        <input type="file" ref={saberInputRef} onChange={onSaberChange} accept="image/*" className="hidden" />
        <input type="file" ref={bgInputRef} onChange={onBgFileChange} accept="video/*,image/*" className="hidden" />
      </div>
    </motion.div>
  );
}
