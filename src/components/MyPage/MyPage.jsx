import { useCallback, useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { getMyCapsules, getLikedCapsules, getLikedCount, updateProfile } from '../../api/user';
import { toRecord } from '../../api/capsules';
import { uploadImage } from '../../api/uploads';
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
  likes,
  onLike,
  onSelect,
  onEdit,
  onDelete,
  onClose,
  onLogout,
  autoOpenEdit = false,
  onEditOpened,
  onLikedIdsLoaded,
  myRecordsVersion = 0,
}) {
  const [tab, setTab] = useState('mine');
  const [myRecords, setMyRecords] = useState(myRecordsProp || []);
  const [editing, setEditing] = useState(autoOpenEdit);
  const [capsuleOffset, setCapsuleOffset] = useState(0);
  const [hasMoreCapsules, setHasMoreCapsules] = useState(false);
  const [capsuleTotal, setCapsuleTotal] = useState(null);
  const capsuleLoadingRef = useRef(false);

  const [likedFromApi, setLikedFromApi] = useState([]);
  const [likedOffset, setLikedOffset] = useState(0);
  const [hasMoreLiked, setHasMoreLiked] = useState(false);
  const [likedTotal, setLikedTotal] = useState(null);
  const likedLoadingRef = useRef(false);

  useEffect(() => {
    if (autoOpenEdit) {
      setEditing(true);
      onEditOpened?.();
    }
  }, [autoOpenEdit]);

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || '');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // 내가 만든 캡슐 조회
  useEffect(() => {
    if (tab !== 'mine') return;
    setCapsuleOffset(0);
    capsuleLoadingRef.current = false;
    getMyCapsules(0)
      .then((res) => {
        const total = res?.totalCount ?? null;
        const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
        setCapsuleTotal(total);
        setMyRecords(list.map((c) => toRecord(c, user?.userId, user)));
        setHasMoreCapsules(list.length >= 20 && (total == null || list.length < total));
      })
      .catch(() => {
        setMyRecords(myRecordsProp || []);
        setHasMoreCapsules(false);
      });
  }, [tab, myRecordsVersion]);

  const loadMoreCapsules = useCallback(async () => {
    if (!hasMoreCapsules || capsuleLoadingRef.current) return;
    capsuleLoadingRef.current = true;
    const nextOffset = capsuleOffset + 20;
    try {
      const res = await getMyCapsules(nextOffset);
      const total = res?.totalCount ?? capsuleTotal;
      const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
      if (res?.totalCount != null) setCapsuleTotal(res.totalCount);
      setMyRecords((prev) => {
        const merged = [...prev, ...list.map((c) => toRecord(c, user?.userId, user))];
        setHasMoreCapsules(list.length >= 20 && (total == null || merged.length < total));
        return merged;
      });
      setCapsuleOffset(nextOffset);
    } catch {
      // ignore
    } finally {
      capsuleLoadingRef.current = false;
    }
  }, [hasMoreCapsules, capsuleOffset, capsuleTotal, user]);

  // 좋아요 누른 캡슐 조회
  useEffect(() => {
    if (tab !== 'likes') return;
    setLikedOffset(0);
    likedLoadingRef.current = false;
    getLikedCount().then((res) => setLikedTotal(res?.totalCount ?? null)).catch(() => {});
    getLikedCapsules(0)
      .then((res) => {
        const total = res?.totalCount ?? null;
        const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
        if (total != null) setLikedTotal(total);
        const records = list.map((c) => toRecord(c, user?.userId, user));
        setLikedFromApi(records);
        setHasMoreLiked(list.length >= 20 && (total == null || list.length < total));
        onLikedIdsLoaded?.(records.map((r) => r.id));
      })
      .catch(() => {
        setLikedFromApi([]);
        setHasMoreLiked(false);
      });
  }, [tab]);

  const loadMoreLiked = useCallback(async () => {
    if (!hasMoreLiked || likedLoadingRef.current) return;
    likedLoadingRef.current = true;
    const nextOffset = likedOffset + 20;
    try {
      const res = await getLikedCapsules(nextOffset);
      const total = res?.totalCount ?? likedTotal;
      const list = Array.isArray(res) ? res : (res?.capsules ?? res?.content ?? []);
      if (res?.totalCount != null) setLikedTotal(res.totalCount);
      const records = list.map((c) => toRecord(c, user?.userId, user));
      setLikedFromApi((prev) => {
        const merged = [...prev, ...records];
        setHasMoreLiked(list.length >= 20 && (total == null || merged.length < total));
        return merged;
      });
      setLikedOffset(nextOffset);
      onLikedIdsLoaded?.(records.map((r) => r.id));
    } catch {
      // ignore
    } finally {
      likedLoadingRef.current = false;
    }
  }, [hasMoreLiked, likedOffset, likedTotal, user]);

  useEffect(() => {
    setNickname(user?.nickname || '');
    setProfileImageUrl(user?.profileImageUrl || '');
  }, [user]);

  const handleProfileImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImageUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageUrl = profileImageUrl;
      if (profileImageFile) {
        const { fileUrl } = await uploadImage(profileImageFile);
        imageUrl = fileUrl;
      }
      const updated = await updateProfile({ nickname, profileImageUrl: imageUrl });
      onUserUpdate?.({ ...user, ...updated, nickname, profileImageUrl: imageUrl });
      setProfileImageFile(null);
      setEditing(false);
    } catch (e) {
      console.error('프로필 저장 실패:', e);
      alert('프로필 저장에 실패했어요.');
    } finally {
      setSaving(false);
    }
  };

  // 좋아요 취소 시 해당 항목이 즉시 사라지도록 likes prop으로 필터
  const displayedLiked = likedFromApi.filter((r) => likes.includes(r.id));
  const current = tab === 'mine' ? myRecords : displayedLiked;

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

      {tab === 'mine' && capsuleTotal != null && (
        <p className="listCountText">총 {capsuleTotal}개</p>
      )}
      {tab === 'likes' && likedTotal != null && (
        <p className="listCountText">총 {likedTotal}개</p>
      )}

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
      {tab === 'likes' && hasMoreLiked && (
        <Sentinel onVisible={loadMoreLiked} />
      )}
    </Panel>
  );
}

export default MyPage;
