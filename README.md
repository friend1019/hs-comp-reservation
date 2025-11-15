# HS 컴퓨터 예약 시스템

한서대 실습실(항소 컴퓨터실) 자원을 예약·관리하기 위한 React + Firebase 기반의 웹 애플리케이션입니다.  
학생은 인증을 거쳐 원하는 컴퓨터/시간대를 예약하고, 관리자는 실시간 자원 현황과 사용자 계정을 통합 관리할 수 있습니다.

## 주요 기능

- **Firebase 인증 + 초기 설정**: 첫 로그인 시 이메일 인증 및 비밀번호 재설정을 강제하여 계정 보안을 확보합니다. (`src/pages/InitPage.jsx`)
- **실시간 예약 UI**: 컴퓨터/날짜/시간대 선택, 예약 생성·취소, 7일치 가용 수량 요약을 하나의 화면에서 처리합니다. (`src/pages/HomePage.jsx`)
- **마이페이지**: 내 계정 정보와 예약 내역을 모아 확인할 수 있습니다. (`src/pages/MyPage.jsx`)
- **관리자 센터**: 자원 현황 요약, 컴퓨터 상태 변경, Firestore 사용자 문서 CRUD, Firebase Auth 계정 생성/삭제를 지원합니다. (`src/pages/AdminPage.jsx`)
- **권한 라우팅**: `ProtectedRoute`와 `AdminRoute`가 로그인·초기화 여부, 관리자 권한을 검사해 적절히 리다이렉션합니다.
- **Call-able Functions**: Firebase Functions(`functions/index.js`)를 통해 관리자 권한으로만 Auth 계정을 생성/삭제합니다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | React 19, React Router DOM 7, Create React App 5 |
| 상태 관리 | Zustand (`src/stores/authStore.js`, `src/stores/reservationStore.js`) |
| Backend as a Service | Firebase Authentication, Cloud Firestore, Cloud Functions |
| 스타일 | 전역 CSS (`src/styles/**`) |
| 테스트 | React Testing Library, Jest (CRA 기본 설정) |

## 디렉터리 개요

```
hs-comp-reservation/
├── src/
│   ├── components/        # 캘린더, 예약 카드, 보호 라우트, 헤더, 모달 등 공용 UI
│   ├── pages/             # 라우트 컴포넌트 (홈, 마이페이지, 관리자, 초기 설정 등)
│   ├── services/          # Firebase(Auth/Firestore/Functions) 호출 래퍼
│   ├── stores/            # Zustand 기반 전역 스토어
│   ├── firebase/          # Firebase 초기화 (env 기반)
│   ├── styles/            # 컴포넌트/페이지 별 CSS
│   ├── App.jsx, routes.jsx
├── functions/             # Firebase Callable Functions (Node 18)
├── prisma/                # 향후 백엔드 연동을 위한 Prisma 스키마 자리 (현재 모델 미정)
├── public/, build/        # CRA 기본 디렉터리
└── firebase.json, firestore.rules
```

## 라우트 & 화면 흐름

| 경로 | 컴포넌트 | 설명 |
| --- | --- | --- |
| `/login` | `LoginPage.jsx` | 학번 또는 이메일 + 비밀번호로 로그인. `authStore.login`이 Firebase Auth를 호출합니다. |
| `/init` | `InitPage.jsx` | 첫 로그인 시 이메일 인증 → 비밀번호 변경 → `users` 문서를 `markUserInitialized`로 업데이트. |
| `/` | `HomePage.jsx` (보호) | 컴퓨터·날짜·시간대 선택, 예약 생성/취소, 가용 요약 표시. |
| `/computer/:id` | `ComputerDetailPage.jsx` (보호) | 단일 컴퓨터의 상태 및 해당 날짜 타임슬롯 확인. |
| `/mypage` | `MyPage.jsx` (보호) | 내 계정·예약 목록 확인. |
| `/admin` | `AdminPage.jsx` (관리자) | 자원 요약, 컴퓨터 상태, 사용자 관리, 전체 예약 열람. |

### 인증 & 초기 설정

