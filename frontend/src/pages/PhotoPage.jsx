import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Save, Sparkles } from 'lucide-react'
import MemoryDropToast from '../components/MemoryDropToast'
import MemoryFragmentCard from '../components/MemoryFragmentCard'
import PhotoModeTabs from '../components/PhotoModeTabs'
import { analyzePhoto, completeTask as completeTaskApi } from '../services/api'
import { completeTask as saveCompletedTask } from '../store/demoState'
import { saveMemoryFragment, triggerMemoryDrop } from '../utils/memoryDrops'

const formatDate = () =>
  new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())

const createSouvenirFragment = ({ fileName, image }) => ({
  id: `souvenir-${Date.now()}`,
  type: 'souvenir',
  title: '今天捡到的一小片光',
  description: `这张照片被收进旅行手账啦。${fileName ? `来自 ${fileName}，` : ''}像一枚轻轻盖下的邮戳，提醒你来过这里。`,
  collectedAt: formatDate(),
  location: '今日旅途中',
  image,
})

function PhotoPage() {
  const [activeMode, setActiveMode] = useState('environment')
  const [preview, setPreview] = useState('')
  const [environmentResult, setEnvironmentResult] = useState(null)
  const [souvenirDraft, setSouvenirDraft] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [dropToast, setDropToast] = useState(null)

  const showDrop = (drop) => {
    if (drop) setDropToast(drop)
  }

  const handleModeChange = (mode) => {
    setActiveMode(mode)
    setPreview('')
    setEnvironmentResult(null)
    setSouvenirDraft(null)
    setIsSaved(false)
    setDropToast(null)
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const image = URL.createObjectURL(file)
    setPreview(image)
    setIsSaved(false)

    if (activeMode === 'souvenir') {
      setEnvironmentResult(null)
      setSouvenirDraft(createSouvenirFragment({ fileName: file.name, image }))
      return
    }

    setSouvenirDraft(null)
    const analysis = await analyzePhoto({
      image: file.name,
      task_id: 'firework_photo_task',
      user_question: '这张照片能完成任务吗？',
    })
    setEnvironmentResult(analysis)
    if (analysis.task_result?.passed) {
      await completeTaskApi({ task_id: 'firework_photo_task', passed: true })
      saveCompletedTask('firework_photo_task', analysis.task_result.reward_badge)
      showDrop(triggerMemoryDrop('environment_analysis'))
    }
  }

  const handleSaveSouvenir = () => {
    if (!souvenirDraft || isSaved) return
    saveMemoryFragment(souvenirDraft)
    setIsSaved(true)
    showDrop(triggerMemoryDrop('souvenir_saved'))
  }

  return (
    <section className="page photo-page">
      <div className="page-intro">
        <p className="eyebrow">寄给搭子的明信片</p>
        <h1>{activeMode === 'environment' ? '把眼前世界寄给我' : '收下一枚纪念物碎片'}</h1>
        <p className="lead">
          {activeMode === 'environment'
            ? '分享你眼前的环境，我会帮你看看氛围、安全感和下一步小建议。'
            : '选一张想留下的照片，SoloMate 会先帮你做成一张旅行手账小卡片。'}
        </p>
      </div>

      <PhotoModeTabs activeMode={activeMode} onChange={handleModeChange} />

      <label className="upload-box postcard-upload">
        {preview ? <img src={preview} alt="上传预览" /> : <ImagePlus size={38} />}
        <span>{preview ? '换一张照片' : activeMode === 'environment' ? '上传一张环境照片' : '上传一张纪念物照片'}</span>
        <input type="file" accept="image/*" onChange={handleUpload} />
      </label>

      {activeMode === 'environment' && environmentResult && (
        <article className="analysis-card postcard-result">
          <Sparkles size={22} />
          <h2>{environmentResult.reply_text}</h2>
          <p>{environmentResult.scene_summary}</p>
          <p>{environmentResult.safety_observation}</p>
          <p>{environmentResult.photo_advice}</p>
          <p>{environmentResult.task_result?.reason}</p>
          <Link className="primary-button" to="/badges">
            查看记忆碎片
          </Link>
        </article>
      )}

      {activeMode === 'souvenir' && souvenirDraft && (
        <section className="souvenir-preview" aria-label="纪念物碎片预览">
          <p className="eyebrow">手账预览</p>
          <MemoryFragmentCard fragment={souvenirDraft} />
          <button type="button" className="primary-button full" onClick={handleSaveSouvenir} disabled={isSaved}>
            <Save size={18} />
            {isSaved ? '已收进记忆碎片' : '保存到记忆碎片'}
          </button>
        </section>
      )}

      <MemoryDropToast drop={dropToast} onClose={() => setDropToast(null)} />
    </section>
  )
}

export default PhotoPage
