import { TranslationSettingsPanel } from '@/modules/translation';
import SettingsPanel from '@/modules/vocab-test/components/SettingsPanel';

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto w-full max-w-2xl space-y-10 p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Settings</h1>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Translation</h2>
            <p className="text-sm text-gray-500">
              How words are looked up while you read. Saved on this device.
            </p>
          </div>
          <TranslationSettingsPanel />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Quiz</h2>
            <p className="text-sm text-gray-500">
              Tune how the spaced-repetition quiz schedules your words. Saved on this device.
            </p>
          </div>
          <SettingsPanel />
        </section>
      </div>
    </main>
  );
}
