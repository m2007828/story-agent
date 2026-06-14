import type { StoryboardPanel, APIConfig, APILog } from '@/types';
import { generatePlaceholderImage } from './canvasFactory';

export type LogFn = (log: APILog) => void;

function makeLog(service: APILog['service'], summary: string, status: APILog['status'], durationMs = 0): APILog {
  return { stage: 3, service, timestamp: Date.now(), requestSummary: summary, status, durationMs };
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 将图片 Blob 压缩/缩放为适合播放器的 data URI。
 * 避免超大图片导致播放器卡顿或导出 HTML 过大。
 */
function compressImageBlob(blob: Blob, maxWidth = 1200, maxHeight = 900, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      // 压缩失败时回退到原始 data URI
      blobToDataUri(blob).then(resolve).catch(reject);
    };
    img.src = url;
  });
}

/* ===================== IMAGE ===================== */

export async function generateImage(
  panel: StoryboardPanel,
  config: APIConfig,
  onLog: LogFn
): Promise<string> {
  const fullPrompt = config.imageStylePrefix
    ? `${config.imageStylePrefix}, ${panel.image_prompt}`
    : panel.image_prompt;

  switch (config.imageProvider) {
    case 'free': {
      // Pollinations.ai — 免费，无需 Key
      onLog(makeLog('ImageGen', `[#${panel.id}] 免费图像生成: ${fullPrompt.slice(0, 40)}...`, 'pending'));
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=800&height=600&seed=${panel.id}&nologo=true`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        onLog(makeLog('ImageGen', `[#${panel.id}] 图像生成成功`, 'success', 2000));
        return await compressImageBlob(blob);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误';
        onLog(makeLog('ImageGen', `[#${panel.id}] 图像生成失败: ${msg}，回退到 Canvas`, 'error', 0));
        return generatePlaceholderImage(panel);
      }
    }

    case 'openai_compatible': {
      // OpenAI 兼容接口 — 支持 OpenAI / SiliconFlow / 即梦CLI / 任何兼容服务
      onLog(makeLog('ImageGen', `[#${panel.id}] API 图像生成: ${fullPrompt.slice(0, 40)}...`, 'pending'));
      if (!config.imageApiKey) {
        onLog(makeLog('ImageGen', `[#${panel.id}] 缺少 API Key，回退到 Canvas`, 'error', 0));
        return generatePlaceholderImage(panel);
      }
      try {
        const baseUrl = config.imageBaseUrl.replace(/\/+$/, '');
        const res = await fetch(`${baseUrl}/v1/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.imageApiKey}`,
          },
          body: JSON.stringify({
            model: config.imageModel || 'dall-e-3',
            prompt: fullPrompt,
            n: 1,
            size: '1024x1024',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        // 兼容多种返回格式
        const imageUrl = data.data?.[0]?.url || data.url || data.image_url || '';
        if (!imageUrl) throw new Error('无图像 URL 返回');
        const imgRes = await fetch(imageUrl);
        const blob = await imgRes.blob();
        onLog(makeLog('ImageGen', `[#${panel.id}] API 图像生成成功`, 'success', 5000));
        return await compressImageBlob(blob);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误';
        onLog(makeLog('ImageGen', `[#${panel.id}] API 图像生成失败: ${msg}，回退到 Canvas`, 'error', 0));
        return generatePlaceholderImage(panel);
      }
    }

    case 'canvas':
    default:
      onLog(makeLog('ImageGen', `[#${panel.id}] 使用 Canvas 占位图`, 'success', 200));
      return generatePlaceholderImage(panel);
  }
}

/* ===================== TTS ===================== */

export async function generateTTS(
  text: string,
  config: APIConfig,
  onLog: LogFn
): Promise<string> {
  switch (config.ttsProvider) {
    case 'browser': {
      onLog(makeLog('TTS', `浏览器原生 TTS: ${text.slice(0, 20)}...`, 'success', 100));
      return '__BROWSER_TTS__';
    }

    case 'edge_tts': {
      onLog(makeLog('TTS', `Edge TTS: ${text.slice(0, 20)}...`, 'pending'));
      try {
        const EdgeTTSBrowserModule = await import('@kingdanx/edge-tts-browser/models/EdgeTTSBrowser.js');
        const EdgeTTSBrowser = EdgeTTSBrowserModule.default || EdgeTTSBrowserModule.EdgeTTSBrowser;
        const tts = new EdgeTTSBrowser();
        const voice = config.ttsVoice || 'zh-CN-YunxiNeural';
        tts.tts.setVoiceParams({ text, voice });
        const fileName = `tts-${Date.now()}.mp3`;
        const blob = await tts.ttsToFile(fileName);
        onLog(makeLog('TTS', `Edge TTS 合成成功 (${voice})`, 'success', 1500));
        return await blobToDataUri(blob);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误';
        onLog(makeLog('TTS', `Edge TTS 失败: ${msg}，回退到浏览器 TTS`, 'error', 0));
        return '__BROWSER_TTS__';
      }
    }

    case 'openai_compatible': {
      // OpenAI 兼容接口 — 支持 OpenAI / SiliconFlow 等兼容 /v1/audio/speech 的服务
      onLog(makeLog('TTS', `API 语音合成: ${text.slice(0, 20)}...`, 'pending'));
      if (!config.ttsApiKey) {
        onLog(makeLog('TTS', '缺少 API Key，回退到浏览器 TTS', 'error', 0));
        return '__BROWSER_TTS__';
      }
      try {
        const baseUrl = config.ttsBaseUrl.replace(/\/+$/, '');
        const res = await fetch(`${baseUrl}/v1/audio/speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.ttsApiKey}`,
          },
          body: JSON.stringify({
            model: config.ttsModel || 'tts-1',
            input: text,
            voice: config.ttsVoice || 'alloy',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || err.message || `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        onLog(makeLog('TTS', 'API 语音合成成功', 'success', 1500));
        return await blobToDataUri(blob);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误';
        onLog(makeLog('TTS', `API 语音合成失败: ${msg}，回退到浏览器 TTS`, 'error', 0));
        return '__BROWSER_TTS__';
      }
    }

    case 'qwen': {
      // 千问 TTS / CosyVoice — DashScope 专用接口
      onLog(makeLog('TTS', `千问 TTS: ${text.slice(0, 20)}...`, 'pending'));
      if (!config.ttsApiKey) {
        onLog(makeLog('TTS', '缺少 DashScope API Key，回退到浏览器 TTS', 'error', 0));
        return '__BROWSER_TTS__';
      }
      try {
        const model = config.ttsModel || 'qwen3-tts-flash';
        const voice = config.ttsVoice || 'Cherry';
        const isCosyVoice = model.startsWith('cosyvoice');
        const endpoint = isCosyVoice
          ? 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer'
          : 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
        const body = isCosyVoice
          ? { model, input: { text, voice, format: 'mp3', sample_rate: 24000 } }
          : { model, input: { text, voice } };
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.ttsApiKey}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || err.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const audioUrl = data.output?.audio?.url;
        if (!audioUrl) throw new Error('无音频 URL 返回');
        const audioRes = await fetch(audioUrl);
        const blob = await audioRes.blob();
        onLog(makeLog('TTS', `千问 TTS 合成成功 (${model}/${voice})`, 'success', 2000));
        return await blobToDataUri(blob);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '未知错误';
        onLog(makeLog('TTS', `千问 TTS 失败: ${msg}，回退到浏览器 TTS`, 'error', 0));
        return '__BROWSER_TTS__';
      }
    }

    default:
      return '__BROWSER_TTS__';
  }
}
