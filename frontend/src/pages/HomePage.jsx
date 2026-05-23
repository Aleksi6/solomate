import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Camera, MessageCircle, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { resetDemoState } from '../store/demoState'

function HomePage() {
  const navigate = useNavigate()

  const handleResetDemo = () => {
    resetDemoState()
    navigate('/', { replace: true })
    window.location.reload()
  }

  return (
    <section className="page home-page diffuse-bg">
      <motion.section
        className="home-hero glass-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="home-hero-orb-wrap">
          <div className="gradient-orb home-hero-orb" aria-hidden="true" />
          <div className="voice-orb voice-wave home-buddy-orb" aria-hidden="true" />
        </div>

        <div className="home-hero-copy">
          <p className="eyebrow">SoloMate</p>
          <h1 className="page-title">今天，我陪你走</h1>
          <p className="page-subtitle">一个人出发，也有人陪你看见世界。</p>
        </div>

        <div className="home-hero-actions">
          <Link className="primary-button" to="/persona">
            <Sparkles size={20} />
            选择我的旅行搭子
          </Link>
          <Link className="ghost-button" to="/photo">
            <Camera size={19} />
            拍照发给搭子
          </Link>
          <button type="button" className="ghost-button" onClick={handleResetDemo}>
            <RotateCcw size={19} />
            重置 Demo
          </button>
        </div>
      </motion.section>

      <section className="home-entry-grid" aria-label="辅助入口">
        <Link to="/chat" className="soft-card home-entry-card">
          <MessageCircle size={22} />
          <strong>陪伴通话</strong>
          <span>慢慢说，搭子会在这里接住你的状态和计划。</span>
        </Link>
        <Link to="/badges" className="soft-card home-entry-card stamp-card">
          <Trophy size={22} />
          <strong>记忆碎片</strong>
          <span>任务、徽章和一路上的小瞬间，都会留在这里。</span>
        </Link>
        <Link to="/diary" className="soft-card home-entry-card home-entry-wide">
          <BookOpen size={22} />
          <strong>旅行手账</strong>
          <span>把今天的路线、心情和风景，整理成一页温柔的旅行记录。</span>
        </Link>
      </section>
    </section>
  )
}

export default HomePage
