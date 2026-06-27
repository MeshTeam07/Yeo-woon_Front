import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Plus } from 'lucide-react';

import { RADIUS_METER } from './constants';
import { logout as apiLogout } from './api/auth';
import { saveToken, clearToken } from './api/client';
import { getMe } from './api/user';
import {
  getNearbyCapsules,
  createCapsule,
  updateCapsule,
  deleteCapsule,
  toRecord,
  likeCapsule,
  unlikeCapsule,
  getSeasonalSongs,
} from './api/capsules';
import { getPresignedUrl, uploadFileToS3 } from './api/uploads';
import { loadLikes, saveLikes } from './utils/storage';
import Sidebar from './components/Sidebar';
import { MapCanvas } from './components/Map';
import { Panel, SortTabs } from './components/Panel';
import { RecordList, SeasonalSongCard } from './components/Record';
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
      ([e]) => {
        if (e.isIntersecting) cbRef.current?.();
      },
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
  const [season, setSeason] = useState(null);
  const [seasonalRecords, setSeasonalRecords] = useState([]);
  const [records, setRecords] = useState([]);
  const [likes, setLikes] = useState(loadLikes);
  const [position, setPosition] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [autoOpenProfileEdit, setAutoOpenProfileEdit] = useState(false);
  const [nearbyOffset, setNearbyOffset] = useState(0);
  const [hasMoreNearby, setHasMoreNearby] = useState(false);
  const [nearbyTotal, setNearbyTotal] = useState(null);
  const nearbyLoadingRef = useRef(false);
  const [myRecordsVersion, setMyRecordsVersion] = useState(0);

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

  // GPS 준비 → 주변 캡슐 조회 (반경 항상 100m 고정)
  const handleLocationReady = useCallback(
    async (lat, lng, addr) => {
      setPosition({ lat, lng });
      setCurrentAddress(addr);
      setNearbyOffset(0);
      try {
        const apiSort = sort === 'recommend' ? 'recommended' : sort === 'seasonal' ? 'distance' : sort;
        const res = await getNearbyCapsules({
          latitude: lat,
          longitude: lng,
          radius: RADIUS_METER,
          sort: apiSort,
        });
        const total = res?.totalCount ?? null;
        const list = Array.isArray(res)
          ? res
          : (res?.capsules ?? res?.content ?? []);
        setNearbyTotal(total);
        setRecords(list.map((c) => toRecord(c, user?.userId, user)));
        setHasMoreNearby(
          list.length >= 20 && (total == null || list.length < total),
        );
        const likedIds = list.filter((r) => r.isLiked).map((r) => r.id);
        setLikes(likedIds);
        saveLikes(likedIds);
      } catch {
        // 네트워크 에러 시 빈 목록 유지
      }
    },
    [sort, user],
  );

  // 지도 줌 변경 (반경 항상 100m 고정, 재조회 없음)
  const handleRadiusChange = useCallback(
    async () => {
      setNearbyOffset(0);
      nearbyLoadingRef.current = false;
      if (!position) return;
      try {
        const apiSort = sort === 'recommend' ? 'recommended' : sort === 'seasonal' ? 'distance' : sort;
        const res = await getNearbyCapsules({
          latitude: position.lat,
          longitude: position.lng,
          radius: RADIUS_METER,
          sort: apiSort,
          offset: 0,
        });
        const total = res?.totalCount ?? null;
        const list = Array.isArray(res)
          ? res
          : (res?.capsules ?? res?.content ?? []);
        setNearbyTotal(total);
        setRecords(list.map((c) => toRecord(c, user?.userId, user)));
        setHasMoreNearby(
          list.length >= 20 && (total == null || list.length < total),
        );
        const likedIds = list.filter((r) => r.isLiked).map((r) => r.id);
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
        latitude: position.lat,
        longitude: position.lng,
        radius: RADIUS_METER,
        sort: apiSort,
        limit: 20,
        offset: nextOffset,
      });
      const total = res?.totalCount ?? nearbyTotal;
      const list = Array.isArray(res)
        ? res
        : (res?.capsules ?? res?.content ?? []);
      if (res?.totalCount != null) setNearbyTotal(res.totalCount);
      setRecords((prev) => {
        const merged = [...prev, ...list.map((c) => toRecord(c, user?.userId, user))];
        setHasMoreNearby(
          list.length >= 20 && (total == null || merged.length < total),
        );
        return merged;
      });
      setNearbyOffset(nextOffset);
    } catch {
      // 추가 로드 실패 시 현재 목록 유지
    } finally {
      nearbyLoadingRef.current = false;
    }
  }, [position, sort, nearbyOffset, hasMoreNearby, nearbyTotal, user]);

  const nearbyRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      if (sort === 'distance') return a.distance - b.distance;
      if (sort === 'recommend') return b.score + b.likes - (a.score + a.likes);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [records, sort]);

  const myRecords = records.filter((item) => item.owner === 'me');

  // 계절순: season 선택 시 seasonal-songs API 호출
  useEffect(() => {
    if (sort !== 'seasonal' || !season || !position) {
      if (sort !== 'seasonal') setSeasonalRecords([]);
      return;
    }
    getSeasonalSongs({ latitude: position.lat, longitude: position.lng, radius: RADIUS_METER, season })
      .then((res) => {
        const seasons = res?.seasons ?? [];
        const target = seasons.find((s) => s.season === season);
        setSeasonalRecords(target?.songs ?? []);
      })
      .catch(() => setSeasonalRecords([]));
  }, [sort, season, position]);

  // 좋아요 탭에서 API로 로드한 항목 ID를 likes state에 병합
  const handleLikedIdsLoaded = useCallback((ids) => {
    setLikes((prev) => {
      const newIds = ids.filter((id) => !prev.includes(id));
      if (newIds.length === 0) return prev;
      const merged = [...prev, ...newIds];
      saveLikes(merged);
      return merged;
    });
  }, []);

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
        item.id === id
          ? { ...item, likes: Math.max(0, item.likes + delta) }
          : item,
      ),
    );
    setSelected((prev) =>
      prev?.id === id
        ? { ...prev, likes: Math.max(0, prev.likes + delta) }
        : prev,
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
          item.id === id
            ? { ...item, likes: Math.max(0, item.likes - delta) }
            : item,
        ),
      );
      setSelected((prev) =>
        prev?.id === id
          ? { ...prev, likes: Math.max(0, prev.likes - delta) }
          : prev,
      );
    }
  };

  const deleteRecord = async (id) => {
    try {
      await deleteCapsule(id);
    } catch {
      showToast('삭제에 실패했어요. 다시 시도해주세요.');
      return;
    }
    setRecords((prev) => prev.filter((item) => item.id !== id));
    const nextLikes = likes.filter((l) => l !== id);
    setLikes(nextLikes);
    saveLikes(nextLikes);
    setMyRecordsVersion((v) => v + 1);
    showToast('기록을 삭제했어요.');
  };

  const uploadBlobImage = async (blobUrl) => {
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    const file = new File([blob], 'capsule-photo.jpg', { type: blob.type || 'image/jpeg' });
    const result = await getPresignedUrl({ fileName: file.name, contentType: file.type });
    console.log('[uploadBlobImage] presigned URL response:', result);
    const presignedUrl = result?.presignedUrl ?? result?.uploadUrl ?? result?.url;
    const fileUrl = result?.fileUrl ?? result?.publicUrl ?? result?.objectUrl ?? result?.imageUrl;
    if (!presignedUrl || !fileUrl) throw new Error(`presigned URL 응답 필드 없음: ${JSON.stringify(result)}`);
    await uploadFileToS3(presignedUrl, file);
    return fileUrl;
  };

  const upsertRecord = async (record) => {
    const song = record.songs?.[0] || {};
    let photoUrl = record.image || null;
    if (photoUrl?.startsWith('blob:')) {
      try {
        photoUrl = await uploadBlobImage(photoUrl);
      } catch {
        showToast('이미지 업로드에 실패했어요.');
        return;
      }
    }

    if (record.id) {
      try {
        const updated = await updateCapsule(record.id, {
          place: {
            latitude: record.lat ?? position?.lat,
            longitude: record.lng ?? position?.lng,
            address: record.address,
          },
          memo: record.message,
          photoUrl,
          song: {
            provider: song.provider || 'ITUNES',
            externalTrackId: song.externalTrackId || '',
            title: song.title,
            artist: song.artist,
            albumCoverUrl: song.albumImage || '',
            previewUrl: song.previewUrl || '',
            musicUrl: song.musicUrl || '',
          },
        });
        const updatedRecord = toRecord(updated, user?.userId, user);
        setRecords((prev) => prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item)));
      } catch {
        showToast('수정에 실패했어요. 다시 시도해주세요.');
        return;
      }
      setMyRecordsVersion((v) => v + 1);
      setEditing(null);
      setPage('mypage');
      showToast('기록을 수정했어요.');
      return;
    }

    try {
      const created = await createCapsule({
        place: {
          latitude: position?.lat,
          longitude: position?.lng,
          address: record.address,
        },
        memo: record.message,
        photoUrl,
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
      const newRecord = toRecord(created, user?.userId, user);
      setRecords((prev) => [newRecord, ...prev]);
      setMyRecordsVersion((v) => v + 1);
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
        onLogout={handleLogout}
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
          onClick={() =>
            requireLogin() &&
            setEditing({ songs: [{}], address: currentAddress })
          }
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
          <SortTabs
            value={sort}
            onChange={(newSort) => {
              if (newSort !== 'seasonal') setSeason(null);
              setSort(newSort);
            }}
            season={season}
            onSeasonChange={setSeason}
          />
          {sort === 'seasonal' ? (
            season ? (
              <>
                <div className="countText">
                  반경 {RADIUS_METER}m · {seasonalRecords.length}개 노래
                </div>
                <div className="seasonalSongList">
                  {seasonalRecords.length === 0 && (
                    <div className="empty">이 계절에 남겨진 여운이 없어요.</div>
                  )}
                  {seasonalRecords.map((entry, i) => (
                    <SeasonalSongCard key={entry.song?.id ?? i} entry={entry} />
                  ))}
                </div>
              </>
            ) : (
              <div className="countText" style={{ textAlign: 'center', padding: '24px 0' }}>
                계절을 선택해주세요
              </div>
            )
          ) : (
            <>
              <div className="countText">
                반경 {RADIUS_METER}m · 총 {nearbyTotal ?? nearbyRecords.length}개
              </div>
              <RecordList
                records={nearbyRecords}
                likes={likes}
                onLike={toggleLike}
                onSelect={setSelected}
              />
              {hasMoreNearby && <Sentinel onVisible={loadMoreNearby} />}
            </>
          )}
        </Panel>
      )}

      {page === 'mypage' && isLoggedIn && (
        <MyPage
          user={user}
          onUserUpdate={setUser}
          myRecords={myRecords}
          likes={likes}
          onLike={toggleLike}
          onSelect={setSelected}
          onEdit={setEditing}
          onDelete={deleteRecord}
          onClose={() => setPage('map')}
          onLogout={handleLogout}
          autoOpenEdit={autoOpenProfileEdit}
          onEditOpened={() => setAutoOpenProfileEdit(false)}
          onLikedIdsLoaded={handleLikedIdsLoaded}
          myRecordsVersion={myRecordsVersion}
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
          onClose={() => setEditing(null)}
          onSubmit={upsertRecord}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;