- `App.jsx`는 `onAuthStateChange`를 등록해 Firebase Auth 세션 변화를 `authStore`에 반영합니다.
- `ProtectedRoute` (`src/components/ProtectedRoute.jsx`)는 로그인 및 `isInitialized` 여부를 체크하고, `/init?mode=verifyEmail` 링크로 들어온 경우 이메일 검증 모드를 허용합니다.
- `InitPage`는 `sendEmailVerification`, `applyActionCode`, `reauthenticateWithCredential`, `updatePassword`를 조합하여 이메일 인증과 비밀번호 재설정을 완료합니다. 완료 시 Firestore `users/{uid}`의 `isInitialized`, `emailVerified`를 갱신합니다.

### 예약 플로우

- `HomePage`는 `fetchComputers`, `fetchDailyAvailability`, `fetchReservations`, `createReservation`, `cancelReservation`, `fetchReservationSummaryByDate`를 활용합니다.
- `SLOT_DEFINITIONS` (`src/services/availabilityApi.js`)에 오전/오후/저녁 슬롯이 정의되어 있으며, 과거 슬롯은 자동으로 비활성화됩니다.
- `CalendarGrid` + `fetchReservationSummaryByDate`는 앞으로 7일간 날짜별 잔여 슬롯 수를 계산합니다.
- 예약 생성 시 동일 컴퓨터+날짜+슬롯에 `status !== cancelled` 문서가 있는지 확인해 중복을 방지합니다. 성공하면 상태 스토어와 Firestore 데이터를 즉시 동기화합니다.
- 취소는 `CancelDialog`를 통해 확인 받고, 서버에서는 해당 예약의 작성자만 취소할 수 있도록 검사합니다.

### 마이페이지

`MyPage`는 전역 `reservationStore`에서 예약 배열을 재사용하여 `ReservationCard` 목록으로 렌더링합니다. 별도의 API 호출 없이 클라이언트 상태를 활용합니다.

### 관리자 센터

- `fetchAdminOverview`는 컴퓨터 수, 점검 중인 수, 진행 중 예약 수를 계산합니다.
- `updateComputerStatus`는 선택한 컴퓨터의 `status` 필드를 업데이트해 실시간 예약 가능 여부를 제어합니다.
- 사용자 관리 폼은 Firestore 문서를 생성/수정(`createUserDocument`, `updateUserDocument`, `deleteUserDocument`)하며, 신규 사용자 추가 시 `createAuthAccount`(callable function)를 옵션으로 실행해 Firebase Auth 계정까지 생성합니다.
- 삭제는 문서만 삭제하거나, 추가 확인 후 `deleteAuthAccount`를 호출해 Auth 계정까지 제거할 수 있습니다.
- 전체 예약 테이블은 모든 `reservations` 문서를 정렬(slot 우선 순위 포함)해 보여줍니다.

## 데이터 모델 (Cloud Firestore)

| 컬렉션 | 주요 필드 | 설명 |
| --- | --- | --- |
| `users/{uid}` | `displayName`, `email`, `studentId`, `roles[]`, `isInitialized`, `emailVerified`, `updatedAt` | 권한 및 초기화 상태 판단에 사용. `roles`는 문자열 배열(+쉼표 문자열)로 저장됩니다. |
| `computers/{computerId}` | `name`, `status` (`available`, `maintenance`, `offline` 등) | 예약 가능한 자원 목록 및 상태. |
| `reservations/{id}` | `computerId`, `computerName`, `date` (`YYYY-MM-DD`), `slot` (`morning/afternoon/evening`), `userId`, `userName`, `status`, `createdAt`, `cancelledAt` | 예약 기록. 슬롯 중복을 피하기 위해 `computerId+date+slot` 조합으로 조회합니다. |

> Firestore 보안 규칙은 `firestore.rules`에 있으며, 배포 전에 `firebase deploy --only firestore:rules`로 반영하세요.

## Firebase Functions

- `createAuthUser`: 관리자만 호출 가능. 지정한 UID/이메일/비밀번호로 Firebase Auth 계정을 만들고, `roles`에 `admin`이 포함되어 있으면 Custom Claims도 갱신합니다.
- `deleteAuthUser`: 관리자만 호출 가능. UID에 해당하는 Auth 계정을 삭제합니다.
- 두 함수 모두 `functions/index.js`에서 `ensureAdminCaller`를 통해 `users/{callerUid}` 문서의 `roles` 배열에 `admin`이 있는지 검사합니다.
- Functions 런타임은 Node.js 20을 사용합니다(Node 18은 2025-10-30에 폐기됨). `functions/package.json`과 `firebase.json`을 최신 상태로 두고, 로컬 실행 전 `npm --prefix functions install`을 수행하세요.

