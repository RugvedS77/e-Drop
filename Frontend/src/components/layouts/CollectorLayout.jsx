import React from 'react';
import { Outlet } from 'react-router-dom';
import CollectorSidebar from './CollectorSidebar';

const CollectorLayout = () => {
  return (
    <div className="flex h-screen w-full bg-gray-900 overflow-hidden"> 
      {/* Note: Changed bg to gray-900 to match the dark theme 
         of the Processor Dashboard we created earlier.
      */}
      
      {/* Sidebar specific to Processor */}
      <CollectorSidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-full relative">
        <div className="p-0"> {/* Padding can be handled inside the pages for full-width maps */}
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CollectorLayout;