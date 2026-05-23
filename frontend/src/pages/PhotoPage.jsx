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
    <section className="page photo-page diffuse-bg">
      <div className="page-intro photo-page-intro">
        <p className="eyebrow">寄给搭子</p>
        <h1 className="page-title">寄给搭子</h1>
        <p className="page-subtitle">
          把眼前的街景、光线和小小纪念寄出去。搭子会替你看看这个世界，也替你把瞬间收进手账。
        </p>
      </div>

      <PhotoModeTabs activeMode={activeMode} onChange={handleModeChange} />

      <label className="upload-box postcard-upload glass-card photo-postcard-uploader">
        {preview ? <img src={preview} alt="上传预览" /> : <ImagePlus size={40} />}
        <div className="photo-upload-copy">
          <strong>{preview ? '换一张照片' : activeMode === 'environment' ? '把现在的风景寄给搭子' : '把这个瞬间收进明信片'}</strong>
          <span>{activeMode === 'environment' ? '上传后，搭子会看看你现在身处怎样的环境。' : '上传后，会先生成一张可保存的纪念物碎片卡。'}</span>
        </div>
        <input type="file" accept="image/*" onChange={handleUpload} />
      </label>

      {activeMode === 'environment' && environmentResult && (
        <article className="analysis-card postcard-result photo-analysis-card">
          <div className="photo-analysis-head">
            <div className="call-card-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="eyebrow">搭子正在看你看到的世界</p>
              <h2>{environmentResult.reply_text}</h2>
            </div>
          </div>
          <div className="photo-analysis-notes">
            <p>{environmentResult.scene_summary}</p>
            <p>{environmentResult.safety_observation}</p>
            <p>{environmentResult.photo_advice}</p>
            <p>{environmentResult.task_result?.reason}</p>
          </div>
          <Link className="primary-button" to="/badges">
            查看记忆碎片
          </Link>
        </article>
      )}

      {activeMode === 'souvenir' && souvenirDraft && (
        <section className="souvenir-preview postcard-preview-panel" aria-label="纪念物碎片预览">
          <div className="photo-analysis-head">
            <div className="call-card-icon">
              <Save size={18} />
            </div>
            <div>
              <p className="eyebrow">旅行手账预览</p>
              <h2>先看看这张要不要留下</h2>
            </div>
          </div>
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
