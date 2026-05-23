import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, Sparkles } from 'lucide-react'
import { analyzePhoto, completeTask as completeTaskApi } from '../services/api'
import { completeTask as saveCompletedTask } from '../store/demoState'

function PhotoPage() {
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    const analysis = await analyzePhoto({
      image: file.name,
      task_id: 'firework_photo_task',
      user_question: '这张照片能完成任务吗？',
    })
    setResult(analysis)
    if (analysis.task_result?.passed) {
      await completeTaskApi({ task_id: 'firework_photo_task', passed: true })
      saveCompletedTask('firework_photo_task', analysis.task_result.reward_badge)
    }
  }

  return (
    <section className="page">
      <p className="eyebrow">拍照给搭子看</p>
      <h1>把这一刻发给我</h1>
      <p className="lead">先用 mock 看图反馈跑通 Demo：选择任意图片后，会生成照片氛围、建议和徽章解锁结果。</p>

      <label className="upload-box">
        {preview ? <img src={preview} alt="上传预览" /> : <ImagePlus size={38} />}
        <span>{preview ? '换一张照片' : '上传一张旅行照片'}</span>
        <input type="file" accept="image/*" onChange={handleUpload} />
      </label>

      {result && (
        <article className="analysis-card">
          <Sparkles size={22} />
          <h2>{result.reply_text}</h2>
          <p>{result.scene_summary}</p>
          <p>{result.safety_observation}</p>
          <p>{result.photo_advice}</p>
          <p>{result.task_result?.reason}</p>
          <Link className="primary-button" to="/badges">
            查看徽章
          </Link>
        </article>
      )}
    </section>
  )
}

export default PhotoPage
