# RULES.md — 국회 보좌진용 **프롬프트 생성기** 운영 규칙

본 문서는 **PromptLab for Assembly Aides**의 일관된 품질·비용·보안을 보장하기 위한 **작업 규칙**입니다.  
PRD에서 합의된 원칙(템플릿화 vs LLM 위임, 형식/레벨/모델타입 축, Vercel 배포)을 구체적 실행 규칙으로 내립니다.

---

## 1) 목적·범위

- **목적**: 사용자의 *주제 + 옵션*을 입력받아, 어떤 LLM에서도 재사용 가능한 **단일 프롬프트**를 생성.
- **범위**: 프롬프트 생성 파이프라인 규칙, 룰팩 스키마, 토큰/비용 거버넌스, 품질·보안, 배포·로그 기준.
- **비범위**: 완성 문서 자동 작성(보도자료/연설문/SNS 결과물 자체), 외부 검색/RAG(차후 단계).

---

## 2) 핵심 원칙 (Template vs LLM)

- **템플릿화(고정)**
  - 형식 분기 룰팩(보도자료/연설문/SNS), 레벨 가이드(초/중/고급), 톤팩, 컴플라이언스/금지어, 출력 스키마, 체크리스트, 토큰 상한.
- **LLM 위임(가변)**
  - _주제 의미 해석/정규화_, 형식별 구성요소 우선순위 판단, 레벨별 세부 지시 문안화, 미세 톤 조정, 리스크 맥락 반영.

---

## 3) 프롬프트 생성 **파이프라인 규칙**

1. **입력 수집**: `topic, format(press_release|speech|sns), level(basic|intermediate|advanced), modelType(lite|reasoning), tone, extras(platform/lengthHint…)`
2. **정규화(LLM, 짧은 호출 1)**: 도메인/핵심메시지/이해관계자/리스크 추출 → `normalized` 섹션 생성.
3. **룰팩 로딩(템플릿)**: `formatPack + levelGuide + tonePack + complianceRules + constraints`.
4. **생성(LLM, 주 호출 1)**: 룰팩×정규화 결과로 **"프롬프트만"** 생성. `max_tokens`는 레벨 가이드에 따름.
5. **체크(규칙)**: 섹션 누락/금지어/길이 초과 검사. 미준수 시 **자동 재작성(LLM 1회 한정)**.
6. **반환**: `{prompt, meta(rulepackId, format, level, tokens, warnings?)}`

> **엄수**: 결과에는 **설명/메모 없이 프롬프트 텍스트만** 포함(메타는 별도 필드).

---

## 4) 토큰/비용 거버넌스

- **입력**: UI 키-값만 전송(과거 히스토리 미포함).
- **연산**: 호출 수 상한 = **정규화 1 + 생성 1 + (재작성 1 선택)**. 총 토큰 **평균 < 900**, 95p < 1200.
- **출력**: 레벨별 `max_tokens` 하드캡(아래 표 참고).
- **레벨별 캡(가이드)**
  - basic: **≤ 300** tokens
  - intermediate: **≤ 600** tokens
  - advanced: **≤ 900** tokens

---

## 5) 런타임/배포 규칙 (Vercel)

- **Edge 경로(기본)**: 단일·저지연 경로(룰팩 적용 + 1~2회 호출). 파일시스템/네이티브 모듈 금지.
- **Node 경로(확장)**: 멀티스텝·장시간·복잡 오케스트레이션 필요 시 별도 라우트.
- **라우팅 분리**: `/api/prompt`(Edge), `/api/prompt/advanced`(Node) 권장.

---

## 6) 로깅·관찰성

- **기록 항목**: 요청ID, 형식/레벨, 룰팩 버전, 토큰(입·출), 재작성 횟수, 경고, 응답시간.
- **PII**: 주제 텍스트에서 민감 식별정보는 **마스킹**.
- **경고 태깅**: 섹션 누락, 금지어, 길이 초과, 컴플라이언스 위반.

---

## 7) 품질 기준 & 수용 기준

- **필수 섹션** 누락 없음(형식별 규정).
- **금지어/과장/추측성** 없음.
- **팩트/출처 요구** 지시 포함(특히 보도자료/정책 주제).
- **레벨별 길이·지시 강도** 차등 명확.
- **반환물**: 프롬프트 텍스트 1개(메타 별도).
- **성능**: P50 < 1.5s(Edge), P95 < 3s.

---

## 8) 금지/주의 표현 관리

- **금지**: 근거 없는 단정(“확실히”, “분명히”), 과장/선동 표현, 모호 주어(“일각에서는”), 무출처 수치·날짜.
- **주의**: 정치적 가치판단 단정, 제3자 명예훼손, 오인 가능 광고성 문구(SNS).

---

## 9) 폴더 구조 & 네이밍

