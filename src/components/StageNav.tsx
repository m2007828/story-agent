import { useAppStore } from '@/store/useAppStore';
import { FileText, Layers, Split, Image, BookOpen } from 'lucide-react';

const stages = [
  { id: 0, label: '故事输入', icon: FileText },
  { id: 1, label: '内容预处理', icon: Layers },
  { id: 2, label: '分镜脚本', icon: Split },
  { id: 3, label: '素材生成', icon: Image },
  { id: 4, label: '阅读 & 导出', icon: BookOpen },
];

export default function StageNav() {
  const currentStage = useAppStore((s) => s.currentStage);
  const setCurrentStage = useAppStore((s) => s.setCurrentStage);
  const stageStatus = useAppStore((s) => s.stageStatus);

  return (
    <nav className="hidden md:flex flex-col items-center py-6 gap-4 w-20 shrink-0 border-r border-white/5 bg-[#0B0F19]">
      <div className="text-[#00F0FF] font-bold text-xs tracking-widest mb-2" style={{ writingMode: 'vertical-rl' }}>
        PIPELINE
      </div>
      {stages.map((stage, idx) => {
        const Icon = stage.icon;
        const status = stageStatus[stage.id];
        const isActive = currentStage === stage.id;
        const isDone = status === 'done';
        const isRunning = status === 'running';

        return (
          <div key={stage.id} className="flex flex-col items-center gap-1 w-full">
            <button
              onClick={() => setCurrentStage(stage.id)}
              className={[
                'relative w-10 h-10 flex items-center justify-center rounded border transition-all duration-300',
                isActive
                  ? 'border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : isDone
                  ? 'border-[#00FF9D]/40 text-[#00FF9D] bg-[#00FF9D]/5'
                  : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300',
              ].join(' ')}
              title={stage.label}
            >
              <Icon size={18} />
              {isRunning && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              )}
            </button>
            <span className={['text-[10px]', isActive ? 'text-[#00F0FF]' : 'text-gray-600'].join(' ')}>
              {String(idx + 1).padStart(2, '0')}
            </span>
            {idx < stages.length - 1 && (
              <div className="w-px h-4 bg-white/5" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
