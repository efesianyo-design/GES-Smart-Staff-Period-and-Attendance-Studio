import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * (kiosk) Layout
 * Strictly fullscreen, black background (#030712 / bg-slate-950), zero navigation headers,
 * zero sidebars, dedicated for physical tablet/terminal mounting in the Staff Common Room.
 */
export default function KioskLayout() {
  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between overflow-hidden select-none font-sans">
      <Outlet />
    </div>
  );
}
