import React from 'react';

export default function Footer(){
  return (
    <footer className="admin-footer">
      <div className="footer-inner">
        <div className="left">© {new Date().getFullYear()} REPS Gym — All rights reserved</div>
        <div className="right">Built with ❤️ · v0.1</div>
      </div>
    </footer>
  );
}
