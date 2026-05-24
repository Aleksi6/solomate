import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BookOpen, Home, Trophy, Users } from 'lucide-react'
import FloatingBuddy from './components/FloatingBuddy'
import BadgePage from './pages/BadgePage'
import ChatPage from './pages/ChatPage'
import CompanionSelectPage from './pages/CompanionSelectPage'
import DiaryDetailPage from './pages/DiaryDetailPage'
import DiaryPage from './pages/DiaryPage'
import HomePage from './pages/HomePage'
import MomentPage from './pages/MomentPage'
import PersonaPage from './pages/PersonaPage'
import PersonaQuizPage from './pages/PersonaQuizPage'
import PhotoPage from './pages/PhotoPage'
import { personas } from './services/api'

const tabs = [
  { to: '/', label: '今日', icon: Home },
  { to: '/persona', label: '搭子', icon: Users },
  { to: '/memory', label: '记忆', icon: Trophy },
  { to: '/diary', label: '手账', icon: BookOpen },
]

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="page-frame">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/persona" element={<PersonaPage />} />
            <Route path="/companions" element={<Navigate to="/persona" replace />} />
            <Route path="/persona/quiz" element={<PersonaQuizPage fixedCompanions={personas} onBack={() => window.history.back()} onComplete={() => window.history.back()} />} />
            <Route path="/persona-quiz" element={<Navigate to="/persona/quiz" replace />} />
            <Route path="/companion-select" element={<CompanionSelectPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:companionId" element={<ChatPage />} />
            <Route path="/photo" element={<PhotoPage />} />
            <Route path="/moment" element={<MomentPage />} />
            <Route path="/memory" element={<BadgePage />} />
            <Route path="/badges" element={<BadgePage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/diary/detail" element={<DiaryDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <nav className="bottom-nav app-nav-glass" aria-label="主导航">
          {tabs.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} className="nav-item">
                <Icon size={20} strokeWidth={2.2} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <FloatingBuddy />
      </div>
    </BrowserRouter>
  )
}

export default App
