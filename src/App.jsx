import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lock, Plus } from 'lucide-react';

import { RADIUS_METER } from './constants';
import { logout as apiLogout } from './api/auth';
import { getMe } from './api/user';
import { getNearbyCapsules, createCapsule, toRecord } from './api/capsules';
import { loadLikes, saveLikes } from './utils/storage';
import Sidebar from './components/Sidebar';
import { MapCanvas } from './components/Map';
import { Panel, SortTabs } from './components/Panel';
import { RecordList } from './components/Record';
import MyPage from './components/MyPage';
import { DetailModal, EditorModal } from './components/Modal';

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState('map');
  const [sort, setSort] = useState('distance');
  const [records, setRecords] = useState([]);
  const [likes, setLikes] = useState(loadLikes);
  const [position, setPosition] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  // 앱 로드 시 로그인 상태 확인
  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data);
        setIsLoggedIn(true);
      })
      .catch(() => {
        setUser(null);
        setIsLoggedIn(false);
      });
  }, []);

  // GPS 준비 → 주변 캡슐 조회
  const handleLocationReady = useCallback(
    async (lat, lng, addr) => {
      setPosition({ lat, lng });
      setCurrentAddress(addr);
      try {
        const res = await getNearbyCapsules({ latitude: lat, longitude: lng, sort });
        const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
        setRecords(list.map((c) => toRecord(c, user?.userId)));
      } catch {
        // 네트워크 에러 시 빈 목록 유지
      }
    },
    [sort, user],
  );

  const nearbyRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      if (sort === 'distance') return a.distance - b.distance;
      if (sort === 'recommend') return b.score + b.likes - (a.score + a.likes);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [records, sort]);

  const myRecords = records.filter((item) => item.owner === 'me');
  const likedRecords = records.filter((item) => likes.includes(item.id));

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 1600);
  };

  const requireLogin = () => {
    if (!isLoggedIn) {
      showToast('로그인 후 이용할 수 있어요.');
      return false;
    }
    return true;
  };

  const toggleLike = (id) => {
    if (!requireLogin()) return;
    const isLiked = likes.includes(id);
    const nextLikes = isLiked ? likes.filter((l) => l !== id) : [...likes, id];
    const amount = isLiked ? -1 : 1;

    setLikes(nextLikes);
    saveLikes(nextLikes);

    setRecords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likes: Math.max(0, item.likes + amount) } : item,
      ),
    );
    setSelected((prev) =>
      prev?.id === id ? { ...prev, likes: Math.max(0, prev.likes + amount) } : prev,
    );
  };

  const deleteRecord = (id) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
    const nextLikes = likes.filter((l) => l !== id);
    setLikes(nextLikes);
    saveLikes(nextLikes);
    showToast('기록을 삭제했어요.');
  };

  const upsertRecord = async (record) => {
    if (record.id) {
      // 수정: 로컬만 반영 (수정 API 없음)
      setRecords((prev) => prev.map((item) => (item.id === record.id ? record : item)));
      setEditing(null);
      setPage('mypage');
      showToast('기록을 수정했어요.');
      return;
    }

    // 신규: API 호출
    try {
      const song = record.songs?.[0] || {};
      const created = await createCapsule({
        latitude: position?.lat,
        longitude: position?.lng,
        address: record.address,
        memo: record.message,
        photoUrl: record.image || null,
        song: {
          provider: 'ITUNES',
          externalTrackId: song.externalTrackId || '',
          title: song.title,
          artist: song.artist,
          albumCoverUrl: song.albumImage || '',
          previewUrl: song.previewUrl || '',
          musicUrl: song.musicUrl || '',
        },
      });
      const newRecord = toRecord(created, user?.userId);
      setRecords((prev) => [newRecord, ...prev]);
      setEditing(null);
      setPage('mypage');
      showToast('새 여운을 남겼어요.');
    } catch {
      showToast('저장에 실패했어요. 다시 시도해주세요.');
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // 무시
    }
    setUser(null);
    setIsLoggedIn(false);
    setPage('map');
    showToast('로그아웃 되었어요.');
  };

  return (
    <div className={`app ${page !== 'map' ? 'panelOpen' : ''}`}>
      <Sidebar
        page={page}
        setPage={setPage}
        isLoggedIn={isLoggedIn}
        user={user}
        requireLogin={requireLogin}
      />

      <main className="mapArea">
        <MapCanvas
          records={nearbyRecords}
          likes={likes}
          onLike={toggleLike}
          onSelect={setSelected}
          onLocationReady={handleLocationReady}
        />

        <button
          className={`writeButton ${!isLoggedIn ? 'locked' : ''}`}
          onClick={() => requireLogin() && setEditing({ songs: [{}], address: currentAddress })}
        >
          {isLoggedIn ? <Plus size={26} /> : <Lock size={22} />}
          순간 남기기
        </button>
      </main>

      {page === 'nearby' && (
        <Panel
          title={currentAddress || '내 주변'}
          subtitle="주변"
          onClose={() => setPage('map')}
        >
          <SortTabs value={sort} onChange={setSort} />
          <div className="countText">반경 {RADIUS_METER}m · {nearbyRecords.length}개</div>
          <RecordList
            records={nearbyRecords}
            likes={likes}
            onLike={toggleLike}
            onSelect={setSelected}
          />
        </Panel>
      )}

      {page === 'mypage' && isLoggedIn && (
        <MyPage
          user={user}
          onUserUpdate={setUser}
          myRecords={myRecords}
          likedRecords={likedRecords}
          likes={likes}
          onLike={toggleLike}
          onSelect={setSelected}
          onEdit={setEditing}
          onDelete={deleteRecord}
          onClose={() => setPage('map')}
          onLogout={handleLogout}
        />
      )}

      {selected && (
        <DetailModal
          record={selected}
          liked={likes.includes(selected.id)}
          onClose={() => setSelected(null)}
          onLike={() => toggleLike(selected.id)}
        />
      )}

      {editing && (
        <EditorModal
          initial={editing}
          position={position}
          onClose={() => setEditing(null)}
          onSubmit={upsertRecord}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
