import type { StoryBlock, Storyboard, APIConfig, APILog } from '@/types';

export type LogFn = (log: APILog) => void;

function makeLog(stage: number, service: APILog['service'], summary: string, status: APILog['status'], durationMs = 0): APILog {
  return { stage, service, timestamp: Date.now(), requestSummary: summary, status, durationMs };
}

/* ===================== LLM - 阶段1 内容预处理 ===================== */

const STAGE1_SYSTEM_PROMPT = `你是一个资深故事编剧和叙事设计师。用户会给你一段原始文本（可能是草稿、大纲、零散片段或完整故事），你需要对其进行"故事化处理"：

1. **重新叙述与润色**：将原文改写为更具画面感、节奏感和戏剧张力的叙事文本。补充环境描写、心理活动、动作细节，使故事更加生动。
2. **增删改查**：可以增加过渡段落、补充细节、删除冗余内容、调整叙事顺序，使故事结构更完整。
3. **结构化拆分**：将处理后的故事拆分为结构化的"故事块"列表。

每个故事块必须包含以下字段：
- type: "scene" | "narration" | "dialogue" | "action"
- content: 经过润色后的内容（不是原文照搬，而是经过你重新叙述的版本）
- sceneHeader: (仅type=scene时) { location, time, mood }
- speaker: (仅type=dialogue时) 说话人
- emotionHint: (可选) 情绪提示

重要规则：
- 对话内容可以适当润色，但保留核心语义和说话人意图
- 叙述部分应大幅增强画面感和氛围感
- 场景描写要具体，包含时间、地点、氛围
- 动作描写要有动态感和细节
- 如果原文过于简略，可以合理扩展；如果过于冗长，可以精简
- 确保故事块之间的叙事连贯性

请严格输出JSON数组，不要输出任何其他内容。格式示例：
[
  {"type":"scene","content":"深夜的废弃工厂区，锈迹斑斑的铁门在风中吱呀作响，远处传来野狗的吠叫","sceneHeader":{"location":"废弃工厂","time":"深夜","mood":"阴森"}},
  {"type":"narration","content":"林默靠在墙角，指尖夹着半截香烟，烟头的红光在黑暗中明灭不定。他已经在这里等了三个小时。"},
  {"type":"dialogue","speaker":"林默","content":"东西呢？别浪费我时间。","emotionHint":"不耐烦"},
  {"type":"action","content":"灰大衣男人从怀中掏出一个牛皮纸信封，缓缓递了过来，手指微微颤抖。"}
]`;

