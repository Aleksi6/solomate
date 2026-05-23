import { LockKeyhole, Trophy } from 'lucide-react'

function BadgeCard({ badge, unlocked }) {
  return (
    <article className={`badge-card ${unlocked ? 'is-unlocked' : ''}`}>
      <div className="badge-medal">{unlocked ? <Trophy size={28} /> : <LockKeyhole size={25} />}</div>
      <h3>{badge.name}</h3>
      <p>{badge.description}</p>
      <span>{unlocked ? '已解锁' : '待解锁'}</span>
    </article>
  )
}

export default BadgeCard