```
/rulepacks
  /format
    press_release_v1.yaml
    speech_v1.yaml
    sns_v1.yaml
    inquiry_v1.yaml
    report_v1.yaml
    media_scraping_v1.yaml
  /level
    basic_v1.yaml
    intermediate_v1.yaml
    advanced_v1.yaml
  /tone
    public_official_v1.yaml
    neutral_v1.yaml
    friendly_v1.yaml
  /compliance
    general_kor_public_comm_v1.yaml
/specs
  rulepack.schema.yaml
  level.schema.yaml
  tone.schema.yaml
/checklists
  press_release_intermediate_v1.md
  speech_advanced_v1.md
  sns_basic_v1.md
  inquiry_intermediate_v1.md
  report_intermediate_v1.md
  media_scraping_intermediate_v1.md
```

---

## 10) 스키마(요약)

### 10.1 **형식 룰팩 스키마** (`rulepack.schema.yaml`)

```yaml
id: press_release_v1
type: formatPack
requiredSections:
  - headline
  - subhead
  - lede
  - body
  - quote
  - contact
toneDefault: public_official_v1
dos:
  - "수치·출처를 명시한다."
  - "과장·추측 표현을 배제한다."
donts:
  - "확정적 단정"
  - "모호한 주어"
structureHints:
  headline:
    mustIncludeOneOf: ["고유명사", "구체 수치", "날짜"]
  body:
    order: ["배경", "근거·수치", "인용", "후속일정"]
complianceRules:
  - facts_required
  - source_required
  - no_exaggeration
```

### 10.2 **레벨 가이드 스키마** (`level.schema.yaml`)

```yaml
id: intermediate_v1
type: levelGuide
maxTokens: 600
strictness:
  checklistRequired: true
  forbidVagueSubject: true
requiredDirectives:
  - "핵심 메시지 1~2개를 명시"
  - "출처·수치를 구체 값으로 요구"
  - "과장·추측 표현 금지"
```

### 10.3 **톤팩 스키마** (`tone.schema.yaml`)

```yaml
id: public_official_v1
type: tonePack
register:
  style: "공적/중립, 간결"
  persona: "정부/의회 커뮤니케이션"
  forbidden:
    - "비격식 이모지 남발"
    - "과도한 감탄"
lexiconHints:
  prefer:
    - "구체적 수치"
    - "정의된 용어"
  avoid:
    - "모호한 말버릇"
```

### 10.4 **컴플라이언스 룰(예)** (`general_kor_public_comm_v1.yaml`)

```yaml
id: general_kor_public_comm_v1
rules:
  facts_required: "수치·날짜·기관명은 구체 값 요구. 불확실은 '검증 필요'로 표기."
  source_required: "주장에는 1개 이상 출처·문서·통계 요구."
  no_exaggeration: "선동·과장·확정 단정 금지. 정책효과는 보수적으로."
```

---

## 11) 형식별 **체크리스트 요약**

- **보도자료(중급 예)**
  - [ ] 헤드라인: 고유명사/수치 ≥ 1
  - [ ] 리드: 2~3문장 핵심 요약
  - [ ] 본문: 배경→근거/수치→인용→후속일정
  - [ ] 문의처 포함, 과장/추측 금지
  - [ ] 출처·팩트 검증 지시 포함
  - [ ] 총 길이 ≤ 600 tokens
- **연설문(고급 예)**
  - [ ] 청중·장소·길이 명시
  - [ ] 스토리 아크: 후킹→문제→비전→정책→호소/감사
  - [ ] 수사 장치(반복/대조) 절제, 박수 포인트 설정
  - [ ] 반론·브리지 문구 포함, 총 길이 ≤ 900 tokens
- **SNS(초급 예)**
  - [ ] 플랫폼 제약 준수(자수/링크)
  - [ ] 1문장 후킹 + 명확한 CTA
  - [ ] 해시태그 정책 준수, 광고성 문구 주의
  - [ ] 단문 변형 N안(AB용), 총 길이 ≤ 300 tokens
- **질의서 작성(중급 예)**
  - [ ] 질의 목적·배경 명확히 기술
  - [ ] 구체적 질문사항 번호별 나열
  - [ ] 답변 요구 형식(서면/구두) 명시
  - [ ] 회신 기한 설정, 관련 법령 근거 포함
  - [ ] 후속조치 계획 언급, 총 길이 ≤ 600 tokens
- **보고서 작성(중급 예)**
  - [ ] 요약: 핵심 내용 2~3줄 압축
  - [ ] 배경/현황: 객관적 사실 중심 기술
  - [ ] 쟁점 분석: 다각도 관점 제시
  - [ ] 결론/권고: 구체적 실행방안 포함
  - [ ] 부록/참고자료 목록, 총 길이 ≤ 600 tokens
- **언론보도 스크랩(중급 예)**
  - [ ] 검색 키워드: 핵심어+동의어 조합
  - [ ] 수집 범위: 기간/매체/지역 한정
  - [ ] 분석 관점: 긍정/부정/중립 분류 기준
  - [ ] 요약 형식: 시계열/주제별 구조화
  - [ ] 트렌드 파악: 변화 추이 분석 포함, 총 길이 ≤ 600 tokens

---

## 12) API 계약 규칙

- `POST /api/prompt`
  - **req**: `{ userInput, options }`
  - **res**: `{ prompt: string, meta: { rulepackId, format, level, tokens, warnings?: string[] } }`
  - **오류 처리**: 체크 불통과 시 `warnings` 채워 반환. 자동 재작성 1회 후에도 불통과면 경고 유지.

