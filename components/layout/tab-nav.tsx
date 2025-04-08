import { MessageSquare, Users, Clipboard, FolderKanban, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: Clipboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Notes', href: '/notes', icon: StickyNote },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 h-14 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap
                  ${isActive
                    ? 'border-b-2 border-black text-black'
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 