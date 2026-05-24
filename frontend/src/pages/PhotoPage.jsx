import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Save, Sparkles } from 'lucide-react'
import MemoryDropToast from '../components/MemoryDropToast'
import MemoryFragmentCard from '../components/MemoryFragmentCard'
import PhotoModeTabs from '../components/PhotoModeTabs'
import { analyzePhoto, completeTask as completeTaskApi, tasks } from '../services/api'
import { completeTask as saveCompletedTask, getDemoState, saveMemoryFragment } from '../store/demoState'
import { triggerMemoryDrop } from '../utils/memoryDrops'

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024

const PHOTO_TASKS = tasks.filter((task) => ['firework_photo_task', 'local_food_task', 'safe_route_task'].includes(task.id))

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('read_failed'))
    reader.readAsDataURL(file)
  })

const createSouvenirFragment = ({ imageDataUrl, personaId, placeName, city }) => ({
  id: `fragment-${Date.now()}`,
  type: 'photo',
  image_data_url: imageDataUrl,
  thumbnail: imageDataUrl,
  created_at: new Date().toISOString(),
  place_name: placeName || '',
  city: city || '',
  persona_id: personaId,
  scene_summary: '这一张被我收进今天的手账里了。',
  safety_observation: '',
  photo_advice: '如果你愿意，之后也可以再补一张更靠近现场细节的版本。',
  reply_text: '这张照片我先替你收好，它会变成今天碎片册里的一页。',
  visual_tags: [],
  detected_scene_type: 'souvenir',
  task_result: {
    passed: false,
    reward_badge: '',
    reason: '这是一张手动收藏的记忆碎片，没有触发任务判定。',
  },
  badges_unlocked: [],
  is_rare: false,
})

