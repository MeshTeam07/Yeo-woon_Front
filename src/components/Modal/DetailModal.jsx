import { useEffect, useRef, useState } from 'react';
import { Heart, MapPin, Pause, Play, UserRound, X } from 'lucide-react';
import { formatTime } from '../../utils/format';
import './Modal.css';

function DetailModal({ record, liked, onClose, onLike }) {
  const cover = record.image || record.songs?.[0]?.albumImage;
  const previewUrl = record.songs?.[0]?.previewUrl;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    if (!previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.onended = () => setPlaying(false);
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

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

          <div className="detailAuthor">
            {record.authorAvatar ? (
              <img src={record.authorAvatar} alt="작성자" className="authorAvatar detailAuthorAvatar" />
            ) : (
              <div className="authorAvatarPlaceholder detailAuthorAvatar">
                <UserRound size={16} />
              </div>
            )}
            <span className="detailAuthorName">{record.author || '익명'}</span>
            <span className="detailAuthorTime">{formatTime(record.createdAt)}</span>
          </div>

          <h2>이곳에 남겨진 여운</h2>

          <p className="message">{record.message}</p>

          <div className="songList">
            {record.songs.slice(0, 1).map((song, index) => (
              <div className="song" key={`${song.title}-${index}`}>
                <img src={song.albumImage} alt="앨범" />

                <div>
                  <b>{song.title}</b>
                  <span>{song.artist}</span>
                </div>

                <button
                  title={previewUrl ? '30초 미리듣기' : '미리듣기 없음'}
                  onClick={togglePlay}
                  disabled={!previewUrl}
                  className={playing ? 'playingBtn' : ''}
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>
            ))}
          </div>

          <button
            className={liked ? 'likeLarge liked' : 'likeLarge'}
            onClick={onLike}
          >
            <Heart
              fill={liked ? 'currentColor' : 'none'}
              strokeWidth={liked ? 0 : 2.4}
            />
            좋아요 {record.likes}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DetailModal;
