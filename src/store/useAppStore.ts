import { create } from 'zustand';
import type { StoryBlock, Storyboard, EnrichedPanel, APILog, APIConfig } from '@/types';
import { demoStory, parseToBlocks, generateStoryboardFromBlocks } from '@/lib/mockData';
import { generateImage, generateTTS } from '@/lib/apiGen';
import { llmParseBlocks, llmGenerateStoryboard } from '@/lib/llmService';

interface AppState {
  rawText: string;
  detectedFormat: string;
  stage1_blocks: StoryBlock[];
  stage2_storyboard: Storyboard | null;
  stage3_panels: EnrichedPanel[] | null;
  stage3_logs: APILog[];
  stage3_progress: { image: number; tts: number; bgm: number };
  currentStage: number;
  stageStatus: Record<number, 'idle' | 'running' | 'done'>;
  apiConfig: APIConfig;
  generatingPanelIds: Set<number>;

  setRawText: (text: string) => void;
  setCurrentStage: (stage: number) => void;
  setStageStatus: (stage: number, status: 'idle' | 'running' | 'done') => void;
  setApiConfig: (config: Partial<APIConfig>) => void;

  runStage1: () => Promise<void>;
  runStage2: () => Promise<void>;
  runStage3: () => Promise<void>;
  generatePanelAssets: (panelId: number) => Promise<void>;

