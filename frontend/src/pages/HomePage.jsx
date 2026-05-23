import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Camera, Map, MessageCircle, Sparkles } from 'lucide-react'

function HomePage() {
  return (
    <section className="page home-page">
      <motion.div className="hero-panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">SoloMate</p>
        <h1>今天我陪你走</h1>
        <p className="lead">一个给单人旅行者的轻量 AI 搭子：陪你聊天、看照片、发小任务，也把今天写成日记。</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/persona">
            <Sparkles size={20} />
            选择我的搭子
          </Link>
          <Link className="voice-button" to="/chat">
            开始语音陪伴
          </Link>
        </div>
      </motion.div>

      <div className="quick-grid">
        <Link to="/photo" className="quick-card">
          <Camera size={24} />
          <span>拍照给搭子看</span>
          <small>上传照片，得到温柔反馈</small>
        </Link>
        <Link to="/badges" className="quick-card">
          <Map size={24} />
          <span>城市任务</span>
          <small>把路线变成低压力挑战</small>
        </Link>
        <Link to="/diary" className="quick-card wide">
          <BookOpen size={24} />
          <span>旅行日记入口</span>
          <small>把今日路线、心情和徽章整理成故事</small>
        </Link>
      </div>

      <Link className="soft-banner" to="/chat">
        <MessageCircle size={20} />
        我现在有点不知道去哪，让搭子推荐下一站
      </Link>
    </section>
  )
}

export default HomePage
