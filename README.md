# React + Vite

## 실행법

git clone해서
npm install
npm run dev

## 커밋 메시지 기본 형식

```bash
type: 커밋 내용 요약
```

예시:

```bash
feat: 메인 페이지 레이아웃 추가
fix: 라우터 경로 오류 수정
style: 버튼 간격 및 색상 수정
docs: README 실행 방법 추가
```

## 커밋 타입

| 타입       | 의미                    | 예시                                |
| ---------- | ----------------------- | ----------------------------------- |
| `feat`     | 새로운 기능 추가        | `feat: 브랜드 목록 페이지 추가`     |
| `fix`      | 버그 수정               | `fix: 이미지 경로 오류 수정`        |
| `style`    | CSS, UI 스타일 수정     | `style: 메인 페이지 여백 조정`      |
| `refactor` | 코드 구조 개선          | `refactor: 컴포넌트 폴더 구조 정리` |
| `docs`     | 문서 수정               | `docs: README 프로젝트 설명 추가`   |
| `chore`    | 설정, 패키지, 기타 작업 | `chore: Vite 프로젝트 초기 설정`    |
| `rename`   | 파일명/폴더명 변경      | `rename: HomePage 파일명 변경`      |
| `remove`   | 파일 삭제               | `remove: 기본 Vite 로고 삭제`       |

## 우리 프로젝트용 커밋 예시

초기 세팅은 이렇게 하면 좋아요.

```bash
git add .
git commit -m "chore: React 프로젝트 초기 설정"
```

기본 Vite 화면 지우고 여운 사이트 틀 만들면:

```bash
git commit -m "feat: 여운 메인 페이지 기본 구조 추가"
```

폴더 구조 만들면:

```bash
git commit -m "chore: 프론트엔드 기본 폴더 구조 설정"
```

CSS 정리하면:

```bash
git commit -m "style: 전역 스타일 초기화"
```

README 작성하면:

```bash
git commit -m "docs: 프로젝트 소개 및 실행 방법 추가"
```

---

# 여운 - 장소 기반 비동기 음악/기록 공유 서비스

## 실행 방법

```bash
npm install
npm run dev
```

## 구현된 흐름

- 첫 진입 시 주변 지도/기록만 확인 가능
- 임시 로그인 전: 마이페이지, 순간 남기기, 좋아요 잠금
- 주변: 거리순, 추천순, 시간순 정렬
- 마이페이지: 내가 만든 것 / 좋아요 탭
- 내가 만든 기록: 수정, 삭제 가능
- 좋아요 기록: 좋아요 취소 가능
- 상세 모달: 주소, 문구, 노래 3개, 30초 미리듣기 버튼 UI
- 작성 모달: 주소, 문구, 노래 3개 필수 / 이미지 선택
- 카드 대표 이미지: 업로드 이미지 URL이 있으면 해당 이미지, 없으면 첫 번째 곡 앨범 이미지

## 다음 단계

- 실제 지도 API: Kakao Map 또는 Naver Map 연동
- 실제 음악 API: Spotify/Apple Music/YouTube Music 등 미리듣기 URL 연동
- 실제 로그인: Kakao/Google OAuth 또는 자체 로그인
- 백엔드: Node.js/Express + MongoDB 또는 PostgreSQL
