import { useState } from 'react';
import { Panel } from '../Panel';
import { RecordList } from '../Record';

function MyPage({ myRecords, likedRecords, likes, onLike, onSelect, onEdit, onDelete, onClose }) {
  const [tab, setTab] = useState('mine');
  const current = tab === 'mine' ? myRecords : likedRecords;

  return (
    <Panel
      title="마이페이지"
      subtitle="내 기록을 모아보는 공간"
      onClose={onClose}
    >
      <div className="tabs wide">
        <button
          className={tab === 'mine' ? 'selected' : ''}
          onClick={() => setTab('mine')}
        >
          내가 만든 것
        </button>

        <button
          className={tab === 'likes' ? 'selected' : ''}
          onClick={() => setTab('likes')}
        >
          좋아요
        </button>
      </div>

      <RecordList
        records={current}
        likes={likes}
        onLike={onLike}
        onSelect={onSelect}
        editable={tab === 'mine'}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Panel>
  );
}

export default MyPage;
