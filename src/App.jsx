import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  MapPin,
  Music2,
  UserRound,
  Lock,
  Plus,
  X,
  Trash2,
  Pencil,
  Play,
  LogIn,
  LogOut,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'yeowoon_records_v1';
const LIKE_KEY = 'yeowoon_likes_v1';
const AUTH_KEY = 'yeowoon_auth_v1';

const seedRecords = [
  {
    id: 'r1',
    owner: 'other',
    author: 'moon',
    address: '서울 동작구 상도1동',
    distance: 180,
    createdAt: '2026-06-27T14:10:00',
    message: '비 오는 길에 들으면 마음이 천천히 가라앉는 노래예요.',
    image: '',
    songs: [
      {
        title: '밤편지',
        artist: 'IU',
        albumImage:
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Square',
        artist: 'Yerin Baek',
        albumImage:
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: '긴 밤',
        artist: 'Seori',
        albumImage:
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
    ],
    likes: 18,
    score: 91,
  },
  {
    id: 'r2',
    owner: 'other',
    author: 'sol',
    address: '서울 관악구 봉천동',
    distance: 920,
    createdAt: '2026-06-27T12:20:00',
    message: '햇빛이 예뻐서 잠깐 멈춘 자리. 오늘은 이 노래가 잘 맞았어요.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80',
    songs: [
      {
        title: 'Love Lee',
        artist: 'AKMU',
        albumImage:
          'https://images.unsplash.com/photo-1499415479124-43c32433a620?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Ditto',
        artist: 'NewJeans',
        albumImage:
          'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Hype Boy',
        artist: 'NewJeans',
        albumImage:
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
    ],
    likes: 7,
    score: 74,
  },
  {
    id: 'r3',
    owner: 'me',
    author: '나',
    address: '서울 동작구 흑석동',
    distance: 1320,
    createdAt: '2026-06-26T19:40:00',
    message: '집 가는 버스 기다리면서 남긴 여운.',
    image: '',
    songs: [
      {
        title: '첫 눈',
        artist: 'EXO',
        albumImage:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: 'Event Horizon',
        artist: 'Younha',
        albumImage:
          'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
      {
        title: '그라데이션',
        artist: '10CM',
        albumImage:
          'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=600&q=80',
        previewUrl: '',
      },
    ],
    likes: 12,
    score: 88,
  },
];

function loadRecords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return seedRecords;

  try {
    return JSON.parse(saved);
  } catch {
    return seedRecords;
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function loadLikes() {
  try {
    return JSON.parse(localStorage.getItem(LIKE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveLikes(likes) {
  localStorage.setItem(LIKE_KEY, JSON.stringify(likes));
}

function formatDistance(meter) {
  return meter < 1000 ? `${meter}m` : `${(meter / 1000).toFixed(1)}km`;
}

function formatTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) return `${Math.max(minutes, 1)}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  return `${Math.floor(hours / 24)}일 전`;
}

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
    const nextLikes = isLiked
      ? likes.filter((likeId) => likeId !== id)
      : [...likes, id];

    const nextRecords = records.map((item) =>
      item.id === id
        ? {
            ...item,
            likes: Math.max(0, item.likes + (isLiked ? -1 : 1)),
          }
        : item,
    );

    setLikes(nextLikes);
    setRecords(nextRecords);
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
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        isLoggedIn={isLoggedIn}
        requireLogin={requireLogin}
      />

      <main className="mapArea">
        <MapCanvas records={nearbyRecords} onSelect={setSelected} />

        <button
          className={`writeButton ${!isLoggedIn ? 'locked' : ''}`}
          onClick={() => requireLogin() && setEditing({ songs: [{}, {}, {}] })}
        >
          {isLoggedIn ? <Plus size={22} /> : <Lock size={19} />}
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

      <AuthButton isLoggedIn={isLoggedIn} setAuth={setAuth} />

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

function Sidebar({ page, setPage, isLoggedIn, requireLogin }) {
  return (
    <aside className="sidebar">
      <h1>여운</h1>

      <button
        className={page === 'nearby' ? 'active' : ''}
        onClick={() => setPage('nearby')}
      >
        <Music2 />
        주변
      </button>

      <button
        className={page === 'mypage' ? 'active' : ''}
        onClick={() => requireLogin() && setPage('mypage')}
      >
        {isLoggedIn ? <UserRound /> : <Lock />}
        마이페이지
      </button>
    </aside>
  );
}

function AuthButton({ isLoggedIn, setAuth }) {
  return (
    <button className="authButton" onClick={() => setAuth(!isLoggedIn)}>
      {isLoggedIn ? <LogOut size={17} /> : <LogIn size={17} />}
      {isLoggedIn ? '로그아웃' : '임시 로그인'}
    </button>
  );
}

function MapCanvas({ records, onSelect }) {
  return (
    <section className="mapCanvas">
      <div className="radiusCircle">
        <span>반경 2km</span>
      </div>

      <div className="road roadOne" />
      <div className="road roadTwo" />
      <div className="myLocation" />

      {records.slice(0, 5).map((record, index) => (
        <button
          key={record.id}
          className={`mapPin pin${index + 1}`}
          onClick={() => onSelect(record)}
          title={record.message}
        >
          <Heart size={22} />
        </button>
      ))}
    </section>
  );
}

function Panel({ title, subtitle, children, onClose }) {
  const startYRef = useRef(0);
  const startSheetYRef = useRef(0);
  const [sheetY, setSheetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isMobile = () => window.matchMedia('(max-width: 640px)').matches;

  const getExpandedY = () => 0;

  const getMiddleY = () => Math.round(window.innerHeight * 0.42);

  // 아래로 충분히 내리면 최소화하지 않고 패널을 닫아서 지도/순간 남기기 버튼을 완전히 보여줌
  const getCloseY = () => Math.round(window.innerHeight * 0.72);

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  useEffect(() => {
    const resetSheetPosition = () => {
      if (!isMobile()) {
        setSheetY(0);
        return;
      }

      // 모바일 첫 진입 상태: 지도도 보이고 리스트도 보이는 중간 높이
      setSheetY(getMiddleY());
    };

    resetSheetPosition();
    window.addEventListener('resize', resetSheetPosition);

    return () => window.removeEventListener('resize', resetSheetPosition);
  }, []);

  const handlePointerDown = (event) => {
    if (!isMobile()) return;

    setIsDragging(true);
    startYRef.current = event.clientY;
    startSheetYRef.current = sheetY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isDragging) return;

    const nextY = startSheetYRef.current + event.clientY - startYRef.current;
    setSheetY(clamp(nextY, getExpandedY(), getCloseY()));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const closeY = getCloseY();
    const middleY = getMiddleY();

    // 아래로 충분히 내리면 패널 자체를 닫음
    if (sheetY > middleY + 80) {
      setSheetY(closeY);

      window.setTimeout(() => {
        onClose();
      }, 180);

      return;
    }

    // 위로 많이 올리면 최대화, 아니면 기본 높이로 복귀
    setSheetY(sheetY < middleY * 0.55 ? getExpandedY() : middleY);
  };

  return (
    <section
      className={`panel ${isDragging ? 'dragging' : ''}`}
      style={{ '--sheet-y': `${sheetY}px` }}
    >
      <div
        className="sheetDragArea"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="sheetHandle">
          <span />
        </div>

        <button className="closePanel" onClick={onClose}>
          <X size={18} />
        </button>

        <p>{subtitle}</p>
        <h2>{title}</h2>
      </div>

      <div className="panelBody">{children}</div>
    </section>
  );
}

function SortTabs({ value, onChange }) {
  const tabs = [
    ['distance', '거리순'],
    ['recommend', '추천순'],
    ['time', '시간순'],
  ];

  return (
    <div className="tabs">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={value === id ? 'selected' : ''}
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function RecordList({
  records,
  likes,
  onLike,
  onSelect,
  editable = false,
  onEdit,
  onDelete,
}) {
  return (
    <div className="recordList">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          liked={likes.includes(record.id)}
          onLike={onLike}
          onSelect={onSelect}
          editable={editable}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {records.length === 0 && (
        <div className="empty">아직 남겨진 기록이 없어요.</div>
      )}
    </div>
  );
}

function RecordCard({
  record,
  liked,
  onLike,
  onSelect,
  editable,
  onEdit,
  onDelete,
}) {
  const cover = record.image || record.songs?.[0]?.albumImage;

  return (
    <article className="recordCard" onClick={() => onSelect(record)}>
      <img src={cover} alt="기록 이미지" />

      <div className="cardBody">
        <div className="meta">
          <MapPin size={14} />
          {formatDistance(record.distance)} · {formatTime(record.createdAt)}
        </div>

        <h3>{record.songs?.[0]?.title || '노래'}</h3>
        <p>{record.message}</p>

        <div className="cardFooter">
          <span>{record.author}</span>

          <button
            className={liked ? 'heart liked' : 'heart'}
            onClick={(e) => {
              e.stopPropagation();
              onLike(record.id);
            }}
          >
            <Heart size={18} />
            {record.likes}
          </button>
        </div>
      </div>

      {editable && (
        <div className="cardMenu" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onEdit(record)}>
            <Pencil size={16} />
          </button>

          <button onClick={() => onDelete(record.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </article>
  );
}

function MyPage({
  myRecords,
  likedRecords,
  likes,
  onLike,
  onSelect,
  onEdit,
  onDelete,
  onClose,
}) {
  const [tab, setTab] = useState('mine');
  const current = tab === 'mine' ? myRecords : likedRecords;

  return (
    <Panel
      title="마이페이지"
      subtitle="내 기록을 모아보는 공간"
      onClose={onClose}
    >
      <div className="tabs wide">
        <button
          className={tab === 'mine' ? 'selected' : ''}
          onClick={() => setTab('mine')}
        >
          내가 만든 것
        </button>

        <button
          className={tab === 'likes' ? 'selected' : ''}
          onClick={() => setTab('likes')}
        >
          좋아요
        </button>
      </div>

      <RecordList
        records={current}
        likes={likes}
        onLike={onLike}
        onSelect={onSelect}
        editable={tab === 'mine'}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Panel>
  );
}

function DetailModal({ record, liked, onClose, onLike }) {
  const cover = record.image || record.songs?.[0]?.albumImage;

  return (
    <div className="modalBackdrop">
      <section className="detailModal">
        <button className="modalClose" onClick={onClose}>
          <X />
        </button>

        <div className="detailCover">
          <img src={cover} alt="상세 이미지" />
        </div>

        <div className="detailContent">
          <p className="address">
            <MapPin size={16} />
            {record.address}
          </p>

          <h2>이곳에 남겨진 여운</h2>

          <p className="message">{record.message}</p>

          <div className="songList">
            {record.songs.map((song, index) => (
              <div className="song" key={`${song.title}-${index}`}>
                <img src={song.albumImage} alt="앨범" />

                <div>
                  <b>{song.title}</b>
                  <span>{song.artist}</span>
                </div>

                <button title="30초 미리듣기">
                  <Play size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            className={liked ? 'likeLarge liked' : 'likeLarge'}
            onClick={onLike}
          >
            <Heart />
            좋아요 {record.likes}
          </button>
        </div>
      </section>
    </div>
  );
}

function EditorModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    id: initial.id,
    owner: initial.owner,
    author: initial.author,
    address: initial.address || '',
    message: initial.message || '',
    image: initial.image || '',
    distance: initial.distance,
    createdAt: initial.createdAt,
    likes: initial.likes,
    score: initial.score,
    songs: [0, 1, 2].map(
      (i) =>
        initial.songs?.[i] || {
          title: '',
          artist: '',
          albumImage: '',
          previewUrl: '',
        },
    ),
  });

  const updateSong = (index, field, value) => {
    const songs = form.songs.map((song, i) =>
      i === index ? { ...song, [field]: value } : song,
    );

    setForm({ ...form, songs });
  };

  const submit = (e) => {
    e.preventDefault();

    const valid =
      form.address.trim() &&
      form.message.trim() &&
      form.songs.every((song) => song.title.trim() && song.artist.trim());

    if (!valid) {
      alert('주소, 문구, 노래 3개는 필수예요.');
      return;
    }

    const fallbackIds = [
      '1511379938547-c1f69419868d',
      '1493225457124-a3eb161ffa5f',
      '1470225620780-dba8ba36b745',
    ];

    const withFallbackImages = form.songs.map((song, i) => ({
      ...song,
      albumImage:
        song.albumImage ||
        `https://images.unsplash.com/photo-${fallbackIds[i]}?auto=format&fit=crop&w=600&q=80`,
    }));

    onSubmit({ ...form, songs: withFallbackImages });
  };

  return (
    <div className="modalBackdrop">
      <form className="editorModal" onSubmit={submit}>
        <button type="button" className="modalClose" onClick={onClose}>
          <X />
        </button>

        <h2>{form.id ? '여운 수정하기' : '순간 남기기'}</h2>

        <label>주소 *</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="예: 서울 동작구 상도1동"
        />

        <label>문구 *</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="이 장소에 남기고 싶은 문장을 적어주세요."
        />

        <label>이미지 URL 선택</label>
        <input
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="사진이 있으면 카드 대표 이미지가 돼요."
        />

        <label>함께 남길 노래 3개 *</label>
        {form.songs.map((song, index) => (
          <div className="songInputs" key={index}>
            <input
              value={song.title}
              onChange={(e) => updateSong(index, 'title', e.target.value)}
              placeholder={`노래 ${index + 1} 제목`}
            />

            <input
              value={song.artist}
              onChange={(e) => updateSong(index, 'artist', e.target.value)}
              placeholder="가수"
            />

            <input
              value={song.albumImage}
              onChange={(e) => updateSong(index, 'albumImage', e.target.value)}
              placeholder="앨범 사진 URL 선택"
            />
          </div>
        ))}

        <button className="submitButton" type="submit">
          저장하기
        </button>
      </form>
    </div>
  );
}

export default App;
