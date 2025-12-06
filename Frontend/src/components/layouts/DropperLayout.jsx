import React from 'react';
import { Outlet } from 'react-router-dom';
import DropperSidebar from './DropperSidebar';

const DropperLayout = () => {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Sidebar specific to Generator */}
      <DropperSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full relative">
        <div className="p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DropperLayout;