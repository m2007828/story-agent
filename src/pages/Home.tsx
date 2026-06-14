import { useAppStore } from '@/store/useAppStore';
import StageNav from '@/components/StageNav';
import StoryInput from '@/components/StoryInput';
import Stage1Preprocess from '@/components/Stage1Preprocess';
import Stage2Storyboard from '@/components/Stage2Storyboard';
import Stage3Assets from '@/components/Stage3Assets';
import Stage4Player from '@/components/Stage4Player';
import ApiSettings from '@/components/ApiSettings';
import { AnimatePresence, motion } from 'framer-motion';

function StageView({ stage }: { stage: number }) {
  switch (stage) {
    case 0: return <StoryInput />;
    case 1: return <Stage1Preprocess />;
    case 2: return <Stage2Storyboard />;
    case 3: return <Stage3Assets />;
    case 4: return <Stage4Player />;
    default: return <StoryInput />;
  }
}

export default function Home() {
  const currentStage = useAppStore((s) => s.currentStage);

  return (
    <div className="min-h-screen flex bg-[#0B0F19]">
      <ApiSettings />
      <StageNav />
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            <span className="neon-text">故事漫画自动演绎生成器</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Story-to-Comic Studio · 文本 → 结构化分镜 → 视觉小说阅读器
          </p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <StageView stage={currentStage} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
