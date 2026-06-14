export interface StoryBlock {
  id: string;
  type: 'scene' | 'narration' | 'dialogue' | 'action';
  sceneHeader?: { location: string; time: string; mood: string };
  speaker?: string;
  content: string;
  emotionHint?: string;
}

export type ShotType = 'closeup' | 'medium' | 'wide' | 'extreme_closeup' | 'long';

export interface StoryboardPanel {
  id: number;
  scene_desc: string;
  shot_type: ShotType;
  image_prompt: string;
  dialogue: { speaker: string | null; text: string };
  narration_text: string;
  voice_type: string;
  estimated_duration: number;
}

export interface Storyboard {
  meta: { title: string; author: string };
  characters: { id: string; name: string; voice_profile: string; appearance: string }[];
  panels: StoryboardPanel[];
}

export interface EnrichedPanel extends StoryboardPanel {
  imageDataUri: string;
  audioDataUri: string;
  bgmDataUri: string;
  actualDuration: number;
}

export interface APILog {
  stage: number;
  service: 'LLM' | 'ImageGen' | 'TTS' | 'BGM';
  timestamp: number;
  requestSummary: string;
  status: 'pending' | 'success' | 'error';
  durationMs: number;
}

export interface APIConfig {
  // LLM（阶段1&2）
  llmProvider: 'rule' | 'openai_compatible';
  llmApiKey: string;
  llmBaseUrl: string;
  llmModel: string;

  // 图像生成（阶段3）
  imageProvider: 'free' | 'openai_compatible' | 'canvas';
  imageApiKey: string;
  imageBaseUrl: string;
  imageModel: string;

  // 语音合成（阶段3）
  ttsProvider: 'browser' | 'edge_tts' | 'openai_compatible' | 'qwen';
  ttsApiKey: string;
  ttsBaseUrl: string;
  ttsVoice: string;
  ttsModel: string;

  // BGM
  bgmUrl: string;

  // 风格前缀，统一画风
  imageStylePrefix: string;
}

export interface ComicPlayerData {
  meta: { title: string; author: string };
  panels: Array<{
    id: number;
    image: string;
    audio: string;
    duration: number;
    subtitle: string;
    speaker: string | null;
    scene_desc: string;
  }>;
  bgm?: string;
}
