import { prisma } from '../src/database/client';

async function runTest() {
  console.log("Starting programmatic sign-up test...");

  // Clean up any existing test user first
  await prisma.user.deleteMany({
    where: { email: 'test_integration@vertigo.ai' }
  });

  const url = 'http://localhost:8000/api/auth/signup';
  const body = {
    name: 'Integration Test User',
    email: 'test_integration@vertigo.ai',
    password: 'securePassword123'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json() as any;
    console.log("API Signup Response status:", res.status);
    console.log("API Signup Response body:", JSON.stringify(data, null, 2));

    if (res.status === 201 && data.success) {
      console.log("API registration initiated successfully!");
      
      // Query database to confirm user record
      const dbUser = await prisma.user.findUnique({
        where: { email: 'test_integration@vertigo.ai' }
      });

      if (dbUser) {
        console.log("✅ Neon Database Verification: User successfully written to User table!");
        console.log("User details:", {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          emailVerified: dbUser.emailVerified
        });
      } else {
        console.log("❌ Neon Database Error: User was not found in the database user table.");
      }
    } else {
      console.log("❌ API Error: Sign-up request returned failed response.");
    }
  } catch (err) {
    console.error("❌ Request Error: Failed to execute signup request:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
