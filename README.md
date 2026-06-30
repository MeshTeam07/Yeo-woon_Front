# 여운 (Yeo-woon)

> **낯선 사람이 남긴 순간을 우연히 만나는 곳**

일상 공간에 한 줄 메모와 음악의 흔적을 남기고, 미래의 누군가가 같은 공간에서 그것을 발견하여 연결되는 **위치 기반 음악 캡슐 서비스**입니다.

- **Frontend**: https://yeo-woon-front.vercel.app
- **Backend GitHub**: https://github.com/MeshTeam07/Yeo-woon_Back

---

## 서비스 개요

| 키워드 | 설명 |
|--------|------|
| 그 자리에 남긴다 | 현재 위치를 기반으로 메모와 음악을 캡슐에 담아 공간에 기록 |
| 시간을 넘어 | 비동기 방식 — 남긴 사람과 발견하는 사람이 같은 시간에 있을 필요 없음 |
| 타인을 잇는다 | 불특정 다수의 흔적이 장소 고유의 축적물로 쌓이며 낯선 사람과 연결 |

---

## 주요 기능

- **위치 기반 주변 탐색** — 반경 100m 내 다른 사람들이 남긴 여운을 지도 위 핀으로 발견
- **여운 남기기** — 주소, 한 줄 문구(최대 30자), iTunes 노래 검색, 선택 이미지로 순간을 기록
- **정렬 방식** — 거리순 / 추천순 / 시간순 / 계절순(봄·여름·가을·겨울) 선택 가능
- **30초 미리 듣기** — 상세 모달에서 iTunes 프리뷰 URL로 노래 재생
- **좋아요** — 마음에 드는 여운에 좋아요·취소 (낙관적 업데이트 적용)
- **마이페이지** — 내가 만든 여운 / 좋아요한 여운 구분 조회, 수정·삭제, 프로필 편집
- **무한 스크롤** — IntersectionObserver 기반 offset 페이지네이션
- **구글 OAuth** — 소셜 로그인, 신규 가입 시 프로필 설정 자동 안내
- **카메라 촬영** — 기기 카메라로 직접 촬영하여 이미지 첨부 가능

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React 19 |
| 빌드 도구 | Vite 8 |
| HTTP 클라이언트 | Axios |
| 지도 | Kakao Maps JavaScript SDK (`services` 라이브러리) |
| 음악 검색 | iTunes Search API (백엔드 프록시 경유) |
| 아이콘 | Lucide React |
| 배포 | Vercel |

---

## 시작하기

```bash
# 저장소 클론
git clone https://github.com/MeshTeam07/Yeo-woon_Front.git
cd Yeo-woon_Front

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리 보기
npm run preview
```

### 환경 변수

프로젝트 루트에 `.env` 파일을 생성하세요.

```env
VITE_API_BASE_URL=https://your-backend-url
VITE_KAKAO_MAP_KEY=your_kakao_javascript_key
```

---

## 프로젝트 구조

```
src/
├── api/
│   ├── client.js        # Axios 인스턴스, Bearer 토큰 관리
│   ├── auth.js          # 로그아웃
│   ├── capsules.js      # 캡슐 CRUD, 좋아요, 계절순 조회
│   ├── songs.js         # iTunes 노래 검색
│   ├── uploads.js       # 이미지 업로드
│   └── user.js          # 내 정보, 캡슐/좋아요 목록, 프로필 수정
├── components/
│   ├── Map/
│   │   ├── MapCanvas.jsx  # Kakao Map 초기화, GPS, CustomOverlay 핀 렌더링
│   │   └── MapPin.jsx     # 개별 지도 핀 컴포넌트
│   ├── Panel/
│   │   ├── Panel.jsx      # 공통 사이드 패널 래퍼
│   │   └── SortTabs.jsx   # 정렬 탭 (거리 / 추천 / 시간 / 계절)
│   ├── Record/
│   │   ├── RecordCard.jsx       # 여운 카드
│   │   ├── RecordList.jsx       # 여운 목록
│   │   └── SeasonalSongCard.jsx # 계절 노래 카드
│   ├── Modal/
│   │   ├── DetailModal.jsx  # 상세 보기 모달 (30초 미리 듣기)
│   │   └── EditorModal.jsx  # 여운 작성 / 수정 폼
│   ├── Sidebar/
│   │   └── Sidebar.jsx    # 네비게이션 사이드바
│   └── MyPage/
│       └── MyPage.jsx     # 마이페이지 (내 기록 / 좋아요)
├── utils/
│   ├── format.js   # 날짜 포맷 유틸
│   └── storage.js  # localStorage 좋아요 동기화
├── constants.js    # RADIUS_METER = 100
├── App.jsx         # 전역 상태 관리 및 화면 조합
└── main.jsx
```

---

## 백엔드 API (총 18개)

### Auth
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/logout` | 로그아웃 (액세스 토큰 쿠키 제거) |

### Users
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/users/me` | 내 정보 조회 |
| POST | `/users/me/profile` | 프로필(닉네임/사진) 변경 |
| GET | `/users/me/capsules` | 내가 남긴 캡슐 목록 |
| GET | `/users/me/likes` | 내가 좋아요 누른 캡슐 목록 |

### Uploads
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/uploads/presigned-url` | S3 이미지 업로드 presigned URL 발급 |
| POST | `/uploads/images` | 이미지 파일을 백엔드가 받아 S3에 직접 업로드 |

### Songs
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/songs/search` | iTunes 트랙 검색 |
| GET | `/api/songs/youtube` | 노래 제목/가수로 YouTube 영상 링크 조회 |

### Places
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/places/{placeId}/seasonal-songs` | 장소별 계절 노래 랭킹 |

### Capsules
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/capsules` | 캡슐 등록 |
| GET | `/capsules/nearby` | 주변 캡슐 조회 |
| GET | `/capsules/nearby/seasonal-songs` | 주변 계절 노래 랭킹 |
| GET | `/capsules/{capsuleId}` | 캡슐 상세 조회 |
| PATCH | `/capsules/{capsuleId}` | 캡슐 수정 |
| DELETE | `/capsules/{capsuleId}` | 캡슐 삭제 |
| POST | `/capsules/{capsuleId}/likes` | 좋아요 |
| DELETE | `/capsules/{capsuleId}/likes` | 좋아요 취소 |

---

## 커밋 컨벤션

```
type: 커밋 내용 요약
```

| 타입 | 의미 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `style` | CSS, UI 스타일 수정 |
| `refactor` | 코드 구조 개선 |
| `docs` | 문서 수정 |
| `chore` | 설정, 패키지, 기타 작업 |
| `rename` | 파일명/폴더명 변경 |
| `remove` | 파일 삭제 |

---

## 팀 MeshTeam07

해커톤 참가 프로젝트 — PM · Frontend · Backend 역할 분담으로 개발
