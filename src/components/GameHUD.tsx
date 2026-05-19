import React from 'react';
import { motion } from 'framer-motion';

interface GameHUDProps {
  focus: number;
  combo: number;
  playerHealth: number;
  bossHealth: number;
  maxPlayerHealth: number;
  maxBossHealth: number;
  bossName: string;
  opponentHealth: number;
  opponentCombo: number;
  isMultiplayer: boolean;
  onResetPitch: (e: React.MouseEvent | React.TouchEvent) => void;
  onResetTrack: (e: React.MouseEvent | React.TouchEvent) => void;
  onNewTrack: (e: React.MouseEvent | React.TouchEvent) => void;
  isVoltaMode: boolean;
  onToggleVolta: () => void;
  voltage: number;
  aura: number;
  isMappingMode: boolean;
  onToggleMapping: () => void;
  beatTimings: number[];
  onClearTimings: () => void;
  maiStrictness: number;
  onMaiStrictnessChange: (val: number) => void;
  maiContextWindow: number;
  onMaiContextWindowChange: (val: number) => void;
  gyroSensX: number;
  onGyroSensXChange: (val: number) => void;
  gyroSensY: number;
  onGyroSensYChange: (val: number) => void;
  gyroSensZ: number;
  onGyroSensZChange: (val: number) => void;
  pitchScale: number;
  onPitchScaleChange: (val: number) => void;
  minPitch: number;
  onMinPitchChange: (val: number) => void;
  maxPitch: number;
  onMaxPitchChange: (val: number) => void;
  manualPitch: number;
  onManualPitchChange: (val: number) => void;
  proxRewardPower: number;
  onProxRewardPowerChange: (val: number) => void;
  proxBonusWeight: number;
  onProxBonusWeightChange: (val: number) => void;
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
  minGyroThreshold: number;
  onMinGyroThresholdChange: (val: number) => void;
  onShuffleTrack: () => void;
  onShuffleEnemy: () => void;
  onBgFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clashVolumeMultiplier: number;
  onClashVolumeMultiplierChange: (val: number) => void;
  voltagePotential: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  onDifficultyChange: (val: 'EASY' | 'MEDIUM' | 'HARD') => void;
  swipeMode: boolean;
  onToggleSwipeMode: () => void;
}

