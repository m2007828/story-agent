import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { APIConfig } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Mic, Image as ImageIcon, Info, Brain, Music } from 'lucide-react';

export default function ApiSettings() {
  const [open, setOpen] = useState(false);
  const apiConfig = useAppStore((s) => s.apiConfig);
  const setApiConfig = useAppStore((s) => s.setApiConfig);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 border border-white/10 rounded bg-[#0B0F19]/80 backdrop-blur hover:border-[#00F0FF]/40 hover:text-[#00F0FF] transition-colors"
      >
        <Settings size={14} /> API 配置
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }} className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#0B0F19] border-l border-white/10 overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Settings size={16} className="text-[#00F0FF]" /> API 与服务配置
                </h2>
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-8">
                {/* ===== LLM ===== */}
                <section>
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Brain size={14} className="text-[#BD00FF]" /> 大语言模型（阶段1&2）
                  </h3>
                  <div className="bg-[#BD00FF]/5 border border-[#BD00FF]/10 rounded p-3 mb-3">
                    <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                      <Info size={14} className="text-[#BD00FF] shrink-0 mt-0.5" />
                      阶段1（内容预处理）和阶段2（分镜脚本生成）需要调用大模型。推荐 DeepSeek（极便宜）或 SiliconFlow（有免费额度），都兼容 OpenAI 接口格式。
                    </p>
                  </div>

                  <label className="block text-xs text-gray-500 mb-1">模式</label>
                  <select value={apiConfig.llmProvider} onChange={(e) => setApiConfig({ llmProvider: e.target.value as APIConfig['llmProvider'] })} className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#BD00FF]/50 mb-3">
                    <option value="rule">规则解析（不调用大模型，效果有限）</option>
                    <option value="openai_compatible">OpenAI 兼容接口（推荐）</option>
                  </select>

                  {apiConfig.llmProvider === 'openai_compatible' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Base URL</label>
                        <input type="text" value={apiConfig.llmBaseUrl} onChange={(e) => setApiConfig({ llmBaseUrl: e.target.value })} placeholder="https://api.deepseek.com" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#BD00FF]/50 font-mono" />
                        <p className="text-[10px] text-gray-600 mt-1">DeepSeek: https://api.deepseek.com | SiliconFlow: https://api.siliconflow.cn/v1</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">API Key</label>
                        <input type="password" value={apiConfig.llmApiKey} onChange={(e) => setApiConfig({ llmApiKey: e.target.value })} placeholder="sk-..." className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#BD00FF]/50 font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">模型名称</label>
                        <input type="text" value={apiConfig.llmModel} onChange={(e) => setApiConfig({ llmModel: e.target.value })} placeholder="deepseek-chat" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#BD00FF]/50 font-mono" />
                        <p className="text-[10px] text-gray-600 mt-1">DeepSeek: deepseek-chat | SiliconFlow: deepseek-ai/DeepSeek-V3</p>
                      </div>
                    </div>
                  )}
                </section>

                {/* ===== IMAGE ===== */}
                <section>
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ImageIcon size={14} className="text-[#00F0FF]" /> AI 图像生成
                  </h3>

                  <label className="block text-xs text-gray-500 mb-1">模式</label>
                  <select value={apiConfig.imageProvider} onChange={(e) => setApiConfig({ imageProvider: e.target.value as APIConfig['imageProvider'] })} className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00F0FF]/50 mb-3">
                    <option value="free">免费模式（Pollinations.ai，无需Key）</option>
                    <option value="openai_compatible">OpenAI 兼容接口（DALL·E / SiliconFlow / 即梦等）</option>
                    <option value="canvas">Canvas 占位图（本地，不调用API）</option>
                  </select>

                  {apiConfig.imageProvider === 'openai_compatible' && (
                    <div className="space-y-3">
                      <div className="bg-[#00F0FF]/5 border border-[#00F0FF]/10 rounded p-3">
                        <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <Info size={14} className="text-[#00F0FF] shrink-0 mt-0.5" />
                          填入任何兼容 OpenAI /v1/images/generations 接口的服务地址即可。支持 OpenAI DALL·E、SiliconFlow、即梦 CLI Wrapper 等。
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Base URL</label>
                        <input type="text" value={apiConfig.imageBaseUrl} onChange={(e) => setApiConfig({ imageBaseUrl: e.target.value })} placeholder="https://api.openai.com" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00F0FF]/50 font-mono" />
                        <p className="text-[10px] text-gray-600 mt-1">OpenAI: https://api.openai.com | SiliconFlow: https://api.siliconflow.cn/v1 | 即梦CLI: http://localhost:3000</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">API Key</label>
                        <input type="password" value={apiConfig.imageApiKey} onChange={(e) => setApiConfig({ imageApiKey: e.target.value })} placeholder="sk-..." className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00F0FF]/50 font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">模型名称</label>
                        <input type="text" value={apiConfig.imageModel} onChange={(e) => setApiConfig({ imageModel: e.target.value })} placeholder="dall-e-3" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00F0FF]/50 font-mono" />
                        <p className="text-[10px] text-gray-600 mt-1">OpenAI: dall-e-3 | SiliconFlow: stabilityai/stable-diffusion-xl-base-1.0 | 即梦: jimeng</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">画风前缀（统一风格）</label>
                    <input type="text" value={apiConfig.imageStylePrefix} onChange={(e) => setApiConfig({ imageStylePrefix: e.target.value })} placeholder="manga style, cinematic lighting" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00F0FF]/50" />
                  </div>
                </section>

                {/* ===== TTS ===== */}
                <section>
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Mic size={14} className="text-[#00FF9D]" /> 语音合成 (TTS)
                  </h3>

                  <label className="block text-xs text-gray-500 mb-1">模式</label>
                  <select value={apiConfig.ttsProvider} onChange={(e) => setApiConfig({ ttsProvider: e.target.value as APIConfig['ttsProvider'] })} className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50 mb-3">
                    <option value="browser">浏览器原生 TTS（免费，零配置）</option>
                    <option value="edge_tts">Edge TTS（免费，高质量中文语音）</option>
                    <option value="qwen">千问 TTS / CosyVoice（阿里云 DashScope）</option>
                    <option value="openai_compatible">OpenAI 兼容接口（OpenAI 等）</option>
                  </select>

                  {(apiConfig.ttsProvider === 'browser' || apiConfig.ttsProvider === 'edge_tts') && (
                    <div className="space-y-3">
                      <div className="bg-[#00FF9D]/5 border border-[#00FF9D]/10 rounded p-3">
                        <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <Info size={14} className="text-[#00FF9D] shrink-0 mt-0.5" />
                          {apiConfig.ttsProvider === 'browser'
                            ? '浏览器原生 TTS 无需任何配置，播放时自动朗读。音质取决于系统语音引擎。'
                            : 'Edge TTS 使用微软 Edge 的在线语音服务，完全免费、无需 API Key，中文语音质量极高（晓晓、云希等）。需要联网。'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">语音角色</label>
                        <select value={apiConfig.ttsVoice || 'zh-CN-YunxiNeural'} onChange={(e) => setApiConfig({ ttsVoice: e.target.value })} className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50">
                          <option value="zh-CN-YunxiNeural">云希（男声，新闻播报风）</option>
                          <option value="zh-CN-XiaoxiaoNeural">晓晓（女声，温柔自然）</option>
                          <option value="zh-CN-XiaoyiNeural">晓伊（女声，活泼）</option>
                          <option value="zh-CN-YunjianNeural">云健（男声，沉稳）</option>
                          <option value="zh-CN-XiaochenNeural">晓辰（女声，知性）</option>
                          <option value="zh-CN-XiaohanNeural">晓涵（女声，温暖）</option>
                          <option value="zh-CN-XiaomoNeural">晓墨（女声，成熟）</option>
                          <option value="zh-CN-XiaoruiNeural">晓瑞（女声，干练）</option>
                          <option value="zh-CN-XiaoshuangNeural">晓双（女声，童声）</option>
                          <option value="zh-CN-XiaoxuanNeural">晓萱（女声，温柔）</option>
                          <option value="zh-CN-XiaozhenNeural">晓甄（女声，端庄）</option>
                          <option value="zh-CN-YunyangNeural">云扬（男声，专业播报）</option>
                          <option value="zh-CN-YunzeNeural">云泽（男声，磁性）</option>
                          <option value="zh-CN-YunxiaNeural">云夏（男声，少年）</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {apiConfig.ttsProvider === 'qwen' && (
                    <div className="space-y-3">
                      <div className="bg-[#00FF9D]/5 border border-[#00FF9D]/10 rounded p-3">
                        <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <Info size={14} className="text-[#00FF9D] shrink-0 mt-0.5" />
                          千问 TTS 是阿里云 DashScope 提供的语音合成服务，支持多语种和情感语音。需要阿里云 DashScope API Key，可在阿里云百炼控制台获取。
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">DashScope API Key</label>
                        <input type="password" value={apiConfig.ttsApiKey} onChange={(e) => setApiConfig({ ttsApiKey: e.target.value })} placeholder="sk-..." className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50 font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">模型</label>
                        <select value={apiConfig.ttsModel || 'qwen3-tts-flash'} onChange={(e) => setApiConfig({ ttsModel: e.target.value })} className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50">
                          <option value="qwen3-tts-flash">qwen3-tts-flash（千问3，快速）</option>
                          <option value="qwen-tts">qwen-tts（千问，通用）</option>
                          <option value="cosyvoice-v3-flash">cosyvoice-v3-flash（CosyVoice，快速）</option>
                          <option value="cosyvoice-v3-plus">cosyvoice-v3-plus（CosyVoice，高质量）</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">语音角色</label>
                        {(apiConfig.ttsModel || 'qwen3-tts-flash').startsWith('cosyvoice') ? (
                          <select value={apiConfig.ttsVoice || 'longanyang'} onChange={(e) => setApiConfig({ ttsVoice: e.target.value })} className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50">
                            <option value="longanyang">龙安洋（男声，阳光大男孩）</option>
                            <option value="longanhuan">龙安欢（女声，欢脱元气）</option>
                            <option value="longcheng">龙橙（男声，阳光）</option>
                            <option value="longhua">龙华（女童，活泼）</option>
                            <option value="longshu">龙书（男声，新闻播报）</option>
                            <option value="longxiaochun">龙小淳（女声，温柔姐姐）</option>
                            <option value="longwan">龙婉（女声，知性）</option>
                          </select>
                        ) : (
                          <select value={apiConfig.ttsVoice || 'Cherry'} onChange={(e) => setApiConfig({ ttsVoice: e.target.value })} className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50">
                            <option value="Cherry">芊悦 / Cherry（女声，阳光亲切）</option>
                            <option value="Serena">苏瑶 / Serena（女声，温柔）</option>
                            <option value="Ethan">晨煦 / Ethan（男声，阳光温暖）</option>
                            <option value="Chelsie">千雪 / Chelsie（女声，二次元）</option>
                            <option value="Momo">茉兔 / Momo（女声，撒娇搞怪）</option>
                            <option value="Vivian">十三 / Vivian（女声，可爱暴躁）</option>
                            <option value="Moon">月白 / Moon（男声，率性帅气）</option>
                            <option value="Maia">四月 / Maia（女声，知性温柔）</option>
                            <option value="Kai">凯 / Kai（男声，磁性）</option>
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {apiConfig.ttsProvider === 'openai_compatible' && (
                    <div className="space-y-3">
                      <div className="bg-[#00FF9D]/5 border border-[#00FF9D]/10 rounded p-3">
                        <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                          <Info size={14} className="text-[#00FF9D] shrink-0 mt-0.5" />
                          填入任何兼容 OpenAI /v1/audio/speech 接口的服务地址即可。
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Base URL</label>
                        <input type="text" value={apiConfig.ttsBaseUrl} onChange={(e) => setApiConfig({ ttsBaseUrl: e.target.value })} placeholder="https://api.openai.com" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50 font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">API Key</label>
                        <input type="password" value={apiConfig.ttsApiKey} onChange={(e) => setApiConfig({ ttsApiKey: e.target.value })} placeholder="sk-..." className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50 font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">模型名称</label>
                        <input type="text" value={apiConfig.ttsModel} onChange={(e) => setApiConfig({ ttsModel: e.target.value })} placeholder="tts-1" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50 font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">语音角色</label>
                        <input type="text" value={apiConfig.ttsVoice} onChange={(e) => setApiConfig({ ttsVoice: e.target.value })} placeholder="alloy" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#00FF9D]/50 font-mono" />
                        <p className="text-[10px] text-gray-600 mt-1">OpenAI: alloy/echo/fable/onyx/nova/shimmer</p>
                      </div>
                    </div>
                  )}
                </section>

                {/* ===== BGM ===== */}
                <section>
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Music size={14} className="text-yellow-400" /> 背景音乐 (BGM)
                  </h3>
                  <div className="bg-yellow-500/5 border border-yellow-500/10 rounded p-3 mb-3">
                    <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                      <Info size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                      填入音频文件直链即可作为全局 BGM。免费音乐来源：Pixabay Music、Free Music Archive。也可留空不使用 BGM。
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">BGM 音频 URL</label>
                    <input type="text" value={apiConfig.bgmUrl} onChange={(e) => setApiConfig({ bgmUrl: e.target.value })} placeholder="https://cdn.pixabay.com/.../music.mp3" className="w-full bg-[#141B2D] border border-white/10 rounded px-3 py-2 text-sm text-gray-200 outline-none focus:border-yellow-400/50 font-mono" />
                  </div>
                </section>

                <div className="pt-4 border-t border-white/5">
                  <button onClick={() => setOpen(false)} className="w-full py-2 text-sm font-bold rounded bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30 hover:bg-[#00F0FF]/20 transition-all">
                    保存并关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
