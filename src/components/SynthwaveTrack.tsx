'use client';

import React, { useState, useEffect, useRef } from 'react';

// 型エラーを解消するためdynamicインポートを使用せず、直接クライアントサイドでimportする
// Tone.jsはReactコンポーネントではないためdynamicでロードできません

const SynthwaveTrack = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [bpm, setBpm] = useState(110);
  const [bassVolume, setBassVolume] = useState(-10);
  const [leadVolume, setLeadVolume] = useState(-15);
  const [padVolume, setPadVolume] = useState(-18);
  const [drumVolume, setDrumVolume] = useState(-8);
  const [arpeggioVolume, setArpeggioVolume] = useState(-20);
  
  // トラック状態の型を定義
  type TrackStates = {
    bass: boolean[];
    pad: boolean[];
    arp: boolean[];
    lead: boolean[];
    kick: boolean[];
    snare: boolean[];
    hat: boolean[];
  };
  
  // トラックのオン/オフ状態を管理
  const [trackStates, setTrackStates] = useState<TrackStates>({
    bass: Array(8).fill(true),
    pad: Array(8).fill(true),
    arp: [false, false, true, true, true, true, true, true], // 3小節目から開始
    lead: [false, false, false, false, true, true, true, true], // 5小節目から開始
    kick: Array(8).fill(true),
    snare: Array(8).fill(true),
    hat: Array(8).fill(true)
  });
  
  // 現在の小節を表示するための状態
  const [currentBar, setCurrentBar] = useState(0);
  
  // Tone.jsのインスタンスを保持
  const ToneRef = useRef<any>(null);
  
  // トラック状態の参照を作成（ループ内で最新の状態にアクセスするため）
  const trackStatesRef = useRef<TrackStates>(trackStates);
  
  // トラック状態が更新されたら参照も更新
  useEffect(() => {
    trackStatesRef.current = trackStates;
  }, [trackStates]);
  
  // Synth references
  const [synths, setSynths] = useState<any>({
    bassSynth: null,
    leadSynth: null,
    padSynth: null,
    arpSynth: null,
    kickSample: null,
    snareSample: null,
    hihatSample: null
  });
  
  // ループの参照を管理
  const [loops, setLoops] = useState<any>({
    bassLoop: null,
    padLoop: null,
    arpLoop: null,
    leadLoop: null,
    kickLoop: null,
    snareLoop: null,
    hihatLoop: null
  });
  
  // Tone.jsモジュールをインポート
  useEffect(() => {
    const loadTone = async () => {
      try {
        const Tone = await import('tone');
        ToneRef.current = Tone;
      } catch (error) {
        console.error('Failed to load Tone.js:', error);
      }
    };
    
    loadTone();
  }, []);
  
  // 現在の小節を追跡
  useEffect(() => {
    if (isPlaying && ToneRef.current) {
      const barTracker = setInterval(() => {
        const currentBeatPosition = ToneRef.current.Transport.position;
        const bar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
        setCurrentBar(bar);
      }, 100); // 100ミリ秒ごとに更新
      
      return () => clearInterval(barTracker);
    }
  }, [isPlaying]);
  
  // Initialize Tone.js
  const initializeAudio = async () => {
    if (!ToneRef.current) return;
    
    const Tone = ToneRef.current;
    await Tone.start();
    
    // Create synths
    const bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.4,
        release: 0.8
      },
      filterEnvelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8,
        baseFrequency: 200,
        octaves: 2
      }
    }).toDestination();
    bassSynth.volume.value = bassVolume;
    
    const leadSynth = new Tone.PolySynth({
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.6,
        release: 1
      }
    }).toDestination();
    leadSynth.volume.value = leadVolume;
    
    const padSynth = new Tone.PolySynth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.8,
        decay: 1,
        sustain: 0.8,
        release: 3
      }
    }).toDestination();
    padSynth.volume.value = padVolume;
    
    const arpSynth = new Tone.PolySynth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.4
      }
    }).toDestination();
    arpSynth.volume.value = arpeggioVolume;
    
    // Drums - using built-in Tone.js drum samples
    const kickSample = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential'
      }
    }).toDestination();
    kickSample.volume.value = drumVolume;
    
    const snareSample = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0
      }
    }).toDestination();
    snareSample.volume.value = drumVolume - 2;
    
    const hihatSample = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.01
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination();
    hihatSample.volume.value = drumVolume - 5;
    
    setSynths({
      bassSynth,
      leadSynth,
      padSynth,
      arpSynth,
      kickSample,
      snareSample,
      hihatSample
    });
    
    // Set BPM
    Tone.Transport.bpm.value = bpm;
    
    // Patterns
    const bassPattern = ["F1", "F1", "F1", "F1", "Ab1", "Ab1", "Ab1", "Ab1", "C2", "C2", "Bb1", "Bb1"];
    let bassIndex = 0;
    
    const chordProgression = [
      ["F3", "Ab3", "C4"], // F minor
      ["F3", "Ab3", "C4"], // F minor
      ["Ab3", "C4", "Eb4"], // Ab major
      ["Bb3", "D4", "F4"]  // Bb major
    ];
    let chordIndex = 0;
    
    const arpNotes = ["F4", "Ab4", "C5", "F5", "C5", "Ab4"];
    let arpIndex = 0;
    
    const leadMelody = [
      { note: "C5", duration: "8n" },
      { note: "F5", duration: "8n" },
      { note: "Ab5", duration: "8n" },
      { note: "G5", duration: "8n" },
      { note: "F5", duration: "4n" },
      { note: "Eb5", duration: "8n" },
      { note: "D5", duration: "8n" },
      { note: "C5", duration: "4n" }
    ];
    let leadIndex = 0;
    
    // Bass loop
    const bassLoop = new Tone.Loop((time: any) => {
      // 現在の小節を取得 (0-7)
      const currentBeatPosition = Tone.Transport.position;
      const currentBar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
      
      // useRefを使用して最新のトラック状態を取得
      if (trackStatesRef.current.bass[currentBar]) {
        bassSynth.triggerAttackRelease(bassPattern[bassIndex], "16n", time);
      }
      bassIndex = (bassIndex + 1) % bassPattern.length;
    }, "8n").start(0);
    
    // Pad loop
    const padLoop = new Tone.Loop((time: any) => {
      const currentBeatPosition = Tone.Transport.position;
      const currentBar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
      
      if (trackStatesRef.current.pad[currentBar]) {
        padSynth.triggerAttackRelease(chordProgression[chordIndex], "2n", time);
      }
      chordIndex = (chordIndex + 1) % chordProgression.length;
    }, "1m").start(0);
    
    // Arpeggio loop
    const arpLoop = new Tone.Loop((time: any) => {
      const currentBeatPosition = Tone.Transport.position;
      const currentBar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
      
      if (trackStatesRef.current.arp[currentBar]) {
        arpSynth.triggerAttackRelease(arpNotes[arpIndex], "16n", time);
      }
      arpIndex = (arpIndex + 1) % arpNotes.length;
    }, "16n").start(0);
    
    // Lead loop
    const leadLoop = new Tone.Loop((time: any) => {
      const currentBeatPosition = Tone.Transport.position;
      const currentBar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
      
      if (trackStatesRef.current.lead[currentBar]) {
        const note = leadMelody[leadIndex];
        leadSynth.triggerAttackRelease(note.note, note.duration, time);
      }
      leadIndex = (leadIndex + 1) % leadMelody.length;
    }, "8n").start(0);
    
    // Drum loops
    const kickLoop = new Tone.Loop((time: any) => {
      const currentBeatPosition = Tone.Transport.position;
      const currentBar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
      
      if (trackStatesRef.current.kick[currentBar]) {
        kickSample.triggerAttackRelease("C1", "8n", time);
      }
    }, "2n").start(0);
    
    const snareLoop = new Tone.Loop((time: any) => {
      const currentBeatPosition = Tone.Transport.position;
      const currentBar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
      
      if (trackStatesRef.current.snare[currentBar]) {
        snareSample.triggerAttackRelease("16n", time);
      }
    }, "4n").start("4n");
    
    const hihatLoop = new Tone.Loop((time: any) => {
      const currentBeatPosition = Tone.Transport.position;
      const currentBar = parseInt(currentBeatPosition.toString().split(':')[0]) % 8;
      
      if (trackStatesRef.current.hat[currentBar]) {
        hihatSample.triggerAttackRelease("32n", time);
      }
    }, "8n").start(0);
    
    // ループの参照を保存
    setLoops({
      bassLoop,
      padLoop,
      arpLoop,
      leadLoop,
      kickLoop,
      snareLoop,
      hihatLoop
    });
    
    setInitialized(true);
  };
  
  // 再生を開始する前に、Transportをリセット
  const togglePlay = async () => {
    if (!ToneRef.current) return;
    
    if (!initialized) {
      await initializeAudio();
    }
    
    if (isPlaying) {
      ToneRef.current.Transport.stop();
      setCurrentBar(0);
    } else {
      // 初期位置にリセット
      ToneRef.current.Transport.position = "0:0:0";
      ToneRef.current.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };
  
  // トラックのオン/オフを切り替える関数
  const toggleTrackStep = (trackName: keyof TrackStates, stepIndex: number) => {
    setTrackStates(prev => {
      const newStates = {...prev};
      newStates[trackName] = [...prev[trackName]];
      newStates[trackName][stepIndex] = !newStates[trackName][stepIndex];
      return newStates;
    });
  };
  
  // Update volumes when sliders change
  useEffect(() => {
    if (initialized && synths.bassSynth) {
      synths.bassSynth.volume.value = bassVolume;
      synths.leadSynth.volume.value = leadVolume;
      synths.padSynth.volume.value = padVolume;
      synths.kickSample.volume.value = drumVolume;
      synths.snareSample.volume.value = drumVolume - 2;
      synths.hihatSample.volume.value = drumVolume - 5;
      synths.arpSynth.volume.value = arpeggioVolume;
    }
  }, [bassVolume, leadVolume, padVolume, drumVolume, arpeggioVolume, initialized, synths]);
  
  // Update BPM when slider changes
  useEffect(() => {
    if (initialized && ToneRef.current) {
      ToneRef.current.Transport.bpm.value = bpm;
    }
  }, [bpm, initialized]);
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (initialized && ToneRef.current) {
        ToneRef.current.Transport.stop();
        ToneRef.current.Transport.cancel();
      }
    };
  }, [initialized]);
  
  // Neon colors and gradients for synthwave style
  const gradientBg = "bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900";
  const gridBg = "relative overflow-hidden";
  
  return (
    <div className={`${gradientBg} p-6 rounded-lg text-white shadow-2xl w-full max-w-4xl mx-auto`}>
      <div className={gridBg}>
        {/* Grid lines for retro aesthetic */}
        <div className="absolute inset-0 z-0 grid grid-cols-12 grid-rows-12 gap-4 opacity-20">
          {Array(144).fill(0).map((_, i) => (
            <div key={i} className="border border-blue-500"></div>
          ))}
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-pink-500 tracking-wider">LUSH SYNTHEWAVE</h1>
            <div className="text-xl text-cyan-400">{bpm} BPM</div>
          </div>
          
          <div className="flex flex-col space-y-4 mb-8">
            <div className="flex justify-center items-center space-x-4">
              <button 
                onClick={togglePlay}
                className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-md font-bold tracking-wider transition"
              >
                {isPlaying ? "STOP" : "PLAY"}
              </button>
              
              {isPlaying && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-white">RECORDING</span>
                </div>
              )}
            </div>
              
            <div className="flex-1">
              <label className="block text-sm text-cyan-400 mb-1">TEMPO</label>
              <input 
                type="range" 
                min="80" 
                max="140" 
                value={bpm} 
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-md appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-900 bg-opacity-70 p-4 rounded-md">
              <h2 className="text-xl font-bold text-purple-400 mb-4">SYNTHS</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-cyan-400 mb-1">BASS</label>
                <input 
                  type="range" 
                  min="-40" 
                  max="0" 
                  value={bassVolume} 
                  onChange={(e) => setBassVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-md appearance-none cursor-pointer"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-cyan-400 mb-1">LEAD</label>
                <input 
                  type="range" 
                  min="-40" 
                  max="0" 
                  value={leadVolume} 
                  onChange={(e) => setLeadVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-md appearance-none cursor-pointer"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-cyan-400 mb-1">PAD</label>
                <input 
                  type="range" 
                  min="-40" 
                  max="0" 
                  value={padVolume} 
                  onChange={(e) => setPadVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-md appearance-none cursor-pointer"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-cyan-400 mb-1">ARPEGGIATOR</label>
                <input 
                  type="range" 
                  min="-40" 
                  max="0" 
                  value={arpeggioVolume} 
                  onChange={(e) => setArpeggioVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-md appearance-none cursor-pointer"
                />
              </div>
            </div>
            
            <div className="bg-gray-900 bg-opacity-70 p-4 rounded-md">
              <h2 className="text-xl font-bold text-purple-400 mb-4">DRUMS</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-cyan-400 mb-1">DRUM KIT</label>
                <input 
                  type="range" 
                  min="-40" 
                  max="0" 
                  value={drumVolume} 
                  onChange={(e) => setDrumVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-md appearance-none cursor-pointer"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-6">
                {["KICK", "SNARE", "HIHAT", "CRASH"].map((drum, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${i === 0 ? 'bg-red-600' : i === 1 ? 'bg-blue-600' : i === 2 ? 'bg-green-600' : 'bg-purple-600'}`}>
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                      </div>
                    </div>
                    <span className="text-xs">{drum}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 bg-opacity-70 p-4 rounded-md mb-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4">ARRANGEMENT <span className="text-sm font-normal text-cyan-400">(Click to toggle steps)</span></h2>
            
            {[
              {name: "BASS", key: "bass" as keyof TrackStates, color: "red"},
              {name: "PAD", key: "pad" as keyof TrackStates, color: "purple"},
              {name: "ARP", key: "arp" as keyof TrackStates, color: "pink"},
              {name: "LEAD", key: "lead" as keyof TrackStates, color: "yellow"},
              {name: "KICK", key: "kick" as keyof TrackStates, color: "blue"},
              {name: "SNARE", key: "snare" as keyof TrackStates, color: "green"},
              {name: "HAT", key: "hat" as keyof TrackStates, color: "cyan"}
            ].map((track, trackIndex) => (
              <div key={trackIndex} className="flex items-center mb-2">
                <div className="w-16 text-sm pr-2">{track.name}</div>
                <div className="flex-1">
                  {trackIndex === 0 && (
                    <div className="grid grid-cols-8 gap-1 mb-1">
                      {Array(8).fill(0).map((_, i) => (
                        <div key={i} className={`text-center text-xs ${isPlaying && currentBar === i ? 'text-white bg-indigo-700 rounded-t-sm font-bold' : 'text-cyan-400'}`}>
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-8 gap-1 h-8">
                    {Array(8).fill(0).map((_, i) => {
                      const active = trackStates[track.key][i];
                      let bgColorClass = '';
                      
                      if (active) {
                        switch(track.color) {
                          case 'red': bgColorClass = 'bg-red-600 hover:bg-red-500'; break;
                          case 'purple': bgColorClass = 'bg-purple-600 hover:bg-purple-500'; break;
                          case 'pink': bgColorClass = 'bg-pink-600 hover:bg-pink-500'; break;
                          case 'yellow': bgColorClass = 'bg-yellow-600 hover:bg-yellow-500'; break;
                          case 'blue': bgColorClass = 'bg-blue-600 hover:bg-blue-500'; break;
                          case 'green': bgColorClass = 'bg-green-600 hover:bg-green-500'; break;
                          case 'cyan': bgColorClass = 'bg-cyan-600 hover:bg-cyan-500'; break;
                          default: bgColorClass = 'bg-gray-600 hover:bg-gray-500';
                        }
                      } else {
                        bgColorClass = 'bg-gray-700 hover:bg-gray-600';
                      }
                      
                      return (
                        <button 
                          key={i}
                          onClick={() => toggleTrackStep(track.key, i)}
                          className={`h-full rounded-sm transition-colors ${bgColorClass} cursor-pointer focus:ring-2 focus:ring-white focus:ring-opacity-50 ${isPlaying && currentBar === i ? 'ring-2 ring-white' : ''}`}
                          aria-label={`Toggle ${track.name} at step ${i+1}`}
                        ></button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center text-sm text-cyan-300 animate-pulse mb-4">
            {isPlaying 
              ? `Experience the 80s synthwave vibes... ⚡ (Current measure: ${currentBar + 1})` 
              : "Click PLAY to start the 80s synthwave experience"}
          </div>
          
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`w-2 h-8 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                  style={{
                    backgroundColor: isPlaying 
                      ? ['#ff00ff', '#00ffff', '#ff2a6d', '#05d9e8', '#01012b'][i-1]
                      : '#333',
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <div className="bg-gray-900 bg-opacity-70 p-4 rounded-md text-center">
              <h3 className="text-lg font-bold text-pink-400 mb-2">QUICK PATTERNS</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <button 
                  onClick={() => setTrackStates({
                    bass: Array(8).fill(true),
                    pad: Array(8).fill(true),
                    arp: [false, false, true, true, true, true, true, true],
                    lead: [false, false, false, false, true, true, true, true],
                    kick: Array(8).fill(true),
                    snare: Array(8).fill(true),
                    hat: Array(8).fill(true)
                  })}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded"
                >
                  Default
                </button>
                <button 
                  onClick={() => setTrackStates({
                    bass: Array(8).fill(true),
                    pad: Array(8).fill(true),
                    arp: Array(8).fill(true),
                    lead: Array(8).fill(true),
                    kick: Array(8).fill(true),
                    snare: Array(8).fill(true),
                    hat: Array(8).fill(true)
                  })}
                  className="px-3 py-1 bg-pink-600 hover:bg-pink-500 text-white text-sm rounded"
                >
                  All On
                </button>
                <button 
                  onClick={() => setTrackStates({
                    bass: [true, true, true, true, false, false, false, false],
                    pad: [true, true, true, true, false, false, false, false],
                    arp: [false, false, true, true, false, false, false, false],
                    lead: [false, false, false, false, true, true, true, true],
                    kick: [true, true, false, false, true, true, false, false],
                    snare: [false, true, false, true, false, true, false, true],
                    hat: [true, false, true, false, true, false, true, false]
                  })}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
                >
                  Alt Pattern
                </button>
                <button 
                  onClick={() => setTrackStates({
                    bass: [true, true, false, false, true, true, false, false],
                    pad: [true, false, true, false, true, false, true, false],
                    arp: [false, true, false, true, false, true, false, true],
                    lead: [true, false, false, true, true, false, false, true],
                    kick: [true, false, true, false, true, false, true, false],
                    snare: [false, true, false, true, false, true, false, true],
                    hat: [true, true, true, true, false, false, false, false]
                  })}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded"
                >
                  Rhythmic
                </button>
                <button 
                  onClick={() => setTrackStates({
                    bass: [true, false, false, false, true, false, false, false],
                    pad: [true, false, false, false, true, false, false, false],
                    arp: [false, false, true, false, false, false, true, false],
                    lead: [false, false, false, false, true, false, false, false],
                    kick: [true, false, false, false, true, false, false, false],
                    snare: [false, false, true, false, false, false, true, false],
                    hat: [false, true, false, true, false, true, false, true]
                  })}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded"
                >
                  Minimal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynthwaveTrack; 