// Test script để kiểm tra PayOs API endpoint
const testPayOsAPI = async () => {
  // Test với localhost (từ máy host)
  const url = "http://localhost:3000/api/payos/create-gym-payment";

  const requestBody = {
    packageId: "test-package-123",
    packageName: "Gói Test",
    packagePrice: 100000,
    packageDuration: 30,
    userId: "test-user-123",
    userName: "Test User",
  };

  console.log("🧪 Testing PayOs API...");
  console.log("URL:", url);
  console.log("Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
};

testPayOsAPI();
