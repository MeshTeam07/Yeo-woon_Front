import RecordCard from './RecordCard';

function RecordList({ records, likes, onLike, onSelect, editable = false, onEdit, onDelete }) {
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

export default RecordList;
