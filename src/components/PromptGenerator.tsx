"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  type Format,
  type ValidationLevel,
  type UserInput,
  type APIResponse,
  type PromptResponse,
  type ErrorResponse,
} from "@/types/rulepack"

const formatOptions: { value: Format; label: string }[] = [
  { value: "press_release", label: "보도자료" },
  { value: "speech", label: "연설문" },
  { value: "sns", label: "SNS 게시글" },
  { value: "inquiry", label: "자료제출" },
  { value: "report", label: "보고서" },
  { value: "media_scraping", label: "이슈 분석" },
]

const levelOptions: { value: ValidationLevel; label: string }[] = [
  { value: "basic", label: "기본 (≤300토큰)" },
  { value: "intermediate", label: "중급 (≤600토큰)" },
  { value: "advanced", label: "고급 (≤900토큰)" },
]

function isSuccess(res: APIResponse): res is PromptResponse {
  return (res as PromptResponse).success === true
}

export default function PromptGenerator() {
  const [formData, setFormData] = useState<Partial<UserInput>>({
    topic: "",
    format: "press_release",
    level: "intermediate",
    context: "",
    tone: "public_official_v1",
    additionalRequirements: [],
    options: { includeWarnings: true, strictMode: true },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<APIResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newRequirement, setNewRequirement] = useState("")
  const [copySuccess, setCopySuccess] = useState<string>("")

  const reqCount = formData.additionalRequirements?.length || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = (await response.json()) as APIResponse
      if (!response.ok) {
        if (!isSuccess(data)) setError((data as ErrorResponse).error.message)
        else setError("서버 오류가 발생했습니다.")
      } else {
        setResult(data)
      }
    } catch (err) {
      console.error("API 호출 실패:", err)
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const addRequirement = () => {
    if (newRequirement.trim() && reqCount < 5) {
      setFormData((prev) => ({
        ...prev,
        additionalRequirements: [
          ...(prev.additionalRequirements || []),
          newRequirement.trim(),
        ],
      }))
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalRequirements:
        prev.additionalRequirements?.filter((_, i) => i !== index) || [],
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess("복사 완료!")
      setTimeout(() => setCopySuccess(""), 2000)
    } catch (err) {
      console.error("클립보드 복사 실패:", err)
      setCopySuccess("복사 실패")
      setTimeout(() => setCopySuccess(""), 2000)
    }
  }

  const canSubmit = useMemo(
    () => !!formData.topic?.trim() && !isLoading,
    [formData.topic, isLoading]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center animate-fade-up">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              국회 보좌진 프롬프트 생성기
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              전문적인 정치 콘텐츠 작성을 위한 AI 프롬프트를 생성합니다
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Form Section */}
            <Card className="shadow-modern-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-up">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-foreground">
                  프롬프트 생성 요청
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  주제와 형식을 선택하여 전문적인 콘텐츠 작성용 프롬프트를 생성하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form onSubmit={handleSubmit}>
                  {/* First Row: Topic and Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <FormItem>
                      <FormLabel htmlFor="topic" className="text-sm font-medium text-foreground">
                        주제 *
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="topic"
                          value={formData.topic || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, topic: e.target.value }))
                          }
                          placeholder="예: 교육정책 개선 방안"
                          maxLength={200}
                          required
                          className="input-focus h-12 text-base border-border/50 bg-background/50"
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        작성하고자 하는 콘텐츠의 핵심 주제를 간단명료하게 입력하세요
                      </div>
                      <FormMessage>
                        {formData.topic && formData.topic.length > 200 &&
                          "주제는 200자 이내로 입력해주세요"}
                      </FormMessage>
                    </FormItem>

                    <FormItem>
                      <FormLabel htmlFor="format" className="text-sm font-medium text-foreground">
                        형식 *
                      </FormLabel>
                      <FormControl>
                        <Select
                          id="format"
                          value={formData.format as Format}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              format: e.target.value as Format,
                            }))
                          }
                          required
                          className="input-focus h-12 text-base border-border/50 bg-background/50"
                        >
                          {formatOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <div className="text-xs text-muted-foreground mt-1">
                        생성할 프롬프트가 만들어낼 콘텐츠의 형식을 선택하세요
                      </div>
                    </FormItem>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormItem>
                        <FormLabel htmlFor="level">난이도 *</FormLabel>
                        <FormControl>
                          <Select
                            id="level"
                            value={formData.level as ValidationLevel}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                level: e.target.value as ValidationLevel,
                              }))
                            }
                            required
                          >
                            {levelOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          프롬프트의 복잡성과 상세함 정도를 선택하세요
                        </div>
                      </FormItem>

                      <FormItem>
                        <FormLabel htmlFor="context">배경 정보</FormLabel>
                        <FormControl>
                          <Textarea
                            id="context"
                            value={formData.context || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, context: e.target.value }))
                            }
                            placeholder="예: 청년 실업률 증가, 정책 환경 변화, 사회적 이슈 등"
                            maxLength={500}
                            rows={3}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          주제와 관련된 현재 상황이나 맥락을 설명해주세요
                        </div>
                        <FormMessage>
                          {formData.context && formData.context.length > 500 &&
                            "배경정보는 500자 이내로 입력해주세요"}
                        </FormMessage>
                      </FormItem>
                    </div>

                    <div className="space-y-4">
                      <FormItem>
                        <FormLabel>추가 요구사항</FormLabel>
                        <div className="text-xs text-muted-foreground mb-2">
                          구체적인 작성 지침이나 특별 요구사항 (예: 통계 포함, 실행일정 명시)
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={newRequirement}
                              onChange={(e) => setNewRequirement(e.target.value)}
                              placeholder="예: 통계 데이터 포함, 청중 맞춤 언어 사용"
                              maxLength={100}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addRequirement()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={addRequirement}
                              disabled={!newRequirement.trim() || reqCount >= 5}
                              size="sm"
                            >
                              추가
                            </Button>
                          </div>

                          {formData.additionalRequirements?.map((req, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <span className="flex-1 px-2 py-1 bg-secondary rounded">
                                {req}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRequirement(index)}
                              >
                                삭제
                              </Button>
                            </div>
                          ))}

                          <div className="text-xs text-muted-foreground">
                            {reqCount} / 5개
                          </div>
                        </div>
                      </FormItem>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-8 h-12 text-base font-medium gradient-primary text-white border-0 btn-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    disabled={!canSubmit}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        생성 중...
                      </span>
                    ) : (
                      "프롬프트 생성"
                    )}
                  </Button>
                </Form>
              </CardContent>
            </Card>

            {/* Result Section */}
            <Card className="shadow-modern-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-up">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold text-foreground">
                  생성 결과
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  생성된 프롬프트와 검증 정보
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 animate-fade-up">
                    <div className="flex items-start gap-3">
                      <span className="text-red-500 mt-0.5">❌</span>
                      <div>
                        <h5 className="font-medium text-red-800 mb-1">오류 발생</h5>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {result && isSuccess(result) && (
                  <div className="space-y-6">
                    {/* Prompt Output */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-foreground">생성된 프롬프트</h4>
                        <div className="flex items-center gap-3">
                          {copySuccess && (
                            <span className="text-sm text-green-600 font-medium animate-fade-up">
                              {copySuccess}
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.data.prompt)}
                            className="btn-hover border-primary/20 text-primary hover:bg-primary hover:text-white"
                          >
                            복사
                          </Button>
                        </div>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-background to-muted/30 rounded-lg border border-border/30 shadow-modern">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {typeof result.data.prompt === 'string'
                            ? result.data.prompt
                            : JSON.stringify(result.data.prompt, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h4 className="text-lg font-medium text-foreground mb-4">메타데이터</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/30 rounded-lg border border-border/30">
                          <div className="text-sm text-muted-foreground mb-1">형식</div>
                          <div className="font-medium text-foreground">
                            {formatOptions.find((f) => f.value === result.data.metadata.format)?.label}
                          </div>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg border border-border/30">
                          <div className="text-sm text-muted-foreground mb-1">난이도</div>
                          <div className="font-medium text-foreground">
                            {levelOptions.find((l) => l.value === result.data.metadata.level)?.label}
                          </div>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg border border-border/30">
                          <div className="text-sm text-muted-foreground mb-1">토큰 수</div>
                          <div className="font-medium text-foreground">{result.data.metadata.tokenCount}</div>
                        </div>
                        <div className="p-4 bg-secondary/30 rounded-lg border border-border/30">
                          <div className="text-sm text-muted-foreground mb-1">처리 시간</div>
                          <div className="font-medium text-foreground">{result.data.metadata.processingTime}ms</div>
                        </div>
                      </div>
                    </div>

                    {/* Validation Results */}
                    {result.data.validation && (
                      <div>
                        <h4 className="text-lg font-medium text-foreground mb-4">검증 결과</h4>
                        <div className="space-y-4">
                          <div className={`p-4 rounded-lg border ${
                            result.data.validation.passed
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-yellow-50 border-yellow-200 text-yellow-800"
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                result.data.validation.passed ? "bg-green-500" : "bg-yellow-500"
                              }`} />
                              <span className="font-medium">
                                {result.data.validation.passed ? "검증 성공" : "주의 필요"}
                              </span>
                              <span className="ml-auto text-sm font-mono">
                                {result.data.validation.score}/100점
                              </span>
                            </div>
                          </div>

                          {result.data.validation.warnings && result.data.validation.warnings.length > 0 && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <h5 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                                <span className="text-yellow-500">⚠️</span>
                                경고사항
                              </h5>
                              <ul className="space-y-2">
                                {result.data.validation.warnings.map((warning, index) => (
                                  <li key={index} className="text-yellow-700 text-sm flex items-start gap-2">
                                    <span className="text-yellow-500 mt-1">•</span>
                                    <span>{warning}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {result.data.validation.suggestions && result.data.validation.suggestions.length > 0 && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                                <span className="text-blue-500">💡</span>
                                개선 제안
                              </h5>
                              <ul className="space-y-2">
                                {result.data.validation.suggestions.map((suggestion, index) => (
                                  <li key={index} className="text-blue-700 text-sm flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!result && !error && !isLoading && (
                  <div className="text-center py-12 animate-fade-up">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium mb-2">
                      프롬프트 생성 준비 완료
                    </p>
                    <p className="text-muted-foreground/70 text-sm">
                      위의 양식을 작성하고 생성 버튼을 클릭하세요
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
