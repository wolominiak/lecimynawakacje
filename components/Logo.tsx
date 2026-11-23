import { IcoPlane } from './Icons';
export default function Logo() {
  return (
    <a href="/" className="logo" aria-label="Lecimy na wakacje - strona główna">
      <span className="logo-mark"><IcoPlane size={18} /></span>
      <span>lecimynawakacje<small>przewodnik po kierunkach</small></span>
    </a>
  );
}
