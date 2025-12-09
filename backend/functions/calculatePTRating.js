/**
 * Cloud Function: Tính rating trung bình cho PT
 *
 * Trigger: Firestore trigger khi có thay đổi trong pt_reviews collection
 *
 * Flow:
 * 1. Khi có review mới/update/delete trong pt_reviews
 * 2. Tự động query tất cả reviews của PT đó
 * 3. Tính average rating
 * 4. Update vào employees collection
 *
 * Deploy: firebase deploy --only functions:calculatePTRating
 */

const admin = require("firebase-admin");

// Initialize Admin SDK nếu chưa
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Firestore Trigger: onCreate, onUpdate, onDelete
 */
exports.calculatePTRatingOnReviewChange = async (change, context) => {
  try {
    const reviewId = context.params.reviewId;

    // Lấy ptId từ review data
    let ptId;

    if (change.after.exists) {
      // onCreate hoặc onUpdate
      ptId = change.after.data().ptId;
      console.log(`📝 Review ${reviewId} changed for PT ${ptId}`);
    } else if (change.before.exists) {
      // onDelete
      ptId = change.before.data().ptId;
      console.log(`🗑️ Review ${reviewId} deleted for PT ${ptId}`);
    } else {
      console.error("❌ No data found in change");
      return null;
    }

    if (!ptId) {
      console.error("❌ ptId not found in review data");
      return null;
    }

    // Tính lại rating cho PT
    await calculateAndUpdatePTRating(ptId);

    return null;
  } catch (error) {
    console.error("❌ Error in calculatePTRatingOnReviewChange:", error);
    // Không throw error để không retry vô hạn
    return null;
  }
};

/**
 * Helper function: Tính và update PT rating
 */
async function calculateAndUpdatePTRating(ptId) {
  try {
    console.log(`🔄 Calculating rating for PT: ${ptId}`);

    // 1. Query tất cả reviews của PT
    const reviewsSnapshot = await db
      .collection("pt_reviews")
      .where("ptId", "==", ptId)
      .get();

    const reviews = reviewsSnapshot.docs.map((doc) => doc.data());
    const totalReviews = reviews.length;

    // 2. Tính average rating
    let averageRating = 0;

    if (totalReviews > 0) {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      averageRating = totalRating / totalReviews;
    }

    console.log(
      `📊 PT ${ptId}: ${totalReviews} reviews, average ${averageRating.toFixed(
        2
      )}`
    );

    // 3. Update vào employees collection
    await db.collection("employees").doc(ptId).update({
      rating: averageRating,
      totalReviews: totalReviews,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ PT ${ptId} rating updated successfully`);

    return {
      ptId,
      averageRating,
      totalReviews,
    };
  } catch (error) {
    console.error(`❌ Error calculating rating for PT ${ptId}:`, error);
    throw error;
  }
}

/**
 * HTTP Callable Function: Manual recalculate cho admin
 *
 * Usage từ Flutter:
 * final callable = FirebaseFunctions.instance.httpsCallable('recalculateAllPTRatings');
 * final result = await callable.call();
 */
exports.recalculateAllPTRatings = async (data, context) => {
  try {
    console.log("🔄 Manual recalculate all PT ratings triggered");

    // Auth check (optional - uncomment cho production)
    // if (!context.auth) {
    //   throw new Error('Unauthorized: Authentication required');
    // }

    // 1. Lấy tất cả PT employees
    const employeesSnapshot = await db
      .collection("employees")
      .where("role", "==", "pt")
      .get();

    console.log(`📋 Found ${employeesSnapshot.size} PT employees`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // 2. Recalculate từng PT
    for (const employeeDoc of employeesSnapshot.docs) {
      const ptId = employeeDoc.id;
      const ptName = employeeDoc.data().fullName || "Unknown";

      try {
        const result = await calculateAndUpdatePTRating(ptId);
        results.push({
          ptId,
          ptName,
          success: true,
          ...result,
        });
        successCount++;
      } catch (error) {
        results.push({
          ptId,
          ptName,
          success: false,
          error: error.message,
        });
        errorCount++;
      }
    }

    console.log(
      `🎉 Recalculate completed: ${successCount} success, ${errorCount} errors`
    );

    return {
      success: true,
      totalPTs: employeesSnapshot.size,
      successCount,
      errorCount,
      results,
    };
  } catch (error) {
    console.error("❌ Error in recalculateAllPTRatings:", error);
    throw new Error(`Failed to recalculate: ${error.message}`);
  }
};