## 상태 관리 & 서비스 계층

- `authStore`: 로그인/로그아웃/세션 상태, 사용자 정보(`user`, `status`, `error`)를 유지합니다.
- `reservationStore`: 예약 목록, 선택한 컴퓨터·날짜·슬롯, 가용 타임슬롯, 로딩 상태를 한 곳에서 관리합니다.
- `src/services/*.js`는 Firebase SDK 호출을 캡슐화해 UI 컴포넌트가 비즈니스 로직과 분리되도록 구성했습니다.

## 환경 변수

`.env.local` (또는 `.env`)에 아래 키를 설정해야 합니다. CRA는 `REACT_APP_` prefix 가 필수입니다.

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=... # 선택 사항
```

Firebase 프로젝트에서 발급한 구성 값을 그대로 입력하세요. 개발/운영을 분리하고 싶다면 `.env.development`, `.env.production`을 사용할 수 있습니다.

## 개발 환경 준비

1. **Node.js 18 이상** (Functions와 맞추는 것을 권장)
2. 의존성 설치  
   ```bash
   npm install
   npm --prefix functions install   # Functions 사용 시
   ```
3. `.env.local` 구성
4. (선택) Firebase Emulator Suite를 사용하는 경우 `firebase emulators:start` 전에 `firebase login` 및 `firebase use <project>`로 프로젝트를 지정하세요.
5. 개발 서버 실행  
   ```bash
   npm start
   ```
   CRA 기본 포트(`3000`)에서 핫 리로드가 동작합니다.

## NPM 스크립트

| 스크립트 | 설명 |
| --- | --- |
| `npm start` | 개발 서버 실행 |
| `npm test` | Jest + React Testing Library 워치 모드 실행 |
| `npm run build` | 프로덕션 번들 생성 (`build/`) |
| `npm run eject` | CRA 구성 추출 (되돌릴 수 없음) |

## Firebase Functions & 배포

```bash
# Functions 로컬 에뮬레이터
firebase emulators:start --only functions,firestore

# 프로덕션 빌드 & 호스팅 배포
npm run build
firebase deploy --only hosting

# Functions, Firestore, Rules 동시 배포
firebase deploy --only functions,firestore:rules
```

배포 전에 Firestore 보안 규칙과 Functions IAM 권한이 올바른지 검토하세요. Functions는 관리자 호출만 허용하므로, 테스트 시에는 에뮬레이터에서 custom auth token을 사용하거나 관리자 계정으로 로그인한 상태에서 호출해야 합니다.

## 테스트 & 품질

- CRA 기본 `npm test` 명령으로 React Testing Library 기반의 테스트 러너를 실행할 수 있습니다.
- 현재는 UI 스냅샷/상태 테스트가 포함되어 있지 않으므로, 핵심 로직 (예: 예약 가능 여부 계산, 라우팅 가드)을 대상으로 추가 테스트를 작성하는 것을 권장합니다.

## 기타 참고 및 향후 작업 아이디어

- `src/components/Toast.jsx`는 텍스트 배열을 `useState` 내부에서 관리하고 있어 외부에서 메시지를 받아오지 않습니다. 전역 스토어/컨텍스트로 교체하면 실사용 알림을 띄울 수 있습니다.
- `prisma/schema.prisma`는 아직 모델이 정의되어 있지 않으므로, 별도 서버·DB와 연동할 계획이 있다면 여기서 스키마를 관리할 수 있습니다.
- 슬롯 정의(`availabilityApi.js`)에 새 시간대를 추가하면 UI 전반이 자동 반영되지만, Firestore에 저장된 `slot` 값도 동일한 식별자를 사용해야 합니다.
- UI 텍스트는 대부분 한국어이므로, i18n을 고려한다면 문자열 리소스 파일을 도입하는 편이 좋습니다.

---

필요한 추가 정보나 개선 요청이 있다면 언제든지 이 문서를 업데이트하세요. 프로젝트의 구조와 도메인 로직이 명확하게 드러나는 README를 유지하는 것이 장기 유지보수에 큰 도움이 됩니다.
