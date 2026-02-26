# ⚡ Link-X

> **금융권 특화 전문(Fixed-length Telegram) 테스트 도구**

금융 시스템 개발 현장에서 Postman으로는 불가능한 **고정길이 전문 송수신**, **멀티 프로토콜 테스트**, **EAI 연계 검증**, **TCP Mock 서버 시뮬레이션**을 하나의 웹 기반 도구로 해결합니다.

---

## 📌 왜 만들었나?

금융권 인터페이스 개발 시 겪는 문제들:

- **Postman으로는 불가능** — 금융 전문은 HTTP/JSON이 아닌 고정길이 바이트 데이터
- **TCP 소켓 테스트가 번거로움** — 매번 간이 클라이언트를 만들어서 테스트
- **전문 파싱이 수작업** — 수백 바이트 전문을 눈으로 잘라서 확인
- **프로토콜마다 도구가 다름** — TCP, HTTP, MQ를 각각 다른 도구로 테스트
- **이력 관리가 안 됨** — 언제 어떤 전문을 보냈는지 추적 불가
- **계정계 / 대외기관 서버 없이는 테스트 불가** — 개발 환경에서 Mock 서버가 없어 매번 의존 발생

---

## 🖥️ 주요 화면

### 1. Dashboard — 실시간 모니터링
> 전문 송수신 현황을 한 눈에 파악

- 총 요청 수, 성공률, 평균 응답시간, 에러 건수 (KPI 카드)
- 시간대별 요청량 바 차트
- 프로토콜별 분포 도넛 차트
- 응답시간 분포 히트맵
- 최근 처리 내역 실시간 피드

### 2. 전문 테스트 — 핵심 기능
> Postman처럼 전문을 구성하고 송수신

- 전문코드 선택 → DB에서 레이아웃 자동 로드
- 필드별 값 입력 (헤더/바디 섹션 구분)
- 프로토콜 선택 (TCP/HTTP/MQ) + 접속정보 설정
- 전문 미리보기 (빌드 결과 확인)
- 전송 실행 → 응답 파싱 결과 즉시 확인
- Raw 전문 필드별 색상 하이라이트

### 3. 레이아웃 관리 — 전문 메타데이터 CRUD
> 전문 필드 정의를 등록/수정/삭제

- **+ 전문 추가** 버튼으로 새 전문코드 등록 (MSG_LEN 기본 필드 자동 생성)
- 전문코드별 필드 목록 (번호, 섹션, 필드명, 길이, 타입, 정렬, 패딩)
- 전문 전체 길이 / 헤더 / 바디 길이 자동 계산
- 필드 추가/삭제
- 기존 EAI 시스템 `TB_TELEGRAM_LAYOUT` 테이블 호환 구조
- API 연동 (백엔드 저장, 실패 시 로컬 fallback)

### 4. 송수신 이력 — 검색 및 필터링
> 전문 송수신 기록 조회 및 분석

- 전문코드/전문명 검색
- 프로토콜별 필터 (TCP/HTTP/MQ)
- 상태별 필터 (성공/실패)
- 목록 선택 시 우측 상세 패널 (요청/응답 원문)
- 처리시간 느린 건 강조 표시

### 5. 접속 프로파일 — 환경별 접속정보 관리
> 개발/검증/운영 환경 프로파일 관리

- 환경별 탭 필터 (DEV / STG / PRD)
- 프로파일 카드 뷰 (호스트, 포트, 프로토콜, 인코딩, 타임아웃)
- 프로파일 추가/수정/삭제/활성화·비활성화
- 운영 환경 위험 표시 (빨간 보더)

### 6. 전문 상세보기 — 요청/응답 비교 분석
> 이력에서 선택한 전문의 상세 분석

- **요청/응답 비교 탭**: 필드별 나란히 비교, 값 차이(diff) 하이라이트
- **요청 상세 탭**: 오프셋, 길이, 타입, 값, Raw 원문 표시
- **응답 상세 탭**: 동일 구조
- **Raw 전문 탭**: 필드별 색상 하이라이트 + 필드 범례
- **Hex Dump 탭**: 16바이트 행 단위 헥스/아스키 덤프, 필드별 색상

### 7. Simulator — TCP Mock 서버 ⭐
> 실제 계정계/대외기관 서버 없이 로컬에서 응답 서버 구동

