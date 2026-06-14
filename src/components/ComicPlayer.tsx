import { useState, useEffect, useRef, useCallback } from 'react';
import type { EnrichedPanel } from '@/types';
import { X, ChevronRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface Props {
  panels: EnrichedPanel[];
  onClose: () => void;
}

export default function ComicPlayer({ panels, onClose }: Props) {
  const [idx, setIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showTopbar, setShowTopbar] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [showSceneDesc, setShowSceneDesc] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const topbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneDescTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idxRef = useRef(0);
  const typingRef = useRef(false);
  const fullTextRef = useRef('');

  idxRef.current = idx;
  typingRef.current = typing;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const playAudioForPanel = useCallback((panel: EnrichedPanel) => {
    stopAudio();
    const text = panel.narration_text || panel.dialogue.text || '';
    if (panel.audioDataUri && panel.audioDataUri !== '__BROWSER_TTS__') {
      const audio = new Audio(panel.audioDataUri);
      audioRef.current = audio;
      audio.volume = muted ? 0 : 1;
      // 音频加载/播放失败时回退到浏览器 TTS
      audio.onerror = () => {
        console.warn('音频加载失败，回退到浏览器 TTS');
        if (text && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'zh-CN';
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      };
      audio.play().catch(() => {
        // 播放被阻止或其他错误，回退到浏览器 TTS
        if (text && window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'zh-CN';
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      });
    } else if (text && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  }, [muted, stopAudio]);

  // Typewriter effect
  const startTyping = useCallback((text: string) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    fullTextRef.current = text;
    setTypedText('');
    setTyping(true);
    setShowHint(false);

    let ci = 0;
    typingTimerRef.current = setInterval(() => {
      if (ci < text.length) {
        setTypedText(text.slice(0, ci + 1));
        ci++;
      } else {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        setTyping(false);
        setShowHint(true);
      }
    }, 35);
  }, []);

  const skipTyping = useCallback(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    typingTimerRef.current = null;
    setTypedText(fullTextRef.current);
    setTyping(false);
    setShowHint(true);
  }, []);

  const showTopbarTemp = useCallback(() => {
    setShowTopbar(true);
    if (topbarTimerRef.current) clearTimeout(topbarTimerRef.current);
    topbarTimerRef.current = setTimeout(() => setShowTopbar(false), 2500);
  }, []);

  const showPanel = useCallback((i: number, skipTransition = false) => {
    if (i < 0 || i >= panels.length) return;
    if (transitioning && !skipTransition) return;

    const panel = panels[i];
    setIdx(i);
    setShowDialog(true);
    setShowEnding(false);

    // Scene description
    if (panel.scene_desc) {
      setShowSceneDesc(true);
      if (sceneDescTimerRef.current) clearTimeout(sceneDescTimerRef.current);
      sceneDescTimerRef.current = setTimeout(() => setShowSceneDesc(false), 3000);
    } else {
      setShowSceneDesc(false);
    }

    // Image transition
    if (!skipTransition) {
      setTransitioning(true);
      setImgLoaded(false);
      // 不在这里设置 imgLoaded=true，等 img onLoad 回调触发
    } else {
      setImgLoaded(false);
      // 首次加载也等 onLoad
    }

    // Typewriter text
    const text = panel.narration_text || panel.dialogue.text || '';
    startTyping(text);

    // Audio
    playAudioForPanel(panel);
  }, [panels, transitioning, startTyping, playAudioForPanel]);

  // Advance: skip typing or go next
  const advance = useCallback(() => {
    if (showEnding || showMenu) return;

    if (typingRef.current) {
      skipTyping();
      return;
    }

    const next = idxRef.current + 1;
    if (next < panels.length) {
      showPanel(next);
    } else {
      stopAudio();
      setShowDialog(false);
      setShowHint(false);
      setShowEnding(true);
    }
  }, [panels.length, showPanel, skipTyping, stopAudio, showEnding, showMenu]);

  const goBack = useCallback(() => {
    if (showEnding || showMenu) return;
    if (idxRef.current > 0) {
      showPanel(idxRef.current - 1);
    }
  }, [showPanel, showEnding, showMenu]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showMenu) {
        if (e.code === 'Escape') setShowMenu(false);
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        advance();
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
      if (e.code === 'Escape') setShowMenu(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [advance, goBack, showMenu]);

  // Touch swipe
  useEffect(() => {
    let sx = 0, sy = 0;
    const onTouchStart = (e: TouchEvent) => {
      sx = e.changedTouches[0].screenX;
      sy = e.changedTouches[0].screenY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const ex = e.changedTouches[0].screenX;
      const ey = e.changedTouches[0].screenY;
      const dx = ex - sx, dy = ey - sy;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx < -50) advance();
        else if (dx > 50) goBack();
      }
    };
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [advance, goBack]);

  // Mouse move → show topbar
  useEffect(() => {
    const onMove = () => showTopbarTemp();
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [showTopbarTemp]);

  // Mute/unmute
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : 1;
  }, [muted]);

  // Cleanup
  useEffect(() => {
    return () => { stopAudio(); };
  }, [stopAudio]);

  // Init first panel
  useEffect(() => {
    showPanel(0, true);
    showTopbarTemp();
  }, []);

  const current = panels[idx];
  const hasSpeaker = current.dialogue.speaker && current.dialogue.speaker.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none" style={{ cursor: 'pointer' }}>
      {/* Scene area - click to advance */}
      <div
        className="flex-1 relative overflow-hidden bg-[#0B0F19]"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          advance();
        }}
        onContextMenu={(e) => { e.preventDefault(); goBack(); }}
      >
        {/* Background image */}
        <img
          src={current.imageDataUri}
          alt=""
          onLoad={() => {
            setImgLoaded(true);
            if (transitioning) {
              setTimeout(() => setTransitioning(false), 500);
            }
          }}
          className={[
            'absolute inset-0 w-full h-full object-contain transition-all duration-500',
            imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]',
          ].join(' ')}
        />

        {/* Scene description overlay */}
        <div
          className={[
            'absolute top-0 left-0 right-0 px-6 py-5 bg-gradient-to-b from-black/70 to-transparent pointer-events-none transition-opacity duration-400',
            showSceneDesc ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <p className="text-sm text-gray-400 italic leading-relaxed">{current.scene_desc}</p>
        </div>

        {/* Dialog box */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none">
          <div
            className={[
              'bg-[#0B0F19]/92 backdrop-blur-xl border border-[#00F0FF]/15 rounded-xl px-5 py-4 max-w-2xl mx-auto min-h-[80px]',
              'transition-all duration-300',
              showDialog ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5',
            ].join(' ')}
          >
            {hasSpeaker && (
              <div className="text-[#00F0FF] font-bold text-sm mb-1.5 tracking-wide">
                {current.dialogue.speaker}
              </div>
            )}
            <div className="text-gray-100 text-base leading-8 font-serif">
              {typedText}
              {typing && <span className="inline-block w-0.5 h-5 bg-[#00F0FF] ml-0.5 animate-pulse" />}
            </div>
          </div>
        </div>

        {/* Click hint arrow */}
        <div
          className={[
            'absolute bottom-2 right-6 transition-opacity duration-300 pointer-events-none',
            showHint ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <ChevronRight size={14} className="text-white/40 animate-pulse" />
        </div>

        {/* Page dots */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none opacity-50">
          {panels.map((_, i) => (
            <div
              key={i}
              className={[
                'h-1 rounded-full transition-all duration-300',
                i === idx ? 'w-4 bg-[#00F0FF]' : 'w-1 bg-white/30',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Top bar (auto-hide) */}
      <div
        className={[
          'absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 z-10',
          'bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300',
          showTopbar ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <span className="text-[13px] text-gray-200 font-semibold truncate max-w-[60%]">
          {panels[0]?.scene_desc?.split('，')[0] || '故事阅读'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">{idx + 1} / {panels.length}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(true); }}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Menu overlay */}
      {showMenu && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
          <h2 className="text-xl text-gray-200 mb-2">菜单</h2>
          <button
            onClick={() => setShowMenu(false)}
            className="px-8 py-2.5 text-sm border border-white/15 rounded-md text-white hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all min-w-[180px]"
          >
            继续阅读
          </button>
          <button
            onClick={() => { setShowMenu(false); setShowEnding(false); showPanel(0, true); }}
            className="px-8 py-2.5 text-sm border border-white/15 rounded-md text-white hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all min-w-[180px]"
          >
            从头开始
          </button>
          <button
            onClick={() => { stopAudio(); setShowMenu(false); onClose(); }}
            className="px-8 py-2.5 text-sm border border-white/15 rounded-md text-white hover:border-red-400 hover:text-red-400 transition-all min-w-[180px]"
          >
            退出
          </button>
        </div>
      )}

      {/* Ending screen */}
      {showEnding && (
        <div className="absolute inset-0 bg-black/95 z-40 flex flex-col items-center justify-center gap-3">
          <h2 className="text-2xl text-gray-200 font-light tracking-[4px]">- Fin -</h2>
          <p className="text-sm text-gray-500">故事已结束</p>
          <button
            onClick={() => { setShowEnding(false); showPanel(0, true); }}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 text-sm border border-white/15 rounded-md text-white hover:border-[#00F0FF] hover:text-[#00F0FF] transition-all"
          >
            <RotateCcw size={14} />
            重新阅读
          </button>
        </div>
      )}
    </div>
  );
}
