import Link from "next/link"

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            사용자 가이드
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
            국회 보좌진용 프롬프트 생성기를 효과적으로 사용하는 방법을 안내합니다
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Table of Contents */}
        <nav className="bg-gray-50 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">목차</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a href="#intro" className="text-blue-600 hover:text-blue-800 font-medium">
              1. 서비스 소개
            </a>
            <a href="#getting-started" className="text-blue-600 hover:text-blue-800 font-medium">
              2. 시작하기
            </a>
            <a href="#formats" className="text-blue-600 hover:text-blue-800 font-medium">
              3. 형식별 가이드
            </a>
            <a href="#levels" className="text-blue-600 hover:text-blue-800 font-medium">
              4. 레벨 선택 가이드
            </a>
            <a href="#examples" className="text-blue-600 hover:text-blue-800 font-medium">
              5. 실제 사용 예시
            </a>
            <a href="#tips" className="text-blue-600 hover:text-blue-800 font-medium">
              6. 팁 & 주의사항
            </a>
            <a href="#faq" className="text-blue-600 hover:text-blue-800 font-medium col-span-full">
              7. 자주 묻는 질문
            </a>
          </div>
        </nav>

        {/* 1. 서비스 소개 */}
        <section id="intro" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
            1. 서비스 소개
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              국회 보좌진용 프롬프트 생성기는 <strong>프롬프트를 생성하는 도구</strong>입니다. 
              완성된 보도자료나 연설문을 직접 만들어주는 것이 아니라, 
              <strong>다른 AI 도구(ChatGPT, Claude 등)에서 바로 사용할 수 있는 고품질 프롬프트</strong>를 만들어줍니다.
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 my-8">
              <h4 className="font-semibold text-blue-900 mb-3">💡 핵심 개념</h4>
              <p className="text-blue-800 leading-relaxed">
                이 서비스는 <strong>&ldquo;메타 도구&rdquo;</strong>입니다. 주제와 형식을 입력하면 
                전문적인 프롬프트를 생성해주고, 이를 복사해서 어떤 AI 서비스에서든 재사용할 수 있습니다.
              </p>
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 mt-12 mb-6">주요 장점</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h4 className="font-semibold text-gray-900 mb-3">⏰ 시간 절약</h4>
                <p className="text-gray-700">
                  매번 프롬프트를 새로 작성할 필요 없이 즉시 전문적인 프롬프트를 얻을 수 있습니다.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h4 className="font-semibold text-gray-900 mb-3">🎯 품질 보장</h4>
                <p className="text-gray-700">
                  형식별 규칙과 컴플라이언스를 준수하는 고품질 프롬프트를 생성합니다.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h4 className="font-semibold text-gray-900 mb-3">🔄 재사용성</h4>
                <p className="text-gray-700">
                  생성된 프롬프트는 어떤 AI 도구에서든 바로 사용할 수 있습니다.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <h4 className="font-semibold text-gray-900 mb-3">💰 비용 효율</h4>
                <p className="text-gray-700">
                  토큰 사용량을 최적화하여 AI 사용 비용을 절약할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. 시작하기 */}
        <section id="getting-started" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
            2. 시작하기
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">기본 사용법</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">주제 입력</h4>
                  <p className="text-gray-700">
                    작성하고자 하는 콘텐츠의 핵심 주제를 간단명료하게 입력하세요.
                    <br />예: &ldquo;청년 창업 지원 정책 발표&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">형식 선택</h4>
                  <p className="text-gray-700">
                    보도자료, 연설문, SNS 게시글 등 원하는 형식을 선택하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">레벨 설정</h4>
                  <p className="text-gray-700">
                    기본(≤300토큰), 중급(≤600토큰), 고급(≤900토큰) 중 선택하세요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">추가 정보 입력 (선택)</h4>
                  <p className="text-gray-700">
                    배경 정보나 추가 요구사항을 입력하여 더 정확한 프롬프트를 생성할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  5
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">프롬프트 생성 & 복사</h4>
                  <p className="text-gray-700">
                    &ldquo;프롬프트 생성&rdquo; 버튼을 클릭하고, 결과를 복사하여 AI 도구에서 사용하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 형식별 가이드 */}
        <section id="formats" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
            3. 형식별 가이드
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg mb-8">
              각 형식의 특징과 활용법을 알아보세요.
            </p>

            <div className="space-y-10">
              {/* 보도자료 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  📰 보도자료
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    공식 발표
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  정부 정책, 사업 발표, 성과 공유 등 공식적인 내용을 언론에 배포할 때 사용합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">주요 특징</h4>
                  <ul className="text-gray-700 space-y-1 list-disc list-inside">
                    <li>헤드라인, 서브헤드, 리드, 본문, 인용, 문의처 구조</li>
                    <li>구체적 수치와 출처 요구</li>
                    <li>과장 표현 금지, 팩트 중심</li>
                    <li>후속 일정 및 연락처 포함</li>
                  </ul>
                </div>
              </div>

              {/* 연설문 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  🎤 연설문
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    구두 발표
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  국정감사, 공식 행사, 정책 설명회 등에서 직접 발표할 내용을 준비할 때 사용합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">주요 특징</h4>
                  <ul className="text-gray-700 space-y-1 list-disc list-inside">
                    <li>후킹 → 문제 → 비전 → 정책 → 호소의 스토리 구조</li>
                    <li>청중과 상황에 맞는 톤 조절</li>
                    <li>수사 장치와 박수 포인트 설정 (중급 이상)</li>
                    <li>반론 대응 브리지 문구 (고급)</li>
                  </ul>
                </div>
              </div>

              {/* SNS */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  📱 SNS 게시글
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    소셜 미디어
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  트위터, 페이스북, 인스타그램 등 소셜 미디어에서 정책을 쉽게 설명할 때 사용합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">주요 특징</h4>
                  <ul className="text-gray-700 space-y-1 list-disc list-inside">
                    <li>플랫폼별 글자 수 제한 준수</li>
                    <li>강력한 첫 문장으로 관심 유도</li>
                    <li>해시태그와 CTA 포함</li>
                    <li>A/B 테스트용 변형 제공</li>
                  </ul>
                </div>
              </div>

              {/* 질의서 작성 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  📋 질의서 작성
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    공식 질의
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  국정감사, 정부 질의 등 공식적인 자료 요청이나 답변 요구 시 사용합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">주요 특징</h4>
                  <ul className="text-gray-700 space-y-1 list-disc list-inside">
                    <li>목적과 배경 명확히 기술</li>
                    <li>구체적 질문사항 번호별 정리</li>
                    <li>답변 형식과 기한 명시</li>
                    <li>관련 법령 근거 포함</li>
                  </ul>
                </div>
              </div>

              {/* 보고서 작성 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  📊 보고서 작성
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    분석 문서
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  정책 분석, 현황 보고, 개선 방안 등 체계적인 분석이 필요한 문서 작성 시 사용합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">주요 특징</h4>
                  <ul className="text-gray-700 space-y-1 list-disc list-inside">
                    <li>요약 → 배경 → 분석 → 결론 → 부록 구조</li>
                    <li>다각도 관점에서 객관적 분석</li>
                    <li>구체적 실행 방안 포함</li>
                    <li>참고자료와 출처 명시</li>
                  </ul>
                </div>
              </div>

              {/* 언론보도 스크랩 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  🔍 언론보도 스크랩
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    미디어 분석
                  </span>
                </h3>
                <p className="text-gray-700 mb-4">
                  특정 이슈나 정책에 대한 언론 보도를 체계적으로 수집하고 분석할 때 사용합니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">주요 특징</h4>
                  <ul className="text-gray-700 space-y-1 list-disc list-inside">
                    <li>검색 키워드와 수집 범위 설정</li>
                    <li>긍정/부정/중립 분류 기준 제시</li>
                    <li>시계열/주제별 요약 구조화</li>
                    <li>트렌드 변화 추이 분석</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 레벨 선택 가이드 */}
        <section id="levels" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
            4. 레벨 선택 가이드
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg mb-8">
              상황에 맞는 레벨을 선택하여 최적의 프롬프트를 생성하세요.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    기본
                  </span>
                  <span className="text-sm text-gray-600">≤300토큰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">언제 사용하나요?</h3>
                <ul className="text-gray-700 space-y-2 mb-4 list-disc list-inside">
                  <li>간단한 SNS 게시글</li>
                  <li>짧은 보도자료</li>
                  <li>빠른 프롬프트 생성이 필요할 때</li>
                </ul>
                <div className="bg-green-50 p-3 rounded text-green-800 text-sm">
                  <strong>특징:</strong> 핵심만 담은 간결한 프롬프트
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    중급
                  </span>
                  <span className="text-sm text-gray-600">≤600토큰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">언제 사용하나요?</h3>
                <ul className="text-gray-700 space-y-2 mb-4 list-disc list-inside">
                  <li>일반적인 보도자료</li>
                  <li>중간 길이의 연설문</li>
                  <li>질의서나 보고서</li>
                  <li>대부분의 상황 (권장)</li>
                </ul>
                <div className="bg-blue-50 p-3 rounded text-blue-800 text-sm">
                  <strong>특징:</strong> 균형 잡힌 상세도와 길이
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    고급
                  </span>
                  <span className="text-sm text-gray-600">≤900토큰</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">언제 사용하나요?</h3>
                <ul className="text-gray-700 space-y-2 mb-4 list-disc list-inside">
                  <li>중요한 정책 발표 연설문</li>
                  <li>복잡한 내용의 보도자료</li>
                  <li>세밀한 분석이 필요한 보고서</li>
                </ul>
                <div className="bg-purple-50 p-3 rounded text-purple-800 text-sm">
                  <strong>특징:</strong> 매우 상세하고 전문적인 프롬프트
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8">
              <h4 className="font-semibold text-yellow-900 mb-3">💡 레벨 선택 팁</h4>
              <p className="text-yellow-800">
                처음 사용할 때는 <strong>중급</strong>부터 시작해보세요. 
                결과가 너무 간단하면 고급으로, 너무 복잡하면 기본으로 조정할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 5. 실제 사용 예시 */}
        <section id="examples" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
            5. 실제 사용 예시
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg mb-8">
              단계별 사용 과정을 실제 예시로 확인해보세요.
            </p>

            <div className="space-y-12">
              {/* 예시 1: 보도자료 */}
              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  보도자료 작성 예시
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">입력 정보</h4>
                    <ul className="text-gray-700 space-y-2">
                      <li><strong>주제:</strong> 청년 창업 지원 정책 발표</li>
                      <li><strong>형식:</strong> 보도자료</li>
                      <li><strong>레벨:</strong> 중급</li>
                      <li><strong>배경:</strong> 청년 실업률 증가, 창업 환경 개선 필요</li>
                    </ul>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">추가 요구사항</h4>
                    <ul className="text-gray-700 space-y-2">
                      <li>• 예산 규모 포함</li>
                      <li>• 신청 방법 명시</li>
                      <li>• 실행 일정 포함</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-emerald-50 border-l-4 border-emerald-400 p-6">
                  <h4 className="font-semibold text-emerald-900 mb-3">결과</h4>
                  <p className="text-emerald-800">
                    &ldquo;정부 정책 발표용 보도자료를 작성하는 전문가로서, 청년 창업 지원 정책에 대한 보도자료를 작성해주세요...&rdquo;
                    와 같은 형태의 전문적인 프롬프트가 생성됩니다.
                  </p>
                </div>
              </div>

              {/* 예시 2: SNS */}
              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  SNS 게시글 작성 예시
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">입력 정보</h4>
                    <ul className="text-gray-700 space-y-2">
                      <li><strong>주제:</strong> 교육 예산 확대</li>
                      <li><strong>형식:</strong> SNS 게시글</li>
                      <li><strong>레벨:</strong> 기본</li>
                      <li><strong>배경:</strong> 교육 환경 개선을 위한 예산 증액</li>
                    </ul>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">추가 요구사항</h4>
                    <ul className="text-gray-700 space-y-2">
                      <li>• 해시태그 포함</li>
                      <li>• 친근한 톤</li>
                      <li>• 트위터 글자 수 준수</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-cyan-50 border-l-4 border-cyan-400 p-6">
                  <h4 className="font-semibold text-cyan-900 mb-3">활용 방법</h4>
                  <p className="text-cyan-800">
                    생성된 프롬프트를 ChatGPT나 Claude에 붙여넣기하면 
                    플랫폼별 최적화된 SNS 게시글이 여러 개 생성됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. 팁 & 주의사항 */}
        <section id="tips" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
            6. 팁 & 주의사항
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg mb-8">
              더 좋은 프롬프트를 위한 노하우를 알려드립니다.
            </p>

            <div className="space-y-12">
              {/* 효과적인 주제 입력 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">✅ 효과적인 주제 입력 방법</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-4">좋은 예시</h4>
                    <ul className="text-green-800 space-y-2">
                      <li>• &ldquo;청년 창업 지원 정책 발표&rdquo;</li>
                      <li>• &ldquo;디지털 교육 환경 개선 방안&rdquo;</li>
                      <li>• &ldquo;소상공인 대출 금리 인하 조치&rdquo;</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-4">피해야 할 예시</h4>
                    <ul className="text-red-800 space-y-2">
                      <li>• &ldquo;정책&rdquo; (너무 추상적)</li>
                      <li>• &ldquo;좋은 일을 했어요&rdquo; (모호함)</li>
                      <li>• &ldquo;어제 회의에서...&rdquo; (맥락 부족)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 배경 정보 활용법 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">💡 배경 정보 활용법</h3>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
                  <p className="text-blue-800 mb-6">
                    배경 정보는 프롬프트에 맥락을 제공하여 더 정확하고 관련성 높은 결과를 만들어냅니다.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-3">포함하면 좋은 정보</h4>
                      <ul className="text-blue-800 space-y-1 list-disc list-inside">
                        <li>현재 상황이나 문제점</li>
                        <li>관련 통계나 데이터</li>
                        <li>정책 목표나 방향</li>
                        <li>대상 집단이나 지역</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-3">예시</h4>
                      <div className="bg-blue-100 p-3 rounded">
                        <p className="text-blue-800 text-sm">
                          &ldquo;최근 청년 실업률이 8.2%로 증가했고, 창업 준비 과정에서 자금 조달의 어려움이 주요 장벽으로 작용하고 있습니다.&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 주의사항 */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">⚠️ 주의사항</h3>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-6">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-3">프롬프트 생성 관련</h4>
                      <ul className="text-orange-800 space-y-1 list-disc list-inside">
                        <li>생성된 것은 &ldquo;프롬프트&rdquo;이지 완성된 콘텐츠가 아닙니다</li>
                        <li>반드시 AI 도구에 붙여넣기해서 실제 콘텐츠를 생성해야 합니다</li>
                        <li>한 번에 완벽한 결과가 나오지 않을 수 있으므로 여러 번 시도해보세요</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-3">콘텐츠 사용 관련</h4>
                      <ul className="text-orange-800 space-y-1 list-disc list-inside">
                        <li>생성된 콘텐츠는 반드시 사실 확인이 필요합니다</li>
                        <li>민감한 정치적 내용은 신중하게 검토하세요</li>
                        <li>최종 배포 전에는 관련 부서의 승인을 받으세요</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ */}
        <section id="faq" className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">
            7. 자주 묻는 질문
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 text-lg mb-8">
              궁금한 점들을 해결해보세요.
            </p>

            <div className="space-y-4">
              {/* FAQ 1 */}
              <div className="border border-gray-200 rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Q. 이 도구는 완성된 보도자료를 만들어주나요?</h3>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">
                      아니요. 이 도구는 <strong>프롬프트</strong>를 생성해줍니다. 
                      완성된 보도자료를 원한다면, 생성된 프롬프트를 복사해서 
                      ChatGPT, Claude 등의 AI 도구에 붙여넣기해야 합니다.
                    </p>
                  </div>
                </details>
              </div>

              {/* FAQ 2 */}
              <div className="border border-gray-200 rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Q. 어떤 AI 도구에서 프롬프트를 사용할 수 있나요?</h3>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">
                      ChatGPT, Claude, Gemini, Copilot 등 대부분의 AI 챗봇에서 사용할 수 있습니다. 
                      프롬프트는 범용적으로 설계되어 어떤 도구에서든 작동합니다.
                    </p>
                  </div>
                </details>
              </div>

              {/* FAQ 3 */}
              <div className="border border-gray-200 rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Q. 레벨별로 어떤 차이가 있나요?</h3>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6">
                    <div className="text-gray-700 space-y-1">
                      <p>기본(300토큰): 간단하고 핵심적인 프롬프트</p>
                      <p>중급(600토큰): 균형 잡힌 상세도의 프롬프트 (권장)</p>
                      <p>고급(900토큰): 매우 상세하고 전문적인 프롬프트</p>
                    </div>
                  </div>
                </details>
              </div>

              {/* FAQ 4 */}
              <div className="border border-gray-200 rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Q. 생성 속도가 느린데 어떻게 하나요?</h3>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">
                      일반적으로 3초 이내에 완료됩니다. 
                      더 빠른 결과를 원한다면 &lsquo;기본&rsquo; 레벨을 선택하고, 
                      추가 요구사항을 줄여보세요.
                    </p>
                  </div>
                </details>
              </div>

              {/* FAQ 5 */}
              <div className="border border-gray-200 rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Q. 생성된 프롬프트가 마음에 들지 않아요.</h3>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">
                      주제를 더 구체적으로 입력하거나, 배경 정보를 추가해보세요. 
                      또는 다른 레벨을 선택하거나 추가 요구사항을 조정해서 다시 생성해보세요.
                    </p>
                  </div>
                </details>
              </div>

              {/* FAQ 6 */}
              <div className="border border-gray-200 rounded-lg">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">Q. 개인정보나 민감한 정보가 저장되나요?</h3>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-700">
                      입력하신 정보는 프롬프트 생성에만 사용되며, 
                      민감한 식별정보는 로그에서 마스킹 처리됩니다. 
                      단, 정확한 프롬프트를 위해서는 구체적인 정보 입력이 도움됩니다.
                    </p>
                  </div>
                </details>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mt-8">
              <h4 className="font-semibold text-blue-900 mb-3">추가 문의사항이 있으신가요?</h4>
              <p className="text-blue-800">
                이 가이드에서 해결되지 않은 문제가 있다면, 
                시스템 관리자에게 문의하거나 피드백을 남겨주세요.
              </p>
            </div>
          </div>
        </section>

        {/* 마무리 */}
        <div className="text-center py-12">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-8">
            <h3 className="text-3xl font-bold text-blue-900 mb-4">
              이제 프롬프트 생성을 시작해보세요!
            </h3>
            <p className="text-blue-700 text-lg mb-6">
              이 가이드를 참고하여 효과적인 프롬프트를 만들어보세요
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              <span>프롬프트 생성하러 가기</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}