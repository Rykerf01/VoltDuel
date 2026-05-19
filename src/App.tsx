import { io, Socket } from 'socket.io-client';
import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './AudioEngine';
import { GoogleGenAI } from '@google/genai';
import { GhostTerminal } from './GhostTerminal';
import { MainMenu } from './components/MainMenu';
import { DuelLobby } from './components/DuelLobby';
import { GameHUD } from './components/GameHUD';
import { ResultScreen } from './components/ResultScreen';
import externalTracks from './externalTracks.json';
import { AnimatePresence } from 'framer-motion';

type GamePhase = 'BOOT' | 'MENU' | 'WAITING' | 'BATTLE' | 'RESULT';

const ENEMY_ROSTER = [
  { name: "[DEFAULT] NEO MATRIX", url: "https://www.dropbox.com/scl/fi/s8yhfwr9jyvv7zmimb0o4/Lumii_20260417_143250176.jpg?rlkey=dl3dp03a4s3j0neh62jpevn0f&st=hu79f28k&dl=1" },
  { name: "LUMII 1630", url: "https://www.dropbox.com/scl/fi/lkqn12q7b4uerp998d258/Lumii_20260329_163028975.jpg?rlkey=2pis25cxejunbbdppmhikqmit&st=nvpgyo1x&dl=1" },
  { name: "0_0-26", url: "https://www.dropbox.com/scl/fi/hsmz6rmmaemfocvb9v05c/0_0-26.jpg?rlkey=clc5ai27nh8xpnoabit5yu5iw&st=ljbnxtwa&dl=1" },
  { name: "IMG_4534", url: "https://www.dropbox.com/scl/fi/ri6nsk54gb3siofv2mps2/IMG_4534.png?rlkey=p2azesdvrlu43xtepkuhlup6s&st=te4qoxii&dl=1" },
  { name: "RDT 1811", url: "https://www.dropbox.com/scl/fi/ie05321z16z0eucf6czt0/RDT_20230927_1811131086433008673659545.jpg?rlkey=792nspgybglql5mabzl9n2rf2&st=t8y8q7kj&dl=1" },
  { name: "RDT 0128", url: "https://www.dropbox.com/scl/fi/pnn0nkzai7dnbc0cn8r2l/RDT_20230102_0128122212668261497858971.jpg?rlkey=reteynqi8zsi0j5bv3e5drivt&st=b7uiy0mu&dl=1" },
  { name: "20230909", url: "https://www.dropbox.com/scl/fi/4m36s2d0coli6x17auox4/20230909_135659.jpg?rlkey=0pswa73dph60tslh3xfb4pfzi&st=ngzlxo1s&dl=1" },
  { name: "LUMII 0213", url: "https://www.dropbox.com/scl/fi/e13saoxn4jqe3d9ztpv7o/Lumii_20241022_021356648.jpg?rlkey=h8w85s6wrukblnzyycbcjdx65&st=vqockdsa&dl=1" },
  { name: "LUMII 1815", url: "https://www.dropbox.com/scl/fi/j2fpupq129wf584poc7yz/Lumii_20260329_181559389.jpg?rlkey=ayy4b3lgtoyejdhjtrfttryiq&st=tf5zp5wi&dl=1" },
  { name: "ARENA DUEL", url: "https://www.dropbox.com/scl/fi/1npvgiox6k2juqwegbys3/arena-duel.jpg?rlkey=6aoi9lvgtf0v1nhvstyudutr8&st=db1ljhlg&dl=1" },
  { name: "VOLT DUELIST", url: "https://dl.dropboxusercontent.com/scl/fi/qw1cpghnwyn4bu3ofnuz4/lv_0_20260305073040.mp4?rlkey=chnn068n4umq8352m47avpick&st=etuwkjiz&dl=1" },
  { name: "NEO ARENA VID", url: "https://www.dropbox.com/scl/fi/8ad41a1j4ci6aism4of0x/lv_0_20251110154609.mp4?rlkey=9e5rd2kq7zphp1nihx4spjn9m&st=sqcvkp14&dl=1" }
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<GamePhase>('MENU');
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [focus, setFocus] = useState(50); // 0-100 focus meter
  
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saberFileName, setSaberFileName] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<'MOBILE' | 'DESKTOP'>('MOBILE');
  const [mobileClashOnRelease, setMobileClashOnRelease] = useState(false);
  const [currentEnemy, setCurrentEnemy] = useState(ENEMY_ROSTER[0]);
  const [currentEnemyImg, setCurrentEnemyImg] = useState<HTMLImageElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(externalTracks[0]);

  const musicTracks = externalTracks;

  const fixDropboxUrl = (url: string) => {
    if (url.includes('dropbox.com') && !url.includes('dl=1') && !url.includes('raw=1')) {
      if (url.includes('?')) return url + '&dl=1';
      return url + '?dl=1';
    }
    return url;
  };

  const handleSelectEnemy = (enemy: any) => {
    enemy.url = fixDropboxUrl(enemy.url);
    setCurrentEnemy(enemy);
    const url = enemy.url.toLowerCase();
    const isVideo = url.endsWith('.mp4') || url.includes('.mp4?') || url.includes('video') || (enemy.file && enemy.file.type.startsWith('video/'));
    
    if (isVideo) {
      if (videoRef.current) {
        videoRef.current.pause();
        // Clear old object URL if any
        if (videoRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(videoRef.current.src);
        }
        videoRef.current.src = enemy.url;
        videoRef.current.load();
        videoRef.current.play().catch(e => {
          console.warn("Video play error:", e);
          setHasVideo(true);
        });
        setHasVideo(true);
      }
      setCurrentEnemyImg(null);
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = enemy.url;
      img.onload = () => {
        setCurrentEnemyImg(img);
        setHasVideo(false);
      };
      img.onerror = () => {
        console.error("Failed to load background image:", enemy.url);
      };
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    }
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleSelectEnemy({ name: file.name, url: url, file: file });
      e.target.value = '';
    }
  };

  const shuffleTrack = () => {
    const randomTrack = musicTracks[Math.floor(Math.random() * musicTracks.length)];
    setCurrentTrack(randomTrack);
    if (audioRef.current && randomTrack) {
      audioRef.current.init(randomTrack.url);
    }
  };

  const shuffleEnemy = () => {
    const randomEnemy = ENEMY_ROSTER[Math.floor(Math.random() * ENEMY_ROSTER.length)];
    handleSelectEnemy(randomEnemy);
  };
  
  const [maiStrictnessState, setMaiStrictnessState] = useState(10.0);
  const [gyroSensX, setGyroSensX] = useState(4.0);
  const [gyroSensY, setGyroSensY] = useState(4.0);
  const [gyroSensZ, setGyroSensZ] = useState(4.0);
  const [pitchScale, setPitchScale] = useState(0.15); 
  const [minPitch, setMinPitch] = useState(0.5);
  const [maxPitch, setMaxPitch] = useState(1.5);
  const [manualPitch, setManualPitch] = useState(1.0);
  const [proxRewardPower, setProxRewardPower] = useState(1.0);
  const [proxBonusWeight, setProxBonusWeight] = useState(0.5);
  const [maiContextWindow, setMaiContextWindow] = useState(10000);
  const [minGyroThreshold, setMinGyroThreshold] = useState(0.0);
  const [clashVolume, setClashVolume] = useState(1.0);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [voltagePotential, setVoltagePotential] = useState(1.0);
  const [swipeMode, setSwipeMode] = useState(false);

  useEffect(() => {
    handleSelectEnemy(ENEMY_ROSTER[0]);
  }, []);

  const setMaiStrictness = (val: number) => {
    setMaiStrictnessState(val);
    state.current.maiStrictness = val;
  };
  const handleMaiContextWindowChange = (val: number) => {
    setMaiContextWindow(val);
    state.current.maiContextWindow = val;
  };
  const [hasVideo, setHasVideo] = useState(true);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [duelId, setDuelId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [opponentHealth, setOpponentHealth] = useState(1000);
  const [opponentCombo, setOpponentCombo] = useState(0);
  const [isMappingMode, setIsMappingMode] = useState(false);
  const [isVoltaMode, setIsVoltaMode] = useState(false);
  const [beatTimings, setBeatTimings] = useState<number[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const saberInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const state = useRef({
    globalMomentum: 50,
    lastPos: { x: 0, y: 0, time: 0 },
    gyroHistory: [] as { time: number, speed: number, dir: number }[],
    swordVisualPos: { x: 0, y: 0 },
    smoothedDy: 0,
    lastSwordVisualPos: { x: 0, y: 0 },
    homeOrientation: null as { beta: number, gamma: number } | null,
    lastTime: performance.now(),
    particles: [] as any[],
    slashes: [] as any[],
    floatingTexts: [] as any[],
    lightningBolts: [] as any[],
    shakeTimer: 0,
    flashTimer: 0,
    bloodTimer: 0,
    zapTimer: 0,
    phase: 'BOOT' as GamePhase,
    audioData: new Uint8Array(128),
    cameraOffset: { x: 0, y: 0 },
    lightIntensity: 0,
    lastClashTime: 0,
    battleStartTime: 0,
    perfectStreak: 0,
    overdrive: false,
    saberRotation: { x: 0, y: 0, z: 0 },
    saberTargetRotation: { x: 0, y: 0, z: 0 },
    beatPulse: 0,
    bossHealth: 10000,
    maxBossHealth: 10000,
    playerHealth: 100,
    maxPlayerHealth: 100,
    combo: 0,
    maxCombo: 0,
    bossName: "VOLT DUELIST",
    voltage: 0,
    voltDebt: 0,
    aura: 0,
    isHumiliated: false,
    isVoltaMode: false,
    lastCurrentTime: 0,
    isMouseHolding: false,
    clashIndex: 0,
    clashGyroHistory: [] as { time: number, speed: number, dir: number }[],
    clashTimer: 100,
    clashTaps: 0,
    maiStrictness: 10.0,
    maiContextWindow: 10000,
    gyroSensX: 4.0,
    gyroSensY: 4.0,
    gyroSensZ: 4.0,
    pitchScalePer100V: 0.15,
    grav: { x: 0, y: 0, z: 0 } as { x: number, y: number, z: number } | null,
    clashVolumeMultiplier: 1.0,
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    maiVoltagePotential: 1.0,
    maiIntegrity: 1.0,
    swipeActive: false,
    swipeInitiated: false,
    swipeStartPos: { x: 0, y: 0 },
    swipeTargetPos: { x: 0, y: 0 },
    swipeProgress: 0,
    nextSwipeClashTime: -1,
    swipeMeterVisible: false,
  });

  const audioRef = useRef<AudioEngine | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const customSaberRef = useRef<HTMLImageElement | null>(null);
  const requestRef = useRef<number>();

  const handleGyroSensX = (v: number) => { setGyroSensX(v); state.current.gyroSensX = v; };
  const handleGyroSensY = (v: number) => { setGyroSensY(v); state.current.gyroSensY = v; };
  const handleGyroSensZ = (v: number) => { setGyroSensZ(v); state.current.gyroSensZ = v; };
  const handlePitchScale = (v: number) => { setPitchScale(v); state.current.pitchScalePer100V = v; };
  const handleMinPitch = (v: number) => { 
    setMinPitch(v); 
    if (audioRef.current) audioRef.current.minPitch = v; 
  };
  const handleMaxPitch = (v: number) => { 
    setMaxPitch(v); 
    if (audioRef.current) audioRef.current.maxPitch = v; 
  };
  const handleManualPitch = (v: number) => {
    setManualPitch(v);
    if (audioRef.current) audioRef.current.manualPitch = v;
  };

  const handleClashVolumeChange = (v: number) => {
    setClashVolume(v);
    state.current.clashVolumeMultiplier = v;
  };

  const handleDifficultyChange = (v: 'EASY' | 'MEDIUM' | 'HARD') => {
    setDifficulty(v);
    state.current.difficulty = v;
  };

  useEffect(() => {
    const img = new Image();
    img.src = "https://cdn.discordapp.com/attachments/1345146254295961640/1477197143570911323/Lumii_20260226_070036183.jpg?ex=69a3e28c&is=69a2910c&hm=027fccb9f536012abc40abbaade4504d9d1bb4d8db8cba331fcd6ef37f8314e8&"; 
    img.onload = () => { bgImageRef.current = img; };
  }, []);

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.on('connect', () => {
      console.log('Connected to server', socketRef.current?.id);
    });
    
    socketRef.current.on('opponent-action', (data) => {
      console.log('Opponent action:', data);
      setOpponentHealth(data.health);
      setOpponentCombo(data.combo);
    });

    socketRef.current.on('track-selected', (trackUrl) => {
      setCustomAudioUrl(trackUrl);
    });

    socketRef.current.on('duel-started', () => {
      startGame();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const safePlay = (v: HTMLVideoElement) => {
      if (v.src && v.src !== "") {
        v.play().catch(e => console.warn("Video play deferred:", e));
      }
    };
    
    const video = document.createElement('video');
    // Find first available video in roster to initialize correctly
    const firstVideoUrl = ENEMY_ROSTER.find(e => e.url.toLowerCase().includes('.mp4'))?.url || "";
    video.src = firstVideoUrl;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.oncanplay = () => {
      safePlay(video);
    };
    videoRef.current = video;
    // Fallback if oncanplay takes too long or fails to fire in some environments
    setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        setHasVideo(true);
      }
    }, 2000);
  }, []);

  useEffect(() => {
    if (!started || phase !== 'BATTLE') return;
    const interval = setInterval(() => {
      // Get current speed from gyroHistory
      const s = state.current;
      const last = s.gyroHistory.length > 0 ? s.gyroHistory[s.gyroHistory.length - 1] : null;
      const speed = last ? last.speed : 0;
      
      setFocus(prev => {
        if (speed > 50) return Math.max(0, prev - 5); // Erratic
        return Math.min(100, prev + 2); // Steady
      });
    }, 100);
    return () => clearInterval(interval);
  }, [started, phase]);

  const requestPermissions = async () => {
    let granted = true;
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const p = await (DeviceMotionEvent as any).requestPermission();
        granted = p === 'granted';
      } catch (e) { granted = false; }
    }
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const p = await (DeviceOrientationEvent as any).requestPermission();
        granted = granted && p === 'granted';
      } catch (e) { granted = false; }
    }
    setPermissionGranted(granted);
  };

  const startGame = async () => {
    await requestPermissions();
    if (!audioRef.current) audioRef.current = new AudioEngine();
    
    // Set specific track as default
    let trackUrl = customAudioUrl;
    let fileName = null;

    if (!trackUrl) {
      const specificTrack = musicTracks.find(t => t.name === "ASSOMBRA NFS");
      if (specificTrack) {
        trackUrl = specificTrack.url;
        fileName = specificTrack.name;
      } else if (musicTracks.length > 0) {
        const randomTrack = musicTracks[Math.floor(Math.random() * musicTracks.length)];
        trackUrl = randomTrack.url;
        fileName = randomTrack.name;
      }
      setFileName(fileName);
    }

    if (trackUrl) {
      await audioRef.current.init(trackUrl);
    }
    
    state.current.lastTime = performance.now();
    if (videoRef.current && videoRef.current.src && videoRef.current.src !== "") {
      videoRef.current.play().catch(e => console.error("Video play failed on start:", e));
    }
    setStarted(true);
    updatePhase('BATTLE');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { 
      setCustomAudioUrl(URL.createObjectURL(file)); 
      setFileName(file.name); 
      e.target.value = ''; // Clear input to allow re-selection
    }
  };

  const handleSaberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaberFileName(file.name);
      const img = new Image(); img.src = URL.createObjectURL(file);
      img.onload = () => { customSaberRef.current = img; };
    }
  };

  const updatePhase = (newPhase: GamePhase) => {
    setPhase(newPhase);
    state.current.phase = newPhase;
    if (newPhase === 'BATTLE') {
      const now = performance.now();
      state.current.battleStartTime = now;
      state.current.gyroHistory = [];
      state.current.clashGyroHistory = [];
      state.current.perfectStreak = 0;
      state.current.combo = 0;
      state.current.maxCombo = 0;
      state.current.clashIndex = 0;
      state.current.maiVoltagePotential = 1.0;
      state.current.maiIntegrity = 1.0;
      setVoltagePotential(1.0);
      
      // Scale Boss by Difficulty
      if (state.current.difficulty === 'EASY') {
        state.current.maxBossHealth = 5000;
        state.current.bossHealth = 5000;
      } else if (state.current.difficulty === 'MEDIUM') {
        state.current.maxBossHealth = 10000;
        state.current.bossHealth = 10000;
      } else if (state.current.difficulty === 'HARD') {
        state.current.maxBossHealth = 20000;
        state.current.bossHealth = 20000;
      }

      state.current.playerHealth = 100;
      state.current.maxPlayerHealth = 100;
      
      if (videoRef.current) {
        videoRef.current.currentTime = 8.0;
      }
    } else if (newPhase === 'RESULT') {
      // Wait for user to click restart
    } else if (newPhase === 'MENU') {
      audioRef.current?.stop();
    }
  };

  useEffect(() => {
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
      
      const s = state.current;
      
      // High-pass filter to isolate linear acceleration
      const alpha = 0.8;
      if (!s.grav) s.grav = { x: acc.x, y: acc.y, z: acc.z };
      s.grav.x = alpha * s.grav.x + (1 - alpha) * acc.x;
      s.grav.y = alpha * s.grav.y + (1 - alpha) * acc.y;
      s.grav.z = alpha * s.grav.z + (1 - alpha) * acc.z;
      
      const linearX = (acc.x - s.grav.x) * s.gyroSensX;
      const linearY = (acc.y - s.grav.y) * s.gyroSensY;
      const linearZ = (acc.z - s.grav.z) * s.gyroSensZ;
      
      const speed = Math.sqrt(linearX*linearX + linearY*linearY + linearZ*linearZ);
      
      if (s.phase === 'BATTLE') {
        const now = performance.now();
        s.gyroHistory.push({ time: now, speed, dir: acc.x });
        if (s.isTouching) {
          s.clashGyroHistory.push({ time: now, speed, dir: acc.x });
        }
        audioRef.current?.setSwingMotion(speed, s.smoothedDy, s.isVoltaMode);
        
        // Update DOM meter
        const meter = document.getElementById('gyro-meter-fill');
        if (meter) {
          meter.style.height = `${Math.min(100, speed)}%`;
        }
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        if (!state.current.homeOrientation) {
          state.current.homeOrientation = { beta: e.beta, gamma: e.gamma };
        }
        let db = e.beta - state.current.homeOrientation.beta;
        let dg = e.gamma - state.current.homeOrientation.gamma;
        if (db > 180) db -= 360; if (db < -180) db += 360;
        if (dg > 180) dg -= 360; if (dg < -180) dg += 360;

        // Apply threshold logic to prevent millimeter jitter from polluting MAI
        if (Math.abs(db) < minGyroThreshold) db = 0;
        if (Math.abs(dg) < minGyroThreshold) dg = 0;
        
        audioRef.current?.setDeviceRotation(dg);
        
        const newY = Math.max(-200, Math.min(200, db * 1.2));
        const dy = newY - state.current.swordVisualPos.y;
        state.current.smoothedDy = state.current.smoothedDy * 0.8 + dy * 0.2;
        
        state.current.swordVisualPos = { 
          x: Math.max(-200, Math.min(200, dg * 1.2)), 
          y: newY 
        };
      }
    };

    if (permissionGranted) {
      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permissionGranted, phase]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!started) return;
    const s = state.current;
    
    if (s.phase === 'BATTLE') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && swipeMode && s.swipeMeterVisible) {
        const touch = e.touches[0];
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        const dist = Math.sqrt(Math.pow(tx - s.swipeStartPos.x, 2) + Math.pow(ty - s.swipeStartPos.y, 2));
        
        if (dist < 50) {
          s.swipeActive = true;
          s.swipeInitiated = true;
          s.swipeProgress = 0;
          if (navigator.vibrate) navigator.vibrate(20);
          return;
        }
      }

      if (isMappingMode) {
        const time = audioRef.current?.getElapsedTime() || 0;
        setBeatTimings(prev => [...prev, time]);
        return;
      }
      
      if (controlMode === 'MOBILE') {
        if (!mobileClashOnRelease) evaluateClash();
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const s = state.current;
    if (s.phase === 'BATTLE') {
      const touch = e.touches[0];
      const now = performance.now();
      const rect = containerRef.current?.getBoundingClientRect();

      if (rect && s.swipeActive && s.swipeInitiated) {
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        const dxLine = s.swipeTargetPos.x - s.swipeStartPos.x;
        const dyLine = s.swipeTargetPos.y - s.swipeStartPos.y;
        const lengthSq = dxLine * dxLine + dyLine * dyLine;
        const t = ((tx - s.swipeStartPos.x) * dxLine + (ty - s.swipeStartPos.y) * dyLine) / lengthSq;
        s.swipeProgress = Math.max(0, Math.min(1, t));

        if (s.swipeProgress >= 0.98) {
          s.swipeActive = false;
          s.swipeMeterVisible = false;
          s.swipeInitiated = false;
          evaluateClash();
        }
      }

      if (s.lastPos && s.lastPos.time > 0) {
        const dx = touch.clientX - s.lastPos.x;
        const dy = touch.clientY - s.lastPos.y;
        const dt = Math.max(1, now - s.lastPos.time);
        const speed = (Math.sqrt(dx * dx + dy * dy) / dt) * 16.66;
        if (isFinite(speed) && isFinite(dy) && isFinite(dx)) {
          s.smoothedDy = s.smoothedDy * 0.8 + dy * 0.2;
          audioRef.current?.setSwingMotion(speed, dy, s.isVoltaMode, dx);
          // Push touch speed to gyro history for clash evaluation in swipe mode
          if (swipeMode) {
            s.gyroHistory.push({ time: now, speed, dir: dx });
          }
        }
        s.swordVisualPos.x = Math.max(-200, Math.min(200, s.swordVisualPos.x + dx));
        s.swordVisualPos.y = Math.max(-200, Math.min(200, s.swordVisualPos.y + dy));
      }
      s.lastPos = { x: touch.clientX, y: touch.clientY, time: now };
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!started) return;
    const s = state.current;
    
    if (s.phase === 'BATTLE') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect && swipeMode && s.swipeMeterVisible) {
        const tx = e.clientX - rect.left;
        const ty = e.clientY - rect.top;
        const dist = Math.sqrt(Math.pow(tx - s.swipeStartPos.x, 2) + Math.pow(ty - s.swipeStartPos.y, 2));
        
        if (dist < 50) {
          s.swipeActive = true;
          s.swipeInitiated = true;
          s.swipeProgress = 0;
          return;
        }
      }

      if (isMappingMode) {
        const time = audioRef.current?.getElapsedTime() || 0;
        setBeatTimings(prev => [...prev, time]);
        return;
      }
      
      if (controlMode === 'MOBILE') {
        evaluateClash();
      } else {
        s.isMouseHolding = true;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const s = state.current;
    const now = performance.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Aiming: Map mouse position relative to center of container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    if (s.swipeActive && s.swipeInitiated) {
      const dxLine = s.swipeTargetPos.x - s.swipeStartPos.x;
      const dyLine = s.swipeTargetPos.y - s.swipeStartPos.y;
      const lengthSq = dxLine * dxLine + dyLine * dyLine;
      const t = ((mouseX - s.swipeStartPos.x) * dxLine + (mouseY - s.swipeStartPos.y) * dyLine) / lengthSq;
      s.swipeProgress = Math.max(0, Math.min(1, t));

      if (s.swipeProgress >= 0.98) {
        s.swipeActive = false;
        s.swipeMeterVisible = false;
        s.swipeInitiated = false;
        evaluateClash();
      }
    }

    // Update visual position for "looking around" (aiming)
    // Scale it to match the gyro feel
    const targetX = (mouseX - centerX) * 0.5;
    const targetY = (mouseY - centerY) * 0.5;
    
    s.swordVisualPos.x = Math.max(-200, Math.min(200, targetX));
    s.swordVisualPos.y = Math.max(-200, Math.min(200, targetY));

    if (s.phase === 'BATTLE' && s.lastPos && s.lastPos.time > 0) {
      const dx = e.clientX - s.lastPos.x;
      const dy = e.clientY - s.lastPos.y;
      const dt = Math.max(1, now - s.lastPos.time);
      const rawSpeed = (Math.sqrt(dx*dx + dy*dy) / dt) * 16.66;
      
      if (controlMode === 'DESKTOP') {
        const mouseMult = s.isMouseHolding ? 5.0 : 1.0;
        const mappedSpeed = rawSpeed * mouseMult;
        if (s.isMouseHolding || (swipeMode && s.swipeInitiated)) {
          s.gyroHistory.push({ time: now, speed: mappedSpeed, dir: dy });
        }
        
        const lastSpeed = s.gyroHistory.length > 0 ? s.gyroHistory[s.gyroHistory.length - 1].speed : mappedSpeed;
        const speed = lastSpeed * 0.8 + mappedSpeed * 0.2;
        
        if (isFinite(speed) && isFinite(dy)) {
          s.smoothedDy = s.smoothedDy * 0.8 + dy * 0.2;
          audioRef.current?.setSwingMotion(speed, dy, s.isVoltaMode);
        }
      } else {
        const lastSpeed = s.gyroHistory.length > 0 ? s.gyroHistory[s.gyroHistory.length - 1].speed : rawSpeed;
        const speed = lastSpeed * 0.8 + rawSpeed * 0.2;
        
        if (isFinite(speed) && isFinite(dy)) {
          s.smoothedDy = s.smoothedDy * 0.8 + dy * 0.2;
          audioRef.current?.setSwingMotion(speed, dy, s.isVoltaMode);
        }
      }
    }
    
    s.lastPos = { x: e.clientX, y: e.clientY, time: now };
  };

  const handleMouseUp = () => {
    state.current.isTouching = false;
    if (controlMode === 'DESKTOP' && state.current.isMouseHolding && state.current.phase === 'BATTLE') {
      evaluateClash();
    }
    state.current.isMouseHolding = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    state.current.isTouching = e.touches.length > 0;
    if (!started || state.current.phase === 'RESULT') return;
    
    if (controlMode === 'MOBILE' && mobileClashOnRelease && state.current.phase === 'BATTLE') {
      evaluateClash();
    }
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    state.current.isTouching = e.touches.length > 0;
  };

  const evaluateClash = () => {
    const s = state.current;
    const now = performance.now();
    
    if (now - s.lastClashTime < 300) return;
    s.lastClashTime = now;
    
    // Evaluate MAI over the last N ms context window
    const windowStart = now - s.maiContextWindow;
    const history = s.gyroHistory.filter(g => g.time >= windowStart);

    let totalSpeed = 0;
    let minSpeed = 9999;
    let maxSpeed = 0;
    let weightedAccelScore = 0;
    
    if (history.length > 0) {
      for (let i = 1; i < history.length; i++) {
        const hPrev = history[i-1];
        const hCurr = history[i];
        
        totalSpeed += hCurr.speed;
        
        if (hCurr.speed < minSpeed) minSpeed = hCurr.speed;
        if (hCurr.speed > maxSpeed) maxSpeed = hCurr.speed;
        
        const accel = hCurr.speed - hPrev.speed;
        if (accel > 0) {
            // How close to the end is this? (0 to 1, where 1 is exactly at `now`)
            const timeRatio = Math.max(0, 1 - ((now - hCurr.time) / s.maiContextWindow));
            // HUGE reward for acceleration closer to clash
            const weight = Math.pow(timeRatio, proxRewardPower); 
            weightedAccelScore += accel * weight;
        }
      }
    } else {
      minSpeed = 0;
    }

    const avgSpeed = history.length > 0 ? totalSpeed / history.length : 0;
    const maxAccelRange = Math.max(0, maxSpeed - (minSpeed === 9999 ? 0 : minSpeed));
    
    // Is the swing fluid enough? Require some speed and reasonable range.
    const isFluid = avgSpeed > (5 * s.maiStrictness) && maxAccelRange > (10 * s.maiStrictness);
    
    const slashAngle = Math.random() * Math.PI * 2;
    
    s.particles.push({
      x: window.innerWidth / 2, y: window.innerHeight / 2, vx: 0, vy: 0, life: 300, maxLife: 300, color: '#06b6d4', size: 20, isRing: true
    });
    
    if (videoRef.current) {
      const clashTimes = [8.0, 2.0]; 
      const time = clashTimes[s.clashIndex % clashTimes.length];
      if (isFinite(time)) {
        videoRef.current.currentTime = time;
      }
    }

    if (isFluid) {
      // Clash Voltage calculation!
      // maxAccelRange base + heavily weighted recent acceleration
      let clashVoltage = (maxAccelRange * 0.5 + weightedAccelScore * proxBonusWeight) * 10;
      
      // Apply Voltage Potential Multiplier
      clashVoltage *= s.maiVoltagePotential;

      const multiplier = s.overdrive ? 2.0 : 1.0;
      const dmg = clashVoltage * multiplier;
      
      let color = '#06b6d4'; // Standard
      let label = 'STRIKE';
      
      if (clashVoltage > 1000) {
        color = '#a855f7'; // Voltaic
        label = 'VOLTAIC CLASH';
        s.perfectStreak++;
      } else {
        s.perfectStreak = 0;
      }

      s.slashes.push({ x: window.innerWidth/2, y: window.innerHeight/2, angle: slashAngle, color: color, life: 300, maxLife: 300, isEnemy: false, size: clashVoltage > 1000 ? 2 : 1.5 });
      
      s.combo++;
      s.maxCombo = Math.max(s.maxCombo, s.combo);
      s.globalMomentum = Math.min(100, s.globalMomentum + 15 + (s.perfectStreak * 2));
      s.bossHealth = Math.max(0, s.bossHealth - dmg);
      
      if (audioRef.current) {
        // Increase pitch by (voltage / 1000) * pitchScalePer100V
        const pitchIncrease = (clashVoltage / 1000) * (s.pitchScalePer100V / 100);
        audioRef.current.pitchShift += pitchIncrease;
        audioRef.current.triggerZap((clashVoltage / 10000) * s.clashVolumeMultiplier);
      }
      
      s.floatingTexts.push({ x: window.innerWidth/2, y: window.innerHeight/2, text: `${label} (${Math.floor(clashVoltage)}V)`, life: 2000, color: color });
      s.floatingTexts.push({ x: window.innerWidth/2 + (Math.random()-0.5)*100, y: window.innerHeight/2 - 100 + (Math.random()-0.5)*50, text: `-${Math.floor(dmg)}`, life: 1000, color: '#fff' });
      if (navigator.vibrate) navigator.vibrate(clashVoltage > 100 ? [50, 30, 50] : 50);
      
      if (s.perfectStreak >= 5 && !s.overdrive) {
        s.overdrive = true;
        s.floatingTexts.push({ x: window.innerWidth/2, y: window.innerHeight/2 - 100, text: 'OVERDRIVE ACTIVE', life: 3000, color: '#fff' });
        s.flashTimer = 500;
      }
    } else {
      // Too weak / erratic, counts as a miss
      s.slashes.push({ x: window.innerWidth/2, y: window.innerHeight/2, angle: slashAngle, color: '#7f1d1d', life: 400, maxLife: 400, isEnemy: true, size: 2.5 });
      s.perfectStreak = 0;
      s.combo = 0;
      s.overdrive = false;
      s.globalMomentum = Math.max(0, s.globalMomentum - 10);
      s.playerHealth -= 10;
      s.shakeTimer = 300;
      audioRef.current?.triggerPenalty();
      s.floatingTexts.push({ x: window.innerWidth/2, y: window.innerHeight/2, text: 'WEAK FLOW', life: 1000, color: '#7f1d1d' });
    }

    if (s.bossHealth < 0) s.bossHealth = 0;
    if (s.playerHealth < 0) s.playerHealth = 0;
    if (audioRef.current) audioRef.current.setTrackPitch(s.globalMomentum, s.combo);
    
    s.clashIndex++;
  };

  const update = (dt: number) => {
    const s = state.current;
    
    if (s.shakeTimer > 0) s.shakeTimer -= dt;
    if (s.flashTimer > 0) s.flashTimer -= dt;
    if (s.bloodTimer > 0) s.bloodTimer -= dt;
    if (s.zapTimer > 0) s.zapTimer -= dt;

    // Voltage
    s.voltage = Math.max(0, s.voltage - (dt * 0.5)); // Decay voltage (scaled 10x)

    if (s.phase === 'BATTLE') {
      // Analyze current MAI Integrity
      // Compact format: smoothed recent history of gyro volatility
      const history = s.gyroHistory;
      if (history.length > 0) {
        const last10 = history.slice(-10);
        const avgSpeed = last10.reduce((acc, h) => acc + h.speed, 0) / last10.length;
        // Integrity is high when speed is consistent and not erratic
        const integrityInput = Math.min(1.0, avgSpeed / 50); // Normalized 0 to 1
        s.maiIntegrity = s.maiIntegrity * 0.95 + integrityInput * 0.05;
      }

      // Linear Voltage Potential scale over time
      // Increases by 0.005 per second base, +0.01 per second based on integrity
      const growthRate = 0.005 + (s.maiIntegrity * 0.01);
      s.maiVoltagePotential += (growthRate * dt) / 1000;
      
      // Update React state for HUD (throttled conceptually by state call)
      if (Math.random() < 0.1) {
        setVoltagePotential(s.maiVoltagePotential);
      }
    } else {
      s.maiVoltagePotential = 1.0;
      s.maiIntegrity = 1.0;
    }

    if (audioRef.current) {
      audioRef.current.update(dt);
    }

    // Update Lightning
    for (let i = s.lightningBolts.length - 1; i >= 0; i--) {
      s.lightningBolts[i].life -= dt;
      if (s.lightningBolts[i].life <= 0) s.lightningBolts.splice(i, 1);
    }

    if (s.phase === 'BATTLE') {
      const now = performance.now();
      
      // Swipe Mode Logic
      if (swipeMode) {
        const nextTarget = audioRef.current?.getNextClash();
        if (nextTarget && nextTarget > 0) {
          const elapsed = audioRef.current?.getElapsedTime() || 0;
          const timeUntil = nextTarget - elapsed;
          
          if (timeUntil < 1.4 && timeUntil > -0.2) {
            if (!s.swipeMeterVisible || s.nextSwipeClashTime !== nextTarget) {
              s.swipeMeterVisible = true;
              s.nextSwipeClashTime = nextTarget;
              s.swipeInitiated = false;
              s.swipeActive = false;
              s.swipeProgress = 0;
              
              // Seeded randomization for consistency
              const seed = Math.floor(nextTarget * 100);
              const rand = (n: number) => (Math.abs(Math.sin(n * 43758.5453123)) % 1);
              
              const centerX = window.innerWidth / 2;
              const centerY = window.innerHeight / 2;
              
              const angle = rand(seed) * Math.PI * 2;
              const length = 180 + rand(seed + 1) * 220;
              const offsetX = (rand(seed + 2) - 0.5) * 450;
              const offsetY = (rand(seed + 3) - 0.5) * 450;
              
              s.swipeStartPos = { x: centerX + offsetX, y: centerY + offsetY };
              s.swipeTargetPos = {
                x: s.swipeStartPos.x + Math.cos(angle) * length,
                y: s.swipeStartPos.y + Math.sin(angle) * length
              };
            }
          } else if (timeUntil < -0.2 || timeUntil > 1.4) {
            // Missed opportunity or too early
            if (s.swipeMeterVisible && s.swipeInitiated && !s.swipeActive && timeUntil < 0) {
              // They started but didn't finish the swipe in time
              s.playerHealth = Math.max(0, s.playerHealth - 15);
              s.shakeTimer = 400;
              s.bloodTimer = 800;
              s.combo = 0;
              audioRef.current?.triggerPenalty();
              s.floatingTexts.push({
                x: window.innerWidth / 2, y: window.innerHeight / 2,
                text: "SYNC FAILED", life: 1000, color: "#ff0000"
              });
            }
            s.swipeMeterVisible = false;
            s.swipeActive = false;
            s.swipeInitiated = false;
          }
        }
      }

      // Keep 4 seconds of history
      s.gyroHistory = s.gyroHistory.filter(g => now - g.time < 4000);
      
      // Detect swing to trigger evaluateClash
      const recentGyro = s.gyroHistory.filter(g => now - g.time < 100);
      const currentSpeed = recentGyro.length > 0 ? recentGyro[recentGyro.length - 1].speed : 0;
      
      // Build voltage based on gyro momentum integrity
      if (currentSpeed > 5) {
        const momentumGain = (currentSpeed / 50) * (dt / 16.6) * 500; // Scaled 10x
        s.voltage = Math.min(500000, s.voltage + momentumGain);
        
        // Judge based on pitch accuracy
        const accuracy = audioRef.current?.getPitchAccuracy() || 0;
        if (accuracy > 0.7) {
          s.voltage += accuracy * 100; // Scaled 10x
          s.globalMomentum = Math.min(100, s.globalMomentum + 0.1);
          s.aura = Math.min(100, s.aura + 0.5);
        } else if (accuracy < 0.3) {
          s.voltage = Math.max(0, s.voltage - 50); // Scaled 10x
          s.globalMomentum = Math.max(0, s.globalMomentum - 0.05);
        }
      } else {
        // Decay voltage slowly if not moving (Abandoning flow)
        s.voltage = Math.max(0, s.voltage - 100 * s.maiStrictness); // Scaled 10x
        s.aura = Math.max(0, s.aura - 5 * s.maiStrictness);
      }

      // 3D Rails Logic: Map mouse/gyro to a 3D rotation
      // We'll use swordVisualPos as a tilt input
      const tiltX = s.swordVisualPos.x / 200; // -1 to 1
      const tiltY = s.swordVisualPos.y / 200; // -1 to 1
      
      // Predetermined "Rail" motion: The saber naturally wants to be in a certain guard
      // but the user's tilt pushes it.
      const railAngle = Math.sin(now / 1000) * 0.2; // Slight idle sway
      s.saberTargetRotation.y = tiltX * 0.8 + railAngle;
      s.saberTargetRotation.x = -tiltY * 0.8;
      s.saberTargetRotation.z = tiltX * 0.3;

      // Smooth interpolation for "weighty" feel
      s.saberRotation.x += (s.saberTargetRotation.x - s.saberRotation.x) * 0.15;
      s.saberRotation.y += (s.saberTargetRotation.y - s.saberRotation.y) * 0.15;
      s.saberRotation.z += (s.saberTargetRotation.z - s.saberRotation.z) * 0.15;

      // Update audio data for sync effects
      if (audioRef.current) {
        audioRef.current.getAudioData(s.audioData);
        
        // Calculate average volume for light/camera effects
        let sum = 0;
        for (let i = 0; i < s.audioData.length; i++) sum += s.audioData[i];
        const avg = sum / s.audioData.length;
        const normalizedAvg = avg / 255;
        
        s.lightIntensity = normalizedAvg;
        // Camera movement synced to bass/volume
        s.cameraOffset.x = (Math.random() - 0.5) * normalizedAvg * 30;
        s.cameraOffset.y = (Math.random() - 0.5) * normalizedAvg * 30;
      }

      // Video-Music Sync Logic
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const vid = videoRef.current;
        const currentTrackRate = audioRef.current?.trackPlaybackRate || 1.0;
        
        // Adjust video speed based on track rate and global momentum
        let momentumFactor = 0.8 + (s.globalMomentum / 100) * 0.4;
        
        if (s.isVoltaMode) {
          // Scale video speed to gyro integrity acceleration the same way the closing circle is
          // Sensitivity adjusted to not be too high
          momentumFactor = 0.8 + (s.globalMomentum / 100) * 1.2;
        }
        
        const requiredRate = currentTrackRate * momentumFactor;
        
        // Smoothly transition to the required rate
        vid.playbackRate = vid.playbackRate * 0.9 + requiredRate * 0.1;
      }

      // Calculate Beat Pulse
      const elapsed = audioRef.current?.getElapsedTime() || 0;
      const beatInterval = (audioRef.current?.detectedBeat || 500) / 1000;
      const beatProgress = (elapsed % beatInterval) / beatInterval;
      // Exponential decay for the pulse
      s.beatPulse = Math.pow(1 - beatProgress, 3);
      
      // Update ambient intensity
      audioRef.current?.setAmbientIntensity(s.globalMomentum);

      // If mouse hasn't moved for 50ms while in BATTLE phase, record 0 speed
      if (s.lastPos && now - s.lastPos.time > 50) {
        const lastSpeed = s.gyroHistory.length > 0 ? s.gyroHistory[s.gyroHistory.length - 1].speed : 0;
        const speed = lastSpeed * 0.5;
        const dy = s.swordVisualPos.y - s.lastSwordVisualPos.y;
        s.lastSwordVisualPos = { ...s.swordVisualPos };
        
        if (speed > 0.1) {
          s.gyroHistory.push({ speed, time: now, dir: 0 });
          if (s.isTouching) {
            s.clashGyroHistory.push({ speed, time: now, dir: 0 });
          }
          audioRef.current?.setSwingMotion(speed, dy, s.isVoltaMode);
        } else if (lastSpeed > 0) {
          s.gyroHistory.push({ speed: 0, time: now, dir: 0 });
          audioRef.current?.setSwingMotion(0, dy, s.isVoltaMode);
        }
      }
    }

    for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
      s.floatingTexts[i].life -= dt;
      s.floatingTexts[i].y -= (50 * dt) / 1000;
      if (s.floatingTexts[i].life <= 0) s.floatingTexts.splice(i, 1);
    }
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += (p.vx * dt) / 1000; p.y += (p.vy * dt) / 1000; p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }
    for (let i = s.slashes.length - 1; i >= 0; i--) {
      s.slashes[i].life -= dt;
      if (s.slashes[i].life <= 0) s.slashes.splice(i, 1);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Use offsetWidth/Height for more reliable sizing in some mobile browsers
    const w = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    const h = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    const s = state.current;

    // Immersive Gyro Camera: Look around based on phone tilt
    // We shift the entire scene slightly in the direction of the tilt
    const lookX = (s.swordVisualPos.x / 200) * 10; 
    const lookY = (s.swordVisualPos.y / 200) * 10;

    ctx.save();
    
    // 4D Parallax Layers
    // Layer 1: Background (Video)
    ctx.save();
    const bgParallax = 1.2;
    ctx.translate(-lookX * bgParallax, -lookY * bgParallax);
    ctx.translate(s.cameraOffset.x, s.cameraOffset.y);
    
    if (s.shakeTimer > 0) {
      const int = (s.shakeTimer / 400) * 20;
      ctx.translate((Math.random() - 0.5) * int, (Math.random() - 0.5) * int);
    }

    ctx.fillStyle = '#050505'; ctx.fillRect(-100, -100, w + 200, h + 200);
    
    // Beat Pulse Background Scaling
    const pulseScale = 1 + s.beatPulse * 0.05;
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(-w/2, -h/2);

    // Focus Aura Glow
    if (started && phase === 'BATTLE') {
      const auraAlpha = (focus / 100) * 0.3;
      const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
      gradient.addColorStop(0, `rgba(0, 255, 255, ${auraAlpha})`);
      gradient.addColorStop(1, `rgba(0, 255, 255, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    if (hasVideo && videoRef.current && videoRef.current.readyState >= 2 && !currentEnemyImg) {
      const vid = videoRef.current;
      const vidRatio = (vid.videoWidth && vid.videoHeight) ? vid.videoWidth / vid.videoHeight : 16/9;
      const screenRatio = w / h;
      let drawW = w, drawH = h;
      if (screenRatio > vidRatio) drawW = w / vidRatio; else drawW = h * vidRatio;
      
      // Scale up to cover gyro panning edges
      const scale = 1.15;
      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.scale(scale, scale);
      ctx.translate(-w/2, -h/2);
      
      ctx.globalAlpha = 1.0;
      ctx.drawImage(vid, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
      ctx.restore();
    } else if (currentEnemyImg) {
      const img = currentEnemyImg;
      const imgRatio = (img.width && img.height) ? img.width / img.height : 16/9;
      const screenRatio = w / h;
      let drawW = w, drawH = h;
      if (screenRatio > imgRatio) drawH = w / imgRatio; else drawW = h * imgRatio;
      
      const scale = 1.15;
      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.scale(scale, scale);
      ctx.translate(-w/2, -h/2);
      
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
      ctx.restore();
    } else if (bgImageRef.current) {
      const img = bgImageRef.current;
      const imgRatio = (img.width && img.height) ? img.width / img.height : 16/9;
      const screenRatio = w / h;
      let drawW = w, drawH = h;
      if (screenRatio > imgRatio) drawH = w / imgRatio; else drawW = h * imgRatio;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
    ctx.restore();

    // Layer 2: Hologram UI & Blade Placement
    ctx.save();
    const uiParallax = 0.6;
    ctx.translate(-lookX * uiParallax, -lookY * uiParallax);
    
    // Light intensity effect
    if (s.phase === 'BATTLE') {
      ctx.fillStyle = `rgba(255, 255, 255, ${(s.lightIntensity * 0.15) + (s.beatPulse * 0.1)})`;
      ctx.fillRect(-100, -100, w + 200, h + 200);
    }

    if (s.flashTimer > 0) {
      ctx.fillStyle = `rgba(6, 182, 212, ${s.flashTimer / 200})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (s.overdrive) {
      ctx.fillStyle = `rgba(0, 255, 255, ${0.05 + Math.sin(performance.now() / 100) * 0.05})`;
      ctx.fillRect(0, 0, w, h);
      
      // Overdrive vignette
      const grad = ctx.createRadialGradient(w/2, h/2, h/4, w/2, h/2, h);
      grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
      grad.addColorStop(1, `rgba(0, 200, 255, 0.3)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    if (s.bloodTimer > 0) {
      const alpha = s.bloodTimer / 1000;
      
      // Bloody vignette
      const grad = ctx.createRadialGradient(w/2, h/2, h/4, w/2, h/2, h);
      grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
      grad.addColorStop(1, `rgba(200, 0, 0, ${alpha * 0.9})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      
      // Deep red tint
      ctx.fillStyle = `rgba(150, 0, 0, ${alpha * 0.4})`;
      ctx.fillRect(0, 0, w, h);
      
      // Penalty Text
      ctx.textAlign = 'center';
      ctx.font = '900 40px Inter';
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 10;
      ctx.fillText('INTEGRITY COMPROMISED', w/2, h/2 - 50);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // Layer 3: POV Voltage Blade (Foreground)
    ctx.save();
    const bladeParallax = 1.8;
    ctx.translate(-lookX * bladeParallax, -lookY * bladeParallax);
    
    if (s.phase === 'BATTLE') {
      drawPOVBlade(ctx, w, h, s.swordVisualPos, s.overdrive);
    }
    ctx.restore();

    // Draw UI (Static Layer)
    if (s.phase === 'BATTLE') {
      // Draw Lightning
      ctx.save();
      for (const bolt of s.lightningBolts) {
        ctx.strokeStyle = bolt.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = bolt.life / 500;
        ctx.beginPath();
        ctx.moveTo(bolt.x1, bolt.y1);
        
        let cx = bolt.x1;
        let cy = bolt.y1;
        const segments = 10;
        for (let i = 1; i <= segments; i++) {
          const tx = bolt.x1 + (bolt.x2 - bolt.x1) * (i / segments);
          const ty = bolt.y1 + (bolt.y2 - bolt.y1) * (i / segments);
          cx = tx + (Math.random() - 0.5) * 50;
          cy = ty + (Math.random() - 0.5) * 50;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Visual Swing Indicator (Rhythm Circle)
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = 100;
      
      ctx.globalAlpha = 0.4;

      // Target Ring
      ctx.beginPath();
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + s.beatPulse * 0.4})`;
      ctx.lineWidth = 4 + s.beatPulse * 2;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Tap Indicators (Melody mapping)
      if (audioRef.current?.tapMoments) {
        const currentTime = audioRef.current.getElapsedTime();
        const tapMoments = audioRef.current.tapMoments;
        const windowSize = 2.0; // Show taps in a 2s window
        
        tapMoments.forEach(t => {
          const timeToTap = t - currentTime;
          if (timeToTap > 0 && timeToTap < windowSize) {
            const angle = -Math.PI / 2 + (timeToTap / windowSize) * Math.PI * 2;
            const tx = centerX + Math.cos(angle) * radius;
            const ty = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.fillStyle = `rgba(0, 255, 255, ${1 - timeToTap / windowSize})`;
            ctx.arc(tx, ty, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Closing Circle Clash Timer
      // Voltage Meter (on the circle)
      if (s.voltage > 0) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 165, 0, 0.8)`;
        ctx.lineWidth = 12;
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (s.voltage / 1000) * Math.PI * 2);
        ctx.stroke();
      }

      /*
      // Boss Health Bar (Top)
      const bossBarW = w * 0.8;
      const bossBarH = 12;
      const bossBarX = (w - bossBarW) / 2;
      const bossBarY = 40;
      
      ctx.fillStyle = 'rgba(255,0,0,0.1)'; ctx.fillRect(bossBarX, bossBarY, bossBarW, bossBarH);
      ctx.fillStyle = 'rgba(255,0,0,0.8)'; ctx.fillRect(bossBarX, bossBarY, bossBarW * (s.bossHealth / s.maxBossHealth), bossBarH);
      ctx.strokeStyle = 'rgba(255,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(bossBarX, bossBarY, bossBarW, bossBarH);
      
      ctx.textAlign = 'center'; ctx.font = 'bold 14px "Space Grotesk"'; ctx.fillStyle = 'rgba(255,0,0,0.8)';
      ctx.fillText(s.bossName, w/2, bossBarY - 10);
      
      // Player Health Bar (Bottom Left)
      const playerBarW = w * 0.4;
      const playerBarH = 8;
      const playerBarX = 20;
      const playerBarY = h - 60;
      
      ctx.fillStyle = 'rgba(0,255,255,0.1)'; ctx.fillRect(playerBarX, playerBarY, playerBarW, playerBarH);
      ctx.fillStyle = 'rgba(0,255,255,0.8)'; ctx.fillRect(playerBarX, playerBarY, playerBarW * (s.playerHealth / s.maxPlayerHealth), playerBarH);
      ctx.strokeStyle = 'rgba(0,255,255,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(playerBarX, playerBarY, playerBarW, playerBarH);
      
      ctx.textAlign = 'left'; ctx.font = 'bold 10px "Space Grotesk"'; ctx.fillStyle = 'rgba(0,255,255,0.8)';
      ctx.fillText(`INTEGRITY: ${Math.floor(s.playerHealth)}%`, playerBarX, playerBarY - 8);

      // Combo Counter (Center Left)
      if (s.combo > 0) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(0,255,255,0.8)';
        ctx.font = 'bold 24px "Space Grotesk"';
        ctx.fillText(`${s.combo}x`, 20, h/2);
        ctx.font = '10px "Space Grotesk"';
        ctx.fillText(`COMBO`, 20, h/2 + 15);
      }
      */
      
      ctx.globalAlpha = 1.0;

      // Surprise: Beat Lens Flare
      if (s.beatPulse > 0.5) {
        const flareAlpha = (s.beatPulse - 0.5) * 2;
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
        grad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha * 0.2})`);
        grad.addColorStop(0.2, `rgba(6, 182, 212, ${flareAlpha * 0.1})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Draw Particles (Rings for taps)
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.arc(p.x, p.y, p.size + (1 - p.life/p.maxLife) * 50, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    // Draw Slashes
    for (const slash of s.slashes) {
      const lifeRatio = slash.life / slash.maxLife;
      ctx.globalAlpha = Math.max(0, lifeRatio);
      ctx.save();
      ctx.translate(slash.x, slash.y);
      ctx.rotate(slash.angle);
      
      const length = 400 * (1 - lifeRatio) + 100; // Slash grows as it dies
      const width = 20 * lifeRatio * slash.size;
      
      ctx.fillStyle = slash.color;
      ctx.shadowBlur = 20;
      ctx.shadowColor = slash.color;
      
      ctx.beginPath();
      ctx.ellipse(0, 0, length / 2, width / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Core
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(0, 0, length / 2 * 0.8, width / 2 * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    ctx.globalAlpha = 1.0;

    ctx.textAlign = 'center'; ctx.font = 'bold 32px "Space Grotesk"';
    for (const ft of s.floatingTexts) {
      ctx.fillStyle = ft.color; ctx.globalAlpha = Math.max(0, ft.life / 1500);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;

    // RESULT Phase Rendering
    if (s.phase === 'RESULT') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, w, h);
      
      ctx.textAlign = 'center';
      if (s.bossHealth <= 0) {
        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 48px "Space Grotesk"';
        ctx.fillText('TARGET DESTROYED', w/2, h/2 - 40);
        ctx.font = '20px "Space Grotesk"';
        ctx.fillText(`Max Combo: ${s.maxCombo}x`, w/2, h/2 + 20);
        ctx.fillText(`Integrity Remaining: ${Math.floor(s.playerHealth)}%`, w/2, h/2 + 50);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 48px "Space Grotesk"';
        ctx.fillText('SYSTEM FAILURE', w/2, h/2 - 40);
        ctx.font = '20px "Space Grotesk"';
        ctx.fillText(`Target Health Remaining: ${Math.floor(s.bossHealth)}`, w/2, h/2 + 20);
      }
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px "Space Grotesk"';
      ctx.fillText('Restarting...', w/2, h/2 + 120);
    }

    // Draw visual indicator for vertical movement (Pitch Direction)
    if (s.phase === 'BATTLE') {
      const tiltY = s.swordVisualPos.y; // Absolute pitch bend
      const isSignificant = Math.abs(tiltY) > 5; 
      
      ctx.beginPath();
      ctx.strokeStyle = tiltY > 0 ? '#ef4444' : '#06b6d4'; // Red for down (pitch down), Cyan for up (pitch up)
      ctx.lineWidth = isSignificant ? 8 : 3;
      ctx.lineCap = 'round';
      
      const startX = w - 40;
      const startY = h / 2;
      const endY = startY + tiltY; // Scale tiltY for visibility
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, endY);
      ctx.stroke();
      
      // Draw arrowhead
      if (isSignificant) {
        ctx.beginPath();
        ctx.fillStyle = tiltY > 0 ? '#ef4444' : '#06b6d4';
        ctx.moveTo(startX, endY);
        ctx.lineTo(startX - 10, endY + (tiltY > 0 ? -10 : 10));
        ctx.lineTo(startX + 10, endY + (tiltY > 0 ? -10 : 10));
        ctx.fill();
        
        // Add text label
        ctx.textAlign = 'right';
        ctx.font = 'bold 12px "Space Grotesk"';
        ctx.fillText(tiltY > 0 ? 'PITCH DOWN' : 'PITCH UP', startX - 20, endY);
      }
    }

    ctx.restore();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!started) return;
        const now = performance.now();
        const s = state.current;

        if (s.phase === 'BATTLE') {
          // Spacebar no longer triggers clash
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, phase]);

  useEffect(() => {
    // Game loop should run as long as we are not in BOOT phase
    if (phase === 'BOOT') return;
    
    const gameLoop = (time: number) => {
      const dt = time - state.current.lastTime;
      state.current.lastTime = time;
      update(dt);
      draw();
      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [phase]);

  const drawHologramBlades = (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, pulse: number) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = 150;
    
    // As progress approaches 1, the blades converge
    const spread = (1 - progress) * 200;
    const alpha = progress > 0.7 ? 0.8 : 0.2;
    
    ctx.save();
    ctx.lineWidth = 2 + pulse * 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    
    // Left Blade (Hologram)
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(centerX - radius - spread, centerY - 100);
    ctx.lineTo(centerX - spread, centerY + 100);
    ctx.stroke();
    
    // Right Blade (Hologram)
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(centerX + radius + spread, centerY - 100);
    ctx.lineTo(centerX + spread, centerY + 100);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawPOVBlade = (ctx: CanvasRenderingContext2D, w: number, h: number, visualPos: {x: number, y: number}, overdrive: boolean) => {
    // Blade is held in right hand, bottom right corner
    // If looking down (visualPos.y > 0), it becomes more visible
    const baseAlpha = 0.3 + (visualPos.y / 200) * 0.4;
    const intensity = 0.5 + (overdrive ? 0.5 : 0);
    
    ctx.save();
    ctx.translate(w * 0.8, h * 0.9);
    ctx.rotate(-Math.PI / 6);
    
    // Blade core
    const grad = ctx.createLinearGradient(0, 0, 0, -h * 0.6);
    grad.addColorStop(0, `rgba(0, 255, 255, ${baseAlpha * intensity})`);
    grad.addColorStop(1, `rgba(0, 255, 255, 0)`);
    
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10 + intensity * 20;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 30 * intensity;
    ctx.shadowColor = 'cyan';
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -h * 0.6);
    ctx.stroke();
    
    // Electrical arcs around the blade
    if (intensity > 0.3) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        let cy = -Math.random() * h * 0.5;
        let cx = (Math.random() - 0.5) * 30;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (Math.random() - 0.5) * 20, cy - 20);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  };

  if (permissionGranted === null) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">VoltDuel</h1>
        <p className="text-zinc-400 text-center mb-8 max-w-md">
          Mobile: Swing your device to strike.<br/>
          Desktop: Hold left-click, swing your mouse, release to strike!
        </p>
        <button onClick={requestPermissions} className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg">Grant Permissions</button>
      </div>
    );
  }

  const resetPitch = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.setTrackPitch(50, 0); // Reset to normal
      audioRef.current.pitchShift = 1.0;
      state.current.perfectStreak = 0; // Reset streak so it doesn't immediately jump back up
      state.current.combo = 0;
      state.current.globalMomentum = 50;
    }
  };

  const resetTrack = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.resetTrack();
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 8.0;
    }
  };

  const newTrack = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    
    await audioRef.current.init(currentTrack.url);
    state.current.battleStartTime = performance.now();
    state.current.combo = 0;
    state.current.perfectStreak = 0;
    state.current.clashIndex = 0;
    
    if (videoRef.current) {
      videoRef.current.currentTime = 8.0; // First clash at 8s
      videoRef.current.play().catch(e => console.warn("Video play failed on new track:", e));
    }
  };

  const toggleVolta = () => {
    const newValue = !isVoltaMode;
    setIsVoltaMode(newValue);
    state.current.isVoltaMode = newValue;
  };

  const resetClashes = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    state.current.combo = 0;
    state.current.perfectStreak = 0;
    
    // Also reset current time tracking to force a re-sync
    state.current.lastCurrentTime = -10; 

    state.current.floatingTexts.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      text: "CLASHES RESET",
      life: 1000,
      color: "#ff00ff"
    });
  };

  const handleJoinDuel = (id: string, track?: string) => {
    setDuelId(id);
    socketRef.current?.emit('join-duel', id);
    if (track) {
      setIsCreator(true);
      socketRef.current?.emit('select-track', { duelId: id, trackUrl: track });
    }
    updatePhase('WAITING');
  };

  return (
    <div 
      className={`fixed inset-0 bg-black flex justify-center items-center touch-none select-none overflow-hidden ${phase === 'BATTLE' ? 'cursor-none' : 'cursor-default'}`}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
    >
      {phase === 'BOOT' && <GhostTerminal onComplete={() => updatePhase('MENU')} />}
      
      <div 
        ref={containerRef}
        className="relative w-full h-full sm:w-[390px] sm:h-[844px] bg-[#050505] sm:border border-gray-900 sm:rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)]"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}
      >
        <AnimatePresence>
          {phase === 'MENU' && !isMultiplayer && (
            <MainMenu
              onStart={startGame}
              onToggleMultiplayer={() => setIsMultiplayer(!isMultiplayer)}
              isMultiplayer={isMultiplayer}
              fileName={fileName}
              saberFileName={saberFileName}
              onFileChange={handleFileChange}
              onSaberChange={handleSaberChange}
              onBgFileChange={handleBgFileChange}
              mode={isVoltaMode ? 'VOLTA' : 'NEO'}
              onToggleMode={() => setIsVoltaMode(!isVoltaMode)}
              tracks={musicTracks}
              currentTrack={currentTrack}
              onSelectTrack={setCurrentTrack}
              enemies={ENEMY_ROSTER}
              currentEnemy={currentEnemy}
              onSelectEnemy={handleSelectEnemy}
              controlMode={controlMode}
              onToggleControlMode={() => setControlMode(controlMode === 'MOBILE' ? 'DESKTOP' : 'MOBILE')}
              mobileClashOnRelease={mobileClashOnRelease}
              onToggleMobileClashMode={() => setMobileClashOnRelease(!mobileClashOnRelease)}
              onShuffleTrack={shuffleTrack}
              onShuffleEnemy={shuffleEnemy}
              difficulty={difficulty}
              onDifficultyChange={handleDifficultyChange}
              swipeMode={swipeMode}
              onToggleSwipeMode={() => setSwipeMode(!swipeMode)}
            />
          )}
          {phase === 'MENU' && isMultiplayer && (
            <DuelLobby
              onJoin={handleJoinDuel}
              onCancel={() => setIsMultiplayer(false)}
              isCreator={isCreator}
              tracks={musicTracks}
            />
          )}
          {phase === 'WAITING' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/90 p-6">
              <h2 className="text-2xl font-bold text-purple-400 mb-6 tracking-widest">WAITING FOR OPPONENT...</h2>
              {isCreator && (
                <button 
                  onClick={() => socketRef.current?.emit('start-duel', duelId)}
                  className="py-3 px-6 bg-purple-900/40 border border-purple-500 text-purple-200 font-bold hover:bg-purple-800"
                >
                  START DUEL
                </button>
              )}
            </div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} className="block w-full h-full" />
        
        <AnimatePresence>
          {phase === 'BATTLE' && (
            <GameHUD
              bossHealth={state.current.bossHealth}
              playerHealth={state.current.playerHealth}
              maxBossHealth={state.current.maxBossHealth}
              maxPlayerHealth={100}
              bossName={state.current.bossName}
              opponentHealth={opponentHealth}
              opponentCombo={opponentCombo}
              isMultiplayer={isMultiplayer}
              combo={state.current.combo}
              focus={focus}
              isMappingMode={isMappingMode}
              beatTimings={beatTimings}
              onResetPitch={resetPitch}
              onResetTrack={resetTrack}
              onNewTrack={newTrack}
              isVoltaMode={isVoltaMode}
              voltage={state.current.voltage}
              aura={state.current.aura}
              onToggleVolta={toggleVolta}
              onToggleMapping={() => setIsMappingMode(!isMappingMode)}
              onClearTimings={() => setBeatTimings([])}
              maiStrictness={maiStrictnessState}
              onMaiStrictnessChange={setMaiStrictness}
              maiContextWindow={maiContextWindow}
              onMaiContextWindowChange={handleMaiContextWindowChange}
              gyroSensX={gyroSensX}
              onGyroSensXChange={handleGyroSensX}
              gyroSensY={gyroSensY}
              onGyroSensYChange={handleGyroSensY}
              gyroSensZ={gyroSensZ}
              onGyroSensZChange={handleGyroSensZ}
              pitchScale={pitchScale}
              onPitchScaleChange={handlePitchScale}
              minPitch={minPitch}
              onMinPitchChange={handleMinPitch}
              maxPitch={maxPitch}
              onMaxPitchChange={handleMaxPitch}
              manualPitch={manualPitch}
              onManualPitchChange={handleManualPitch}
              proxRewardPower={proxRewardPower}
              onProxRewardPowerChange={setProxRewardPower}
              proxBonusWeight={proxBonusWeight}
              onProxBonusWeightChange={setProxBonusWeight}
              tracks={musicTracks}
              currentTrack={currentTrack}
              onSelectTrack={(track) => {
                setCurrentTrack(track);
                if (audioRef.current) audioRef.current.init(track.url);
              }}
              enemies={ENEMY_ROSTER}
              currentEnemy={currentEnemy}
              onSelectEnemy={handleSelectEnemy}
              controlMode={controlMode}
              onToggleControlMode={() => setControlMode(controlMode === 'MOBILE' ? 'DESKTOP' : 'MOBILE')}
              mobileClashOnRelease={mobileClashOnRelease}
              onToggleMobileClashMode={() => setMobileClashOnRelease(!mobileClashOnRelease)}
              minGyroThreshold={minGyroThreshold}
              onMinGyroThresholdChange={setMinGyroThreshold}
              onShuffleTrack={shuffleTrack}
              onShuffleEnemy={shuffleEnemy}
              onBgFileChange={handleBgFileChange}
              difficulty={difficulty}
              onDifficultyChange={handleDifficultyChange}
              clashVolumeMultiplier={clashVolume}
              onClashVolumeMultiplierChange={handleClashVolumeChange}
              voltagePotential={voltagePotential}
              swipeMode={swipeMode}
              onToggleSwipeMode={() => setSwipeMode(!swipeMode)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === 'RESULT' && (
            <ResultScreen
              maxCombo={state.current.maxCombo}
              playerHealth={state.current.playerHealth}
              bossHealth={state.current.bossHealth}
              onRestart={() => updatePhase('MENU')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
