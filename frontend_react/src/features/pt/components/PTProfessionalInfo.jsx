import React from 'react';

export default function PTProfessionalInfo({ 
  ptInfo, 
  setPtInfo,
  newSpecialty,
  setNewSpecialty,
  newCertificate,
  setNewCertificate,
  newAchievement,
  setNewAchievement,
  addSpecialty,
  removeSpecialty,
  addCertificate,
  removeCertificate,
  addAchievement,
  removeAchievement,
  handleCertificateImageUpload,
  removeCertificateImage,
  handleAchievementImageUpload,
  removeAchievementImage
}) {
  return (
    <div style={{ 
      background: 'var(--color-surface)', 
      borderRadius: '14px', 
      padding: '24px',
      boxShadow: '0 10px 30px rgba(11,37,69,0.06)',
      marginBottom: '20px'
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', color: 'var(--color-primary)' }}>
        💪 Thông tin PT
      </h2>

      {/* Bio */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Giới thiệu bản thân
        </label>
        <textarea
          value={ptInfo.bio}
          onChange={(e) => setPtInfo({ ...ptInfo, bio: e.target.value })}
          placeholder="Viết vài dòng giới thiệu về bản thân, kinh nghiệm, phong cách tập luyện..."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Experience */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Số năm kinh nghiệm
        </label>
        <input
          type="number"
          value={ptInfo.experience}
          onChange={(e) => setPtInfo({ ...ptInfo, experience: parseInt(e.target.value) || 0 })}
          style={{
            width: '200px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Specialties */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Chuyên môn
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={newSpecialty}
            onChange={(e) => setNewSpecialty(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
            placeholder="VD: Tăng cơ, Giảm cân, Yoga..."
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
          <button
            onClick={addSpecialty}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Thêm
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(ptInfo.specialties || []).map((specialty, index) => (
            <div
              key={index}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(13,71,161,0.1)',
                color: 'var(--color-primary)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {specialty}
              <button
                onClick={() => removeSpecialty(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Chứng chỉ
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={newCertificate}
            onChange={(e) => setNewCertificate(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCertificate()}
            placeholder="VD: ACE Personal Trainer, NASM-CPT..."
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
          <button
            onClick={addCertificate}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Thêm
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(ptInfo.certificates || []).map((cert, index) => {
            const isObject = typeof cert === 'object';
            const isFirebaseURL = typeof cert === 'string' && cert.startsWith('https://firebasestorage');
            
            // If cert is a Firebase Storage URL string, convert it to object format
            let certText, certImages;
            if (isFirebaseURL) {
              certText = `Chứng chỉ ${index + 1}`;
              certImages = [{
                id: `img_${index}`,
                url: cert,
                fileName: cert.split('/').pop().split('?')[0]
              }];
            } else {
              certText = isObject ? cert.text : cert;
              certImages = isObject ? cert.images : [];
            }
            
            return (
              <div 
                key={index} 
                style={{ 
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: certImages?.length > 0 ? '10px' : '0' }}>
                  <span style={{ fontWeight: 500 }}>{certText}</span>
                  <button
                    onClick={() => removeCertificate(index)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    Xóa
                  </button>
                </div>
                
                {/* Display images */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {certImages?.map((img, imgIndex) => {
                    const imageUrl = img.url?.startsWith('http') ? img.url : `http://localhost:3000${img.url}`;
                    return (
                    <div key={imgIndex} style={{ position: 'relative' }}>
                      <img
                        src={imageUrl}
                        alt={`Certificate ${index + 1} - Image ${imgIndex + 1}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(imageUrl, '_blank')}
                        title="Click để xem ảnh lớn"
                        onError={(e) => {
                          console.error('Error loading image:', imageUrl);
                          e.target.style.border = '2px solid red';
                        }}
                      />
                      <button
                        onClick={() => removeCertificateImage(index, imgIndex)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        title="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  );
                  })}
                  
                  {/* Upload button */}
                  <label
                    style={{
                      width: '100px',
                      height: '100px',
                      border: '2px dashed var(--color-primary)',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'rgba(13,71,161,0.05)',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(13,71,161,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(13,71,161,0.05)'}
                  >
                    <span style={{ fontSize: '32px', color: 'var(--color-primary)' }}>+</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>Thêm ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCertificateImageUpload(index, e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Thành tích
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
            placeholder="VD: Huấn luyện viên xuất sắc 2023..."
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
          <button
            onClick={addAchievement}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Thêm
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(ptInfo.achievements || []).map((achievement, index) => {
            const isObject = typeof achievement === 'object';
            const isFirebaseURL = typeof achievement === 'string' && achievement.startsWith('https://firebasestorage');
            
            // If achievement is a Firebase Storage URL string, convert it to object format
            let achievementText, achievementImages;
            if (isFirebaseURL) {
              achievementText = `Thành tích ${index + 1}`;
              achievementImages = [{
                id: `img_${index}`,
                url: achievement,
                fileName: achievement.split('/').pop().split('?')[0]
              }];
            } else {
              achievementText = isObject ? achievement.text : achievement;
              achievementImages = isObject ? achievement.images : [];
            }
            
            return (
              <div 
                key={index} 
                style={{ 
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: achievementImages?.length > 0 ? '10px' : '0' }}>
                  <span style={{ fontWeight: 500 }}>{achievementText}</span>
                  <button
                    onClick={() => removeAchievement(index)}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    Xóa
                  </button>
                </div>
                
                {/* Display images */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {achievementImages?.map((img, imgIndex) => {
                    const imageUrl = img.url?.startsWith('http') ? img.url : `http://localhost:3000${img.url}`;
                    return (
                    <div key={imgIndex} style={{ position: 'relative' }}>
                      <img
                        src={imageUrl}
                        alt={`Achievement ${index + 1} - Image ${imgIndex + 1}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '2px solid #ddd',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(imageUrl, '_blank')}
                        title="Click để xem ảnh lớn"
                        onError={(e) => {
                          console.error('Error loading image:', imageUrl);
                          e.target.style.border = '2px solid red';
                        }}
                      />
                      <button
                        onClick={() => removeAchievementImage(index, imgIndex)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        title="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  );
                  })}
                  
                  {/* Upload button */}
                  <label
                    style={{
                      width: '100px',
                      height: '100px',
                      border: '2px dashed var(--color-primary)',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'rgba(13,71,161,0.05)',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(13,71,161,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(13,71,161,0.05)'}
                  >
                    <span style={{ fontSize: '32px', color: 'var(--color-primary)' }}>+</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px' }}>Thêm ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAchievementImageUpload(index, e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Media */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
          Mạng xã hội
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <input
            type="text"
            value={ptInfo.socialMedia?.facebook || ''}
            onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, facebook: e.target.value } })}
            placeholder="Facebook URL"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
          <input
            type="text"
            value={ptInfo.socialMedia?.instagram || ''}
            onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, instagram: e.target.value } })}
            placeholder="Instagram URL"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
          <input
            type="text"
            value={ptInfo.socialMedia?.tiktok || ''}
            onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, tiktok: e.target.value } })}
            placeholder="TikTok URL"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
          <input
            type="text"
            value={ptInfo.socialMedia?.youtube || ''}
            onChange={(e) => setPtInfo({ ...ptInfo, socialMedia: { ...ptInfo.socialMedia, youtube: e.target.value } })}
            placeholder="YouTube URL"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Max Clients & Accepting New Clients */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '0' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Số học viên tối đa / ngày
          </label>
          <input
            type="number"
            value={ptInfo.maxClientsPerDay}
            onChange={(e) => setPtInfo({ ...ptInfo, maxClientsPerDay: parseInt(e.target.value) || 8 })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>
            Nhận học viên mới
          </label>
          <select
            value={ptInfo.isAcceptingNewClients ? 'yes' : 'no'}
            onChange={(e) => setPtInfo({ ...ptInfo, isAcceptingNewClients: e.target.value === 'yes' })}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px'
            }}
          >
            <option value="yes">Có</option>
            <option value="no">Không</option>
          </select>
        </div>
      </div>
    </div>
  );
}

