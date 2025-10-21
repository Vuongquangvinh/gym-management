import React, { useState } from 'react';
import PackageTable from '../../packages/components/packageTable/packageTable.jsx';
import DetailPackage from '../../packages/components/detailPackage/detailPackage.jsx';

export default function Packages() {
  const [selectedPackage, setSelectedPackage] = useState(null);

  return (
    <div className="card">
      {selectedPackage ? (
        <DetailPackage pkg={selectedPackage} onClose={() => setSelectedPackage(null)} />
      ) : (
        <PackageTable onSelectPackage={setSelectedPackage} />
      )}
    </div>
  );
}
