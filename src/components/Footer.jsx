import '../styles/components/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <p className="footer__text">© {new Date().getFullYear()} HS 컴퓨터 예약 시스템</p>
        <p className="footer__meta">문의: lab-admin@office.hanseo.ac.kr</p>
      </div>
    </footer>
  );
}
