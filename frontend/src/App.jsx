import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BookOpen, Camera, Home, MessageCircle, Trophy, Users } from 'lucide-react'
import FloatingBuddy from './components/FloatingBuddy'
import HomePage from './pages/HomePage'
import PersonaPage from './pages/PersonaPage'
import ChatPage from './pages/ChatPage'
import PhotoPage from './pages/PhotoPage'
import BadgePage from './pages/BadgePage'
import DiaryPage from './pages/DiaryPage'

const tabs = [
  { to: '/', label: '首页', icon: Home },
  { to: '/persona', label: '搭子', icon: Users },
  { to: '/chat', label: '通话', icon: MessageCircle },
  { to: '/photo', label: '拍照', icon: Camera },
  { to: '/badges', label: '碎片', icon: Trophy },
  { to: '/diary', label: '手账', icon: BookOpen },
]

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="page-frame">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/persona" element={<PersonaPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/photo" element={<PhotoPage />} />
            <Route path="/badges" element={<BadgePage />} />
            <Route path="/diary" element={<DiaryPage />} />
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
