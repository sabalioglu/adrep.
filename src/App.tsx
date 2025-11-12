import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Brain, Zap, Copy } from 'lucide-react';
import { ScrapingPage } from './pages/ScrapingPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { VariationsPage } from './pages/VariationsPage';
import { CreateAdPage } from './pages/CreateAdPage';

function App() {

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ad Intelligence Agent</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Scrape, analyze, and regenerate competitor ads with AI-powered insights
                </p>
              </div>
            </div>

            <nav className="flex gap-3 flex-wrap">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl p-4 border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-blue-500' : 'bg-blue-100'
                    }`}>
                      <Zap className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                        Automated Scraping
                      </p>
                      <p className={`text-xs ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                        Facebook & TikTok ad libraries
                      </p>
                    </div>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/analysis"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl p-4 border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-orange-500' : 'bg-orange-100'
                    }`}>
                      <Brain className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? 'text-orange-900' : 'text-gray-900'}`}>
                        Deep Analysis
                      </p>
                      <p className={`text-xs ${isActive ? 'text-orange-700' : 'text-gray-600'}`}>
                        Visual, copy, tone & audience insights
                      </p>
                    </div>
                  </>
                )}
              </NavLink>

              <NavLink
                to="/create-ad"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl p-4 border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-orange-500' : 'bg-orange-100'
                    }`}>
                      <Copy className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isActive ? 'text-orange-900' : 'text-gray-900'}`}>
                        Create Your Ad
                      </p>
                      <p className={`text-xs ${isActive ? 'text-orange-700' : 'text-gray-600'}`}>
                        Clone & customize winning ads
                      </p>
                    </div>
                  </>
                )}
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<ScrapingPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/variations" element={<VariationsPage />} />
            <Route path="/create-ad" element={<CreateAdPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
