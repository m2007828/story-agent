import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { Play, BookOpen, Download, FileArchive, AlertTriangle, CheckCircle } from 'lucide-react';
import ComicPlayer from './ComicPlayer';
import { exportStandaloneHtml, exportZip } from '@/lib/export';

export default function Stage4Player() {
  const stage3_panels = useAppStore((s) => s.stage3_panels);
  const storyboard = useAppStore((s) => s.stage2_storyboard);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const title = storyboard?.meta.title || '未命名故事';

  if (!stage3_panels || stage3_panels.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-10 text-center">
        请先完成阶段 3 的素材生成
      </div>
    );
  }

  const handleExportHtml = async () => {
    if (!stage3_panels) return;
    setExporting(true);
    await exportStandaloneHtml(title, stage3_panels);
    setExporting(false);
  };

  const handleExportZip = async () => {
    if (!stage3_panels) return;
    setExporting(true);
    await exportZip(title, stage3_panels);
    setExporting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen size={18} className="text-[#00F0FF]" />
          阶段 4：故事阅读 & 导出
        </h2>
      </div>

      {/* Preview section */}
      <div className="glass-card rounded p-6 text-center mb-4">
        <div className="mb-4 text-sm text-gray-400">
          共 {stage3_panels.length} 个分镜 · 点击推进剧情，像视觉小说一样阅读
        </div>
        <div className="flex justify-center gap-2 mb-6">
          {stage3_panels.slice(0, 6).map((p) => (
            <img key={p.id} src={p.imageDataUri} alt="" className="w-20 h-14 object-cover rounded border border-white/10 opacity-70" />
          ))}
          {stage3_panels.length > 6 && (
            <div className="w-20 h-14 flex items-center justify-center rounded border border-white/10 text-xs text-gray-500">
              +{stage3_panels.length - 6}
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold rounded bg-[#00F0FF] text-[#0B0F19] hover:shadow-[0_0_24px_rgba(0,240,255,0.35)] transition-all"
        >
          <Play size={18} fill="currentColor" />
          开始阅读
        </button>
        <p className="mt-3 text-xs text-gray-500">点击/空格推进 · 方向键翻页 · ESC菜单 · 滑动切页</p>
      </div>

      {/* Export section */}
      <div className="space-y-4">
        <div className="glass-card rounded p-5">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle size={18} className="text-[#00FF9D] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">产物就绪</h3>
              <p className="text-xs text-gray-400 mt-1">
                共 {stage3_panels.length} 个分镜。导出为独立 HTML，双击即可离线阅读，体验与预览一致的视觉小说效果。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportHtml}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition-all disabled:opacity-50"
            >
              <Download size={16} />
              下载独立 HTML
            </button>
            <button
              onClick={handleExportZip}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30 hover:bg-[#00FF9D]/20 transition-all disabled:opacity-50"
            >
              <FileArchive size={16} />
              打包 ZIP 下载
            </button>
          </div>
        </div>

        <div className="glass-card rounded p-5 border-yellow-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-500">未完成的功能与接入说明</h3>
              <ul className="text-xs text-gray-400 mt-2 space-y-1.5 list-disc list-inside">
                <li><strong className="text-gray-300">真实 AI 绘图</strong>：当前为 Canvas 程序化占位图。如需接入 DALL·E 3 / Stable Diffusion / Midjourney，需在素材生成阶段替换为真实 API 调用。</li>
                <li><strong className="text-gray-300">真实 TTS 语音</strong>：当前为静音占位 WAV。如需接入 Azure TTS / ElevenLabs，需将 narration_text 发送至对应接口。</li>
                <li><strong className="text-gray-300">背景音乐/音效</strong>：当前未生成真实 BGM。可接入音乐生成 API 或本地素材库。</li>
                <li><strong className="text-gray-300">角色一致性</strong>：连续分镜角色一致性依赖 IP-Adapter / cref 等高级绘画控制。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {open && <ComicPlayer panels={stage3_panels} onClose={() => setOpen(false)} />}
    </motion.div>
  );
}
