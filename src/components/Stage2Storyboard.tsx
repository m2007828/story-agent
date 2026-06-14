import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Split, Play, Camera, Mic, Music, Upload, RefreshCw,
  Pencil, Check, X, Volume2, Pause, ChevronDown, ChevronUp, Clock, Loader2,
} from 'lucide-react';
import type { StoryboardPanel, EnrichedPanel } from '@/types';
import { compressImageToDataUri } from '@/lib/utils';

/* ===================== Audio Player Hook ===================== */
function useAudioPlayer() {
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((src: string, text?: string) => {
    setAudioError(null);
    if (playingSrc === src) {
      audioRef.current?.pause();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setPlayingSrc(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    if (src === '__BROWSER_TTS__' && text) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
      setPlayingSrc(src);
      return;
    }
    const audio = new Audio(src);
    audio.onended = () => setPlayingSrc(null);
    audio.onerror = () => {
      setPlayingSrc(null);
      setAudioError('音频加载失败，格式可能不受支持');
      // 回退到浏览器 TTS
      if (text && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      }
    };
    audio.play().catch(() => {
      setPlayingSrc(null);
      setAudioError('音频播放失败');
    });
    audioRef.current = audio;
    setPlayingSrc(src);
  }, [playingSrc]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlayingSrc(null);
  }, []);

  return { playingSrc, audioError, play, stop };
}

