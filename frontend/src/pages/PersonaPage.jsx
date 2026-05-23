import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PersonaCard from '../components/PersonaCard'
import { personas } from '../services/api'
import { getDemoState, setSelectedPersona } from '../store/demoState'

function PersonaPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(getDemoState().selectedPersona.id)

  const handleSelect = (personaId) => {
    const persona = personas.find((item) => item.id === personaId) || personas[0]
    setSelectedPersona(persona)
    setSelected(personaId)
    navigate('/chat')
  }

  return (
    <section className="page">
      <p className="eyebrow">选择旅行搭子</p>
      <h1>今天想被怎样陪伴？</h1>
      <p className="lead">选一个适合当前心情的人格。之后聊天、拍照和日记都会沿用这个搭子的语气。</p>
      <div className="persona-list">
        {personas.map((persona) => (
          <PersonaCard key={persona.id} persona={persona} active={selected === persona.id} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  )
}

export default PersonaPage
