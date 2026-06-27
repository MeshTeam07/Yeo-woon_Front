import { Heart } from 'lucide-react';
import './MapPin.css';

function MapPin({ record, index, liked, onLike, onSelect }) {
  const song = record.songs?.[0];

  return (
    <div className={`mapPinGroup pin${index}`}>
      <button
        className={`mapPin ${liked ? 'liked' : ''}`}
        onClick={() => onSelect(record)}
        title={record.message}
      >
        <Heart
          size={22}
          fill={liked ? 'currentColor' : 'none'}
          strokeWidth={liked ? 0 : 2.5}
        />
      </button>

      <div className="mapMiniCard" onClick={() => onSelect(record)}>
        <img src={song?.albumImage || record.image} alt="앨범 이미지" />

        <div>
          <strong>{song?.title || '노래 제목'}</strong>
          <span>{song?.artist || record.author}</span>
        </div>

        <button
          className={`miniHeart ${liked ? 'liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike(record.id);
          }}
          aria-label="좋아요"
        >
          <Heart
            size={15}
            fill={liked ? 'currentColor' : 'none'}
            strokeWidth={liked ? 0 : 2.4}
          />
        </button>
      </div>
    </div>
  );
}

export default MapPin;