export function GameHUD({
  focus,
  combo,
  playerHealth,
  bossHealth,
  maxPlayerHealth,
  maxBossHealth,
  bossName,
  opponentHealth,
  opponentCombo,
  isMultiplayer,
  onResetPitch,
  onResetTrack,
  onNewTrack,
  isVoltaMode,
  onToggleVolta,
  voltage,
  aura,
  isMappingMode,
  onToggleMapping,
  beatTimings,
  onClearTimings,
  maiStrictness,
  onMaiStrictnessChange,
  maiContextWindow,
  onMaiContextWindowChange,
  gyroSensX,
  onGyroSensXChange,
  gyroSensY,
  onGyroSensYChange,
  gyroSensZ,
  onGyroSensZChange,
  pitchScale,
  onPitchScaleChange,
  minPitch,
  onMinPitchChange,
  maxPitch,
  onMaxPitchChange,
  manualPitch,
  onManualPitchChange,
  proxRewardPower,
  onProxRewardPowerChange,
  proxBonusWeight,
  onProxBonusWeightChange,
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
  minGyroThreshold,
  onMinGyroThresholdChange,
  onShuffleTrack,
  onShuffleEnemy,
  onBgFileChange,
  clashVolumeMultiplier,
  onClashVolumeMultiplierChange,
  voltagePotential,
  difficulty,
  onDifficultyChange,
  swipeMode,
  onToggleSwipeMode,
}: GameHUDProps) {
  const [showSettings, setShowSettings] = React.useState(false);
  const hudBgInputRef = React.useRef<HTMLInputElement>(null);

  const auraColor = aura > 70 ? 'rgba(0, 255, 255, 0.8)' : aura > 30 ? 'rgba(0, 200, 255, 0.6)' : 'rgba(0, 150, 255, 0.4)';
  
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6">
      {/* Gyro Motion Output Meter */}
      <div className="absolute left-4 bottom-32 w-4 h-48 bg-black/60 border border-cyan-900/50 rounded-sm flex flex-col justify-end overflow-hidden pb-1 items-center z-10 pointer-events-none">
        <label className="text-cyan-500 font-mono text-[6px] absolute top-1 -rotate-90 origin-center whitespace-nowrap opacity-50 uppercase tracking-widest">MAI integrity</label>
        <div id="gyro-meter-fill" className="w-full bg-cyan-400/80 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-75" style={{ height: '0%' }}></div>
      </div>

      <div className="absolute left-10 bottom-32 flex flex-col gap-1 z-10 pointer-events-none">
        <span className="text-[10px] text-purple-400 font-mono tracking-widest uppercase">Voltage Potential</span>
        <span className="text-xl text-purple-300 font-mono font-bold drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
          {voltagePotential.toFixed(2)}x
        </span>
      </div>

      {/* Top Bar: Persistent Track Info & Boss Health */}
      <div className="absolute top-2 right-4 flex flex-col items-end opacity-50 z-50 pointer-events-none">
        <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">CURRENT AUDIO</span>
        <span className="text-xs text-yellow-400 font-mono">{currentTrack?.name || "UPLOADED"}</span>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-md mx-auto pt-6">
        <div className="flex justify-between items-end mb-1">
          <span className="text-red-500 font-black tracking-widest text-sm drop-shadow-[0_0_5px_rgba(255,0,0,0.8)] uppercase">
            {isMultiplayer ? "OPPONENT" : currentEnemy?.name || bossName}
          </span>
          <span className="text-red-500/80 font-mono text-xs">{Math.floor(isMultiplayer ? opponentHealth : bossHealth)} HP</span>
        </div>
        <div className="w-full h-3 bg-black/60 border border-red-900/50 rounded-sm overflow-hidden backdrop-blur-sm">
          <motion.div 
            className="h-full bg-gradient-to-r from-red-700 to-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)]" 
            initial={{ width: '100%' }}
            animate={{ width: `${((isMultiplayer ? opponentHealth : bossHealth) / (isMultiplayer ? 1000 : maxBossHealth)) * 100}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          />
        </div>
      </div>

      {/* Middle: Combo Counter & Volta Button */}
      <div className="flex-1 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col items-start ml-4 sm:ml-8 pointer-events-auto">
          {(combo > 2 || (isMultiplayer && opponentCombo > 2)) && (
            <motion.div 
              key={isMultiplayer ? opponentCombo : combo}
              initial={{ scale: 1.5, opacity: 0, x: -20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              className="flex flex-col items-start"
            >
              <span className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] italic">
                {isMultiplayer ? opponentCombo : combo}
              </span>
              <span className="text-cyan-400 font-mono tracking-[0.3em] text-sm uppercase -mt-2 ml-2">
                {isMultiplayer ? "OPPONENT HITS" : "HITS"}
              </span>
            </motion.div>
          )}
        </div>

        <div className="mr-4 sm:mr-8 flex flex-col items-end gap-4 pointer-events-auto">
          {/* Voltage */}
          <div className="flex flex-col items-end">
            <span className="text-yellow-500 font-mono text-xs tracking-widest uppercase opacity-60">Voltage</span>
            <span className="text-4xl sm:text-5xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] font-mono">
              {Math.floor(voltage).toLocaleString()}
            </span>
          </div>

          {/* Aura */}
          <div className="flex flex-col items-end">
            <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase opacity-80">Aura</span>
            <div className="w-32 h-2 bg-black/60 border border-cyan-900/50 rounded-sm overflow-hidden backdrop-blur-sm mt-1">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.6)]" 
                animate={{ width: `${aura}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Player Health & Controls */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex justify-center pointer-events-auto mb-2">
          <button 
            onClick={onToggleVolta}
            className={`px-6 py-2 border-2 font-black tracking-[0.2em] text-lg rounded-sm transition-all duration-300 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isVoltaMode ? 'bg-yellow-500/20 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`}
          >
            {isVoltaMode ? 'NEO' : 'VOLTA'}
          </button>
        </div>
        <div className="flex justify-between items-end w-full max-w-md mx-auto">
          <div className="flex flex-col gap-1 w-1/2">
            <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase">Integrity</span>
            <div className="w-full h-2 bg-black/60 border border-cyan-900/50 rounded-sm overflow-hidden backdrop-blur-sm">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.6)]" 
                initial={{ width: '100%' }}
                animate={{ width: `${(playerHealth / maxPlayerHealth) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1 w-1/3 items-end">
            <span className="text-yellow-400 font-mono text-[10px] tracking-widest uppercase">Focus</span>
            <div className="w-full h-2 bg-black/60 border border-yellow-900/50 rounded-sm overflow-hidden backdrop-blur-sm">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-[0_0_8px_rgba(255,255,0,0.6)]" 
                animate={{ width: `${focus}%` }}
              />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-end gap-2 pointer-events-auto">
          <button 
            onClick={onResetPitch} 
            onTouchStart={onResetPitch}
            className="px-3 py-2 bg-black/60 border border-cyan-500/50 text-cyan-400 text-[10px] font-mono tracking-widest rounded-sm hover:bg-cyan-900/40 transition-colors backdrop-blur-sm"
          >
            RST PITCH
          </button>
          <button 
            onClick={onResetTrack} 
            onTouchStart={onResetTrack}
            className="px-3 py-2 bg-black/60 border border-cyan-500/50 text-cyan-400 text-[10px] font-mono tracking-widest rounded-sm hover:bg-cyan-900/40 transition-colors backdrop-blur-sm"
          >
            RST TRACK
          </button>
          <button 
            onClick={onNewTrack} 
            onTouchStart={onNewTrack}
            className="px-3 py-2 bg-black/60 border border-purple-500/50 text-purple-400 text-[10px] font-mono tracking-widest rounded-sm hover:bg-purple-900/40 transition-colors backdrop-blur-sm"
          >
            NEW TRACK
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleControlMode(); }}
            onTouchStart={(e) => { e.stopPropagation(); onToggleControlMode(); }}
            className={`px-3 py-2 bg-black/60 border ${controlMode === 'DESKTOP' ? 'border-green-500/50 text-green-400' : 'border-blue-500/50 text-blue-400'} text-[10px] font-mono tracking-widest rounded-sm hover:bg-gray-900/40 transition-colors backdrop-blur-sm`}
          >
            {controlMode}
          </button>
          {controlMode === 'MOBILE' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleMobileClashMode(); }}
              onTouchStart={(e) => { e.stopPropagation(); onToggleMobileClashMode(); }}
              className={`px-3 py-2 bg-black/60 border ${mobileClashOnRelease ? 'border-orange-500/50 text-orange-400' : 'border-cyan-500/50 text-cyan-400'} text-[10px] font-mono tracking-widest rounded-sm hover:bg-gray-900/40 transition-colors backdrop-blur-sm`}
            >
              C:{mobileClashOnRelease ? 'REL' : 'TAP'}
            </button>
          )}
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`px-3 py-2 border text-[10px] font-mono tracking-widest rounded-sm transition-colors backdrop-blur-sm ${showSettings ? 'bg-orange-900/60 border-orange-500/50 text-orange-300' : 'bg-black/60 border-gray-600/50 text-gray-400 hover:bg-gray-800/60'}`}
          >
            {showSettings ? 'CLOSE SET' : 'SETTINGS'}
          </button>
          <button 
            onClick={onToggleMapping} 
            className={`px-3 py-2 border text-[10px] font-mono tracking-widest rounded-sm transition-colors backdrop-blur-sm ${isMappingMode ? 'bg-red-900/60 border-red-500/50 text-red-300' : 'bg-black/60 border-gray-600/50 text-gray-400 hover:bg-gray-800/60'}`}
          >
            {isMappingMode ? 'MAPPING' : 'MAP'}
          </button>
        </div>

        {/* Dropdowns & Settings Panel */}
        {(showSettings || isMappingMode) && (
          <div className="flex flex-col items-end pointer-events-auto mt-2 space-y-1 bg-black/80 p-2 border border-cyan-900/50 rounded-sm w-48 max-h-[70vh] overflow-y-auto">
            
            <div className="flex gap-1 w-full">
              <select 
                value={currentTrack?.url || ''} 
                onChange={(e) => {
                  const t = tracks.find(x => x.url === e.target.value);
                  if (t) onSelectTrack(t);
                }}
                className="flex-1 bg-black/60 border border-yellow-800/50 text-yellow-400 text-[10px] p-2 mb-1 font-mono focus:outline-none focus:border-yellow-500 truncate"
              >
                {tracks.map((t, i) => (
                  <option key={i} value={t.url} className="bg-black text-yellow-400">{t.name}</option>
                ))}
              </select>
              <button 
                onClick={onShuffleTrack}
                className="p-1 px-2 bg-yellow-900/40 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-800/60 rounded-sm transition-colors text-[8px] font-mono h-[30px]"
              >
                SHUF
              </button>
            </div>

            <div className="flex gap-1 w-full">
              <select 
                value={currentEnemy?.url || ''} 
                onChange={(e) => {
                  const t = enemies.find(x => x.url === e.target.value);
                  if (t) onSelectEnemy(t);
                }}
                className="flex-1 bg-black/60 border border-red-800/50 text-red-400 text-[10px] p-2 mb-2 font-mono focus:outline-none focus:border-red-500 truncate"
              >
                {enemies.map((t, i) => (
                  <option key={i} value={t.url} className="bg-black text-red-400">{t.name}</option>
                ))}
              </select>
              <button 
                onClick={onShuffleEnemy}
                className="p-1 px-2 bg-red-900/40 border border-red-500/50 text-red-400 hover:bg-red-800/60 rounded-sm transition-colors text-[8px] font-mono h-[30px]"
              >
                SHUF
              </button>
            </div>

            <div className="text-cyan-500 font-mono text-[8px] tracking-widest border-b border-cyan-900/50 w-full text-center pb-1 mb-1 mt-2">CALIBRATION</div>
            
            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-cyan-400 font-mono text-[8px] truncate">MAI STRICT: {maiStrictness.toFixed(1)}x</span>
              <input type="range" min="0" max="10.0" step="0.1" value={maiStrictness} onChange={(e) => onMaiStrictnessChange(parseFloat(e.target.value))} className="w-20 accent-cyan-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-cyan-400 font-mono text-[8px] truncate">MAI WINDOW: {(maiContextWindow / 1000).toFixed(1)}s</span>
              <input type="range" min="100" max="10000" step="100" value={maiContextWindow} onChange={(e) => onMaiContextWindowChange(parseInt(e.target.value))} className="w-20 accent-cyan-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-cyan-400 font-mono text-[8px]">SENS X: {gyroSensX.toFixed(1)}x</span>
              <input type="range" min="0" max="5.0" step="0.1" value={gyroSensX} onChange={(e) => onGyroSensXChange(parseFloat(e.target.value))} className="w-20 accent-cyan-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-cyan-400 font-mono text-[8px]">SENS Y: {gyroSensY.toFixed(1)}x</span>
              <input type="range" min="0" max="5.0" step="0.1" value={gyroSensY} onChange={(e) => onGyroSensYChange(parseFloat(e.target.value))} className="w-20 accent-cyan-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-cyan-400 font-mono text-[8px]">SENS Z: {gyroSensZ.toFixed(1)}x</span>
              <input type="range" min="0" max="5.0" step="0.1" value={gyroSensZ} onChange={(e) => onGyroSensZChange(parseFloat(e.target.value))} className="w-20 accent-cyan-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-red-400 font-mono text-[8px] truncate uppercase">Min Gyro: {minGyroThreshold.toFixed(1)}°</span>
              <input type="range" min="0.0" max="180.0" step="0.5" value={minGyroThreshold} onChange={(e) => onMinGyroThresholdChange(parseFloat(e.target.value))} className="w-20 accent-red-500" />
            </div>

            <div className="text-purple-500 font-mono text-[8px] tracking-widest border-b border-purple-900/50 w-full text-center pb-1 mb-1 mt-2">AUDIO PERFORMANCE</div>
            
            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-purple-400 font-mono text-[8px] uppercase">Clash Volume: {(clashVolumeMultiplier * 100).toFixed(0)}%</span>
              <input type="range" min="0.0" max="10.0" step="0.1" value={clashVolumeMultiplier} onChange={(e) => onClashVolumeMultiplierChange(parseFloat(e.target.value))} className="w-20 accent-purple-500" />
            </div>

            <div className="flex flex-col gap-1 w-full mt-2">
              <span className="text-[10px] text-purple-400 tracking-widest font-mono uppercase">Boss Difficulty</span>
              <div className="flex gap-1">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => onDifficultyChange(d)}
                    className={`flex-1 py-1 text-[8px] font-mono border transition-all ${
                      difficulty === d 
                        ? 'bg-purple-900/60 border-purple-400 text-purple-100' 
                        : 'bg-black/40 border-gray-800 text-gray-500 hover:border-purple-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-purple-400 font-mono text-[8px] truncate">PITCH/:100V: {pitchScale.toFixed(2)}x</span>
              <input type="range" min="0.15" max="3.0" step="0.05" value={pitchScale} onChange={(e) => onPitchScaleChange(parseFloat(e.target.value))} className="w-20 accent-purple-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-purple-400 font-mono text-[8px]">MIN PITCH: {minPitch.toFixed(2)}</span>
              <input type="range" min="0.1" max="1.5" step="0.05" value={minPitch} onChange={(e) => onMinPitchChange(parseFloat(e.target.value))} className="w-20 accent-purple-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-purple-400 font-mono text-[8px]">MAX PITCH: {maxPitch.toFixed(2)}</span>
              <input type="range" min="1.0" max="3.0" step="0.05" value={maxPitch} onChange={(e) => onMaxPitchChange(parseFloat(e.target.value))} className="w-20 accent-purple-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-purple-400 font-mono text-[8px]">MANUAL PITCH: {manualPitch.toFixed(2)}</span>
              <input type="range" min="0.5" max="2.0" step="0.05" value={manualPitch} onChange={(e) => onManualPitchChange(parseFloat(e.target.value))} className="w-20 accent-purple-500" />
            </div>

            <div className="flex flex-col gap-1 w-full mt-2">
              <span className="text-[10px] text-orange-400 tracking-widest font-mono uppercase">Input Mode</span>
              <button
                onClick={onToggleSwipeMode}
                className={`w-full py-1 text-[8px] font-mono border transition-all ${
                  swipeMode 
                    ? 'bg-orange-900/60 border-orange-400 text-orange-100 shadow-[0_0_10px_rgba(251,146,60,0.4)]' 
                    : 'bg-black/40 border-gray-800 text-gray-500 hover:border-orange-800'
                }`}
              >
                {swipeMode ? 'SWIPE CLASH: ON' : 'SWIPE CLASH: OFF'}
              </button>
            </div>

            <div className="text-orange-500 font-mono text-[8px] tracking-widest border-b border-orange-900/50 w-full text-center pb-1 mb-1 mt-2">ACCEL REWARD</div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-orange-400 font-mono text-[8px] truncate">PROX POWER: {proxRewardPower.toFixed(1)}</span>
              <input type="range" min="1.0" max="15.0" step="0.5" value={proxRewardPower} onChange={(e) => onProxRewardPowerChange(parseFloat(e.target.value))} className="w-20 accent-orange-500" />
            </div>

            <div className="flex items-center gap-2 justify-between w-full">
              <span className="text-orange-400 font-mono text-[8px] truncate">PROX WEIGHT: {proxBonusWeight.toFixed(1)}x</span>
              <input type="range" min="0.0" max="10.0" step="0.5" value={proxBonusWeight} onChange={(e) => onProxBonusWeightChange(parseFloat(e.target.value))} className="w-20 accent-orange-500" />
            </div>

            <div className="border-t border-cyan-900/50 mt-2 pt-2 flex flex-col gap-1">
              <button 
                onClick={() => hudBgInputRef.current?.click()}
                className="w-full bg-red-900/40 border border-red-500/50 text-red-500 hover:bg-red-800/60 transition-colors text-[8px] font-mono py-1 uppercase"
              >
                [ Upload Arena Background ]
              </button>
              <input type="file" ref={hudBgInputRef} onChange={onBgFileChange} accept="video/*,image/*" className="hidden" />
            </div>
          </div>
        )}

        {isMappingMode && (
          <div className="bg-black/80 p-3 border border-red-500/50 text-red-400 text-xs rounded-sm mt-2 max-h-32 overflow-y-auto pointer-events-auto font-mono">
            <div className="flex justify-between items-center mb-2 border-b border-red-900/50 pb-1">
              <span>TIMINGS [{beatTimings.length}]</span>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(beatTimings.join(', '))} className="hover:text-red-200">COPY</button>
                <button onClick={onClearTimings} className="hover:text-red-200">CLR</button>
              </div>
            </div>
            <p className="break-all text-[10px] opacity-80">{beatTimings.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
