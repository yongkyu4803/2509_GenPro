# ENGINEERING_RULES.md — 프롬프트 생성기 코딩 규칙 (Next.js + Vercel)

본 문서는 **코드 작성·배포·운영**에 필요한 규칙을 정의합니다. 제품 규칙은 `RULES.md`를, 개발 규칙은 본 문서를 참조하세요.

---

## 1) 기술 스택 & 런타임 원칙

- **프레임워크**: Next.js(App Router) / **TypeScript** 필수, `tsconfig`는 `strict: true`.
- **런타임 분리**
  - **Edge 경로**(기본): 단일/저지연 경로. 파일시스템·네이티브 모듈 금지.
  - **Node 경로**(확장): 멀티스텝(정규화→생성→검사→재작성), 외부 라이브러리 의존, 장시간 처리.
- **모델 SDK**: `openai` 또는 `ai + @ai-sdk/openai` 중 택1. 프로젝트 시작 시 **하나로 고정**.
- **토큰 카운트**: Edge 호환 가능한 `@dqbd/tiktoken` 사용(오차 10% 버퍼).

---

## 2) 디렉터리 구조(권장)

```
/app
  /api
    /prompt            # Edge: 단일 생성 경로
      route.ts
    /prompt-advanced   # Node: 멀티스텝/재작성/툴호출
      route.ts
/lib
  llm.ts               # 모델 클라이언트/콜 래퍼
  tokens.ts            # 토큰 카운팅/예산 가드
  logger.ts            # 구조적 로깅
  rate-limit.ts        # 레이트리밋
  validate.ts          # Zod 스키마
  checklist.ts         # 체크/재작성 트리거
  rulepacks.ts         # 룰팩 로더(파일/원격)
/rulepacks
  /format/*.yaml
  /level/*.yaml
  /tone/*.yaml
  /compliance/*.yaml
/specs/*.schema.yaml    # 스키마
/tests
  unit/*.test.ts
  api/*.test.ts
```

---

## 3) 환경변수 & 보안

- **환경변수(Vercel)**
  - `OPENAI_API_KEY` (서버 전용)
  - `RULEPACKS_BASE_URL` 또는 파일 로딩이면 불필요
  - `KV_URL` 또는 `DATABASE_URL` (선택)
- **보안 원칙**
  - API 키는 **서버사이드에서만** 사용. 클라이언트 전송 금지.
  - 로그/에러에 PII 기록 금지(주제 텍스트는 해시/부분 마스킹).
  - CORS: 동일 오리진. 필요 시 `OPTIONS` 허용/화이트리스트.

---

## 4) API 계약 (실제 코드 기준)

### 4.1 요청/응답 스키마 (Zod)

```ts
// /lib/validate.ts
import { z } from "zod";

export const UserInputSchema = z.object({
  topic: z.string().min(3).max(400),
  format: z.enum([
    "press_release",
    "speech",
    "sns",
    "inquiry",
    "report",
    "media_scraping",
  ]),
  level: z.enum(["basic", "intermediate", "advanced"]),
  modelType: z.enum(["lite", "reasoning"]).default("lite"),
  tone: z.enum(["public", "neutral", "friendly"]).default("public"),
  extras: z
    .object({
      platform: z
        .enum(["twitter", "instagram", "youtube_community"])
        .optional(),
      lengthHint: z.enum(["short", "mid", "long"]).optional(),
    })
    .optional(),
});

export type UserInput = z.infer<typeof UserInputSchema>;

export const PromptResponseSchema = z.object({
  prompt: z.string().min(30),
  meta: z.object({
    rulepackId: z.string(),
    format: z.string(),
    level: z.string(),
    tokens: z.object({ in: z.number(), out: z.number(), total: z.number() }),
    warnings: z.array(z.string()).optional(),
  }),
});
```

### 4.2 에러 페이로드(표준화)

```json
{
  "error": { "code": "BAD_REQUEST", "message": "Validation failed: ..." },
  "requestId": "r-20250907-abc123"
}
```

---

## 5) 토큰 예산 & 가드

- **입력(estimated)**: UI 키-값만 → 대체로 **< 300 tokens**
- **레벨별 `max_tokens`**
  - `basic`: 300, `intermediate`: 600, `advanced`: 900
- **호출 상한**: 정규화 1회 + 생성 1회 + (재작성 1회, 조건부)
- **가드 로직**

```ts
// /lib/tokens.ts
export const BUDGET = {
  input: 8000,
  output: { basic: 300, intermediate: 600, advanced: 900 },
  safety: 0.9,
};

export function enforceOutputCap(level: "basic" | "intermediate" | "advanced") {
  return Math.floor(BUDGET.output[level] * BUDGET.safety);
}
```

---

## 6) 레이트리밋 & 남용 방지

- **기본 정책**: IP 기준 **분당 30 req**, 사용자 로그인 시 사용자ID 기준 **분당 60 req**.
- **스토리지**: Edge 친화적인 KV(선택) 또는 메모리(프리뷰 한정).
- **실패 시**: `429 Too Many Requests` + `Retry-After` 헤더.

---

## 7) 로깅/관찰성

