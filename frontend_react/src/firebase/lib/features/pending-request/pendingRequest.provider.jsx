import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PendingRequestService } from './pendingRequest.service';
import { db } from '../../config/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export const PendingRequestContext = createContext({
  requests: [],
  loading: true,
  filter: 'pending',
  setFilter: () => {},
  approveRequest: async () => {},
  rejectRequest: async () => {},
  viewRequestDetails: async () => {},
  refreshRequests: () => {},
});

export function PendingRequestProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]); // For counting
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    all: 0
  });
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Real-time listener for ALL requests (for counting)
  useEffect(() => {
    const unsubscribe = PendingRequestService.subscribeToPendingRequests(
      {}, // No filter - get all
      { pageSize: 1000 }, // Large page size for counting
      (requestsList) => {
        setAllRequests(requestsList);
        
        // Calculate counts
        const newCounts = {
          all: requestsList.length,
          pending: requestsList.filter(r => r.status === 'pending').length,
          approved: requestsList.filter(r => r.status === 'approved').length,
          rejected: requestsList.filter(r => r.status === 'rejected').length,
          cancelled: requestsList.filter(r => r.status === 'cancelled').length,
        };
        setCounts(newCounts);
      },
      (error) => {
        console.error('Error loading all requests:', error);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Real-time listener for FILTERED requests with pagination
  useEffect(() => {
    setLoading(true);
    setRequests([]); // Clear old requests when filter changes
    setLastDoc(null);
    setHasMore(false);

    // Setup filters
    const filters = {};
    if (filter !== 'all') {
      filters.status = filter;
    }

    // Subscribe to real-time updates (first page)
    const unsubscribe = PendingRequestService.subscribeToPendingRequests(
      filters,
      { pageSize: 20, lastDoc: null }, // First page
      async (requestsList, lastDocument, hasMoreData) => {
        console.log('🔥 [Provider] Loaded requests:', requestsList.length, 'hasMore:', hasMoreData);
        
        // Convert timestamps and backfill avatars
        const formatted = await Promise.all(requestsList.map(async (req) => {
          let avatarUrl = req.employeeAvatar;
          
          // Backfill avatar if missing
          if (!avatarUrl && req.employeeId) {
            try {
              const { doc, getDoc } = await import('firebase/firestore');
              const employeeDoc = await getDoc(doc(db, 'employees', req.employeeId));
              if (employeeDoc.exists()) {
                avatarUrl = employeeDoc.data().avatarUrl || null;
              }
            } catch (error) {
              console.error('Error fetching avatar for', req.employeeId, error);
            }
          }
          
          console.log('🔍 Request:', req.employeeName, 'Avatar:', avatarUrl);
          
          return {
            ...req,
            employeeAvatar: avatarUrl,
            createdAt: req.createdAt?.toDate?.() || new Date(req.createdAt),
            updatedAt: req.updatedAt?.toDate?.() || new Date(req.updatedAt)
          };
        }));
        
        // Sort by newest first
        formatted.sort((a, b) => b.createdAt - a.createdAt);
        
        setRequests(formatted);
        setLastDoc(lastDocument);
        setHasMore(hasMoreData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading requests:', error);
        toast.error('Không thể tải danh sách yêu cầu');
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [filter]);

  /**
   * Approve request - handle different types
   */
  const approveRequest = useCallback(async (request) => {
    try {
      // Handle different request types
      if (request.type === 'employee_update') {
        // Update employee data
        const employeeRef = doc(db, 'employees', request.employeeId);
        await updateDoc(employeeRef, request.data);
      } else if (request.type === 'package_create') {
        // Create new package
        const { collection, addDoc } = await import('firebase/firestore');
        const packagesRef = collection(db, 'pt_packages');
        await addDoc(packagesRef, {
          ...request.data,
          ptId: request.ptId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else if (request.type === 'package_update') {
        // Update existing package
        const packageRef = doc(db, 'pt_packages', request.packageId);
        await updateDoc(packageRef, {
          ...request.data,
          updatedAt: new Date()
        });
      } else if (request.type === 'package_delete') {
        // Delete package
        const packageRef = doc(db, 'pt_packages', request.packageId);
        await deleteDoc(packageRef);
      } else if (request.type === 'package_enable') {
        // Enable package
        const packageRef = doc(db, 'pt_packages', request.packageId);
        await updateDoc(packageRef, {
          isActive: true,
          updatedAt: new Date()
        });
      } else if (request.type === 'package_disable') {
        // Disable package
        const packageRef = doc(db, 'pt_packages', request.packageId);
        await updateDoc(packageRef, {
          isActive: false,
          updatedAt: new Date()
        });
      }

      // Update request status using service
      await PendingRequestService.approveRequest(request.id);

      toast.success('Yêu cầu đã được phê duyệt!', {
        position: "top-right",
        autoClose: 2000,
      });

      return { success: true };
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(`Lỗi khi duyệt yêu cầu: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Reject request
   */
  const rejectRequest = useCallback(async (requestId, reason = '') => {
    try {
      await PendingRequestService.rejectRequest(requestId, reason);
      
      toast.success('Yêu cầu đã bị từ chối', {
        position: "top-right",
        autoClose: 2000,
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(`Lỗi khi từ chối yêu cầu: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * View request details - Show comparison modal
   */
  const viewRequestDetails = useCallback(async (request) => {
    const { data, previousData, type } = request;
    
    console.log('🔍 [viewRequestDetails] Request:', request);
    console.log('🔍 [viewRequestDetails] Type:', type);
    console.log('🔍 [viewRequestDetails] Data:', data);
    console.log('🔍 [viewRequestDetails] PreviousData:', previousData);
    
    let changesHtml = '<div style="text-align: left; max-height: 500px; overflow-y: auto; padding: 10px;">';
    let hasChanges = false;
    
    // Employee update details
    if (type === 'employee_update') {
      changesHtml += '<h4 style="color: #007bff; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #007bff;">📝 So sánh thay đổi thông tin nhân viên</h4>';
      
      const formatChange = (label, oldVal, newVal) => {
        // Normalize values for comparison
        const normalizeVal = (val) => {
          if (val === undefined || val === null || val === '') return null;
          return String(val).trim();
        };
        
        const normalizedOld = normalizeVal(oldVal);
        const normalizedNew = normalizeVal(newVal);
        
        // Always show field, mark if changed
        const isChanged = normalizedOld !== normalizedNew;
        if (isChanged) hasChanges = true;
        
        return `
          <div style="margin: 10px 0; padding: 14px; background: ${isChanged ? '#fffbf0' : 'white'}; border-radius: 8px; border-left: 4px solid ${isChanged ? '#ffc107' : '#dee2e6'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-weight: 600; color: #495057; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
              ${label}
              ${isChanged ? '<span style="background: #ffc107; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">THAY ĐỔI</span>' : ''}
            </div>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center;">
              <div>
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 4px;">Hiện tại:</div>
                <span style="color: ${isChanged ? '#dc3545' : '#495057'}; background: ${isChanged ? '#ffe6e6' : '#f8f9fa'}; padding: 8px 12px; border-radius: 6px; display: block; word-break: break-word;">
                  ${oldVal || '(Trống)'}
                </span>
              </div>
              <span style="color: #6c757d; font-size: 20px;">→</span>
              <div>
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 4px;">Yêu cầu:</div>
                <span style="color: ${isChanged ? '#28a745' : '#495057'}; background: ${isChanged ? '#e6ffe6' : '#f8f9fa'}; padding: 8px 12px; border-radius: 6px; font-weight: ${isChanged ? '600' : '400'}; display: block; word-break: break-word;">
                  ${newVal || '(Trống)'}
                </span>
              </div>
            </div>
          </div>
        `;
      };

      // Basic info - ALWAYS show
      changesHtml += '<div style="margin-bottom: 20px;">';
      changesHtml += '<h5 style="color: #6c757d; margin: 12px 0 8px 0; font-size: 14px;">Thông tin cơ bản:</h5>';
      changesHtml += formatChange('Họ và tên', previousData?.fullName, data?.fullName);
      changesHtml += formatChange('Số điện thoại', previousData?.phone, data?.phone);
      changesHtml += formatChange('Địa chỉ', previousData?.address, data?.address);
      changesHtml += formatChange('CCCD', previousData?.idCard, data?.idCard);
      changesHtml += formatChange('Giới tính', 
        previousData?.gender === 'male' ? 'Nam' : previousData?.gender === 'female' ? 'Nữ' : 'Khác',
        data?.gender === 'male' ? 'Nam' : data?.gender === 'female' ? 'Nữ' : 'Khác'
      );
      changesHtml += '</div>';
      
      // PT info
      if (data?.ptInfo || previousData?.ptInfo) {
        changesHtml += '<div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">';
        changesHtml += '<h5 style="color: #0d6efd; margin: 0 0 12px 0; font-size: 14px;">Thông tin PT:</h5>';
        
        const ptInfo = data?.ptInfo || {};
        const oldPtInfo = previousData?.ptInfo || {};
        
        changesHtml += formatChange('Giới thiệu bản thân', oldPtInfo.bio, ptInfo.bio);
        changesHtml += formatChange('Kinh nghiệm', `${oldPtInfo.experience || 0} năm`, `${ptInfo.experience || 0} năm`);
        
        // Specialties
        const formatSpecialties = (specs) => {
          if (!specs || specs.length === 0) return '(Chưa có)';
          return specs.map(s => typeof s === 'string' ? s : s.text || s.name || s).join(', ');
        };
        changesHtml += formatChange('Chuyên môn', formatSpecialties(oldPtInfo.specialties), formatSpecialties(ptInfo.specialties));
        
        // Certificates with images
        const formatCertsDetailed = (certs, label) => {
          if (!certs || certs.length === 0) return '<p style="color: #6c757d; font-style: italic; margin: 8px 0;">(Chưa có)</p>';
          
          return certs.map((c, idx) => {
            // Extract text - handle both string and object formats
            let text = '';
            if (typeof c === 'string') {
              text = c;
            } else if (c && typeof c === 'object') {
              text = c.text || c.name || c.title || JSON.stringify(c);
            }
            
            // Extract images
            const images = (typeof c === 'object' && c.images) ? c.images : [];
            
            let html = `<div style="margin: 6px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; border: 1px solid #dee2e6;">`;
            html += `<div style="font-weight: 500; color: #495057; margin-bottom: 6px;"><strong>${idx + 1}.</strong> ${text || '(Chưa có tên)'}</div>`;
            
            if (images && images.length > 0) {
              html += `<div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">`;
              images.forEach((img, imgIdx) => {
                // Extract URL - handle both string and object formats
                let imgUrl = '';
                if (typeof img === 'string') {
                  imgUrl = img;
                } else if (img && typeof img === 'object') {
                  imgUrl = img.url || img.path || img.src || '';
                }
                
                // Build full URL if relative path
                if (imgUrl && !imgUrl.startsWith('http')) {
                  imgUrl = `${window.location.origin}${imgUrl}`;
                }
                
                if (!imgUrl) {
                  // No valid URL
                  html += `
                    <div style="width: 70px; height: 70px; background: #e9ecef; border-radius: 6px; border: 2px dashed #6c757d; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #6c757d; text-align: center; flex-direction: column; padding: 4px;">
                      <span style="font-size: 16px;">🖼️</span>
                      <span>No URL</span>
                    </div>
                  `;
                } else {
                  html += `
                    <div style="position: relative; display: inline-block;">
                      <a href="${imgUrl}" target="_blank" style="display: block;" title="Click để xem full size">
                        <img 
                          src="${imgUrl}" 
                          alt="Certificate Image ${imgIdx + 1}"
                          style="width: 70px; height: 70px; object-fit: cover; border-radius: 6px; border: 2px solid #007bff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;" 
                          onmouseover="this.style.transform='scale(1.05)'"
                          onmouseout="this.style.transform='scale(1)'"
                          onerror="this.style.display='none'; this.parentElement.nextElementSibling.style.display='flex';"
                        />
                      </a>
                      <div style="display: none; width: 70px; height: 70px; background: #e9ecef; border-radius: 6px; border: 2px dashed #6c757d; align-items: center; justify-content: center; font-size: 9px; color: #6c757d; text-align: center; flex-direction: column; padding: 4px;">
                        <span style="font-size: 16px;">🖼️</span>
                        <span>Ảnh lỗi</span>
                        <span style="font-size: 8px; margin-top: 2px; word-break: break-all; max-width: 60px;">${typeof img === 'string' ? img.split('/').pop().substring(0, 10) : (img.fileName || img.name || 'N/A').substring(0, 10)}...</span>
                      </div>
                    </div>
                  `;
                }
              });
              html += `</div>`;
              html += `<div style="font-size: 11px; color: #6c757d; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                <span>📷 ${images.length} hình</span>
                <span style="color: #999;">•</span>
                <span style="font-size: 10px; color: #999;">Click để xem full size</span>
              </div>`;
            } else {
              html += `<div style="font-size: 11px; color: #6c757d; font-style: italic; margin-top: 4px; padding: 8px; background: #f1f3f5; border-radius: 4px; text-align: center;">📷 Chưa có hình ảnh</div>`;
            }
            html += `</div>`;
            return html;
          }).join('');
        };
        
        // Helper to normalize certificate/achievement objects for comparison
        const normalizeCertArray = (arr) => {
          if (!arr || arr.length === 0) return [];
          return arr.map(item => {
            if (typeof item === 'string') return { text: item, images: [] };
            return {
              text: item.text || item.name || '',
              images: item.images || [],
              id: item.id || ''
            };
          }).sort((a, b) => a.text.localeCompare(b.text)); // Sort for consistent comparison
        };
        
        // Compare certificates
        const normalizedOldCerts = normalizeCertArray(oldPtInfo.certificates);
        const normalizedNewCerts = normalizeCertArray(ptInfo.certificates);
        
        if (JSON.stringify(normalizedOldCerts) !== JSON.stringify(normalizedNewCerts)) {
          console.log('🔍 [Certificates] Old:', oldPtInfo.certificates);
          console.log('🔍 [Certificates] New:', ptInfo.certificates);
          console.log('🔍 [Certificates] Normalized Old:', normalizedOldCerts);
          console.log('🔍 [Certificates] Normalized New:', normalizedNewCerts);
          
          // Debug image URLs
          if (ptInfo.certificates && ptInfo.certificates[0]?.images) {
            console.log('🔍 [Certificates] Image URLs:', ptInfo.certificates[0].images);
            ptInfo.certificates[0].images.forEach((img, i) => {
              const url = typeof img === 'string' ? img : (img?.url || img?.path || 'N/A');
              const fullUrl = (url && typeof url === 'string' && !url.startsWith('http')) 
                ? `${window.location.origin}${url}` 
                : url;
              console.log(`🔍 [Certificates] Image ${i + 1} Object:`, img);
              console.log(`🔍 [Certificates] Image ${i + 1} URL:`, url);
              console.log(`🔍 [Certificates] Full URL ${i + 1}:`, fullUrl);
            });
          }
          
          if (oldPtInfo.certificates && oldPtInfo.certificates[0]?.images) {
            console.log('🔍 [Certificates OLD] Image URLs:', oldPtInfo.certificates[0].images);
          }
          
          const oldCertsHtml = formatCertsDetailed(oldPtInfo.certificates, 'Cũ');
          const newCertsHtml = formatCertsDetailed(ptInfo.certificates, 'Mới');
          
          hasChanges = true;
          changesHtml += `
            <div style="margin: 10px 0; padding: 14px; background: #fffbf0; border-radius: 8px; border-left: 4px solid #ffc107; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-weight: 600; color: #495057; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                Chứng chỉ
                <span style="background: #ffc107; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">THAY ĐỔI</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: start;">
                <div>
                  <div style="font-size: 11px; color: #6c757d; margin-bottom: 6px;">Hiện tại:</div>
                  <div style="color: #dc3545; background: #ffe6e6; padding: 8px 12px; border-radius: 6px;">
                    ${oldCertsHtml || '(Chưa có)'}
                  </div>
                </div>
                <span style="color: #6c757d; font-size: 20px;">→</span>
                <div>
                  <div style="font-size: 11px; color: #6c757d; margin-bottom: 6px;">Yêu cầu:</div>
                  <div style="color: #28a745; background: #e6ffe6; padding: 8px 12px; border-radius: 6px; font-weight: 600;">
                    ${newCertsHtml || '(Chưa có)'}
                  </div>
                </div>
              </div>
            </div>
          `;
        } else {
          const certsHtml = formatCertsDetailed(ptInfo.certificates || oldPtInfo.certificates);
          changesHtml += `
            <div style="margin: 10px 0; padding: 14px; background: white; border-radius: 8px; border-left: 4px solid #dee2e6; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-weight: 600; color: #495057; margin-bottom: 10px;">Chứng chỉ</div>
              <div style="color: #495057; background: #f8f9fa; padding: 8px 12px; border-radius: 6px;">
                ${certsHtml || '(Chưa có)'}
              </div>
            </div>
          `;
        }
        
        // Achievements with images
        const normalizedOldAchs = normalizeCertArray(oldPtInfo.achievements);
        const normalizedNewAchs = normalizeCertArray(ptInfo.achievements);
        
        if (JSON.stringify(normalizedOldAchs) !== JSON.stringify(normalizedNewAchs)) {
          console.log('🔍 [Achievements] Old:', oldPtInfo.achievements);
          console.log('🔍 [Achievements] New:', ptInfo.achievements);
          console.log('🔍 [Achievements] Normalized Old:', normalizedOldAchs);
          console.log('🔍 [Achievements] Normalized New:', normalizedNewAchs);
          
          const oldAchsHtml = formatCertsDetailed(oldPtInfo.achievements, 'Cũ');
          const newAchsHtml = formatCertsDetailed(ptInfo.achievements, 'Mới');
          
          hasChanges = true;
          changesHtml += `
            <div style="margin: 10px 0; padding: 14px; background: #fffbf0; border-radius: 8px; border-left: 4px solid #ffc107; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-weight: 600; color: #495057; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                Thành tích
                <span style="background: #ffc107; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">THAY ĐỔI</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: start;">
                <div>
                  <div style="font-size: 11px; color: #6c757d; margin-bottom: 6px;">Hiện tại:</div>
                  <div style="color: #dc3545; background: #ffe6e6; padding: 8px 12px; border-radius: 6px;">
                    ${oldAchsHtml || '(Chưa có)'}
                  </div>
                </div>
                <span style="color: #6c757d; font-size: 20px;">→</span>
                <div>
                  <div style="font-size: 11px; color: #6c757d; margin-bottom: 6px;">Yêu cầu:</div>
                  <div style="color: #28a745; background: #e6ffe6; padding: 8px 12px; border-radius: 6px; font-weight: 600;">
                    ${newAchsHtml || '(Chưa có)'}
                  </div>
                </div>
              </div>
            </div>
          `;
        } else {
          const achsHtml = formatCertsDetailed(ptInfo.achievements || oldPtInfo.achievements);
          changesHtml += `
            <div style="margin: 10px 0; padding: 14px; background: white; border-radius: 8px; border-left: 4px solid #dee2e6; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="font-weight: 600; color: #495057; margin-bottom: 10px;">Thành tích</div>
              <div style="color: #495057; background: #f8f9fa; padding: 8px 12px; border-radius: 6px;">
                ${achsHtml || '(Chưa có)'}
              </div>
            </div>
          `;
        }
        
        changesHtml += formatChange('Số học viên tối đa/ngày', oldPtInfo.maxClientsPerDay, ptInfo.maxClientsPerDay);
        changesHtml += formatChange('Nhận học viên mới', 
          oldPtInfo.isAcceptingNewClients ? 'Có' : 'Không',
          ptInfo.isAcceptingNewClients ? 'Có' : 'Không'
        );
        
        changesHtml += '</div>';
      }
      
      // Summary
      if (!hasChanges) {
        changesHtml += '<div style="padding: 20px; background: #fff3cd; border-radius: 8px; text-align: center; margin-top: 16px;"><p style="margin: 0; color: #856404; font-style: italic;">⚠️ Không phát hiện thay đổi nào trong request này</p></div>';
      }
    }
    
    // Package details
    if (type === 'package_create') {
      hasChanges = true; // New package is always a change
      changesHtml += '<h4 style="color: #28a745; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #28a745;">➕ Tạo gói tập mới</h4>';
      changesHtml += `
        <div style="padding: 20px; background: #e6ffe6; border-radius: 8px; border-left: 4px solid #28a745; box-shadow: 0 2px 8px rgba(40,167,69,0.1);">
          <div style="display: grid; gap: 12px;">
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; align-items: start;">
              <strong>Tên gói:</strong> 
              <span style="color: #28a745; font-weight: 600; font-size: 15px;">${data.name}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Loại:</strong> 
              <span>${data.packageType}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Giá:</strong> 
              <span style="color: #28a745; font-weight: 600; font-size: 15px;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.price)}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Số buổi:</strong> 
              <span>${data.sessions}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Thời lượng:</strong> 
              <span>${data.duration} phút</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Giảm giá:</strong> 
              <span>${data.discount || 0}%</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Mô tả:</strong> 
              <span style="font-style: italic; color: #6c757d;">${data.description || '(Chưa có mô tả)'}</span>
            </div>
          </div>
        </div>
      `;
    } else if (type === 'package_update') {
      changesHtml += '<h4 style="color: #007bff; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #007bff;">✏️ So sánh cập nhật gói tập</h4>';
      
      const formatPackageChange = (label, oldVal, newVal) => {
        const normalizeVal = (val) => {
          if (val === undefined || val === null || val === '') return null;
          return String(val).trim();
        };
        
        const normalizedOld = normalizeVal(oldVal);
        const normalizedNew = normalizeVal(newVal);
        const isChanged = normalizedOld !== normalizedNew;
        
        if (isChanged) hasChanges = true;
        
        return `
          <div style="margin: 10px 0; padding: 14px; background: ${isChanged ? '#fffbf0' : 'white'}; border-radius: 8px; border-left: 4px solid ${isChanged ? '#ffc107' : '#dee2e6'}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-weight: 600; color: #495057; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
              ${label}
              ${isChanged ? '<span style="background: #ffc107; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">THAY ĐỔI</span>' : ''}
            </div>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center;">
              <div>
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 4px;">Hiện tại:</div>
                <span style="color: ${isChanged ? '#dc3545' : '#495057'}; background: ${isChanged ? '#ffe6e6' : '#f8f9fa'}; padding: 8px 12px; border-radius: 6px; display: block; word-break: break-word;">
                  ${oldVal || '(Trống)'}
                </span>
              </div>
              <span style="color: #6c757d; font-size: 20px;">→</span>
              <div>
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 4px;">Yêu cầu:</div>
                <span style="color: ${isChanged ? '#28a745' : '#495057'}; background: ${isChanged ? '#e6ffe6' : '#f8f9fa'}; padding: 8px 12px; border-radius: 6px; font-weight: ${isChanged ? '600' : '400'}; display: block; word-break: break-word;">
                  ${newVal || '(Trống)'}
                </span>
              </div>
            </div>
          </div>
        `;
      };

      changesHtml += formatPackageChange('Tên gói', previousData?.name, data?.name);
      changesHtml += formatPackageChange('Loại', previousData?.packageType, data?.packageType);
      changesHtml += formatPackageChange(
        'Giá',
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(previousData?.price || 0),
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data?.price || 0)
      );
      changesHtml += formatPackageChange('Số buổi', previousData?.sessions, data?.sessions);
      changesHtml += formatPackageChange('Thời lượng', `${previousData?.duration || 0} phút`, `${data?.duration || 0} phút`);
      changesHtml += formatPackageChange('Giảm giá', `${previousData?.discount || 0}%`, `${data?.discount || 0}%`);
      changesHtml += formatPackageChange('Mô tả', previousData?.description || '(Chưa có)', data?.description || '(Chưa có)');
      
      // Check availableTimeSlots
      const formatSlots = (slots) => {
        if (!slots || slots.length === 0) return '(Trống)';
        return slots.map(slot => {
          if (typeof slot === 'string') return slot;
          return `${slot.startTime || slot.start || ''}-${slot.endTime || slot.end || ''}`;
        }).join(', ');
      };
      
      changesHtml += formatPackageChange(
        'Lịch cố định',
        formatSlots(previousData?.availableTimeSlots),
        formatSlots(data?.availableTimeSlots)
      );
      
      if (!hasChanges) {
        changesHtml += '<div style="padding: 20px; background: #fff3cd; border-radius: 8px; text-align: center; margin-top: 16px;"><p style="margin: 0; color: #856404; font-style: italic;">⚠️ Không phát hiện thay đổi nào</p></div>';
      }
    } else if (type === 'package_delete') {
      hasChanges = true; // Delete is always a change
      changesHtml += '<h4 style="color: #dc3545; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #dc3545;">🗑️ Xóa gói tập</h4>';
      changesHtml += `
        <div style="padding: 20px; background: #ffe6e6; border-radius: 8px; border-left: 4px solid #dc3545; box-shadow: 0 2px 8px rgba(220,53,69,0.1);">
          <div style="display: grid; gap: 12px;">
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Tên gói:</strong> 
              <span style="font-weight: 600;">${previousData?.name}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Loại:</strong> 
              <span>${previousData?.packageType}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Giá:</strong> 
              <span style="font-weight: 600;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(previousData?.price || 0)}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Số buổi:</strong> 
              <span>${previousData?.sessions}</span>
            </div>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
              <strong>Thời lượng:</strong> 
              <span>${previousData?.duration} phút</span>
            </div>
          </div>
          <div style="margin-top: 16px; padding: 12px; background: #dc3545; color: white; border-radius: 6px; font-weight: 600; text-align: center;">
            ⚠️ Gói này sẽ bị xóa vĩnh viễn khỏi hệ thống
          </div>
        </div>
      `;
    } else if (type === 'package_enable' || type === 'package_disable') {
      hasChanges = true; // Enable/disable is always a change
      const isEnable = type === 'package_enable';
      changesHtml += `<h4 style="color: ${isEnable ? '#17a2b8' : '#ffc107'}; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid ${isEnable ? '#17a2b8' : '#ffc107'};">${isEnable ? '✅ Kích hoạt' : '🚫 Vô hiệu hóa'} gói tập</h4>`;
      changesHtml += `
        <div style="padding: 20px; background: ${isEnable ? '#e0f7fa' : '#fff3cd'}; border-radius: 8px; border-left: 4px solid ${isEnable ? '#17a2b8' : '#ffc107'}; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 16px;">
            <strong>Tên gói:</strong> 
            <span style="font-size: 15px; font-weight: 600; margin-left: 8px;">${request.packageName}</span>
          </div>
          <div style="background: white; padding: 16px; border-radius: 8px;">
            <strong style="display: block; margin-bottom: 12px; color: #495057;">Thay đổi trạng thái:</strong>
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center;">
              <div>
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 4px;">Hiện tại:</div>
                <span style="color: #dc3545; background: #ffe6e6; padding: 10px 14px; border-radius: 6px; display: block; text-align: center; font-weight: 600;">
                  ${isEnable ? '🚫 Tạm dừng' : '✅ Hoạt động'}
                </span>
              </div>
              <span style="color: #6c757d; font-size: 20px;">→</span>
              <div>
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 4px;">Yêu cầu:</div>
                <span style="color: #28a745; background: #e6ffe6; padding: 10px 14px; border-radius: 6px; font-weight: 600; display: block; text-align: center;">
                  ${isEnable ? '✅ Hoạt động' : '🚫 Tạm dừng'}
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    changesHtml += '</div>';

    return Swal.fire({
      icon: 'info',
      title: 'Chi tiết yêu cầu',
      html: changesHtml,
      width: '700px',
      confirmButtonText: 'Đóng',
      customClass: {
        container: 'pending-request-detail-modal'
      }
    });
  }, []);

  /**
   * Approve request with confirmation
   */
  const approveRequestWithConfirm = useCallback(async (request) => {
    const typeLabels = {
      'employee_update': 'Cập nhật thông tin nhân viên',
      'package_create': 'Tạo gói tập mới',
      'package_update': 'Cập nhật gói tập',
      'package_delete': 'Xóa gói tập',
      'package_enable': 'Kích hoạt gói tập',
      'package_disable': 'Vô hiệu hóa gói tập'
    };

    const result = await Swal.fire({
      icon: 'question',
      title: 'Duyệt yêu cầu này?',
      html: `
        <div style="text-align: left;">
          <p><strong>Người yêu cầu:</strong> ${request.employeeName || request.requestedByName || 'N/A'}</p>
          <p><strong>Loại:</strong> ${typeLabels[request.type] || request.type}</p>
          ${request.packageName ? `<p><strong>Gói:</strong> ${request.packageName}</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#28a745'
    });

    if (!result.isConfirmed) return { success: false, cancelled: true };

    return approveRequest(request);
  }, [approveRequest]);

  /**
   * Reject request with confirmation
   */
  const rejectRequestWithConfirm = useCallback(async (requestId, requestInfo = {}) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Từ chối yêu cầu này?',
      input: 'textarea',
      inputLabel: 'Lý do từ chối (tùy chọn)',
      inputPlaceholder: 'Nhập lý do...',
      showCancelButton: true,
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc3545'
    });

    if (!result.isConfirmed) return { success: false, cancelled: true };

    try {
      await PendingRequestService.rejectRequest(requestId, result.value || '');
      
      toast.success('Yêu cầu đã bị từ chối', {
        position: "top-right",
        autoClose: 2000,
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(`Lỗi khi từ chối yêu cầu: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Load more requests (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    console.log('📄 [Provider] Loading more requests...');
    
    try {
      const filters = {};
      if (filter !== 'all') {
        filters.status = filter;
      }

      // Subscribe to next page
      const unsubscribe = PendingRequestService.subscribeToPendingRequests(
        filters,
        { pageSize: 20, lastDoc: lastDoc },
        async (requestsList, lastDocument, hasMoreData) => {
          console.log('🔥 [Provider] Loaded more:', requestsList.length, 'hasMore:', hasMoreData);
          
          // Backfill avatars
          const formatted = await Promise.all(requestsList.map(async (req) => {
            let avatarUrl = req.employeeAvatar;
            
            if (!avatarUrl && req.employeeId) {
              try {
                const { doc, getDoc } = await import('firebase/firestore');
                const employeeDoc = await getDoc(doc(db, 'employees', req.employeeId));
                if (employeeDoc.exists()) {
                  avatarUrl = employeeDoc.data().avatarUrl || null;
                }
              } catch (error) {
                console.error('Error fetching avatar for', req.employeeId, error);
              }
            }
            
            return {
              ...req,
              employeeAvatar: avatarUrl,
              createdAt: req.createdAt?.toDate?.() || new Date(req.createdAt),
              updatedAt: req.updatedAt?.toDate?.() || new Date(req.updatedAt)
            };
          }));
          
          formatted.sort((a, b) => b.createdAt - a.createdAt);
          
          // Append to existing requests
          setRequests(prev => [...prev, ...formatted]);
          setLastDoc(lastDocument);
          setHasMore(hasMoreData);
          setLoadingMore(false);
          
          // Cleanup subscription after loading
          unsubscribe();
        },
        (error) => {
          console.error('Error loading more:', error);
          setLoadingMore(false);
        }
      );
    } catch (error) {
      console.error('Error in loadMore:', error);
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, lastDoc, filter]);

  /**
   * Refresh requests (manual reload)
   */
  const refreshRequests = useCallback(() => {
    // onSnapshot will auto-refresh, but this is here for compatibility
    setLoading(true);
  }, []);

  const contextValue = {
    requests,
    loading,
    loadingMore,
    hasMore,
    filter,
    setFilter,
    approveRequest: approveRequestWithConfirm,
    rejectRequest: rejectRequestWithConfirm,
    viewRequestDetails,
    refreshRequests,
    loadMore,
    counts,
  };

  return (
    <PendingRequestContext.Provider value={contextValue}>
      {children}
    </PendingRequestContext.Provider>
  );
}

/**
 * Hook to use pending request context
 */
export const usePendingRequests = () => {
  const context = useContext(PendingRequestContext);
  if (!context) {
    throw new Error('usePendingRequests must be used within PendingRequestProvider');
  }
  return context;
};

