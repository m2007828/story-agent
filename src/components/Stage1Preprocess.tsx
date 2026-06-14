import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CheckCircle, MapPin, Clock, CloudRain, MessageCircle, BookOpen, Footprints,
  Plus, Trash2, ChevronDown, GripVertical, Pencil, Check, X,
} from 'lucide-react';
import type { StoryBlock } from '@/types';

const typeIcons: Record<string, React.ReactNode> = {
  scene: <MapPin size={14} className="text-[#BD00FF]" />,
  narration: <BookOpen size={14} className="text-[#00F0FF]" />,
  dialogue: <MessageCircle size={14} className="text-[#00FF9D]" />,
  action: <Footprints size={14} className="text-yellow-400" />,
};

const typeLabels: Record<string, string> = {
  scene: '场景',
  narration: '叙述',
  dialogue: '对话',
  action: '动作',
};

const typeOptions: StoryBlock['type'][] = ['scene', 'narration', 'dialogue', 'action'];

/* ===================== Inline Edit for scene header ===================== */
function SceneHeaderEdit({ block, onUpdate }: { block: StoryBlock; onUpdate: (field: Partial<StoryBlock>) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.sceneHeader || { location: '', time: '', mood: '' });

  if (!block.sceneHeader) return null;

  if (editing) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        <input
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
          className="w-20 bg-black/30 border border-[#BD00FF]/30 rounded px-1.5 py-0.5 text-[10px] text-gray-200 outline-none"
          placeholder="地点"
          autoFocus
        />
        <input
          value={draft.time}
          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          className="w-16 bg-black/30 border border-[#BD00FF]/30 rounded px-1.5 py-0.5 text-[10px] text-gray-200 outline-none"
          placeholder="时间"
        />
        <input
          value={draft.mood}
          onChange={(e) => setDraft({ ...draft, mood: e.target.value })}
          className="w-16 bg-black/30 border border-[#BD00FF]/30 rounded px-1.5 py-0.5 text-[10px] text-gray-200 outline-none"
          placeholder="氛围"
        />
        <button
          onClick={() => { onUpdate({ sceneHeader: draft }); setEditing(false); }}
          className="p-0.5 text-[#00FF9D] hover:bg-white/5 rounded"
        >
          <Check size={12} />
        </button>
        <button
          onClick={() => { setDraft(block.sceneHeader!); setEditing(false); }}
          className="p-0.5 text-gray-500 hover:bg-white/5 rounded"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 ml-auto text-[10px] text-gray-500 cursor-pointer group"
      onClick={() => setEditing(true)}
    >
      <span className="flex items-center gap-1"><MapPin size={10} /> {block.sceneHeader.location}</span>
      <span className="flex items-center gap-1"><Clock size={10} /> {block.sceneHeader.time}</span>
      <span className="flex items-center gap-1"><CloudRain size={10} /> {block.sceneHeader.mood}</span>
      <Pencil size={10} className="opacity-0 group-hover:opacity-100 text-gray-600 transition-opacity" />
    </div>
  );
}