- **형식**: JSON line (`console.log(JSON.stringify({...}))`)
- **필수 필드**: `requestId`, `route`, `runtime(edge|node)`, `format`, `level`, `rulepackId`, `tokens.in/out/total`, `durationMs`, `warnings`
- **레벨**: `info`(정상), `warn`(체크 통과 실패·재작성), `error`(예외)

---

## 8) 체크리스트 검사 & 재작성 정책

- **체크 항목**: 형식별 필수 섹션, 금지어, 길이 초과, 팩트/출처 지시 유무.
- **불통과 시**: 자동 재작성 **최대 1회**. 여전히 실패하면 `warnings`만 첨부해 반환.

```ts
// /lib/checklist.ts
export function checkPrompt(
  text: string,
  format: "press_release" | "speech" | "sns"
) {
  const warnings: string[] = [];
  // ...룰팩 기반 검사...
  return { ok: warnings.length === 0, warnings };
}
```

---

## 9) 룰팩 로딩 & 버저닝

- **형식**: YAML(권장) 또는 JSON. `id`는 `press_release_v1` 형태.
- **버저닝**: SemVer 유사(`_v1`, `_v1_1`). 변경 시 `CHANGELOG.md` 필수.
- **로딩 실패 시**: 안전 기본값(`press_release_v1`, `public_official_v1`, `intermediate_v1`)로 폴백 + `warn` 로그.

---

## 10) LLM 호출 래퍼 (단일 인터페이스)

```ts
// /lib/llm.ts
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function generatePrompt({
  system,
  user,
  maxTokens,
}: {
  system: string;
  user: string;
  maxTokens: number;
}) {
  const start = Date.now();
  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.6,
    stream: false,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: maxTokens,
  });
  const text = stream.choices?.[0]?.message?.content ?? "";
  return { text, durationMs: Date.now() - start };
}
```

---

## 11) 라우트 구현 패턴

### 11.1 Edge(기본) — `/api/prompt`

```ts
// app/api/prompt/route.ts
export const runtime = "edge";
import { NextRequest } from "next/server";
import { UserInputSchema } from "@/lib/validate";
import { loadRulepacks } from "@/lib/rulepacks";
import { generatePrompt } from "@/lib/llm";
import { checkPrompt } from "@/lib/checklist";
import { enforceOutputCap } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const body = await req.json();
    const userInput = UserInputSchema.parse(body);

    const packs = await loadRulepacks(userInput);
    const system = packs.toSystemPrompt(); // 템플릿화된 시스템 프롬프트
    const user = packs.toUserPrompt(userInput); // 정규화 포함(Edge에선 경량 처리)

    const maxTokens = enforceOutputCap(userInput.level);
    const { text } = await generatePrompt({ system, user, maxTokens });

    const check = checkPrompt(text, userInput.format);
    // 필요시 재작성 로직(간단히 생략 또는 Node 경로로 위임)

    return new Response(
      JSON.stringify({
        prompt: text,
        meta: {
          rulepackId: packs.id,
          format: userInput.format,
          level: userInput.level,
          tokens: { in: 0, out: text.length, total: 0 },
          warnings: check.ok ? undefined : check.warnings,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: { code: "BAD_REQUEST", message: err.message },
        requestId,
      }),
      { status: 400 }
    );
  }
}
```

### 11.2 Node(확장) — `/api/prompt-advanced`

- 정규화(LLM) → 생성(LLM) → 체크 실패 시 재작성(LLM) **최대 1회**.
- 외부 도구(번역/요약)·복잡 로깅·리트라이 등 수행.

---

## 12) 코딩 스타일 & 품질

- **ESLint + Prettier** 표준 설정, `noImplicitAny`, `noUncheckedIndexedAccess` 활성화.
- **커밋 컨벤션**: Conventional Commits(`feat:`, `fix:`, `chore:`…).
- **에러 처리**: `try/catch` + 에러 코드 맵핑(`BAD_REQUEST|RATE_LIMITED|UPSTREAM_ERROR`).
- **국문화**: 사용자-facing 텍스트는 한국어. 내부 로그/코드는 영어 가능.

---

## 13) 테스트 전략

- **유닛**: 스키마 검증, 룰팩 로딩, 체크리스트 검사.
- **API**: `/api/prompt` happy-path, 밸리데이션 실패, 레이트리밋 429.
- **스냅샷**: 대표 케이스 10종 프롬프트 스냅샷 비교(레벨·형식별).
- **도구**: Vitest(유닛) + Supertest 또는 Next API 테스트 러너.

---

## 14) 성능 & SLO

- **목표**: P50 < 1.5s(Edge), P95 < 3s.
- **릴리즈 전 체크**: 대표 입력 10종 측정 → PR 템플릿에 기록.

---

## 15) 접근성 & UX 규칙

- 복사 버튼 키보드 포커스 가능, ARIA 라벨 제공.
- 오류 메시지 명확(필드 기준), 재시도 안내.

---

## 16) 운영·배포

- **Vercel Preview → Production** 2단계.
- **롤백**: 직전 빌드 롤백 지침 숙지.
- **비용 모니터링**: 일일 토큰·호출 수 상한, 초과 알림.

---

## 17) 변경 관리

- `RULES.md`(제품)와 본 문서(개발) **동시에 업데이트**.
- 룰팩 변경 시 회귀 테스트(체크리스트 10케이스) 의무.

---
