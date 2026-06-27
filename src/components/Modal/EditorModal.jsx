import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { searchSongs } from '../../api/songs';
import './Modal.css';

function EditorModal({ initial, position, onClose, onSubmit }) {
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
    songs: [
      initial.songs?.[0] || {
        title: '',
        artist: '',
        albumImage: '',
        previewUrl: '',
        externalTrackId: '',
        musicUrl: '',
      },
    ],
  });

  const [songQuery, setSongQuery] = useState(form.songs[0]?.title || '');
  const [songResults, setSongResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!songQuery.trim()) {
      setSongResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchSongs({ keyword: songQuery });
        const list = Array.isArray(res)
          ? res
          : (res?.songs ?? res?.results ?? []);
        setSongResults(list.slice(0, 8));
      } catch {
        setSongResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [songQuery]);

  const selectSong = (song) => {
    const mapped = {
      title: song.title ?? song.trackName ?? '',
      artist: song.artist ?? song.artistName ?? '',
      albumImage:
        song.albumCoverUrl ?? song.albumImage ?? song.artworkUrl100 ?? '',
      previewUrl: song.previewUrl ?? '',
      externalTrackId: song.externalTrackId ?? String(song.trackId ?? ''),
      musicUrl: song.musicUrl ?? song.previewUrl ?? '',
    };
    setForm((prev) => ({ ...prev, songs: [mapped] }));
    setSongQuery(mapped.title);
    setSongResults([]);
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, image: URL.createObjectURL(file) }));
  };

  const submit = (e) => {
    e.preventDefault();
    const song = form.songs[0];
    if (
      !form.address.trim() ||
      !form.message.trim() ||
      !song.title.trim() ||
      !song.artist.trim()
    ) {
      alert('주소, 문구, 노래 1개는 필수예요.');
      return;
    }
    onSubmit({ ...form, songs: [song] });
  };

  return (
    <div className="modalBackdrop">
      <form className="editorModal" onSubmit={submit}>
        <button type="button" className="modalClose" onClick={onClose}>
          <X />
        </button>

        <h2>{form.id ? '여운 수정하기' : '순간 남기기'}</h2>

        <label>주소</label>
        <input
          value={form.address}
          readOnly
          style={{ background: '#f5f4f9', color: '#777', cursor: 'default' }}
        />

        <label>문구 *</label>
        <textarea
          value={form.message}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, message: e.target.value }))
          }
          placeholder="이 장소에 남기고 싶은 문장을 적어주세요."
        />

        <label>대표 이미지 선택</label>
        <div className="uploadButtons">
          <label className="uploadChoice">
            카메라로 촬영
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageFile}
            />
          </label>
          <label className="uploadChoice">
            앨범/드라이브 선택
            <input type="file" accept="image/*" onChange={handleImageFile} />
          </label>
        </div>
        {form.image && (
          <img
            className="imagePreview"
            src={form.image}
            alt="선택한 대표 이미지"
          />
        )}

        <label>함께 남길 노래 1개 *</label>
        <div className="songSearch">
          <input
            value={songQuery}
            onChange={(e) => setSongQuery(e.target.value)}
            placeholder="노래 제목 또는 가수 검색"
          />
          {searching && <div className="songSearchHint">검색 중...</div>}
          {songResults.length > 0 && (
            <ul className="songResults">
              {songResults.map((song, i) => {
                const title = song.title ?? song.trackName ?? '';
                const artist = song.artist ?? song.artistName ?? '';
                const thumb =
                  song.albumCoverUrl ??
                  song.albumImage ??
                  song.artworkUrl100 ??
                  '';
                return (
                  <li
                    key={song.externalTrackId ?? song.trackId ?? i}
                    onClick={() => selectSong(song)}
                  >
                    {thumb && <img src={thumb} alt="" />}
                    <span className="songResultTitle">{title}</span>
                    <span className="songResultArtist">{artist}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {form.songs[0].title && (
          <div className="selectedSong">
            {form.songs[0].albumImage && (
              <img src={form.songs[0].albumImage} alt="앨범" />
            )}
            <div>
              <strong>{form.songs[0].title}</strong>
              <span>{form.songs[0].artist}</span>
            </div>
          </div>
        )}

        <button className="submitButton" type="submit">
          저장하기
        </button>
      </form>
    </div>
  );
}

export default EditorModal;
