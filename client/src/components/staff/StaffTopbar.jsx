import React from 'react';

const StaffTopbar = ({ title = 'Staff Dashboard' }) => (
  <header className="staff-topbar">
    <div className="staff-topbar__inner">
      <h1 className="staff-topbar__title">{title}</h1>
    </div>
  </header>
);

export default StaffTopbar;
