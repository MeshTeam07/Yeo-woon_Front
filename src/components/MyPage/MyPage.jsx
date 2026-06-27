import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { getMyCapsules, updateProfile } from '../../api/user';
import { toRecord } from '../../api/capsules';
import { Panel } from '../Panel';
import { RecordList } from '../Record';

function MyPage({
  user,
  onUserUpdate,
  myRecords: myRecordsProp,
  likedRecords,
  likes,
  onLike,
  onSelect,
  onEdit,
  onDelete,
  onClose,
  onLogout,
}) {
  const [tab, setTab] = useState('mine');
  const [myRecords, setMyRecords] = useState(myRecordsProp || []);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab !== 'mine') return;
    getMyCapsules()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
        setMyRecords(list.map((c) => toRecord(c, user?.userId)));
      })
      .catch(() => {
        setMyRecords(myRecordsProp || []);
      });
  }, [tab]);

  useEffect(() => {
    setNickname(user?.nickname || '');
    setProfileImageUrl(user?.profileImageUrl || '');
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ nickname, profileImageUrl });
      onUserUpdate?.({ ...user, ...updated, nickname, profileImageUrl });
      setEditing(false);
    } catch {
      alert('프로필 저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  const current = tab === 'mine' ? myRecords : likedRecords;

  return (
    <Panel title="마이페이지" subtitle="내 기록을 모아보는 공간" onClose={onClose}>
      <div className="profileSection">
        {user?.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="프로필" className="profileAvatar" />
        ) : (
          <div className="profileAvatarPlaceholder">
            <UserRound size={36} />
          </div>
        )}
        <div className="profileInfo">
          <strong>{user?.nickname || '닉네임 없음'}</strong>
          <div className="profileActions">
            <button className="profileEditBtn" onClick={() => setEditing((v) => !v)}>
              {editing ? '취소' : '프로필 수정'}
            </button>
            <button className="logoutBtn" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="profileEditForm">
          <label>닉네임</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임 입력"
          />
          <label>프로필 이미지 URL</label>
          <input
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
            placeholder="이미지 URL 입력"
          />
          <button className="submitButton" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}

      <div className="tabs wide">
        <button className={tab === 'mine' ? 'selected' : ''} onClick={() => setTab('mine')}>
          내가 만든 것
        </button>
        <button className={tab === 'likes' ? 'selected' : ''} onClick={() => setTab('likes')}>
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
