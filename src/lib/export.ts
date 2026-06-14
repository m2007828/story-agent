import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { playerTemplate } from './playerTemplate';
import type { EnrichedPanel } from '@/types';

export async function exportStandaloneHtml(title: string, panels: EnrichedPanel[]) {
  const data = {
    meta: { title, author: '用户' },
    panels: panels.map((p) => ({
      id: p.id,
      image: p.imageDataUri,
      audio: p.audioDataUri,
      duration: p.actualDuration,
      subtitle: p.narration_text || p.dialogue.text,
      speaker: p.dialogue.speaker,
      scene_desc: p.scene_desc || '',
    })),
  };

  const jsonStr = JSON.stringify(data);
  const html = playerTemplate
    .replace('__TITLE__', title)
    .replace('__COMIC_DATA__', jsonStr);

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${title}-视觉小说.html`);
}

export async function exportZip(title: string, panels: EnrichedPanel[]) {
  const zip = new JSZip();

  const data = {
    meta: { title, author: '用户' },
    panels: panels.map((p) => ({
      id: p.id,
      image: p.imageDataUri,
      audio: p.audioDataUri,
      duration: p.actualDuration,
      subtitle: p.narration_text || p.dialogue.text,
      speaker: p.dialogue.speaker,
      scene_desc: p.scene_desc || '',
    })),
  };

  const jsonStr = JSON.stringify(data);
  const html = playerTemplate
    .replace('__TITLE__', title)
    .replace('__COMIC_DATA__', jsonStr);

  zip.file('index.html', html);
  zip.file('README.txt', `本包由「故事漫画自动演绎生成器」导出。

双击 index.html 即可在浏览器中离线阅读。
体验视觉小说式的故事推进：点击/空格推进剧情，方向键翻页。

当前为演示版本，图片与音频由程序自动生成占位资源。
如需接入真实 AI 绘图 / TTS API，请在 Studio 中配置 API Key 后重新生成。`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${title}-视觉小说.zip`);
}
