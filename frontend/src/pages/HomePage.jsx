import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Camera, Map, MessageCircle, Sparkles } from 'lucide-react'

function HomePage() {
  return (
    <section className="page home-page">
      <motion.div className="hero-panel journal-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">SoloMate Travel Journal</p>
        <h1>今天，也有人陪你慢慢走</h1>
        <p className="lead">
          一个给独自旅行者的轻量 AI 搭子：陪你通话、看照片、收集记忆碎片，也把今天整理成温柔的旅行手账。
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/persona">
            <Sparkles size={20} />
            选择旅行搭子
          </Link>
          <Link className="voice-button" to="/chat">
            <MessageCircle size={19} />
            开始陪伴通话
          </Link>
        </div>
      </motion.div>

      <div className="quick-grid">
        <Link to="/photo" className="quick-card stamp-card">
          <Camera size={24} />
          <span>把眼前世界寄给搭子</span>
          <small>上传照片，得到温柔反馈和小小掉落</small>
        </Link>
        <Link to="/badges" className="quick-card stamp-card">
          <Map size={24} />
          <span>记忆碎片收集册</span>
          <small>徽章、成就和偶遇瞬间都收在这里</small>
        </Link>
        <Link to="/diary" className="quick-card stamp-card wide">
          <BookOpen size={24} />
          <span>今日旅行手账</span>
          <small>把路线、心情和收获整理成一页故事</small>
        </Link>
      </div>

      <Link className="soft-banner postcard-banner" to="/chat">
        <MessageCircle size={20} />
        我现在有点不知道去哪，让搭子陪我选下一站
      </Link>
    </section>
  )
}

export default HomePage
