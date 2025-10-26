import React, { useState } from 'react';
import { CheckinProvider } from '../../../firebase/lib/features/checkin';
import DataTableCheckin from '../components/DataTableCheckin';
import AddCheckinModal from '../components/AddCheckinModal.jsx';
import './checkins.css';

export default function Checkins() {
  const [showAddCheckin, setShowAddCheckin] = useState(false);

  return (
    <CheckinProvider>
      <div className="checkins-page">
        {/* Main Content với Provider Pattern */}
        <div className="page-content">
          <DataTableCheckin 
            onAddCheckin={() => setShowAddCheckin(true)}
          />
        </div>

        {/* Add Checkin Modal */}
        <AddCheckinModal 
          isOpen={showAddCheckin}
          onClose={() => setShowAddCheckin(false)}
        />
      </div>
    </CheckinProvider>
  );
}