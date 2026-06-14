import QuizSession from '@/modules/vocab-test/components/QuizSession';

export default function TestPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 md:p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800 sm:text-3xl">Vocabulary Quiz</h1>
        <QuizSession />
      </div>
    </main>
  );
}
