import React, { useState } from 'react';
import CheckinModel from '../../../firebase/lib/features/checkin/checkin.model.js';

export default function UpdateSearchTokens() {
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const result = await CheckinModel.updateAllSearchTokensWithPrefix();
      setResult(result);
      console.log('Update completed:', result);
    } catch (error) {
      console.error('Update failed:', error);
      setResult({ error: error.message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Update Search Tokens</h3>
      <p>This will update all checkin documents to support prefix search (e.g., "Vuo" finding "Vương")</p>
      
      <button 
        onClick={handleUpdate} 
        disabled={updating}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: updating ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: updating ? 'not-allowed' : 'pointer'
        }}
      >
        {updating ? 'Updating...' : 'Update Search Tokens'}
      </button>

      {result && (
        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          {result.error ? (
            <p style={{ color: 'red' }}>Error: {result.error}</p>
          ) : (
            <p style={{ color: 'green' }}>
              Successfully updated {result.updated} out of {result.total} documents
            </p>
          )}
        </div>
      )}
    </div>
  );
}