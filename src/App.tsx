import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Hero Section with Mesh Background */}
      <div className="mesh-background min-h-screen flex flex-col items-center justify-center gap-8 p-8">
        
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-4">
          <span className="text--gold">DechBar</span> App
        </h1>
        <p className="text-xl text-gray-600 text-center mb-8">
          Test Tailwind + FOUNDATION Design System
        </p>

        {/* Glass Card */}
        <div className="glass-card p-8 max-w-2xl w-full space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            🎨 Glassmorphism Card
          </h2>
          <p className="text-gray-700">
            Tento card používá <code className="px-2 py-1 bg-gray-200 rounded text-sm">backdrop-filter: blur(20px)</code> z modern-effects.css
          </p>
          
          {/* Counter */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCount(count - 1)}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-200 scale-spring"
            >
              -
            </button>
            <span className="text-3xl font-bold text-gray-900 min-w-[60px] text-center">
              {count}
            </span>
            <button 
              onClick={() => setCount(count + 1)}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-200 scale-spring"
            >
              +
            </button>
          </div>
        </div>

        {/* Gold Button (from modern-effects.css) */}
        <button className="button--gold px-8 py-4 rounded-xl text-lg font-semibold ripple scale-spring">
          ✨ Gold Button with Shimmer
        </button>

        {/* Elevated Card */}
        <div className="card--elevated bg-white p-6 rounded-xl max-w-md w-full">
          <h3 className="text-xl font-semibold mb-2">Elevated Card</h3>
          <p className="text-gray-600">Hover over me to see lift effect!</p>
        </div>

        {/* 4 Temperaments Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mt-8">
          {/* Sangvinik */}
          <div className="card--sangvinik glass-card p-6 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="font-semibold text-lg mb-2">Sangvinik</h4>
            <p className="text-sm text-gray-700">Fun & Playful</p>
          </div>

          {/* Cholerik */}
          <div className="card--cholerik glass-card p-6 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <h4 className="font-semibold text-lg mb-2">Cholerik</h4>
            <p className="text-sm text-gray-700">Fast & Efficient</p>
          </div>

          {/* Melancholik */}
          <div className="card--melancholik glass-card p-6 text-center">
            <div className="text-4xl mb-2">📚</div>
            <h4 className="font-semibold text-lg mb-2">Melancholik</h4>
            <p className="text-sm text-gray-700">Depth & Quality</p>
          </div>

          {/* Flegmatik */}
          <div className="card--flegmatik glass-card p-6 text-center">
            <div className="text-4xl mb-2">🕊️</div>
            <h4 className="font-semibold text-lg mb-2">Flegmatik</h4>
            <p className="text-sm text-gray-700">Calm & Peaceful</p>
          </div>
        </div>

        {/* Tailwind Utilities Test */}
        <div className="mt-12 space-y-4">
          <h3 className="text-2xl font-bold text-center">Tailwind Test</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-gold px-4 py-2 rounded-lg shadow-gold">Gold Color</div>
            <div className="bg-success px-4 py-2 rounded-lg text-white shadow-md">Success</div>
            <div className="bg-sangvinik-primary px-4 py-2 rounded-lg text-white shadow-sangvinik">Sangvinik</div>
            <div className="bg-cholerik-secondary px-4 py-2 rounded-lg text-white shadow-cholerik">Cholerik</div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
