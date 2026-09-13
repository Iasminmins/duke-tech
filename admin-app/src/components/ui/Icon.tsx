import type { ReactNode, SVGProps } from 'react';

export type IconName = 'grid' | 'clipboard' | 'calendar' | 'wrench' | 'users' | 'device' | 'box' | 'cart' | 'wallet' | 'chart' | 'settings' | 'search' | 'bell' | 'plus' | 'arrow' | 'menu' | 'logout' | 'chevron' | 'sun' | 'moon' | 'check' | 'file' | 'refresh' | 'inbox' | 'x' | 'clock' | 'link';

export function Icon({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h.01M11 14h.01M15 14h.01M7 18h.01M11 18h.01"/></>,
    wrench: <path d="m14.7 6.3 3-3a5 5 0 0 0-6.4 6.4l-7 7a2.1 2.1 0 1 0 3 3l7-7a5 5 0 0 0 6.4-6.4l-3 3-3-3Z"/>,
    users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11a3 3 0 0 0 0-6M21 20v-1.5a4 4 0 0 0-3-3.87"/></>,
    device: <><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></>,
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
    cart: <><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L21 8H6M10 21h.01M18 21h.01"/></>,
    wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 1 4 16.5v-10Z"/><path d="M4 8h16v8h-4a3 3 0 0 1 0-6h4M16 12h.01"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m19.4 15 .1.1a2 2 0 1 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 1 1-4 0v-.2a2 2 0 0 0-3.4-1.4l-.1.1A2 2 0 1 1 3 15.2l.1-.1a2 2 0 0 0-1.4-3.4h-.2a2 2 0 1 1 0-4h.2A2 2 0 0 0 3 4.3l-.1-.1A2 2 0 1 1 5.7 1.4l.1.1a2 2 0 0 0 3.4-1.4V0a2 2 0 1 1 4 0v.2a2 2 0 0 0 3.4 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a2 2 0 0 0 1.4 3.4h.2a2 2 0 1 1 0 4h-.2a2 2 0 0 0-1.4 3.2Z" transform="translate(2 2) scale(.83)"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M21 4v16"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    moon: <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z"/>,
    check: <path d="M20 6 9 17l-5-5"/>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></>,
    refresh: <><path d="M21 12a9 9 0 0 1-15.3 6.4M3 12a9 9 0 0 1 15.3-6.4"/><path d="M3 4v5h5M21 20v-5h-5"/></>,
    inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7l3.5-7Z"/></>,
    x: <path d="M18 6 6 18M6 6l12 12"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
    link: <><path d="M9 17H7a5 5 0 1 1 0-10h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><path d="M8 12h8"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name]}</svg>;
}
