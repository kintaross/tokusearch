'use client';

import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutWrapperProps) {
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
