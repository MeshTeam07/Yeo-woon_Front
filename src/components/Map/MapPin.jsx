import { Heart } from 'lucide-react';
import mapPinIcon from '../../assets/map_pin_icon.png';
import './MapPin.css';

function MapPin({ record, liked, onLike, onSelect }) {
  const song = record.songs?.[0];

  const heartFill = liked ? 'currentColor' : 'none';
  const heartStrokeWidth = liked ? 0 : 2.5;

  return (
    <div className="mapPinGroup">
      <button
        type="button"
        className={`mapPin ${liked ? 'liked' : ''}`}
        onClick={() => onSelect(record)}
        title={record.message}
      >
        <span className="mapPinFallback" aria-hidden="true" />
        <img src={mapPinIcon} alt="" className="mapPinImage" />

        <Heart
          className="mapPinHeart"
          size={22}
          fill={heartFill}
          strokeWidth={heartStrokeWidth}
        />
      </button>

      <div className="mapMiniCard" onClick={() => onSelect(record)}>
        <img src={song?.albumImage || record.image} alt="앨범 이미지" />

        <div>
          <strong>{song?.title || '노래 제목'}</strong>
          <span>{song?.artist || record.author}</span>
        </div>

        <button
          type="button"
          className={`miniHeart ${liked ? 'liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike(record.id);
          }}
          aria-label="좋아요"
          title={liked ? '좋아요 취소' : '좋아요'}
        >
          <Heart size={15} fill={heartFill} strokeWidth={liked ? 0 : 2.4} />
        </button>
      </div>
    </div>
  );
}

export default MapPin;
