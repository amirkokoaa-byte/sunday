
import React from 'react';
import { Page, User } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen, user, onLogout }) => {
  const menuItems = [
    { id: 'attendance' as Page, label: 'حضور وانصراف', icon: '📝' },
    { id: 'location-attendance' as Page, label: 'حضور لوكيشن', icon: '📍' },
    { id: 'my-logs' as Page, label: 'إجازاتي ومأمورياتي', icon: '🏖️' },
    { id: 'history' as Page, label: 'الحضور السابق', icon: '📅' },
  ];

  if (user.isAdmin) {
    menuItems.push({ id: 'settings' as Page, label: 'الإعدادات', icon: '⚙️' });
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 right-0 h-full w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-blue-500 p-2 rounded-lg text-sm">🏬</span>
            حضور يوم السبت
          </h1>
          <button className="lg:hidden text-white p-2" onClick={() => setIsOpen(false)}>✖</button>
        </div>

        <nav className="mt-6 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-6 py-4 text-right transition-colors ${
                currentPage === item.id 
                  ? 'bg-blue-600 border-r-4 border-white' 
                  : 'hover:bg-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full px-6 py-4 text-right text-red-400 hover:bg-red-900/20 transition-colors font-bold flex items-center gap-3"
          >
            <span>🚪</span>
            تسجيل الخروج
          </button>
          <div className="p-4 text-xs text-slate-500">
            حضور يوم السبت © 2024
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
