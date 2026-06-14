import type { StoryboardPanel } from '@/types';

const moodGradients: Record<string, [string, string]> = {
  雨: ['#0f172a', '#1e1b4b'],
  夜: ['#020617', '#1e1b4b'],
  暗: ['#000000', '#1e293b'],
  神秘: ['#1e1b4b', '#312e81'],
  紧张: ['#450a0a', '#7f1d1d'],
  悲伤: ['#1e293b', '#334155'],
  喜悦: ['#3f6212', '#14532d'],
  默认: ['#0f172a', '#334155'],
};

function pickGradient(text: string): [string, string] {
  for (const [key, colors] of Object.entries(moodGradients)) {
    if (text.includes(key)) return colors;
  }
  return moodGradients['默认'];
}

function drawPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function generatePlaceholderImage(panel: StoryboardPanel): string {
  const canvas = document.createElement('canvas');
  const w = 800;
  const h = 600;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const [c1, c2] = pickGradient(panel.scene_desc + panel.image_prompt);

  // Background gradient
  const grd = ctx.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, c1);
  grd.addColorStop(1, c2);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // Stars / particles
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    const sr = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Neon grid lines at bottom
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < w; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, h * 0.6);
    ctx.lineTo(i - 100, h);
    ctx.stroke();
  }

  // Central shape based on shot_type
  ctx.save();
  ctx.translate(w / 2, h / 2);

  const shapeColor = 'rgba(0, 240, 255, 0.08)';
  const strokeColor = 'rgba(0, 240, 255, 0.35)';

  switch (panel.shot_type) {
    case 'wide':
      // City silhouette
      ctx.fillStyle = shapeColor;
      ctx.fillRect(-300, 50, 100, 200);
      ctx.fillRect(-150, 20, 120, 230);
      ctx.fillRect(50, 80, 90, 170);
      ctx.fillRect(200, 40, 110, 210);
      ctx.strokeStyle = strokeColor;
      ctx.strokeRect(-300, 50, 100, 200);
      ctx.strokeRect(-150, 20, 120, 230);
      ctx.strokeRect(50, 80, 90, 170);
      ctx.strokeRect(200, 40, 110, 210);
      break;
    case 'closeup':
      // Face oval
      ctx.fillStyle = shapeColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 120, 160, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Eyes
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(-40, -20, 20, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(40, -20, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'medium':
      // Body rectangle
      ctx.fillStyle = shapeColor;
      ctx.fillRect(-80, -120, 160, 320);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(-80, -120, 160, 320);
      // Head
      ctx.beginPath();
      ctx.arc(0, -160, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'extreme_closeup':
      // Eye detail
      ctx.fillStyle = shapeColor;
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(189, 0, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'long':
      // Mountains / horizon
      ctx.fillStyle = shapeColor;
      ctx.beginPath();
      ctx.moveTo(-400, 100);
      ctx.lineTo(-200, -80);
      ctx.lineTo(0, 60);
      ctx.lineTo(200, -100);
      ctx.lineTo(400, 80);
      ctx.lineTo(400, 300);
      ctx.lineTo(-400, 300);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
  }

  ctx.restore();

  // Frame border
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // Text watermark
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '24px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`分镜 #${panel.id}`, w / 2, 50);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '16px "Noto Sans SC", sans-serif';
  const promptText = panel.image_prompt.slice(0, 24) + (panel.image_prompt.length > 24 ? '…' : '');
  ctx.fillText(promptText, w / 2, h - 30);

  // Shot type badge
  ctx.fillStyle = 'rgba(189, 0, 255, 0.2)';
  ctx.fillRect(w - 120, h - 60, 100, 30);
  ctx.strokeStyle = 'rgba(189, 0, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(w - 120, h - 60, 100, 30);
  ctx.fillStyle = 'rgba(189, 0, 255, 0.9)';
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(panel.shot_type.toUpperCase(), w - 70, h - 40);

  return canvas.toDataURL('image/png');
}

export function generateSilentAudioDataUri(durationSeconds: number): string {
  // Generate a very short WAV header + silence to simulate audio file
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const byteRate = sampleRate * 1 * 1;
  const blockAlign = 1;
  const bitsPerSample = 8;
  const dataSize = numSamples;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    view.setUint8(44 + i, 128); // silence
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
