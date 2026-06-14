import type { StoryBlock, Storyboard } from '@/types';

export const demoStory = `雨后的夜晚，空气里弥漫着潮湿的金属味。街角霓虹灯在积水中碎成一片片红色的光斑。

林默站在巷口，压低帽檐。他等了三个小时，终于看见那个穿灰大衣的男人从酒吧后门走出来。

灰大衣男人（低声）：东西带来了吗？

林默（掏出信封，眼神警惕）：我要先验货。

灰大衣男人笑了笑，从口袋里取出一枚青铜钥匙，在路灯下晃了晃。钥匙表面刻着古怪的纹路，像某种眼睛的图案。

灰大衣男人：你会后悔的。这扇门一旦打开，就关不上了。

林默没有回答。他接过钥匙，指尖触碰到金属的瞬间，一阵冰冷的刺痛顺着脊背爬上来。远处的雷声滚过屋顶，雨又要下了。`;

export function detectFormat(text: string): 'novel' | 'screenplay' | 'dialogue' | 'unknown' {
  if (!text.trim()) return 'unknown';
  const hasSceneHeaders = /^[\s]*(?:场景|景|EXT\.?|INT\.?|场号)/im.test(text);
  const hasDialogueMarkers = /[\(（].*?[）\)].*[:：].+/m.test(text) || /\n[\s]*[\u4e00-\u9fa5a-zA-Z]+[:：]/m.test(text);
  if (hasSceneHeaders) return 'screenplay';
  if (hasDialogueMarkers) return 'dialogue';
  return 'novel';
}

export function parseToBlocks(text: string): StoryBlock[] {
  const format = detectFormat(text);
  const blocks: StoryBlock[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let currentSceneId = 'scene-1';
  let idx = 0;

  for (const line of lines) {
    const id = `block-${idx++}`;
    if (format === 'dialogue' || format === 'screenplay') {
      const dialogueMatch = line.match(/^(.+?)[（(](.+?)[)）][:：]\s*(.+)$/);
      if (dialogueMatch) {
        blocks.push({
          id,
          type: 'dialogue',
          speaker: dialogueMatch[1].trim(),
          content: dialogueMatch[3].trim(),
          emotionHint: dialogueMatch[2].trim(),
        });
        continue;
      }
    }
    if (/^(场景|景|EXT\.?|INT\.?)/i.test(line)) {
      currentSceneId = id;
      const parts = line.split(/[,，]/);
      blocks.push({
        id,
        type: 'scene',
        sceneHeader: {
          location: parts[0]?.replace(/^.*?[：:]/, '').trim() || '未知地点',
          time: parts[1]?.trim() || '夜晚',
          mood: parts[2]?.trim() || '神秘',
        },
        content: line,
      });
    } else if (line.includes('：') && line.length < 20 && !line.includes('。')) {
      // heuristic speaker without parenthesis
      const [speaker, ...rest] = line.split('：');
      blocks.push({ id, type: 'dialogue', speaker: speaker.trim(), content: rest.join('：').trim() });
    } else {
      blocks.push({ id, type: 'narration', content: line });
    }
  }
  return blocks;
}

export function generateStoryboardFromBlocks(blocks: StoryBlock[]): Storyboard {
  const panels: Storyboard['panels'] = [];
  let panelId = 1;
  let currentScene = '夜晚的街道，雨刚停';
  let currentMood = '神秘';

  // 角色外貌映射，用于在 image_prompt 中区分人物
  const characterAppearances: Record<string, string> = {
    '林默': 'a young man in his late 20s with short messy black hair, sharp dark eyes, wearing a dark jacket with collar turned up, lean build, faint scar on left eyebrow',
    '灰大衣男人': 'a middle-aged man in his 40s with receding gray hair, wearing a long gray overcoat and thick-rimmed glasses, stocky build',
  };

  for (const block of blocks) {
    if (block.type === 'scene' && block.sceneHeader) {
      currentScene = `${block.sceneHeader.time}的${block.sceneHeader.location}`;
      currentMood = block.sceneHeader.mood;
      continue;
    }

    const isDialogue = block.type === 'dialogue';
    const shotType = isDialogue ? 'closeup' : 'wide';
    const speaker = block.speaker || '';
    const appearance = characterAppearances[speaker] || '';

    let imagePrompt: string;
    if (isDialogue && appearance) {
      imagePrompt = `${appearance}, ${currentMood} atmosphere, speaking with emotion, ${currentScene} background, cinematic lighting, manga style`;
    } else if (isDialogue) {
      imagePrompt = `Character close-up, ${currentMood} atmosphere, speaking, ${currentScene} background, cinematic lighting, manga style`;
    } else {
      imagePrompt = `${currentMood} atmosphere, ${currentScene}, ${block.content.slice(0, 50)}, cinematic lighting, manga style`;
    }

    const desc = isDialogue
      ? `${speaker}的面部特写，${currentScene}背景`
      : currentScene;

    panels.push({
      id: panelId++,
      scene_desc: desc,
      shot_type: shotType,
      image_prompt: imagePrompt,
      dialogue: {
        speaker: isDialogue ? block.speaker || null : null,
        text: isDialogue ? block.content : '',
      },
      narration_text: isDialogue ? `${block.speaker}说道：${block.content}` : block.content,
      voice_type: isDialogue ? 'character_male' : 'narrator_male',
      estimated_duration: Math.max(3, Math.ceil(block.content.length / 5)),
    });
  }

  return {
    meta: { title: '未命名故事', author: '用户' },
    characters: [
      { id: 'narrator', name: '旁白', voice_profile: 'narrator_male', appearance: 'off-screen narrator, no visual appearance' },
      { id: 'char1', name: '林默', voice_profile: 'character_male', appearance: 'A young man in his late 20s, short black hair slightly messy, sharp dark eyes, wearing a dark jacket with collar turned up, lean build, a faint scar on his left eyebrow, intense and cautious expression' },
      { id: 'char2', name: '灰大衣男人', voice_profile: 'character_male_deep', appearance: 'A middle-aged man in his 40s, receding gray hair, wearing a long gray overcoat, thick rimmed glasses, stocky build, nervous habit of adjusting his collar, shifty eyes' },
    ],
    panels,
  };
}
