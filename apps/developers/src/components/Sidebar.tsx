'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BookOpen, Map, Users, ChevronDown } from 'lucide-react'

// Page navigation
interface NavItem {
  href: string
  label: string
  icon: typeof BookOpen
}

const navItems: NavItem[] = [
  { href: '/', label: 'Documentation', icon: BookOpen },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/contributors', label: 'Contributors', icon: Users },
]

// Doc sections (only shown on docs page)
interface Section {
  id: string
  title: string
}

const docSections: Section[] = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'installation', title: 'Installation' },
  { id: 'quickstart', title: 'Quick Start' },
  { id: 'api', title: 'API Reference' },
  { id: 'components', title: 'Components' },
  { id: 'ai', title: 'AI Integration' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [activeSection, setActiveSection] = useState<string>('')
  const [sectionsExpanded, setSectionsExpanded] = useState(true)
  const isDocsPage = pathname === '/'

  // Track scroll position for section highlighting (docs page only)
  useEffect(() => {
    if (!isDocsPage) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      for (let i = docSections.length - 1; i >= 0; i--) {
        const section = document.getElementById(docSections[i].id)
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(docSections[i].id)
          break
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDocsPage])

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)

    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })

      window.history.pushState(null, '', `#${id}`)
    }
  }

  return (
    <aside
      className="hidden lg:block w-64 flex-shrink-0"
      aria-label="Site navigation"
    >
      <nav className="sticky top-24 space-y-6">
        {/* Page Navigation */}
        <div className="space-y-1">
          <h2 className="px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Navigation
          </h2>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors duration-150
                  ${isActive
                    ? 'bg-accent-yellow/10 text-ink font-medium'
                    : 'text-ink-muted hover:bg-cream-100 hover:text-ink'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent-yellow' : ''}`} />
                {item.label}
              </a>
            )
          })}
        </div>

        {/* Doc Sections (only on docs page) */}
        {isDocsPage && (
          <div className="space-y-1">
            <button
              onClick={() => setSectionsExpanded(!sectionsExpanded)}
              className="w-full flex items-center justify-between px-4 py-1 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink transition-colors"
            >
              <span>On This Page</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${sectionsExpanded ? '' : '-rotate-90'}`}
              />
            </button>

            {sectionsExpanded && (
              <div className="space-y-0.5 mt-2">
                {docSections.map((section) => {
                  const isActive = activeSection === section.id

                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => handleSectionClick(e, section.id)}
                      className={`
                        block px-4 py-1.5 text-sm transition-colors duration-150 border-l-2
                        ${isActive
                          ? 'border-accent-yellow text-ink font-medium bg-accent-yellow/5'
                          : 'border-transparent text-ink-muted hover:text-ink hover:border-ink/20'
                        }
                      `}
                      aria-current={isActive ? 'location' : undefined}
                    >
                      {section.title}
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-4 border-t border-ink/5">
          <h2 className="px-4 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Resources
          </h2>
          <a
            href="https://github.com/rockfridrich/villa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            GitHub Repository
            <span className="text-xs">↗</span>
          </a>
          <a
            href="https://github.com/rockfridrich/villa/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Report Issue
            <span className="text-xs">↗</span>
          </a>
        </div>
      </nav>
    </aside>
  )
}
