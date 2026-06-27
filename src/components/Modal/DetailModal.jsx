import { Heart, MapPin, Play, X } from 'lucide-react';

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
            {record.songs.slice(0, 1).map((song, index) => (
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
