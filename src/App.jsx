import { useMemo, useState } from 'react';
import { Lock, Plus } from 'lucide-react';

import { AUTH_KEY, loadLikes, loadRecords, saveLikes, saveRecords } from './utils/storage';
import Sidebar from './components/Sidebar';
import { MapCanvas } from './components/Map';
import { Panel, SortTabs } from './components/Panel';
import { RecordList } from './components/Record';
import MyPage from './components/MyPage';
import { DetailModal, EditorModal } from './components/Modal';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem(AUTH_KEY) === 'true',
  );
  const [page, setPage] = useState('map');
  const [sort, setSort] = useState('distance');
  const [records, setRecords] = useState(loadRecords);
  const [likes, setLikes] = useState(loadLikes);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');

  const myRecords = records.filter((item) => item.owner === 'me');
  const likedRecords = records.filter((item) => likes.includes(item.id));

  const nearbyRecords = useMemo(() => {
    const list = records.filter((item) => item.distance <= 2000);

    return [...list].sort((a, b) => {
      if (sort === 'distance') return a.distance - b.distance;
      if (sort === 'recommend') return b.score + b.likes - (a.score + a.likes);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [records, sort]);

  const setAuth = (next) => {
    setIsLoggedIn(next);
    localStorage.setItem(AUTH_KEY, String(next));

    if (!next) setPage('map');
  };

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
    const amount = isLiked ? -1 : 1;

    const nextLikes = isLiked
      ? likes.filter((likeId) => likeId !== id)
      : [...likes, id];

    const nextRecords = records.map((item) =>
      item.id === id
        ? {
            ...item,
            likes: Math.max(0, item.likes + amount),
          }
        : item,
    );

    setLikes(nextLikes);
    setRecords(nextRecords);

    setSelected((prev) =>
      prev?.id === id
        ? {
            ...prev,
            likes: Math.max(0, prev.likes + amount),
          }
        : prev,
    );

    saveLikes(nextLikes);
    saveRecords(nextRecords);
  };

  const deleteRecord = (id) => {
    const nextRecords = records.filter((item) => item.id !== id);
    const nextLikes = likes.filter((likeId) => likeId !== id);

    setRecords(nextRecords);
    setLikes(nextLikes);
    saveRecords(nextRecords);
    saveLikes(nextLikes);
    showToast('기록을 삭제했어요.');
  };

  const upsertRecord = (record) => {
    const nextRecords = record.id
      ? records.map((item) => (item.id === record.id ? record : item))
      : [
          {
            ...record,
            id: crypto.randomUUID(),
            owner: 'me',
            author: '나',
            createdAt: new Date().toISOString(),
            distance: 260,
            likes: 0,
            score: 80,
          },
          ...records,
        ];

    setRecords(nextRecords);
    saveRecords(nextRecords);
    setEditing(null);
    setPage('mypage');
    showToast(record.id ? '기록을 수정했어요.' : '새 여운을 남겼어요.');
  };

  return (
    <div className={`app ${page !== 'map' ? 'panelOpen' : ''}`}>
      <Sidebar
        page={page}
        setPage={setPage}
        isLoggedIn={isLoggedIn}
        setAuth={setAuth}
        requireLogin={requireLogin}
      />

      <main className="mapArea">
        <MapCanvas
          records={nearbyRecords}
          likes={likes}
          onLike={toggleLike}
          onSelect={setSelected}
        />

        <button
          className={`writeButton ${!isLoggedIn ? 'locked' : ''}`}
          onClick={() => requireLogin() && setEditing({ songs: [{}] })}
        >
          {isLoggedIn ? <Plus size={26} /> : <Lock size={22} />}
          순간 남기기
        </button>
      </main>

      {page === 'nearby' && (
        <Panel
          title="동작구 상도1동"
          subtitle="주변"
          onClose={() => setPage('map')}
        >
          <SortTabs value={sort} onChange={setSort} />
          <div className="countText">반경 2km · {nearbyRecords.length}개</div>

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
          myRecords={myRecords}
          likedRecords={likedRecords}
          likes={likes}
          onLike={toggleLike}
          onSelect={setSelected}
          onEdit={setEditing}
          onDelete={deleteRecord}
          onClose={() => setPage('map')}
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
