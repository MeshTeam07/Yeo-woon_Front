import { Heart, MapPin, Pencil, Trash2 } from 'lucide-react';
import { formatDistance, formatTime } from '../../utils/format';
import './RecordCard.css';

function RecordCard({ record, liked, onLike, onSelect, editable, onEdit, onDelete }) {
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
            <Heart
              size={18}
              fill={liked ? 'currentColor' : 'none'}
              strokeWidth={liked ? 0 : 2.4}
            />
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

export default RecordCard;
