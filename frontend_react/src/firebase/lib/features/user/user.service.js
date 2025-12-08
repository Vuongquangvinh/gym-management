// User Service - Quản lý thông tin người dùng
import { doc, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../config/firebase';

/**
 * Lấy thông tin profile của user từ Firestore
 * Tự động kiểm tra cả collection employees và users
 * @param {string} userId - ID của user
 * @returns {Promise<Object>} - Thông tin user
 */
export const getUserProfile = async (userId) => {
  try {
    console.log('🔍 Getting profile for userId:', userId);
    
    let userData = null;
    let docId = null;
    let isEmployee = false;
    
    // Try employees collection first (query by uid field)
    console.log('🔍 Checking employees collection by uid...');
    const employeesRef = collection(db, 'employees');
    const employeesQuery = query(employeesRef, where('uid', '==', userId), limit(1));
    const employeesSnapshot = await getDocs(employeesQuery);
    
    if (!employeesSnapshot.empty) {
      isEmployee = true;
      const employeeDoc = employeesSnapshot.docs[0];
      userData = employeeDoc.data();
      docId = employeeDoc.id;
      console.log('✅ Found in employees collection:', userData);
    } else {
      // If not found in employees, try users collection
      console.log('🔍 Not in employees, checking users collection by uid...');
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('uid', '==', userId), limit(1));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        userData = userDoc.data();
        docId = userDoc.id;
        console.log('✅ Found in users collection:', userData);
      }
    }
    
    if (userData) {
      console.log('📊 Raw Firestore data:', userData);
      
      // Support both phoneNumber and phone_number fields
      const phoneNumber = userData.phoneNumber || userData.phone_number || userData.phone || '';
      const photoURL = userData.photoURL || userData.photo_url || userData.avatarUrl || userData.avatar || '';
      const displayName = userData.displayName || userData.full_name || userData.fullName || '';
      
      const profileData = {
        displayName: displayName,
        email: userData.email || '',
        phoneNumber: phoneNumber,
        photoURL: photoURL,
        role: userData.role || userData.position || '',
        position: userData.position || '',
        isEmployee: isEmployee,
        docId: docId, // Store document ID for updates
      };
      
      console.log('✅ Processed profile data:', profileData);
      
      return {
        success: true,
        data: profileData,
        message: 'Tải thông tin thành công'
      };
    } else {
      console.warn('⚠️ User document not found in Firestore (checked both employees and users), using Auth data');
      // Fallback to Auth data if Firestore doc doesn't exist
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        return {
          success: true,
          data: {
            displayName: currentUser.displayName || '',
            email: currentUser.email || '',
            phoneNumber: currentUser.phoneNumber || '',
            photoURL: currentUser.photoURL || '',
            role: '',
            position: '',
            isEmployee: false,
          },
          message: 'Lấy thông tin từ Firebase Auth'
        };
      }
      throw new Error('Không tìm thấy thông tin người dùng');
    }
  } catch (error) {
    console.error('❌ getUserProfile error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Lỗi tải thông tin người dùng'
    };
  }
};

/**
 * Cập nhật thông tin profile của user
 * Tự động cập nhật đúng collection (employees hoặc users)
 * @param {string} userId - ID của user
 * @param {Object} profileData - Dữ liệu cần update
 * @returns {Promise<Object>}
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    // Validate phone number if provided
    if (profileData.phoneNumber && !/^[0-9]{10}$/.test(profileData.phoneNumber)) {
      throw new Error('Số điện thoại không hợp lệ (10 chữ số)');
    }

    // Validate displayName
    if (profileData.displayName && !profileData.displayName.trim()) {
      throw new Error('Họ tên không được để trống');
    }

    // Check which collection to update
    let userDoc = await getDoc(doc(db, 'employees', userId));
    let collectionName = 'employees';
    
    if (!userDoc.exists()) {
      userDoc = await getDoc(doc(db, 'users', userId));
      collectionName = 'users';
    }

    if (!userDoc.exists()) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }

    // Prepare update data based on collection structure
    const updateData = {
      updatedAt: new Date(),
    };

    // Map fields based on collection naming convention
    if (collectionName === 'employees') {
      if (profileData.displayName) updateData.fullName = profileData.displayName;
      if (profileData.phoneNumber) updateData.phone = profileData.phoneNumber;
      if (profileData.photoURL) updateData.photoURL = profileData.photoURL;
    } else {
      if (profileData.displayName) updateData.displayName = profileData.displayName;
      if (profileData.phoneNumber) updateData.phone_number = profileData.phoneNumber;
      if (profileData.photoURL) updateData.photoURL = profileData.photoURL;
    }

    await updateDoc(doc(db, collectionName, userId), updateData);

    console.log(`✅ Updated profile in ${collectionName}:`, updateData);

    return {
      success: true,
      data: profileData,
      message: 'Cập nhật thông tin thành công'
    };
  } catch (error) {
    console.error('❌ updateUserProfile error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Lỗi cập nhật thông tin'
    };
  }
};

/**
 * Upload avatar và trả về URL
 * @param {string} userId - ID của user
 * @param {File} file - File ảnh
 * @returns {Promise<Object>} - URL của ảnh đã upload
 */
export const uploadUserAvatar = async (userId, file) => {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('Vui lòng chọn file ảnh');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Ảnh không được vượt quá 5MB');
    }

    // Upload to Firebase Storage
    const storageRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const photoURL = await getDownloadURL(storageRef);

    return {
      success: true,
      data: { photoURL },
      message: 'Tải ảnh lên thành công'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Lỗi tải ảnh lên'
    };
  }
};
