import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Upload, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StoryInput() {
  const rawText = useAppStore((s) => s.rawText);
  const setRawText = useAppStore((s) => s.setRawText);
  const runStage1 = useAppStore((s) => s.runStage1);
  const stageStatus = useAppStore((s) => s.stageStatus);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      setRawText(text);
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText size={18} className="text-[#00F0FF]" />
          故事输入台
        </h2>
        <span className="text-xs text-gray-500">支持 TXT / MD / 直接粘贴</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          'relative rounded border transition-all duration-300',
          dragOver
            ? 'border-[#00F0FF] bg-[#00F0FF]/5 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
            : 'border-white/10 bg-[#0f1420] hover:border-white/20',
        ].join(' ')}
      >
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="在此粘贴你的故事、剧本或小说片段……"
          className="w-full h-64 bg-transparent p-5 text-sm leading-relaxed text-gray-200 placeholder-gray-600 resize-none outline-none font-serif-sc"
        />
        {dragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm rounded">
            <span className="text-[#00F0FF] font-medium flex items-center gap-2">
              <Upload size={20} /> 释放以上传文件
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-300 border border-white/10 rounded hover:border-[#00F0FF]/40 hover:text-[#00F0FF] transition-colors"
          >
            <Upload size={14} /> 上传文件
          </button>
          <span className="text-xs text-gray-600">
            {rawText.length} 字符
          </span>
        </div>

        <button
          onClick={runStage1}
          disabled={stageStatus[1] === 'running' || !rawText.trim()}
          className={[
            'flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded transition-all',
            stageStatus[1] === 'running'
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 hover:shadow-[0_0_16px_rgba(0,240,255,0.2)]',
          ].join(' ')}
        >
          <Sparkles size={16} />
          {stageStatus[1] === 'running' ? '处理中……' : '开始工作流'}
        </button>
      </div>
    </motion.div>
  );
}
