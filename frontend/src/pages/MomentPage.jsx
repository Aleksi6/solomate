import { useState } from 'react'
import { Check, Heart, ImagePlus } from 'lucide-react'
import { saveMoodMoment } from '../utils/memoryStorage'

const moodTags = ['轻松', '有点累', '想记录', '小确幸', '晚风', '迷路了']

const readImageAsDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve('')
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })

function MomentPage() {
  const [text, setText] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [imageName, setImageName] = useState('')
  const [imageData, setImageData] = useState('')
  const [saved, setSaved] = useState(false)

  const toggleTag = (tag) => {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    setImageName(file?.name || '')
    setImageData(await readImageAsDataUrl(file))
  }

  const handleSave = () => {
    saveMoodMoment({
      content: text,
      tags: selectedTags,
      image: imageData,
      title: text ? text.slice(0, 12) : imageName || '此刻心情',
    })
    setSaved(true)
  }

  return (
    <section className="page moment-page diffuse-bg">
      <div className="page-intro">
        <p className="eyebrow">Moment</p>
        <h1 className="page-title">记录此刻心情</h1>
        <p className="page-subtitle">把这一刻留给今天。</p>
      </div>

      <section className="glass-card moment-panel">
        <textarea
          className="moment-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="把这一刻留给今天"
        />

        <div className="moment-tag-row">
          {moodTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`pill-button ${selectedTags.includes(tag) ? 'is-active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <label className="ghost-button moment-upload-button">
          <ImagePlus size={16} />
          {imageName || '可选上传图片'}
          <input type="file" accept="image/*" onChange={handleImageChange} hidden />
        </label>

        {imageData ? <img className="moment-upload-preview" src={imageData} alt={imageName || 'moment upload'} /> : null}

        <button type="button" className="primary-button full" onClick={handleSave}>
          {saved ? <Check size={18} /> : <Heart size={18} />}
          {saved ? '已经收进今天' : '收进今天'}
        </button>
      </section>
    </section>
  )
}

export default MomentPage
