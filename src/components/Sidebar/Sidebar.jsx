import { Lock, Music2, UserRound } from 'lucide-react';
import yeowoonLogo from '../../assets/main_icon_yeowoon.png';
import googleIcon from '../../assets/google_icon.png';
import './Sidebar.css';

function Sidebar({ page, setPage, isLoggedIn, user, requireLogin, onLogout }) {
  const goHome = () => setPage('map');

  const toggleNearby = () => {
    setPage(page === 'nearby' ? 'map' : 'nearby');
  };

  const toggleMypage = () => {
    if (!requireLogin()) return;
    setPage(page === 'mypage' ? 'map' : 'mypage');
  };

  const handleLogin = () => {
    window.location.href =
      import.meta.env.VITE_GOOGLE_LOGIN_URL || '/oauth2/authorization/google';
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

      {isLoggedIn ? (
        <button className="authButton sidebarProfile" onClick={toggleMypage}>
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="프로필"
              className="sidebarAvatar"
            />
          ) : (
            <UserRound size={22} />
          )}
          <span className="authButtonText">
            {user?.nickname || '내 정보'}
          </span>
        </button>
      ) : (
        <button className="authButton" onClick={handleLogin}>
          <img src={googleIcon} alt="Google" className="googleIcon" />
          로그인
        </button>
      )}
    </aside>
  );
}

export default Sidebar;
