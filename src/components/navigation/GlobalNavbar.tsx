'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BookOpen, Sparkles, Settings, ExternalLink, Mail, Zap } from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

const tabs: NavTab[] = [
  {
    id: 'generator',
    label: '프롬프트 생성기',
    href: '/',
    icon: Zap
  },
  {
    id: 'library',
    label: '프롬프트 라이브러리',
    href: 'https://prompt-parkyongkyus-projects.vercel.app/library',
    icon: BookOpen
  },
  {
    id: 'library',
    label: '프롬프트 스터디',
    href: 'https://prompt-parkyongkyus-projects.vercel.app/study',
    icon: BookOpen
  }
];

export default function GlobalNavbar() {
  const pathname = usePathname();
  
  // 현재 활성 탭 결정
  const getActiveTab = () => {
    if (pathname === '/') return 'generator';
    return 'generator'; // 현재는 생성기 페이지만 있으므로
  };

  const activeTab = getActiveTab();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 브랜드 로고 */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">국회 보좌진 프롬프트 생성기</h1>
            </div>
          </Link>

          {/* 네비게이션 탭 */}
          <div className="flex items-center gap-4">
            {/* 데스크톱 네비게이션 탭 */}
            <div className="hidden sm:flex bg-gray-100 rounded-lg p-1 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isExternal = tab.href.startsWith('http');
                
                const tabContent = (
                  <div className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200',
                    'text-sm font-medium whitespace-nowrap',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}>
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {isExternal && <ExternalLink size={12} />}
                  </div>
                );

                return isExternal ? (
                  <a
                    key={tab.id}
                    href={tab.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contents"
                  >
                    {tabContent}
                  </a>
                ) : (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className="contents"
                  >
                    {tabContent}
                  </Link>
                );
              })}
            </div>

            {/* 모바일 네비게이션 탭 */}
            <div className="flex sm:hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isExternal = tab.href.startsWith('http');
                
                const tabContent = (
                  <div className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors',
                    'text-xs font-medium',
                    isActive
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  )}>
                    <div className="flex items-center gap-1">
                      <Icon size={16} />
                      {isExternal && <ExternalLink size={10} />}
                    </div>
                    <span>{tab.label.split(' ')[0]}</span>
                  </div>
                );

                return isExternal ? (
                  <a
                    key={tab.id}
                    href={tab.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contents"
                  >
                    {tabContent}
                  </a>
                ) : (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className="contents"
                  >
                    {tabContent}
                  </Link>
                );
              })}
            </div>

            {/* 문의하기 링크 */}
            <a
              href="mailto:gq.newslens@gmail.com"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
            >
              <Mail size={16} />
              <span className="hidden sm:inline">문의하기</span>
            </a>

            {/* AI Learning Platform 링크 */}
            <a
              href="https://gq-ai.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">AI Learning platform</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}