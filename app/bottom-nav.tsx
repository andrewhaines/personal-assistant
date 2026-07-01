'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, ListTodo, Sun, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const LINKS = [
  { href: '/', label: 'Chat', icon: MessageCircle },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/settings/accounts', label: 'Settings', icon: Settings, match: '/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex max-w-2xl mx-auto items-center justify-around">
        {LINKS.map(link => {
          const active = link.match ? pathname.startsWith(link.match) : pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'flex-1 flex-col gap-0.5 h-16 rounded-none',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="size-5" />
              <span className="text-xs">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
