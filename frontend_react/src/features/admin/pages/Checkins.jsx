import React, { useState } from 'react';
import { CheckinProvider } from '../../../firebase/lib/features/checkin';
import DataTableCheckin from '../components/DataTableCheckin';
import AddCheckinModal from '../components/AddCheckinModal.jsx';
import styles from './Checkins.module.css';

export default function Checkins() {
  const [showAddCheckin, setShowAddCheckin] = useState(false);

  return (
    <CheckinProvider>
      <div className={styles.checkinsPage}>
        {/* Main Content với Provider Pattern */}
        <div className={styles.pageContent}>
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