- **리스너 제어 탭**: TCP 포트 리스닝 시작/중지, 실시간 상태/통계 모니터링 (총 요청 수, 성공/에러)
- **응답 규칙 탭**: 전문코드별 필드 응답 방식 정의 (FIXED / ECHO / ECHO_FROM / TIMESTAMP / SEQUENCE)
- **수신/응답 로그 탭**: 수신된 전문 원문과 응답 전문 실시간 확인, 에러 상세 표시
- 리스너 설정 CRUD (포트, 인코딩, 길이헤더 크기, 전문코드 오프셋, 응답 지연 등)
- 레이아웃 기반 자동 규칙 생성 (에코백 기본 규칙 자동 셋업)
- 2초 폴링 기반 실시간 상태 업데이트

---

## 🏗️ 아키텍처

```
┌─────────────┐     HTTP/JSON      ┌──────────────────────────────────┐
│  React UI   │ ◄────────────────► │        Spring Boot Backend       │
│  (7 Pages)  │                    │                                  │
└─────────────┘                    │  ┌────────────────────────────┐  │
                                   │  │  TelegramController        │  │
                                   │  │  LayoutController          │  │
                                   │  │  ProfileController         │  │
                                   │  │  SimulatorController       │  │
                                   │  └──────────┬─────────────────┘  │
                                   │             │                    │
                                   │  ┌──────────▼─────────────────┐  │
                                   │  │  TelegramService           │  │
                                   │  │  SimulatorService          │  │
                                   │  └──────┬───────────┬─────────┘  │
                                   │         │           │            │
                                   │  ┌──────▼──────┐ ┌─▼──────────┐  │
                                   │  │  Telegram   │ │  Protocol  │  │
                                   │  │  Engine     │ │  Router    │  │
                                   │  │ (빌드/파싱) │  │ auto route │  |
                                   │  └──────┬──────┘ └──┬───┬───┬─┘  │
                                   │         │           │   │   │    │
                                   │  ┌──────▼──────┐    │   │   │    │
                                   │  │ PostgreSQL  │    │   │   │    │
                                   │  └─────────────┘    │   │   │    │
                                   └─────────────────────┼───┼───┼────┘
                                                         │   │   │
                                                ┌────────┘   │   └────────┐
                                                ▼            ▼            ▼
                                           ┌────────┐  ┌────────┐  ┌────────┐
                                           │  TCP   │  │  HTTP  │  │   MQ   │
                                           │ Socket │  │  REST  │  │  IBM   │
                                           └───┬────┘  └───┬────┘  └───┬────┘
                                               └─────┬─────┘───────────┘
                                                     ▼
                                            ┌─────────────────┐
                                            │   EAI / 계정계   │
                                            │   대외기관 서버   │
                                            └─────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     TCP Simulator (Mock Server)                      │
│                                                                      │
│  SimulatorService ──► TcpListener (포트별 독립 스레드)               │
│       │                    │                                         │
│       │              ┌─────▼──────────────────────────────────┐     │
│       │              │  수신 → 길이헤더 파싱 → 전문코드 추출   │     │
│       │              │  → 레이아웃 매칭 → 응답 생성 → 전송     │     │
│       │              └─────────────────────────────────────────┘     │
│       │                    │                                         │
│  ResponseGenerator ◄───────┘  (FIXED/ECHO/TIMESTAMP/SEQUENCE)       │
│       │                                                              │
│  SimulatorLog ──► TB_SIMULATOR_LOG (수신/응답 이력 저장)             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Backend** | Java 17, Spring Boot 3.2, Spring Data JPA, Hibernate |
| **Frontend** | React 18, Vite 5, React Router 6, Axios |
| **Database** | PostgreSQL 15 (운영) / H2 (개발) |
| **통신** | TCP/IP Socket, HTTP/REST, IBM MQ |
| **빌드** | Gradle 8.x, npm |
| **인프라** | Docker Compose |

---

## 🔥 핵심 기능 상세

### Fixed-length 전문 엔진 (`TelegramEngine.java`)
- DB 메타데이터 기반 전문 레이아웃 관리 (기존 EAI 시스템 호환)
- **전문 빌드**: 필드값 → 고정길이 바이트 배열 변환
- **전문 파싱**: 바이트 배열 → 필드별 자동 분해
- **유효성 검사**: 필수값, 숫자 타입, 길이 초과 체크
- **인코딩 지원**: EUC-KR (한글 2byte) / UTF-8 / MS949

### 멀티 프로토콜 송수신 (Strategy 패턴)
- **TCP/IP Socket**: 동기 방식, 길이 헤더(4/8byte) 자동 처리
- **HTTP/REST**: POST/PUT, 커스텀 헤더, Content-Type 설정
- **IBM MQ**: Request/Response Queue 기반 (확장 가능)
- 새 프로토콜 추가 시 `ProtocolHandler` 구현만 하면 자동 라우팅

### TCP Mock 서버 (Simulator) ⭐
- **멀티 리스너**: 포트별 독립 스레드로 복수 리스너 동시 운영 가능
- **자동 전문 파싱**: 수신 전문을 레이아웃 기반으로 필드별 자동 분해
- **응답 규칙 엔진 (`ResponseGenerator`)**: 필드별 응답값 생성 방식 정의
  - `FIXED` — 고정값 지정
  - `ECHO` — 요청 동일 필드값 에코백
  - `ECHO_FROM` — 요청의 다른 필드값 복사 (sourceField 지정)
  - `TIMESTAMP` — 현재 시각 자동 삽입 (포맷 지정 가능)
  - `SEQUENCE` — 자동 증가 순번 (prefix + 10자리 zero-padding)
  - `DEFAULT` — 규칙 없는 필드는 에코백 처리
- **길이 헤더 처리**: 4/8byte 고정길이 헤더 자동 파싱·생성, 자기 포함 여부 설정 가능
- **응답 지연 시뮬레이션**: 실제 서버 처리 시간 모사 (responseDelayMs 설정)
- **수신 로그**: 모든 수신/응답 원문을 `TB_SIMULATOR_LOG`에 저장

---

## 📂 프로젝트 구조

```
link-x/
├── eai-engine/
│   ├── build.gradle
│   └── src/main/
│       ├── java/com/linkx/
│       │   ├── LinkXApplication.java
│       │   ├── config/
│       │   │   └── WebConfig.java              # CORS 설정 (allowedOriginPatterns 사용)
│       │   ├── controller/
│       │   │   ├── TelegramController.java
│       │   │   ├── LayoutController.java
│       │   │   ├── ProfileController.java
│       │   │   └── SimulatorController.java     # ⭐
│       │   ├── domain/
│       │   │   ├── TelegramLayout.java
│       │   │   ├── TelegramHistory.java
│       │   │   ├── ConnectionProfile.java
│       │   │   ├── SimulatorConfig.java         # ⭐
│       │   │   ├── SimulatorLog.java            # ⭐
│       │   │   └── ResponseRule.java            # ⭐
│       │   ├── repository/
│       │   │   ├── TelegramLayoutRepository.java
│       │   │   ├── TelegramHistoryRepository.java
│       │   │   ├── ConnectionProfileRepository.java
│       │   │   ├── SimulatorConfigRepository.java
│       │   │   ├── SimulatorLogRepository.java
│       │   │   └── ResponseRuleRepository.java
│       │   ├── service/
│       │   │   └── TelegramService.java
│       │   ├── simulator/
│       │   │   ├── SimulatorService.java        # ⭐
│       │   │   ├── TcpListener.java             # ⭐
│       │   │   └── ResponseGenerator.java       # ⭐
│       │   ├── telegram/
│       │   │   └── TelegramEngine.java
│       │   └── protocol/
│       │       ├── ProtocolHandler.java
│       │       ├── ProtocolRouter.java
│       │       ├── ConnectionConfig.java
│       │       ├── TcpProtocolHandler.java
│       │       ├── HttpProtocolHandler.java
│       │       └── MqProtocolHandler.java
│       └── resources/
│           ├── application.yml
│           └── data.sql
│
├── eai-adm/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                               # /simulator 라우트 포함
│       ├── styles/
│       │   └── theme.css
│       ├── components/
│       │   └── AppLayout.jsx                     # Simulator 사이드바 메뉴 포함
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── TelegramTester.jsx
│       │   ├── LayoutManager.jsx                 # 새 전문 추가 기능 + API 연동
│       │   ├── HistoryPage.jsx
│       │   ├── ProfileManager.jsx
│       │   ├── TelegramDetail.jsx
│       │   └── SimulatorPage.jsx                 # ⭐
│       └── api/
│           ├── telegramApi.js
│           └── simulatorApi.js                   # ⭐
│
├── docs/
│   ├── schema.sql
│   └── architecture.mermaid
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 실행 방법

