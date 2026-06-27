import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import './SeasonalSongCard.css';

function SeasonalSongCard({ entry }) {
  const { song, capsuleCount } = entry;
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = () => {
    if (!song.previewUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(song.previewUrl);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current && audioRef.current.currentTime >= 30) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setPlaying(false);
        }
      });
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  };

  return (
    <article className="seasonalSongCard">
      <img
        className="seasonalAlbumCover"
        src={song.albumCoverUrl}
        alt={song.title}
      />
      <div className="seasonalCardBody">
        <p className="seasonalSongTitle">{song.title}</p>
        <p className="seasonalSongArtist">{song.artist}</p>
        <p className="seasonalSongCount">
          이 계절에 {capsuleCount}번 선택되었어요
        </p>
      </div>
      {song.previewUrl && (
        <button
          className={`seasonalPlayBtn${playing ? ' playing' : ''}`}
          onClick={togglePlay}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
      )}
    </article>
  );
}

export default SeasonalSongCard;
