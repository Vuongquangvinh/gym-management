/**
 * Cloud Functions for Firebase
 *
 * Entry point cho tất cả Cloud Functions
 */

const functions = require("firebase-functions");
const ptRatingFunctions = require("./calculatePTRating");

// Export PT Rating Functions
exports.calculatePTRatingOnReviewChange = functions
  .region("asia-southeast1") // Chọn region gần Việt Nam
  .firestore.document("pt_reviews/{reviewId}")
  .onWrite(ptRatingFunctions.calculatePTRatingOnReviewChange);

exports.recalculateAllPTRatings = functions
  .region("asia-southeast1")
  .https.onCall(ptRatingFunctions.recalculateAllPTRatings);
