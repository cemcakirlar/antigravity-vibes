function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="rounded-xl bg-gray-800 p-8 shadow-2xl ring-1 ring-white/10">
        <h1 className="mb-4 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Orion Web
        </h1>
        <p className="text-gray-400">
          Tailwind CSS v4 setup is working perfectly! 🚀
        </p>
        <div className="mt-6 flex gap-4">
          <button className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-500 transition">
            Get Started
          </button>
          <button className="rounded-lg bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600 transition">
            Documentation
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
