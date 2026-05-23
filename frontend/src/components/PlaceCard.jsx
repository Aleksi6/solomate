import { MapPin, ShieldCheck } from 'lucide-react'

function PlaceCard({ place, onVisit }) {
  return (
    <article className="place-card">
      <div>
        <p className="eyebrow">{place.type}</p>
        <h3>{place.name}</h3>
        <p>{place.description}</p>
      </div>
      <div className="meta-row">
        <span>
          <MapPin size={15} />
          {place.distance}m
        </span>
        <span>
          <ShieldCheck size={15} />
          安心度 {place.safety}
        </span>
      </div>
      <div className="tag-row">
        {place.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {onVisit && (
        <button type="button" className="ghost-button" onClick={() => onVisit(place.id)}>
          记为已路过
        </button>
      )}
    </article>
  )
}

export default PlaceCard
