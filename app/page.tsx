export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Adapt MVP
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            AI-Powered Training Platform for B2B Companies
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Automatically generate interactive training courses from your company&apos;s knowledge base.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/status"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              System Status
            </a>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-3xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">Upload Knowledge</h3>
            <p className="text-gray-600">
              Upload your company docs (TXT, DOCX, PDF) and let AI analyze them.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Generation</h3>
            <p className="text-gray-600">
              Alice AI creates quiz and open-ended questions automatically.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Monitor employee progress, results, and identify problem areas.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