### 1. DB 실행
```bash
docker-compose up -d
```

### 2. Backend 실행
```bash
cd eai-engine
./gradlew bootRun
# 개발 모드 (H2 인메모리 DB)
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### 3. Frontend 실행
```bash
cd eai-adm
npm install
npm run dev
```

### 4. 접속
| URL | 용도 |
|-----|------|
| http://localhost:3000 | Frontend |
| http://localhost:8080/api | Backend API |
| http://localhost:8080/h2-console | H2 Console (dev 모드) |

---

## ⚠️ 주요 설정 주의사항

### CORS 설정 (Spring Boot 6 이상)
`allowCredentials(true)` 사용 시 `allowedOrigins("*")` 금지. 반드시 `allowedOriginPatterns("*")` 사용:

```java
// WebConfig.java
registry.addMapping("/api/**")
    .allowedOriginPatterns("*")   // ← allowedOrigins("*") 사용 시 500 에러 발생
    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    .allowedHeaders("*")
    .allowCredentials(true);
```

### Simulator 사용 순서
1. 레이아웃 관리에서 전문 등록
2. Simulator → 리스너 제어 → 리스너 추가 (포트, 전문코드 오프셋 설정)
3. Simulator → 응답 규칙 → 전문코드 선택 후 규칙 저장
4. 리스너 시작
5. 전문 테스트에서 해당 포트로 전송

---

## 📡 API 엔드포인트

### 전문 송수신
| Method | URL | 설명 |
|--------|-----|------|
| `GET` | `/api/telegram/list` | 전문코드 목록 조회 |
| `GET` | `/api/telegram/layout/{id}` | 전문 레이아웃 조회 |
| `POST` | `/api/telegram/send` | 전문 송수신 실행 |
| `GET` | `/api/telegram/history` | 최근 송수신 이력 |

### 레이아웃 관리
| Method | URL | 설명 |
|--------|-----|------|
| `GET` | `/api/layout` | 전체 레이아웃 조회 |
| `POST` | `/api/layout` | 필드 추가 |
| `PUT` | `/api/layout/{id}` | 필드 수정 |
| `DELETE` | `/api/layout/{id}` | 필드 삭제 |

### 시뮬레이터 ⭐
| Method | URL | 설명 |
|--------|-----|------|
| `POST` | `/api/simulator/listener/{configId}/start` | 리스너 시작 |
| `POST` | `/api/simulator/listener/{configId}/stop` | 리스너 중지 |
| `GET` | `/api/simulator/listener/status` | 전체 리스너 상태 조회 |
| `GET` | `/api/simulator/config` | 시뮬레이터 설정 목록 |
| `POST` | `/api/simulator/config` | 설정 등록 |
| `GET` | `/api/simulator/rule/{telegramId}` | 응답 규칙 조회 |
| `POST` | `/api/simulator/rule/batch` | 응답 규칙 일괄 등록 |
| `GET` | `/api/simulator/log` | 수신 로그 조회 |

---

## 🗄️ DB 테이블

| 테이블 | 설명 |
|--------|------|
| `TB_TELEGRAM_LAYOUT` | 전문 필드 레이아웃 메타데이터 |
| `TB_TELEGRAM_HISTORY` | 전문 송수신 이력 |
| `TB_CONNECTION_PROFILE` | 접속 프로파일 |
| `TB_SIMULATOR_CONFIG` | 시뮬레이터 리스너 설정 ⭐ |
| `TB_SIMULATOR_LOG` | 시뮬레이터 수신/응답 로그 ⭐ |
| `TB_RESPONSE_RULE` | 시뮬레이터 응답 규칙 ⭐ |

---

## 📋 향후 계획

- [ ] SFTP/FTP 파일 전송 테스트
- [ ] SEED/ARIA 암복호화 모듈
- [ ] 전문 템플릿 저장/불러오기
- [ ] 배치 테스트 (다건 전문 연속 송신)
- [ ] 전문 diff 비교 (요청 vs 응답 변경점 추적)
- [ ] 사용자 인증/권한 관리
- [ ] 전문 레이아웃 Excel 일괄 업로드
- [ ] 시뮬레이터 SSE 기반 실시간 로그 스트리밍 (현재 폴링 방식)
- [ ] 시뮬레이터 응답 규칙 조건부 분기 (요청 필드값에 따라 다른 응답)
- [ ] 시뮬레이터 장애 시나리오 (응답 지연, 연결 끊김, 에러 응답 비율 설정)

---

## 🧑‍💻 개발 배경

금융권 EAI 시스템 개발 실무에서 매번 전문 테스트를 위해 간이 클라이언트를 만들거나 텔넷으로 바이트를 직접 보내는 비효율을 경험했습니다. 인터페이스 수가 130개가 넘는 프로젝트에서 이 작업이 반복되면서, 현장에서 바로 쓸 수 있는 전문 테스트 전용 도구의 필요성을 느껴 직접 개발하게 됐습니다.

특히 계정계나 대외기관 서버가 준비되지 않은 초기 개발 단계에서 **Simulator 기능**으로 Mock 서버를 직접 띄워 송수신 테스트를 완결할 수 있도록 설계했습니다.

---

## License

MIT License
