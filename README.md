# Typing Practice Admin

한국어 타이핑 연습 서비스의 관리자 클라이언트입니다.

## 주요 기능

### 인증

- Google OAuth 로그인 (ADMIN 권한 필요)
- JWT Access Token + Refresh Token (localStorage 저장)
- 401 응답 시 자동 토큰 갱신

### 회원 관리

- 회원 목록 조회 (권한 필터, 정렬)
- 상세 보기 → 권한 변경 (USER ↔ ADMIN)
- ADMIN 권한 부여 시 이메일/닉네임 확인 팝업
- 회원 차단/해제 (사유 입력)

### 문장 관리

- 문장 목록 조회 (상태/타입 필터, 난이도 정렬)
- 상세 보기 → 승인, 거부, 수정, 숨김, 복원, 삭제
- 상세 모달에서 타이핑 통계 확인 (CPM, 정확도, 초기화 횟수)
- 기본 문장 벌크 업로드 (배치 처리, 진행률 표시)
- 삭제된 문장 탭: 복원 / 영구 삭제 (ID 입력 확인)

### 단어 관리

- 단어 목록 조회 (언어 필터, 정렬)
- 단어 등록 / 수정 / 삭제
- 기본 단어 벌크 업로드 (배치 처리, 진행률 표시)

### 신고 관리

- 신고 목록 조회 (상태 필터, 정렬)
- 상세 보기 → 문장 수정 후 처리 / 문장 삭제
- 신고 삭제

### 공지사항 관리

- 공지사항 목록 조회 (커서 기반 무한 스크롤)
- 다국어(ko/en/ja) 제목/본문 작성
- 게시 여부, 고정 여부, 게시 일시(KST) 지정
- 고정 공지는 상단 별도 영역에 표시

### 업데이트 노트 관리

- 업데이트 노트 목록 조회 (커서 기반 무한 스크롤)
- 버전(`v1.8.1` 형식) / 배포 일시(KST) / 게시 여부
- 새 기능 · 개선 사항 항목별 다국어(ko/en/ja) 입력

### 배치 관리

- 문장 통계: 동적 난이도 보정 (올인원), 문장별 타이핑 통계, 전역 문장 통계
- 개인 통계: 개인 타이핑 통계, 개인 오타 통계, 개인 일간 통계 (날짜 지정)

## 기술 스택

- React 19
- Ant Design 6
- React Router 7
- Axios

## 시작하기

### 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 값을 채워주세요.

| 변수 | 설명 |
|------|------|
| `REACT_APP_API_URL` | 백엔드 API 서버 주소 (기본값: `http://localhost:8080`) |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `REACT_APP_REDIRECT_URI` | OAuth Redirect URI (예: `http://localhost:3001`) |

### 실행

```bash
npm install
npm start
```

`http://localhost:3001`에서 실행됩니다.

## 프로젝트 구조

```
src/
├── api/                # API 클라이언트 및 도메인별 API 모듈
│   ├── client.js       # axios 인스턴스 (JWT 인터셉터, 토큰 갱신, 토큰 키 상수)
│   ├── index.js        # API 모듈 re-export
│   ├── auth.js
│   ├── members.js
│   ├── quotes.js
│   ├── words.js
│   ├── reports.js
│   ├── announcements.js
│   ├── updateNotes.js
│   └── stats.js
├── components/
│   ├── AdminLayout.jsx     # 사이드바 + 헤더 레이아웃
│   └── LocalizedInput.jsx  # 다국어(ko/en/ja) 입력 컴포넌트
├── const/
│   ├── default-quotes.const.js  # 기본 문장 데이터
│   └── default-words.const.js   # 기본 단어 데이터
├── constants/
│   └── index.js        # 역할, 상태, 타입 등 상수 정의
├── contexts/
│   └── AuthContext.jsx # 인증 상태 관리
├── hooks/
│   ├── index.js
│   ├── useInfiniteScroll.js        # 오프셋 기반 무한 스크롤
│   └── useCursorInfiniteScroll.js  # 커서 기반 무한 스크롤
├── pages/
│   ├── LoginPage.jsx          # Google OAuth 로그인
│   ├── MembersPage.jsx        # 회원 관리
│   ├── QuotesPage.jsx         # 문장 관리
│   ├── DeletedQuotesTab.jsx   # 삭제된 문장 탭 (QuotesPage 내부)
│   ├── WordsPage.jsx          # 단어 관리
│   ├── ReportsPage.jsx        # 신고 관리
│   ├── AnnouncementsPage.jsx  # 공지사항 관리
│   ├── UpdateNotesPage.jsx    # 업데이트 노트 관리
│   └── BatchPage.jsx          # 배치 관리
└── utils/
    └── index.js        # 날짜 포맷, KST↔UTC 변환 등 유틸리티
```

## 관련 저장소

- [typing practice](https://github.com/HongnamKim/typing-practice) — 서비스 전체 코드
- [typing-practice-be](https://github.com/HongnamKim/typing-practice/tree/main/typing-practice-be) — Spring Boot 백엔드
- [tp-react](https://github.com/HongnamKim/typing-practice/tree/main/tp-react) — 사용자용 React 프론트엔드
