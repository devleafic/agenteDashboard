import './KortexFace.css';

const KortexFace = ({ className = '', ...props }) => (
  <svg
    viewBox="10 7 32 38"
    className={`kortex-face${className ? ` ${className}` : ''}`}
    fill="none"
    focusable="false"
    {...props}
  >
    <path d="M16 16 Q20 19, 24 16" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M30 16 Q34 13, 38 16" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="20" cy="25" r="3" fill="currentColor" className="kortex-eye" />
    <circle cx="34" cy="24" r="3" fill="currentColor" className="kortex-eye" />
    <path d="M27 27 L23 40" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
    <path d="M23 40 L29 40" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
  </svg>
);

export default KortexFace;
