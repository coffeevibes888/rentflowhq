import { ChatBox } from '@/components/shared/chatbox';

export const metadata = {
  title: 'Support Chat | Rocken My Vibe',
  description: 'Get help from our AI assistant and live agents',
};

export default function ChatPage() {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto h-screen flex flex-col md:flex-row gap-4 p-4">
        <div className="md:w-2/3 h-full">
          <ChatBox />
        </div>
        <div className="md:w-1/3 hidden md:flex flex-col bg-slate-100 dark:bg-slate-900 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              💬 Chat Features
            </h3>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <li>✓ AI-powered responses</li>
              <li>✓ Live agent support</li>
              <li>✓ Real-time messaging</li>
              <li>✓ Message history</li>
              <li>✓ Typing indicators</li>
              <li>✓ Timestamps</li>
            </ul>
          </div>

          <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              🚀 Try These
            </h3>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <li>&bull; &quot;Hello&quot;</li>
              <li>&bull; &quot;How do I track my order?&quot;</li>
              <li>&bull; &quot;What&apos;s your return policy?&quot;</li>
              <li>&bull; &quot;Do you have my size?&quot;</li>
            </ul>
          </div>

          <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              📝 About
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              This chat interface supports both AI and live agent responses. The AI learns from conversations, and live agents can take over anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
