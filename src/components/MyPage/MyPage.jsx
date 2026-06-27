import { useCallback, useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { getMyCapsules, updateProfile } from '../../api/user';
import { toRecord } from '../../api/capsules';
import { Panel } from '../Panel';
import { RecordList } from '../Record';

function Sentinel({ onVisible }) {
  const cbRef = useRef(onVisible);
  useEffect(() => {
    cbRef.current = onVisible;
  });
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) cbRef.current?.(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} style={{ height: 4 }} />;
}

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
  autoOpenEdit = false,
  onEditOpened,
}) {
  const [tab, setTab] = useState('mine');
  const [myRecords, setMyRecords] = useState(myRecordsProp || []);
  const [editing, setEditing] = useState(autoOpenEdit);
  const [capsuleOffset, setCapsuleOffset] = useState(0);
  const [hasMoreCapsules, setHasMoreCapsules] = useState(false);
  const capsuleLoadingRef = useRef(false);

  useEffect(() => {
    if (autoOpenEdit) {
      setEditing(true);
      onEditOpened?.();
    }
  }, [autoOpenEdit]);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab !== 'mine') return;
    setCapsuleOffset(0);
    capsuleLoadingRef.current = false;
    getMyCapsules(0)
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
        setMyRecords(list.map((c) => toRecord(c, user?.userId)));
        setHasMoreCapsules(list.length >= 20);
      })
      .catch(() => {
        setMyRecords(myRecordsProp || []);
        setHasMoreCapsules(false);
      });
  }, [tab]);

  const loadMoreCapsules = useCallback(async () => {
    if (!hasMoreCapsules || capsuleLoadingRef.current) return;
    capsuleLoadingRef.current = true;
    const nextOffset = capsuleOffset + 20;
    try {
      const res = await getMyCapsules(nextOffset);
      const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
      setMyRecords((prev) => [...prev, ...list.map((c) => toRecord(c, user?.userId))]);
      setCapsuleOffset(nextOffset);
      setHasMoreCapsules(list.length >= 20);
    } catch {
      // 추가 로드 실패 시 현재 목록 유지
    } finally {
      capsuleLoadingRef.current = false;
    }
  }, [hasMoreCapsules, capsuleOffset, user]);

  useEffect(() => {
    setNickname(user?.nickname || '');
    setProfileImageUrl(user?.profileImageUrl || '');
  }, [user]);

  const handleProfileImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImageUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

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
          <label>프로필 사진</label>
          {profileImageUrl && (
            <img src={profileImageUrl} alt="미리보기" className="profilePreview" />
          )}
          <label className="profileImgUpload">
            파일 선택
            <input type="file" accept="image/*" onChange={handleProfileImageFile} />
          </label>
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
      {tab === 'mine' && hasMoreCapsules && (
        <Sentinel onVisible={loadMoreCapsules} />
      )}
    </Panel>
  );
}

export default MyPage;
