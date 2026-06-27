import MapPin from './MapPin';

function MapCanvas({ records, likes, onLike, onSelect }) {
  return (
    <section className="mapCanvas">
      <div className="radiusCircle">
        <span>반경 2km</span>
      </div>

      <div className="road roadOne" />
      <div className="road roadTwo" />
      <div className="myLocation" />

      {records.slice(0, 5).map((record, index) => (
        <MapPin
          key={record.id}
          record={record}
          index={index + 1}
          liked={likes.includes(record.id)}
          onLike={onLike}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}

export default MapCanvas;