/* ===================== Inline Edit Field ===================== */
function InlineEdit({
  value,
  onSave,
  multiline = false,
  className = '',
}: {
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => { setDraft(value); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = () => { onSave(draft); setEditing(false); };

  if (editing) {
    return (
      <div className="flex items-start gap-1">
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 bg-black/30 border border-[#00F0FF]/30 rounded px-2 py-1 text-xs text-gray-200 outline-none resize-none min-h-[60px]"
            autoFocus
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 bg-black/30 border border-[#00F0FF]/30 rounded px-2 py-1 text-xs text-gray-200 outline-none"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          />
        )}
        <button onClick={save} className="p-1 text-[#00FF9D] hover:bg-white/5 rounded"><Check size={14} /></button>
        <button onClick={cancel} className="p-1 text-gray-500 hover:bg-white/5 rounded"><X size={14} /></button>
      </div>
    );
  }

  return (
    <div className={`group flex items-start gap-1 ${className}`}>
      <span className="flex-1 text-xs text-gray-300 leading-relaxed">{value}</span>
      <button
        onClick={startEdit}
        className="p-1 text-gray-600 opacity-0 group-hover:opacity-100 hover:text-[#00F0FF] transition-all shrink-0"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}

/* ===================== Upload Button ===================== */
function UploadButton({ onUpload, accept, label }: { onUpload: (dataUri: string) => void; accept: string; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (accept.startsWith('image')) {
      // 图片：压缩后再上传
      setCompressing(true);
      try {
        const dataUri = await compressImageToDataUri(file);
        onUpload(dataUri);
      } catch {
        // 压缩失败时回退到原始 data URI
        const reader = new FileReader();
        reader.onloadend = () => onUpload(reader.result as string);
        reader.readAsDataURL(file);
      } finally {
        setCompressing(false);
      }
    } else {
      // 音频：校验格式和大小
      const supportedExts = ['.mp3', '.wav', '.ogg', '.oga', '.weba', '.m4a'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!supportedExts.includes(ext)) {
        setError('不支持的格式，请使用 MP3/WAV/OGG');
        e.target.value = '';
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError('音频文件不能超过 20MB');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => onUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <>
      <button
        onClick={() => { setError(null); inputRef.current?.click(); }}
        disabled={compressing}
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-[#00F0FF] border border-white/5 hover:border-[#00F0FF]/30 rounded transition-all disabled:opacity-50"
      >
        <Upload size={10} /> {compressing ? '压缩中...' : label}
      </button>
      {error && <span className="text-[10px] text-red-400 ml-1">{error}</span>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </>
  );
}

/* ===================== Panel Card ===================== */
function PanelCard({
  panel,
  enriched,
  isGenerating,
  onGenerate,
  onUpdatePanel,
  onUpdateStoryboard,
}: {
  panel: StoryboardPanel;
  enriched: EnrichedPanel | undefined;
  isGenerating: boolean;
  onGenerate: () => void;
  onUpdatePanel: (data: Partial<EnrichedPanel>) => void;
  onUpdateStoryboard: (data: Partial<StoryboardPanel>) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { playingSrc, audioError, play, stop } = useAudioPlayer();

  const hasAssets = !!enriched;

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-mono text-gray-500 w-8">#{panel.id}</span>
        <span className="text-xs px-2 py-0.5 rounded border border-white/10 text-gray-400 uppercase">
          {panel.shot_type}
        </span>
        <span className="flex-1 text-sm text-gray-300 truncate">{panel.scene_desc}</span>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock size={12} /> {panel.estimated_duration}s
        </span>
        {isGenerating && <Loader2 size={14} className="text-[#00F0FF] animate-spin" />}
        {expanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
              {/* Main content area: image + text side by side */}
              <div className="flex gap-4">
                {/* Image section */}
                <div className="w-48 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <Camera size={10} /> 画面
                    </label>
                    {hasAssets && (
                      <div className="flex gap-1">
                        <UploadButton
                          accept="image/*"
                          label="上传"
                          onUpload={(dataUri) => onUpdatePanel({ imageDataUri: dataUri })}
                        />
                        <button
                          onClick={onGenerate}
                          disabled={isGenerating}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-[#BD00FF] border border-white/5 hover:border-[#BD00FF]/30 rounded transition-all disabled:opacity-50"
                        >
                          <RefreshCw size={10} /> 重新生成
                        </button>
                      </div>
                    )}
                  </div>
                  {hasAssets && enriched.imageDataUri ? (
                    <img
                      src={enriched.imageDataUri}
                      alt={`panel-${panel.id}`}
                      className="w-48 h-32 object-cover rounded border border-white/10"
                    />
                  ) : (
                    <div className="w-48 h-32 rounded border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                      <Camera size={20} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600">暂无图片</span>
                    </div>
                  )}
                </div>

                {/* Text content section */}
                <div className="flex-1 space-y-3 min-w-0">
                  {/* Scene description */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1 mb-1">
                      场景描述
                    </label>
                    <InlineEdit
                      value={panel.scene_desc}
                      onSave={(v) => onUpdateStoryboard({ scene_desc: v })}
                    />
                  </div>

                  {/* Image prompt */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1 mb-1">
                      <Camera size={10} /> 画面提示词
                    </label>
                    <InlineEdit
                      value={panel.image_prompt}
                      onSave={(v) => onUpdateStoryboard({ image_prompt: v })}
                      multiline
                    />
                  </div>

                  {/* Narration / Dialogue */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1 mb-1">
                        <Mic size={10} /> 旁白/对白
                      </label>
                      <InlineEdit
                        value={panel.narration_text}
                        onSave={(v) => onUpdateStoryboard({ narration_text: v })}
                        multiline
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">语音角色</label>
                      <InlineEdit
                        value={panel.voice_type}
                        onSave={(v) => onUpdateStoryboard({ voice_type: v })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio controls row */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                {/* Voice playback */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <Mic size={10} /> 语音
                  </label>
                  {hasAssets && enriched.audioDataUri ? (
                    <button
                      onClick={() => play(enriched.audioDataUri, panel.narration_text || panel.dialogue.text || '')}
                      className={[
                        'flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-all',
                        playingSrc === enriched.audioDataUri
                          ? 'bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-[#00FF9D]/30 hover:text-[#00FF9D]',
                      ].join(' ')}
                    >
                      {playingSrc === enriched.audioDataUri ? <Pause size={12} /> : <Volume2 size={12} />}
                      {playingSrc === enriched.audioDataUri ? '暂停' : '播放'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-600">生成后可播放</span>
                  )}
                  {hasAssets && (
                    <UploadButton
                      accept=".mp3,.wav,.ogg,.oga,.weba,.m4a,audio/*"
                      label="上传语音"
                      onUpload={(dataUri) => onUpdatePanel({ audioDataUri: dataUri })}
                    />
                  )}
                  {audioError && <span className="text-[10px] text-red-400">{audioError}</span>}
                </div>

                {/* BGM playback */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                    <Music size={10} /> 背景音
                  </label>
                  {hasAssets && enriched.bgmDataUri ? (
                    <>
                      <button
                        onClick={() => play(enriched.bgmDataUri)}
                        className={[
                          'flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-all',
                          playingSrc === enriched.bgmDataUri
                            ? 'bg-[#BD00FF]/10 text-[#BD00FF] border border-[#BD00FF]/30'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:border-[#BD00FF]/30 hover:text-[#BD00FF]',
                        ].join(' ')}
                      >
                        {playingSrc === enriched.bgmDataUri ? <Pause size={12} /> : <Music size={12} />}
                        {playingSrc === enriched.bgmDataUri ? '暂停' : '播放'}
                      </button>
                      <UploadButton
                        accept=".mp3,.wav,.ogg,.oga,.weba,.m4a,audio/*"
                        label="替换"
                        onUpload={(dataUri) => onUpdatePanel({ bgmDataUri: dataUri })}
                      />
                    </>
                  ) : hasAssets ? (
                    <UploadButton
                      accept=".mp3,.wav,.ogg,.oga,.weba,.m4a,audio/*"
                      label="上传背景音"
                      onUpload={(dataUri) => onUpdatePanel({ bgmDataUri: dataUri })}
                    />
                  ) : (
                    <span className="text-[10px] text-gray-600">生成后可设置</span>
                  )}
                </div>

                {/* Generate button for individual panel */}
                {!hasAssets && (
                  <button
                    onClick={onGenerate}
                    disabled={isGenerating}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-[#BD00FF]/10 text-[#BD00FF] border border-[#BD00FF]/30 hover:bg-[#BD00FF]/20 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {isGenerating ? '生成中...' : '生成素材'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===================== Main Component ===================== */
export default function Stage2Storyboard() {
  const storyboard = useAppStore((s) => s.stage2_storyboard);
  const stage3_panels = useAppStore((s) => s.stage3_panels);
  const stageStatus = useAppStore((s) => s.stageStatus);
  const generatingPanelIds = useAppStore((s) => s.generatingPanelIds);
  const runStage3 = useAppStore((s) => s.runStage3);
  const generatePanelAssets = useAppStore((s) => s.generatePanelAssets);
  const updatePanel = useAppStore((s) => s.updatePanel);
  const updateStoryboardPanel = useAppStore((s) => s.updateStoryboardPanel);
  const setCurrentStage = useAppStore((s) => s.setCurrentStage);
  const [showJson, setShowJson] = useState(false);

  if (!storyboard) {
    return (
      <div className="text-sm text-gray-500 py-10 text-center">
        请先完成阶段 1 的内容预处理
      </div>
    );
  }

  const allGenerated = stage3_panels && storyboard.panels.every((p) =>
    stage3_panels.some((ep) => ep.id === p.id)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Split size={18} className="text-[#BD00FF]" />
          阶段 2：分镜脚本 & 素材管理
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJson(!showJson)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showJson ? '隐藏 JSON' : '查看 JSON'}
          </button>
          {!allGenerated && (
            <button
              onClick={runStage3}
              disabled={stageStatus[3] === 'running'}
              className={[
                'flex items-center gap-2 px-5 py-2 text-xs font-bold rounded transition-all',
                stageStatus[3] === 'running'
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-[#BD00FF]/10 text-[#BD00FF] border border-[#BD00FF]/30 hover:bg-[#BD00FF]/20',
              ].join(' ')}
            >
              {stageStatus[3] === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {stageStatus[3] === 'running' ? '批量生成中...' : '开始素材生成'}
            </button>
          )}
          {allGenerated && (
            <button
              onClick={() => setCurrentStage(4)}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition-all"
            >
              预览播放器 <Play size={14} />
            </button>
          )}
        </div>
      </div>

      {showJson && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4"
        >
          <pre className="bg-black/40 border border-white/5 rounded p-3 text-[10px] text-[#00FF9D] font-mono overflow-x-auto max-h-40">
            {JSON.stringify(storyboard, null, 2)}
          </pre>
        </motion.div>
      )}

      {/* Panel list */}
      <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {storyboard.panels.map((panel) => {
          const enriched = stage3_panels?.find((ep) => ep.id === panel.id);
          return (
            <PanelCard
              key={panel.id}
              panel={panel}
              enriched={enriched}
              isGenerating={generatingPanelIds.has(panel.id)}
              onGenerate={() => generatePanelAssets(panel.id)}
              onUpdatePanel={(data) => updatePanel(panel.id, data)}
              onUpdateStoryboard={(data) => updateStoryboardPanel(panel.id, data)}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