  updateBlock: (id: string, content: string) => void;
  addBlock: (afterId: string | null, type: StoryBlock['type']) => void;
  deleteBlock: (id: string) => void;
  updateBlockType: (id: string, type: StoryBlock['type']) => void;
  updateBlockField: (id: string, field: Partial<StoryBlock>) => void;
  updatePanel: (id: number, data: Partial<EnrichedPanel>) => void;
  updateStoryboardPanel: (id: number, data: Partial<import('@/types').StoryboardPanel>) => void;
  addLog: (log: APILog) => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const defaultApiConfig: APIConfig = {
  llmProvider: 'rule',
  llmApiKey: '',
  llmBaseUrl: 'https://api.deepseek.com',
  llmModel: 'deepseek-chat',

  imageProvider: 'free',
  imageApiKey: '',
  imageBaseUrl: 'https://api.openai.com',
  imageModel: 'dall-e-3',

  ttsProvider: 'browser',
  ttsApiKey: '',
  ttsBaseUrl: 'https://api.openai.com',
  ttsVoice: 'zh-CN-YunxiNeural',
  ttsModel: 'qwen3-tts-flash',

  bgmUrl: '',

  imageStylePrefix: 'manga style, cinematic lighting',
};

export const useAppStore = create<AppState>((set, get) => ({
  rawText: demoStory,
  detectedFormat: 'dialogue',
  stage1_blocks: [],
  stage2_storyboard: null,
  stage3_panels: null,
  stage3_logs: [],
  stage3_progress: { image: 0, tts: 0, bgm: 0 },
  currentStage: 0,
  stageStatus: { 0: 'idle', 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle' },
  apiConfig: defaultApiConfig,
  generatingPanelIds: new Set(),

  setRawText: (text) => set({ rawText: text }),
  setCurrentStage: (stage) => set({ currentStage: stage }),
  setStageStatus: (stage, status) =>
    set((s) => ({ stageStatus: { ...s.stageStatus, [stage]: status } })),
  setApiConfig: (partial) =>
    set((s) => ({ apiConfig: { ...s.apiConfig, ...partial } })),

  runStage1: async () => {
    const { rawText, apiConfig, setStageStatus, setCurrentStage, addLog } = get();
    setStageStatus(1, 'running');
    setCurrentStage(1);

    const blocks = await llmParseBlocks(rawText, apiConfig, addLog);
    set({ stage1_blocks: blocks, detectedFormat: 'dialogue' });

    await sleep(200);
    setStageStatus(1, 'done');
  },

  runStage2: async () => {
    const { stage1_blocks, rawText, apiConfig, setStageStatus, setCurrentStage, addLog } = get();
    setStageStatus(2, 'running');
    setCurrentStage(2);

    const storyboard = await llmGenerateStoryboard(stage1_blocks, rawText, apiConfig, addLog);
    set({ stage2_storyboard: storyboard });

    await sleep(200);
    setStageStatus(2, 'done');
  },

  runStage3: async () => {
    const { stage2_storyboard, apiConfig, setStageStatus, setCurrentStage, addLog } = get();
    if (!stage2_storyboard) return;
    setStageStatus(3, 'running');
    setCurrentStage(3);

    const panels: EnrichedPanel[] = [];
    const total = stage2_storyboard.panels.length;

    for (let i = 0; i < total; i++) {
      const p = stage2_storyboard.panels[i];
      const imageDataUri = await generateImage(p, apiConfig, addLog);
      const text = p.narration_text || p.dialogue.text || '';
      const audioDataUri = await generateTTS(text, apiConfig, addLog);

      panels.push({ ...p, imageDataUri, audioDataUri, bgmDataUri: '', actualDuration: p.estimated_duration });
      set({ stage3_progress: { image: Math.round(((i + 1) / total) * 100), tts: Math.round(((i + 1) / total) * 100), bgm: i === total - 1 ? 100 : Math.round(((i + 1) / total) * 100) } });
    }

    addLog({ stage: 3, service: 'BGM', timestamp: Date.now(), requestSummary: '匹配场景氛围 BGM', status: 'pending', durationMs: 0 });
    await sleep(400);
    addLog({ stage: 3, service: 'BGM', timestamp: Date.now(), requestSummary: 'BGM 匹配完成', status: 'success', durationMs: 600 });

    set({ stage3_panels: panels });
    setStageStatus(3, 'done');
  },

  generatePanelAssets: async (panelId: number) => {
    const { stage2_storyboard, stage3_panels, apiConfig, addLog } = get();
    if (!stage2_storyboard) return;

    const panel = stage2_storyboard.panels.find((p) => p.id === panelId);
    if (!panel) return;

    set((s) => {
      const next = new Set(s.generatingPanelIds);
      next.add(panelId);
      return { generatingPanelIds: next };
    });

    const imageDataUri = await generateImage(panel, apiConfig, addLog);
    const text = panel.narration_text || panel.dialogue.text || '';
    const audioDataUri = await generateTTS(text, apiConfig, addLog);

    const enriched: EnrichedPanel = {
      ...panel,
      imageDataUri,
      audioDataUri,
      bgmDataUri: '',
      actualDuration: panel.estimated_duration,
    };

    set((s) => {
      const existing = s.stage3_panels || [];
      const idx = existing.findIndex((p) => p.id === panelId);
      const nextPanels = idx >= 0
        ? existing.map((p) => (p.id === panelId ? enriched : p))
        : [...existing, enriched];
      const nextGen = new Set(s.generatingPanelIds);
      nextGen.delete(panelId);
      return { stage3_panels: nextPanels, generatingPanelIds: nextGen };
    });
  },

  updateBlock: (id, content) =>
    set((s) => ({
      stage1_blocks: s.stage1_blocks.map((b) => (b.id === id ? { ...b, content } : b)),
    })),

  addBlock: (afterId, type) =>
    set((s) => {
      const newBlock: StoryBlock = {
        id: `block-${Date.now()}`,
        type,
        content: type === 'scene' ? '新场景' : type === 'dialogue' ? '新对话' : type === 'action' ? '新动作' : '新叙述',
        ...(type === 'scene' ? { sceneHeader: { location: '未指定', time: '未指定', mood: '未指定' } } : {}),
        ...(type === 'dialogue' ? { speaker: '角色' } : {}),
      };
      if (afterId === null) {
        return { stage1_blocks: [...s.stage1_blocks, newBlock] };
      }
      const idx = s.stage1_blocks.findIndex((b) => b.id === afterId);
      const next = [...s.stage1_blocks];
      next.splice(idx + 1, 0, newBlock);
      return { stage1_blocks: next };
    }),

  deleteBlock: (id) =>
    set((s) => ({
      stage1_blocks: s.stage1_blocks.filter((b) => b.id !== id),
    })),

  updateBlockType: (id, type) =>
    set((s) => ({
      stage1_blocks: s.stage1_blocks.map((b) => {
        if (b.id !== id) return b;
        const updated: StoryBlock = { ...b, type };
        if (type === 'scene' && !b.sceneHeader) {
          updated.sceneHeader = { location: '未指定', time: '未指定', mood: '未指定' };
        }
        if (type !== 'scene') {
          delete updated.sceneHeader;
        }
        if (type === 'dialogue' && !b.speaker) {
          updated.speaker = '角色';
        }
        if (type !== 'dialogue') {
          delete updated.speaker;
        }
        return updated;
      }),
    })),

  updateBlockField: (id, field) =>
    set((s) => ({
      stage1_blocks: s.stage1_blocks.map((b) => (b.id === id ? { ...b, ...field } : b)),
    })),

  updatePanel: (id, data) =>
    set((s) => {
      if (!s.stage3_panels) return s;
      return { stage3_panels: s.stage3_panels.map((p) => (p.id === id ? { ...p, ...data } : p)) };
    }),

  updateStoryboardPanel: (id, data) =>
    set((s) => {
      if (!s.stage2_storyboard) return s;
      return {
        stage2_storyboard: {
          ...s.stage2_storyboard,
          panels: s.stage2_storyboard.panels.map((p) => (p.id === id ? { ...p, ...data } : p)),
        },
      };
    }),

  addLog: (log) => set((s) => ({ stage3_logs: [...s.stage3_logs, log] })),
}));