function PhotoPage() {
  const [activeMode, setActiveMode] = useState('environment')
  const [selectedTaskId, setSelectedTaskId] = useState('firework_photo_task')
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [environmentResult, setEnvironmentResult] = useState(null)
  const [souvenirDraft, setSouvenirDraft] = useState(null)
  const [dropToast, setDropToast] = useState(null)
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const state = useMemo(() => getDemoState(), [])
  const personaId = state.selectedPersona?.id || 'gentle_friend'
  const liveContext = state.conversationState?.live_context || {}
  const currentPlaceName = state.conversationState?.current_place || liveContext.place_name || state.conversationState?.target_place || ''
  const currentCity = state.conversationState?.current_city || liveContext.city || ''

  useEffect(() => {
    if (!dropToast) return undefined
    const timer = window.setTimeout(() => setDropToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [dropToast])

  useEffect(
    () => () => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    },
    [preview],
  )

  const selectedTask = PHOTO_TASKS.find((task) => task.id === selectedTaskId) || PHOTO_TASKS[0]

  const resetAnalysisState = () => {
    setEnvironmentResult(null)
    setSouvenirDraft(null)
    setIsSaved(false)
    setError('')
  }

  const handleModeChange = (mode) => {
    setActiveMode(mode)
    setSelectedFile(null)
    if (preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setPreview('')
    resetAnalysisState()
    setDropToast(null)
  }

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('这次先发图片给搭子吧，其他文件格式我还接不住。')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('这张图有点大了，尽量控制在 8MB 以内，我会更稳地接住。')
      return
    }

    const nextPreview = URL.createObjectURL(file)
    if (preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }

    setSelectedFile(file)
    setPreview(nextPreview)
    resetAnalysisState()

    const imageDataUrl = await readFileAsDataUrl(file)

    if (activeMode === 'souvenir') {
      setSouvenirDraft(
        createSouvenirFragment({
          imageDataUrl,
          personaId,
          placeName: currentPlaceName,
          city: currentCity,
        }),
      )
      return
    }

    setIsAnalyzing(true)

    try {
      const analysis = await analyzePhoto({
        file,
        task_id: selectedTaskId,
        persona_id: personaId,
        user_question: `请看这张图是否符合${selectedTask.title}。`,
      })

      setEnvironmentResult(analysis)

      const fragmentId = `fragment-${Date.now()}`
      const unlockedBadge = analysis.task_result?.passed ? analysis.task_result?.reward_badge || '' : ''
      const fragment = {
        id: fragmentId,
        type: 'photo',
        image_data_url: imageDataUrl,
        thumbnail: imageDataUrl,
        created_at: new Date().toISOString(),
        place_name: currentPlaceName,
        city: currentCity,
        persona_id: personaId,
        scene_summary: analysis.scene_summary || '',
        safety_observation: analysis.safety_observation || '',
        photo_advice: analysis.photo_advice || '',
        reply_text: analysis.reply_text || '',
        visual_tags: [],
        detected_scene_type: selectedTaskId,
        task_result: {
          passed: Boolean(analysis.task_result?.passed),
          reward_badge: unlockedBadge,
          reason: analysis.task_result?.reason || '',
        },
        badges_unlocked: unlockedBadge ? [unlockedBadge] : [],
        is_rare: false,
      }

      saveMemoryFragment(fragment)

      if (analysis.task_result?.passed) {
        await completeTaskApi({ task_id: selectedTaskId, passed: true })
        saveCompletedTask(selectedTaskId, unlockedBadge, fragmentId)
      }

      setDropToast(
        triggerMemoryDrop('environment_analysis') || {
          title: analysis.task_result?.passed ? '已收进碎片册' : '分析结果已保存',
          description: analysis.task_result?.passed
            ? '这张照片已经带着搭子的评论一起收进今天的记忆碎片里了。'
            : '这张照片已经留进碎片册里，之后还可以继续回看。',
          rarity: 'common',
        },
      )
    } catch {
      setError('这次照片分析没有顺利返回，不过页面不会丢。你可以再试一次。')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSaveSouvenir = () => {
    if (!souvenirDraft || isSaved) return
    saveMemoryFragment(souvenirDraft)
    setIsSaved(true)
    setDropToast(
      triggerMemoryDrop('souvenir_saved') || {
        title: '已收进碎片册',
        description: '这张照片已经安安稳稳地躺进今天的手账里了。',
        rarity: 'common',
      },
    )
  }

  return (
    <section className="page photo-page diffuse-bg">
      <div className="page-intro photo-page-intro">
        <p className="eyebrow">寄照片给搭子</p>
        <h1 className="page-title">寄照片给搭子</h1>
        <p className="page-subtitle">把眼前的街景、光线和小小纪念寄出去。搭子会替你看看这个世界，也替你把瞬间收进手账。</p>
      </div>

      <PhotoModeTabs activeMode={activeMode} onChange={handleModeChange} />

      {activeMode === 'environment' && (
        <section className="glass-card soft-card photo-task-picker" aria-label="照片任务选择">
          <p className="eyebrow">分析任务</p>
          <div className="suggestion-row">
            {PHOTO_TASKS.map((task) => (
              <button
                key={task.id}
                type="button"
                className={`pill-button ${selectedTaskId === task.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedTaskId(task.id)}
                disabled={isAnalyzing}
              >
                {task.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <label className="upload-box postcard-upload glass-card photo-postcard-uploader">
        {preview ? <img src={preview} alt="上传预览" /> : <ImagePlus size={40} />}
        <div className="photo-upload-copy">
          <strong>{preview ? '换一张照片' : activeMode === 'environment' ? '把现在的风景寄给搭子' : '把这个瞬间收进明信片'}</strong>
          <span>
            {activeMode === 'environment'
              ? '上传后，搭子会先看一眼场景，再把分析结果和任务判定一起收进碎片册。'
              : '上传后，这张照片会先变成一枚可保存的手账碎片。'}
          </span>
        </div>
        <input type="file" accept="image/*" onChange={handleUpload} />
      </label>

      {error ? <p className="page-subtitle">{error}</p> : null}

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

      {activeMode === 'environment' && !environmentResult && selectedFile && isAnalyzing ? (
        <article className="analysis-card glass-card">
          <p className="eyebrow">正在分析</p>
          <p>搭子正在看这张图，我会尽量把场景、建议和任务判断一起接住。</p>
        </article>
      ) : null}

      <MemoryDropToast drop={dropToast} onClose={() => setDropToast(null)} />
    </section>
  )
}

export default PhotoPage
