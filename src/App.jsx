import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Plus } from 'lucide-react';

import { RADIUS_METER } from './constants';
import { logout as apiLogout } from './api/auth';
import { saveToken, clearToken } from './api/client';
import { getMe } from './api/user';
import {
  getNearbyCapsules, createCapsule, toRecord,
  likeCapsule, unlikeCapsule,
} from './api/capsules';
import { loadLikes, saveLikes } from './utils/storage';
import Sidebar from './components/Sidebar';
import { MapCanvas } from './components/Map';
import { Panel, SortTabs } from './components/Panel';
import { RecordList } from './components/Record';
import MyPage from './components/MyPage';
import { DetailModal, EditorModal } from './components/Modal';

function Sentinel({ onVisible }) {
  const cbRef = useRef(onVisible);
  useEffect(() => {
    cbRef.current = onVisible;
  });
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) cbRef.current?.(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} style={{ height: 4 }} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState('map');
  const [sort, setSort] = useState('distance');
  const [records, setRecords] = useState([]);
  const [likes, setLikes] = useState(loadLikes);
  const [position, setPosition] = useState(null);
  const [radius, setRadius] = useState(RADIUS_METER);
  const [currentAddress, setCurrentAddress] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [autoOpenProfileEdit, setAutoOpenProfileEdit] = useState(false);
  const [nearbyOffset, setNearbyOffset] = useState(0);
  const [hasMoreNearby, setHasMoreNearby] = useState(false);
  const nearbyLoadingRef = useRef(false);

  // 앱 로드 시 로그인 상태 확인 (OAuth 콜백 URL 정리 포함)
  useEffect(() => {
    const pathname = window.location.pathname.replace(/\/+/g, '/');
    const isOAuthCallback = pathname.startsWith('/oauth/callback');
    const params = new URLSearchParams(window.location.search);
    const isNewUser = params.get('isNewUser') === 'true';
    const accessToken = params.get('accessToken');

    if (isOAuthCallback) {
      if (accessToken) saveToken(accessToken);
      window.history.replaceState(null, '', '/');
    }

    getMe()
      .then((data) => {
        setUser(data);
        setIsLoggedIn(true);
        if (isNewUser) {
          setPage('mypage');
          setAutoOpenProfileEdit(true);
        }
      })
      .catch(() => {
        setUser(null);
        setIsLoggedIn(false);
      });
  }, []);

  // GPS 준비 → 주변 캡슐 조회 (initRadius: MapCanvas에서 계산한 초기 줌 반경)
  const handleLocationReady = useCallback(
    async (lat, lng, addr, initRadius) => {
      const queryRadius = initRadius ?? radius;
      if (initRadius != null) setRadius(initRadius);
      setPosition({ lat, lng });
      setCurrentAddress(addr);
      setNearbyOffset(0);
      try {
        const apiSort = sort === 'recommend' ? 'recommended' : sort;
        const res = await getNearbyCapsules({
          latitude: lat, longitude: lng, radius: queryRadius, sort: apiSort,
        });
        const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
        setRecords(list.map((c) => toRecord(c, user?.userId)));
        setHasMoreNearby(list.length >= 20);
        const likedIds = list.filter((r) => r.likedByMe).map((r) => r.id);
        setLikes(likedIds);
        saveLikes(likedIds);
      } catch {
        // 네트워크 에러 시 빈 목록 유지
      }
    },
    [sort, user, radius],
  );

  // 지도 줌 변경 → 반경으로 재조회
  const handleRadiusChange = useCallback(
    async (newRadius) => {
      setRadius(newRadius);
      setNearbyOffset(0);
      nearbyLoadingRef.current = false;
      if (!position) return;
      try {
        const apiSort = sort === 'recommend' ? 'recommended' : sort;
        const res = await getNearbyCapsules({
          latitude: position.lat, longitude: position.lng,
          radius: newRadius, sort: apiSort, offset: 0,
        });
        const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
        setRecords(list.map((c) => toRecord(c, user?.userId)));
        setHasMoreNearby(list.length >= 20);
        const likedIds = list.filter((r) => r.likedByMe).map((r) => r.id);
        setLikes(likedIds);
        saveLikes(likedIds);
      } catch {
        // 네트워크 에러 시 현재 목록 유지
      }
    },
    [position, sort, user],
  );

  // 주변 목록 추가 로드 (무한스크롤)
  const loadMoreNearby = useCallback(async () => {
    if (!position || !hasMoreNearby || nearbyLoadingRef.current) return;
    nearbyLoadingRef.current = true;
    const nextOffset = nearbyOffset + 20;
    try {
      const apiSort = sort === 'recommend' ? 'recommended' : sort;
      const res = await getNearbyCapsules({
        latitude: position.lat, longitude: position.lng,
        radius, sort: apiSort, limit: 20, offset: nextOffset,
      });
      const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
      setRecords((prev) => [...prev, ...list.map((c) => toRecord(c, user?.userId))]);
      setNearbyOffset(nextOffset);
      setHasMoreNearby(list.length >= 20);
    } catch {
      // 추가 로드 실패 시 현재 목록 유지
    } finally {
      nearbyLoadingRef.current = false;
    }
  }, [position, radius, sort, nearbyOffset, hasMoreNearby, user]);

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

  const toggleLike = async (id) => {
    if (!requireLogin()) return;
    const wasLiked = likes.includes(id);
    const delta = wasLiked ? -1 : 1;
    const nextLikes = wasLiked ? likes.filter((l) => l !== id) : [...likes, id];

    // 낙관적 업데이트
    setLikes(nextLikes);
    saveLikes(nextLikes);
    setRecords((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likes: Math.max(0, item.likes + delta) } : item,
      ),
    );
    setSelected((prev) =>
      prev?.id === id ? { ...prev, likes: Math.max(0, prev.likes + delta) } : prev,
    );

    try {
      if (wasLiked) {
        await unlikeCapsule(id);
      } else {
        await likeCapsule(id);
      }
    } catch {
      // 롤백
      setLikes(likes);
      saveLikes(likes);
      setRecords((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, likes: Math.max(0, item.likes - delta) } : item,
        ),
      );
      setSelected((prev) =>
        prev?.id === id ? { ...prev, likes: Math.max(0, prev.likes - delta) } : prev,
      );
    }
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
      setRecords((prev) => prev.map((item) => (item.id === record.id ? record : item)));
      setEditing(null);
      setPage('mypage');
      showToast('기록을 수정했어요.');
      return;
    }

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
    clearToken();
    setUser(null);
    setIsLoggedIn(false);
    setPage('map');
    setLikes([]);
    saveLikes([]);
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
          onRadiusChange={handleRadiusChange}
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
          <div className="countText">반경 {radius}m · {nearbyRecords.length}개</div>
          <RecordList
            records={nearbyRecords}
            likes={likes}
            onLike={toggleLike}
            onSelect={setSelected}
          />
          {hasMoreNearby && <Sentinel onVisible={loadMoreNearby} />}
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
          autoOpenEdit={autoOpenProfileEdit}
          onEditOpened={() => setAutoOpenProfileEdit(false)}
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