export async function llmParseBlocks(
  rawText: string,
  config: APIConfig,
  onLog: LogFn
): Promise<StoryBlock[]> {
  if (config.llmProvider === 'rule') {
    // 回退到规则解析
    const { parseToBlocks } = await import('./mockData');
    return parseToBlocks(rawText);
  }

  onLog(makeLog(1, 'LLM', `POST ${config.llmBaseUrl}/chat/completions - 故事内容预处理`, 'pending'));

  try {
    const res = await fetch(`${config.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          { role: 'system', content: STAGE1_SYSTEM_PROMPT },
          { role: 'user', content: rawText },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 尝试提取 JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('LLM 返回内容中未找到 JSON 数组');

    const parsed = JSON.parse(jsonMatch[0]);
    const blocks: StoryBlock[] = parsed.map((b: Record<string, unknown>, i: number) => ({
      id: `block-${i}`,
      type: b.type as StoryBlock['type'],
      content: String(b.content || ''),
      sceneHeader: b.sceneHeader as StoryBlock['sceneHeader'],
      speaker: b.speaker as string | undefined,
      emotionHint: b.emotionHint as string | undefined,
    }));

    onLog(makeLog(1, 'LLM', `预处理完成，识别 ${blocks.length} 个故事块`, 'success', 2000));
    return blocks;
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误';
    onLog(makeLog(1, 'LLM', `LLM 调用失败: ${msg}，回退到规则解析`, 'error', 0));
    const { parseToBlocks } = await import('./mockData');
    return parseToBlocks(rawText);
  }
}

/* ===================== LLM - 阶段2 分镜脚本生成 ===================== */

const STAGE2_SYSTEM_PROMPT = `你是一个专业的漫画分镜师和AI绘图提示词专家。用户会给你结构化的故事块，你需要将其转化为漫画分镜脚本。

每个分镜(panel)需要包含：
- id: 序号(从1开始)
- scene_desc: 场景描述(简短)
- shot_type: "closeup" | "medium" | "wide" | "extreme_closeup" | "long"
- image_prompt: 英文画面描述(用于AI绘图，必须详细包含以下要素)
- dialogue: { speaker: string|null, text: string }
- narration_text: 旁白文本(用于TTS朗读)
- voice_type: 语音类型标识
- estimated_duration: 预估时长(秒)

**image_prompt 编写规则（极其重要）**：
1. 必须用英文撰写
2. 必须明确描述画面中每个角色的外貌特征，包括：性别、年龄、发色发型、服装、体型、显著特征（如伤疤、配饰等）
3. 不同角色必须有清晰的视觉区分度，避免角色混淆
4. 包含角色的具体动作和表情描述
5. 包含环境背景、光影氛围、天气等场景要素
6. 包含构图和景别描述（如 from behind, over shoulder, profile 等）
7. 示例："A young man in his 20s with short black hair, wearing a dark gray trench coat and fedora hat, standing under a flickering neon sign with a cautious expression, rain-soaked street reflecting red neon lights, cinematic low-key lighting, manga style"

**角色表(characters)编写规则**：
1. 为每个出场角色创建详细的角色档案
2. appearance 字段必须包含：性别、年龄、发型发色、瞳色、肤色、体型、标志性服装、配饰、显著特征
3. 角色描述要足够具体，使AI绘图时能稳定生成一致的角色形象

规则：
1. 每句对话或关键动作一般一个分镜
2. image_prompt 必须用英文，详细描述画面，特别要区分不同角色
3. 保持叙事节奏
4. 严格输出JSON对象，格式：{ "meta": { "title": "...", "author": "..." }, "characters": [...], "panels": [...] }

characters 数组中每个角色格式：
{ "id": "角色ID", "name": "角色名", "voice_profile": "语音标识", "appearance": "详细英文外貌描述，用于AI绘图时保持角色一致性" }`;

export async function llmGenerateStoryboard(
  blocks: StoryBlock[],
  rawText: string,
  config: APIConfig,
  onLog: LogFn
): Promise<Storyboard> {
  if (config.llmProvider === 'rule') {
    const { generateStoryboardFromBlocks } = await import('./mockData');
    return generateStoryboardFromBlocks(blocks);
  }

  onLog(makeLog(2, 'LLM', `POST ${config.llmBaseUrl}/chat/completions - 分镜脚本生成`, 'pending'));

  try {
    const blocksSummary = blocks.map(b => `[${b.type}] ${b.speaker ? b.speaker + ': ' : ''}${b.content}`).join('\n');

    const res = await fetch(`${config.llmBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel,
        messages: [
          { role: 'system', content: STAGE2_SYSTEM_PROMPT },
          { role: 'user', content: `原始故事：\n${rawText.slice(0, 2000)}\n\n结构化故事块：\n${blocksSummary}` },
        ],
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('LLM 返回内容中未找到 JSON 对象');

    const storyboard = JSON.parse(jsonMatch[0]) as Storyboard;

    // 确保 panels 有 id
    storyboard.panels = storyboard.panels.map((p, i) => ({
      ...p,
      id: p.id || i + 1,
    }));

    onLog(makeLog(2, 'LLM', `分镜生成完成，共 ${storyboard.panels.length} 个镜头`, 'success', 3000));
    return storyboard;
  } catch (e) {
    const msg = e instanceof Error ? e.message : '未知错误';
    onLog(makeLog(2, 'LLM', `LLM 调用失败: ${msg}，回退到规则生成`, 'error', 0));
    const { generateStoryboardFromBlocks } = await import('./mockData');
    return generateStoryboardFromBlocks(blocks);
  }
}
