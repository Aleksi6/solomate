import { Camera, RefreshCcw, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

function QuickActionBar() {
  return (
    <nav className="quick-action-bar glass-card" aria-label={'\u5feb\u6377\u64cd\u4f5c'}>
      <Link className="ghost-button quick-action-link" to="/photo">
        <Camera size={16} />
        {'\u62cd\u7167'}
      </Link>
      <Link className="ghost-button quick-action-link" to="/badges">
        <Trophy size={16} />
        {'\u641c\u96c6\u788e\u7247'}
      </Link>
      <Link className="ghost-button quick-action-link" to="/persona">
        <RefreshCcw size={16} />
        {'\u5207\u6362\u642d\u5b50'}
      </Link>
    </nav>
  )
}

export default QuickActionBar
