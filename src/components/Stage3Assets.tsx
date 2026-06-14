import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Image, Headphones, Music, Terminal, ArrowRight } from 'lucide-react';

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-gray-300">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function Stage3Assets() {
  const stageStatus = useAppStore((s) => s.stageStatus);
  const stage3_progress = useAppStore((s) => s.stage3_progress);
  const stage3_logs = useAppStore((s) => s.stage3_logs);
  const stage3_panels = useAppStore((s) => s.stage3_panels);
  const setCurrentStage = useAppStore((s) => s.setCurrentStage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Image size={18} className="text-[#00F0FF]" />
          阶段 3：素材生成管线
        </h2>
        {stageStatus[3] === 'done' && (
          <button
            onClick={() => setCurrentStage(4)}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition-all"
          >
            预览播放器 <ArrowRight size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="glass-card rounded p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-300">
            <Image size={14} className="text-[#00F0FF]" /> AI 图像生成
          </div>
          <ProgressBar label="图像任务" value={stage3_progress.image} color="#00F0FF" />
          <div className="text-[10px] text-gray-500">
            引擎: Stable Diffusion XL / DALL·E 3 (模拟)
          </div>
        </div>
        <div className="glass-card rounded p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-300">
            <Headphones size={14} className="text-[#00FF9D]" /> TTS 语音合成
          </div>
          <ProgressBar label="语音任务" value={stage3_progress.tts} color="#00FF9D" />
          <div className="text-[10px] text-gray-500">
            引擎: Azure TTS / ElevenLabs (模拟)
          </div>
        </div>
        <div className="glass-card rounded p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-300">
            <Music size={14} className="text-[#BD00FF]" /> BGM / 音效
          </div>
          <ProgressBar label="氛围音任务" value={stage3_progress.bgm} color="#BD00FF" />
          <div className="text-[10px] text-gray-500">
            引擎: 素材库匹配 / 环境音生成 (模拟)
          </div>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="glass-card rounded overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-black/20">
          <Terminal size={14} className="text-[#00FF9D]" />
          <span className="text-xs font-mono text-[#00FF9D]">API_CALL_LOGS</span>
        </div>
        <div className="h-48 overflow-y-auto p-3 space-y-1 font-mono text-[11px]">
          {stage3_logs.length === 0 && (
            <span className="text-gray-600">等待任务开始……</span>
          )}
          {stage3_logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-gray-600 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
              </span>
              <span
                className={[
                  'px-1.5 py-0.5 rounded text-[10px] shrink-0',
                  log.service === 'LLM' ? 'bg-blue-500/10 text-blue-400'
                    : log.service === 'ImageGen' ? 'bg-cyan-500/10 text-cyan-400'
                    : log.service === 'TTS' ? 'bg-green-500/10 text-green-400'
                    : 'bg-purple-500/10 text-purple-400',
                ].join(' ')}
              >
                {log.service}
              </span>
              <span className={log.status === 'success' ? 'text-gray-300' : 'text-gray-500'}>
                {log.requestSummary}
              </span>
              {log.status === 'success' && (
                <span className="text-[#00FF9D] ml-auto shrink-0">OK {log.durationMs}ms</span>
              )}
            </div>
          ))}
          {stageStatus[3] === 'running' && (
            <div className="text-gray-500 cursor-blink">_</div>
          )}
        </div>
      </div>

      {/* Generated preview thumbnails */}
      {stage3_panels && stage3_panels.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-medium text-gray-400 mb-2">已生成资源预览</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stage3_panels.map((p) => (
              <div key={p.id} className="shrink-0 w-32">
                <img src={p.imageDataUri} alt={`panel-${p.id}`} className="w-32 h-20 object-cover rounded border border-white/10" />
                <div className="text-[10px] text-gray-500 mt-1 truncate">#{p.id} {p.shot_type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