---

## 13) 모델·파라미터 정책

- **modelType = lite**: 저비용·저추론(문장 다듬기 중심), `temperature: 0.5~0.7`.
- **modelType = reasoning**: 의미 확장·리스크 컨텍스트, `temperature: 0.3~0.6`.
- **공통**: `max_tokens`는 **레벨 가이드 값**을 초과 금지.

---

## 14) 보안·비밀 관리

- API 키는 **서버사이드 환경변수**. 브라우저 노출 금지.
- 로그에 민감 식별정보 저장 금지(마스킹).
- 정치·의료·금융 등 민감 토픽에는 **검증·출처** 지시 강화.

---

## 15) 변경 관리·버저닝

- 룰팩/톤팩/레벨가이드 **SemVer** 적용(예: `press_release_v1 → v1.1`).
- 변경 시 **변경 요약(CHANGELOG.md)**, 회귀 테스트(체크리스트 10케이스) 필수.
- 배포 전 **스테이징에서 토큰/지연 메트릭 확인**.

---

## 16) 샘플 룰팩 (요약본)

### 16.1 보도자료 v1

```yaml
id: press_release_v1
requiredSections: [headline, subhead, lede, body, quote, contact]
structureHints:
  headline: { mustIncludeOneOf: ["고유명사", "구체 수치", "날짜"] }
  body: { order: ["배경", "근거·수치", "인용", "후속일정"] }
complianceRules: [facts_required, source_required, no_exaggeration]
toneDefault: public_official_v1
```

### 16.2 연설문 v1

```yaml
id: speech_v1
requiredSections: [purpose, audience, arc, policy_points, closing]
structureHints:
  arc: { order: ["후킹", "문제", "비전", "정책", "호소/감사"] }
advancedOptions:
  applause_points: true
  rebuttal_bridge: true
complianceRules: [facts_required, no_exaggeration]
toneDefault: public_official_v1
```

### 16.3 SNS v1

```yaml
id: sns_v1
requiredSections: [hook, body_short, cta, tags]
platformConstraints:
  twitter: { maxChars: 280, linkPolicy: "1개 이하" }
  instagram: { maxHashtags: 10 }
variants: { count: 3 } # AB 테스트용 단문 변형
complianceRules: [no_exaggeration]
toneDefault: neutral_v1
```

### 16.4 질의서 작성 v1

```yaml
id: inquiry_v1
requiredSections:
  [purpose, background, questions, response_format, deadline, legal_basis]
structureHints:
  questions: { numbering: "1), 2), 3)..." }
  deadline: { format: "YYYY년 MM월 DD일까지" }
  legal_basis: { mustInclude: ["관련 법령", "근거 조항"] }
complianceRules: [facts_required, source_required, formal_tone]
toneDefault: public_official_v1
```

### 16.5 보고서 작성 v1

```yaml
id: report_v1
requiredSections: [summary, background, analysis, conclusion, appendix]
structureHints:
  summary: { maxLines: 3, keyPoints: "핵심 내용만" }
  analysis: { perspectives: ["현황", "쟁점", "대안"] }
  conclusion: { actionItems: "구체적 실행방안" }
complianceRules:
  [facts_required, source_required, objective_tone, no_exaggeration]
toneDefault: public_official_v1
```

### 16.6 언론보도 스크랩 v1

```yaml
id: media_scraping_v1
requiredSections: [keywords, scope, analysis_criteria, summary_format, trends]
structureHints:
  keywords: { combinations: "핵심어+동의어", operators: "AND/OR" }
  scope: { period: "수집기간", media: "매체범위", region: "지역" }
  analysis_criteria: { sentiment: ["긍정", "부정", "중립"] }
  summary_format: { structure: ["시계열", "주제별"] }
complianceRules: [objective_tone, source_required]
toneDefault: neutral_v1
```

---

## 17) FAQ·운영 지침

- **Q. 프롬프트가 길어요.** → 레벨 가이드를 낮추거나 lengthHint=short 권장.
- **Q. 정치적 가치 판단이 과도해요.** → tonePack을 `public_official_v1`로 강제, `no_exaggeration` 재확인.
- **Q. 속도가 느립니다.** → Edge 경로 유지, 재작성 호출 비활성화 또는 룰팩 간소화.

---

## 18) 부록: 체크리스트 템플릿(복제용)

```md
# [형식]\_[레벨]\_vX 체크리스트

- [ ] 필수 섹션 누락 없음: [...]
- [ ] 길이 ≤ [maxTokens]
- [ ] 금지어/과장/추측성 표현 없음
- [ ] 출처/팩트 검증 지시 포함
- [ ] 톤팩 준수(어휘/스타일)
- [ ] 구조 힌트(순서/포맷) 준수
- [ ] 경고(warnings) 비어있음
```

---

**준수 실패 시**: 자동 재작성 1회 한정 → 여전히 불통과면 사용자에게 `warnings` 표시 후 프롬프트 제공.
