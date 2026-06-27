import { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { searchSongs } from '../../api/songs';
import './Modal.css';

function EditorModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    id: initial.id,
    lat: initial.lat,
    lng: initial.lng,
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

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [songQuery, setSongQuery] = useState(form.songs[0]?.title || '');
  const [songResults, setSongResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSongQueryChange = (e) => {
    const val = e.target.value;
    setSongQuery(val);
    if (!val.trim()) setSongResults([]);
  };

  const handleSearch = async () => {
    if (!songQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchSongs({ keyword: songQuery });
      const list = Array.isArray(res)
        ? res
        : (res?.items ?? res?.songs ?? res?.results ?? []);
      setSongResults(list.slice(0, 10));
    } catch {
      setSongResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 카메라 스트림이 열리면 video 엘리먼트에 연결
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch {
      alert('카메라 권한이 필요합니다.');
    }
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setForm((prev) => ({ ...prev, image: url }));
      closeCamera();
    }, 'image/jpeg');
  };

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
        <div className="readonlyAddress">
          {form.address || '주소 정보가 없습니다'}
        </div>

        <label>문구 *</label>
        <textarea
          value={form.message}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, message: e.target.value }))
          }
          maxLength={30}
          placeholder="이 장소에 남기고 싶은 문장을 적어주세요. (최대 30자)"
        />

        <div className="charCount">{form.message.length}/30</div>

        <label>대표 이미지 선택</label>
        <div className="uploadButtons">
          <button type="button" className="uploadChoice" onClick={openCamera}>
            <Camera size={18} />
            카메라로 촬영
          </button>

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
          <div className="songSearchRow">
            <input
              value={songQuery}
              onChange={handleSongQueryChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="노래 제목 또는 가수 검색"
            />
            <button
              type="button"
              className="songSearchBtn"
              onClick={handleSearch}
            >
              검색
            </button>
          </div>
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

      {isCameraOpen && (
        <div className="cameraBackdrop">
          <div className="cameraModal">
            <button
              type="button"
              className="cameraClose"
              onClick={closeCamera}
              aria-label="카메라 닫기"
            >
              <X />
            </button>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="cameraPreview"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="cameraActions">
              <button type="button" onClick={closeCamera}>
                취소
              </button>
              <button type="button" onClick={takePhoto}>
                촬영하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorModal;
