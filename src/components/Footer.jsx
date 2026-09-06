import { EMAIL } from '../site'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-status">
        <span className="footer-dot" />
        Currently exploring roles in the Netherlands / Germany
      </p>
      <a className="footer-email" href={`mailto:${EMAIL}`}>
        {EMAIL}
      </a>
    </footer>
  )
}
