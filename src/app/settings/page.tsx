import SettingsPanel from '@/modules/vocab-test/components/SettingsPanel';

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 md:p-8">
        <h1 className="mb-1 text-2xl font-bold text-gray-800 sm:text-3xl">Quiz Settings</h1>
        <p className="mb-6 text-sm text-gray-500">
          Tune how the spaced-repetition quiz schedules your words. Saved on this device.
        </p>
        <SettingsPanel />
      </div>
    </main>
  );
}
