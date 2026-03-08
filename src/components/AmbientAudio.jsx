import { useState, useRef, useEffect } from "react";

const TRACKS = [
  { id: "void", name: "Entering the Void", src: "/audio/tracks/2. Entering the Void (Loop).ogg" },
  { id: "station", name: "Awakening Station", src: "/audio/tracks/11. Awakening Station (Loop).ogg" },
  { id: "echoes", name: "Echoes from the Station", src: "/audio/tracks/13. Echoes from the Station (Loop).ogg" },
  { id: "spacetime", name: "Fractured Space-Time", src: "/audio/tracks/16. Fractured Space-Time (Loop).ogg" },
  { id: "wormhole", name: "Through the Wormhole", src: "/audio/tracks/18. Through the Wormhole (Loop).ogg" },
  { id: "unknown", name: "Scanning the Unknown", src: "/audio/tracks/20. Scanning the Unknown (Loop).ogg" },
  // Fallbacks to built-in ambients
  { id: "outpost", name: "Abandoned Outpost", src: "/audio/ambient-outpost.ogg" },
];

export default function AmbientAudio() {
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.25);
  const [showPanel, setShowPanel] = useState(false);
  const audioRef = useRef(null);

  const track = TRACKS[trackIdx];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && playing) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [trackIdx]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const nextTrack = () => {
    setTrackIdx((i) => (i + 1) % TRACKS.length);
  };

  return (
    <div className="fixed bottom-4 left-4 z-30">
      <audio
        ref={audioRef}
        src={track.src}
        loop
        preload="none"
      />

      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: playing ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${playing ? "rgba(255,107,53,0.3)" : "rgba(255,255,255,0.1)"}`,
          color: playing ? "#ff6b35" : "#6b7280",
        }}
        title="Musique ambiante"
      >
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
          {playing ? (
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          )}
        </svg>
      </button>

      {showPanel && (
        <div className="absolute bottom-12 left-0 rounded-xl border border-white/10 bg-[#0c1020]/95 backdrop-blur-sm p-3 w-56 animate-fade-in">
          <p className="text-[9px] text-gray-500 font-mono uppercase tracking-wider mb-2">Ambiance</p>

          <div className="flex items-center gap-2 mb-3">
            <button onClick={toggle} className="w-7 h-7 rounded-lg bg-synth-primary/15 border border-synth-primary/30 text-synth-primary flex items-center justify-center text-xs">
              {playing ? "⏸" : "▶"}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-300 truncate font-mono">{track.name}</p>
              <p className="text-[8px] text-gray-600 font-mono">Sci-Fi Ambient Loop</p>
            </div>
            <button onClick={nextTrack} className="text-[10px] text-gray-500 hover:text-gray-300 font-mono">
              ⏭
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-600 font-mono">VOL</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-[#ff6b35] h-1"
            />
            <span className="text-[9px] text-gray-500 font-mono w-6 text-right">{Math.round(volume * 100)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