/* ===================== Add Block Dropdown ===================== */
function AddBlockDropdown({ onAdd }: { onAdd: (type: StoryBlock['type']) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-400 border border-white/10 rounded hover:border-[#00F0FF]/40 hover:text-[#00F0FF] transition-colors"
      >
        <Plus size={14} /> 添加故事块
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 mt-1 z-20 bg-[#141B2D] border border-white/10 rounded shadow-xl overflow-hidden min-w-[120px]"
            >
              {typeOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => { onAdd(t); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                >
                  {typeIcons[t]} {typeLabels[t]}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ===================== Story Block Card ===================== */
function BlockCard({
  block,
  idx,
  onUpdateContent,
  onUpdateType,
  onUpdateField,
  onDelete,
  onAddAfter,
}: {
  block: StoryBlock;
  idx: number;
  onUpdateContent: (content: string) => void;
  onUpdateType: (type: StoryBlock['type']) => void;
  onUpdateField: (field: Partial<StoryBlock>) => void;
  onDelete: () => void;
  onAddAfter: (type: StoryBlock['type']) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [speakerEditing, setSpeakerEditing] = useState(false);
  const [speakerDraft, setSpeakerDraft] = useState(block.speaker || '');

  return (
    <div
      className="glass-card rounded p-4 hover:border-white/10 transition-colors group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-2 mb-2">
        <GripVertical size={14} className="text-gray-600 cursor-grab" />

        <span className="text-[10px] text-gray-500 font-mono">#{idx + 1}</span>

        {/* Type selector dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-white transition-colors"
            onClick={(e) => {
              const next = typeOptions[(typeOptions.indexOf(block.type) + 1) % typeOptions.length];
              onUpdateType(next);
            }}
          >
            {typeIcons[block.type]} {typeLabels[block.type]}
          </button>
        </div>

        {/* Scene header */}
        {block.type === 'scene' && (
          <SceneHeaderEdit block={block} onUpdate={onUpdateField} />
        )}

        {/* Speaker */}
        {block.type === 'dialogue' && (
          speakerEditing ? (
            <div className="ml-auto flex items-center gap-1">
              <input
                value={speakerDraft}
                onChange={(e) => setSpeakerDraft(e.target.value)}
                className="w-20 bg-black/30 border border-[#00FF9D]/30 rounded px-1.5 py-0.5 text-[10px] text-[#00FF9D] outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { onUpdateField({ speaker: speakerDraft }); setSpeakerEditing(false); }
                  if (e.key === 'Escape') { setSpeakerDraft(block.speaker || ''); setSpeakerEditing(false); }
                }}
              />
              <button onClick={() => { onUpdateField({ speaker: speakerDraft }); setSpeakerEditing(false); }} className="p-0.5 text-[#00FF9D]"><Check size={10} /></button>
              <button onClick={() => { setSpeakerDraft(block.speaker || ''); setSpeakerEditing(false); }} className="p-0.5 text-gray-500"><X size={10} /></button>
            </div>
          ) : (
            <span
              className="ml-auto text-xs text-[#00FF9D] cursor-pointer hover:underline"
              onClick={() => { setSpeakerDraft(block.speaker || ''); setSpeakerEditing(true); }}
            >
              {block.speaker || '未指定'}
            </span>
          )
        )}

        {/* Emotion hint */}
        {block.emotionHint && (
          <span className="text-[10px] text-yellow-400/60">({block.emotionHint})</span>
        )}

        {/* Action buttons */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 ml-2"
            >
              <button
                onClick={onDelete}
                className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                title="删除此块"
              >
                <Trash2 size={12} />
              </button>
              <div className="relative group/add">
                <button
                  className="p-1 text-gray-600 hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 rounded transition-colors"
                  title="在下方插入"
                >
                  <Plus size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content textarea */}
      <textarea
        value={block.content}
        onChange={(e) => onUpdateContent(e.target.value)}
        className="w-full bg-transparent text-sm text-gray-200 outline-none resize-none font-serif-sc leading-relaxed"
        rows={Math.max(2, Math.ceil(block.content.length / 40))}
      />

      {/* Quick add below */}
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <AddBlockDropdown onAdd={onAddAfter} />
      </div>
    </div>
  );
}

/* ===================== Main Component ===================== */
export default function Stage1Preprocess() {
  const stage1_blocks = useAppStore((s) => s.stage1_blocks);
  const stageStatus = useAppStore((s) => s.stageStatus);
  const updateBlock = useAppStore((s) => s.updateBlock);
  const addBlock = useAppStore((s) => s.addBlock);
  const deleteBlock = useAppStore((s) => s.deleteBlock);
  const updateBlockType = useAppStore((s) => s.updateBlockType);
  const updateBlockField = useAppStore((s) => s.updateBlockField);
  const runStage2 = useAppStore((s) => s.runStage2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle size={18} className="text-[#00FF9D]" />
          阶段 1：内容预处理
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">识别到 {stage1_blocks.length} 个故事块</span>
          <AddBlockDropdown onAdd={(type) => addBlock(null, type)} />
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {stage1_blocks.map((block, idx) => (
          <BlockCard
            key={block.id}
            block={block}
            idx={idx}
            onUpdateContent={(content) => updateBlock(block.id, content)}
            onUpdateType={(type) => updateBlockType(block.id, type)}
            onUpdateField={(field) => updateBlockField(block.id, field)}
            onDelete={() => deleteBlock(block.id)}
            onAddAfter={(type) => addBlock(block.id, type)}
          />
        ))}
      </div>

      {stage1_blocks.length === 0 && (
        <div className="text-center py-10 text-gray-600 text-sm">
          暂无故事块，请点击上方「添加故事块」或返回输入故事文本
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={runStage2}
          disabled={stageStatus[2] === 'running' || stage1_blocks.length === 0}
          className={[
            'flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded transition-all',
            stageStatus[2] === 'running' || stage1_blocks.length === 0
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 hover:shadow-[0_0_16px_rgba(0,240,255,0.2)]',
          ].join(' ')}
        >
          <Play size={16} />
          {stageStatus[2] === 'running' ? '生成中……' : '进入分镜生成'}
        </button>
      </div>
    </motion.div>
  );
}
