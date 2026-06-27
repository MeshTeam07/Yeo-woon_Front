import { Lock, LogIn, LogOut, Music2, UserRound } from 'lucide-react';
import yeowoonLogo from '../../assets/main_icon_yeowoon.png';
import './Sidebar.css';

function AuthButton({ isLoggedIn, setAuth }) {
  return (
    <button className="authButton" onClick={() => setAuth(!isLoggedIn)}>
      {isLoggedIn ? <LogOut size={17} /> : <LogIn size={17} />}
      {isLoggedIn ? '로그아웃' : '임시 로그인'}
    </button>
  );
}

function Sidebar({ page, setPage, isLoggedIn, setAuth, requireLogin }) {
  const goHome = () => setPage('map');

  const toggleNearby = () => {
    setPage(page === 'nearby' ? 'map' : 'nearby');
  };

  const toggleMypage = () => {
    if (!requireLogin()) return;
    setPage(page === 'mypage' ? 'map' : 'mypage');
  };

  return (
    <aside className="sidebar">
      <button className="brandHome" onClick={goHome} aria-label="홈으로 이동">
        <img src={yeowoonLogo} alt="여운 대표 이미지" />
        <h1>
          <span>여</span>
          <span>운</span>
        </h1>
      </button>

      <button
        className={page === 'nearby' ? 'active' : ''}
        onClick={toggleNearby}
      >
        <Music2 />
        주변
      </button>

      <button
        className={page === 'mypage' ? 'active' : ''}
        onClick={toggleMypage}
      >
        {isLoggedIn ? <UserRound /> : <Lock />}
        마이페이지
      </button>

      <AuthButton isLoggedIn={isLoggedIn} setAuth={setAuth} />
    </aside>
  );
}

export default Sidebar;
