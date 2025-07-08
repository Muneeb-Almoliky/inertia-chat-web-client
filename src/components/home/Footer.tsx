'use client'

import Link from 'next/link'
import { Github, Mail } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-sm text-muted-foreground">
              © {year} Inertia Chat. All rights reserved.
            </p>
            <div className="flex gap-4">
              <FooterIconLink
                href="#" // TODO: Add GitHub repo link
                label="GitHub"
                icon={<Github className="h-5 w-5" />}
              />
              <FooterIconLink
                href="mailto:contact@example.com" // TODO: Add email address
                label="Email"
                icon={<Mail className="h-5 w-5" />}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  )
}

function FooterIconLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      aria-label={label}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
    </Link>
  )
}
