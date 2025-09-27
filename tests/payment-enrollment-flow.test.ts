/**
 * CRITICAL INTEGRATION TEST: Payment-to-Enrollment Flow
 * 
 * This test suite validates the most critical business logic flow:
 * Payment → Webhook → Enrollment → Premium Access
 * 
 * PRIORITY 1 TEST for Production Deployment
 */

import { storage } from '../server/storage';

describe('🔥 CRITICAL: Payment-to-Enrollment Flow Integration Tests', () => {
  let testUser: any;
  let testCourse: any;
  let mockPaymentIntent: any;
  
  beforeEach(async () => {
    // Create test user
    testUser = await storage.createUser({
      email: 'test.payment@example.com',
      firstName: 'Test',
      lastName: 'User',
      isApproved: true
    });
    
    // Create test course
    testCourse = await storage.createCourse({
      title: 'Test Financial Course',
      description: 'Test course for payment flow',
      price: 99.99,
      status: 'published',
      thumbnailUrl: 'https://example.com/thumb.jpg'
    });
    
    // Mock successful payment intent
    mockPaymentIntent = {
      id: 'pi_test_payment_intent',
      amount: 9999, // $99.99 in cents
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        userId: testUser.id,
        userEmail: testUser.email,
        productId: testCourse.id,
        productType: 'course'
      }
    };
  });

  describe('✅ SUCCESS SCENARIOS', () => {
    test('Should process complete payment-to-enrollment flow successfully', async () => {
      // ARRANGE: Verify no existing enrollment
      const beforeEnrollment = await storage.getEnrollment(testUser.id, testCourse.id);
      expect(beforeEnrollment).toBeNull();
      
      // ACT: Simulate webhook payment success
      const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true' // Signal this is a test request
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: {
            object: mockPaymentIntent
          }
        })
      });
      
      // ASSERT: Webhook processed successfully
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      
      // ASSERT: Enrollment was created
      const enrollment = await storage.getEnrollment(testUser.id, testCourse.id);
      expect(enrollment).toBeTruthy();
      expect(enrollment?.userId).toBe(testUser.id);
      expect(enrollment?.courseId).toBe(testCourse.id);
      expect(enrollment?.progress).toBe(0);
      expect(enrollment?.completed).toBe(false);
      
      // ASSERT: User can access course content (premium access verification)
      const userEnrollments = await storage.getUserEnrollments(testUser.id);
      expect(userEnrollments).toHaveLength(1);
      expect(userEnrollments[0].course.title).toBe(testCourse.title);
      
      console.log('✅ SUCCESS: Payment → Enrollment flow completed successfully');
    });

    test('Should handle admin user payment correctly', async () => {
      // ARRANGE: Create admin user
      const adminUser = await storage.createUser({
        email: 'tamzid257@gmail.com', // Admin email from code
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isApproved: true
      });
      
      const adminPayment = {
        ...mockPaymentIntent,
        metadata: {
          ...mockPaymentIntent.metadata,
          userId: adminUser.id,
          userEmail: adminUser.email
        }
      };
      
      // ACT: Process admin payment
      const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: adminPayment }
        })
      });
      
      // ASSERT: Admin enrollment processed
      expect(response.ok).toBe(true);
      const enrollment = await storage.getEnrollment(adminUser.id, testCourse.id);
      expect(enrollment).toBeTruthy();
      
      console.log('✅ SUCCESS: Admin payment processed correctly');
    });
  });

  describe('❌ FAILURE SCENARIOS', () => {
    test('Should handle missing metadata gracefully', async () => {
      // ARRANGE: Payment with missing metadata
      const invalidPayment = {
        ...mockPaymentIntent,
        metadata: {} // Missing required fields
      };
      
      // ACT: Process invalid payment
      const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: invalidPayment }
        })
      });
      
      // ASSERT: Should handle gracefully without creating enrollment
      // Note: Webhook should still return 200 to prevent retries
      expect(response.status).toBe(200);
      
      const enrollment = await storage.getEnrollment(testUser.id, testCourse.id);
      expect(enrollment).toBeNull();
      
      console.log('✅ SUCCESS: Invalid metadata handled gracefully');
    });

    test('Should handle non-existent user payment', async () => {
      // ARRANGE: Payment for non-existent user
      const invalidUserPayment = {
        ...mockPaymentIntent,
        metadata: {
          ...mockPaymentIntent.metadata,
          userId: 'non-existent-user-id'
        }
      };
      
      // ACT: Process payment for invalid user
      const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: invalidUserPayment }
        })
      });
      
      // ASSERT: Should handle gracefully
      expect(response.status).toBe(200);
      
      console.log('✅ SUCCESS: Non-existent user payment handled gracefully');
    });

    test('Should handle non-existent course payment', async () => {
      // ARRANGE: Payment for non-existent course
      const invalidCoursePayment = {
        ...mockPaymentIntent,
        metadata: {
          ...mockPaymentIntent.metadata,
          productId: 'non-existent-course-id'
        }
      };
      
      // ACT: Process payment for invalid course
      const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: invalidCoursePayment }
        })
      });
      
      // ASSERT: Should handle gracefully
      expect(response.status).toBe(200);
      
      console.log('✅ SUCCESS: Non-existent course payment handled gracefully');
    });

    test('Should handle duplicate enrollment attempt', async () => {
      // ARRANGE: Create existing enrollment
      await storage.enrollUserInCourse({
        userId: testUser.id,
        courseId: testCourse.id,
        progress: 50,
        completed: false
      });
      
      // ACT: Process payment for already enrolled user
      const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          type: 'payment_intent.succeeded',
          data: { object: mockPaymentIntent }
        })
      });
      
      // ASSERT: Should handle gracefully without creating duplicate
      expect(response.ok).toBe(true);
      
      const enrollments = await storage.getUserEnrollments(testUser.id);
      expect(enrollments).toHaveLength(1); // Should still be only one enrollment
      expect(enrollments[0].progress).toBe(50); // Original progress preserved
      
      console.log('✅ SUCCESS: Duplicate enrollment prevented successfully');
    });
  });

  describe('🔄 PAYMENT FAILURE SCENARIOS', () => {
    test('Should handle payment failure events', async () => {
      // ARRANGE: Payment failure event
      const failedPayment = {
        ...mockPaymentIntent,
        status: 'requires_payment_method',
        last_payment_error: {
          code: 'card_declined',
          message: 'Your card was declined.'
        }
      };
      
      // ACT: Process payment failure
      const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          type: 'payment_intent.payment_failed',
          data: { object: failedPayment }
        })
      });
      
      // ASSERT: Should handle failure gracefully
      expect(response.ok).toBe(true);
      
      // ASSERT: No enrollment should be created
      const enrollment = await storage.getEnrollment(testUser.id, testCourse.id);
      expect(enrollment).toBeNull();
      
      console.log('✅ SUCCESS: Payment failure handled correctly');
    });
  });

  describe('🚀 PERFORMANCE & RELIABILITY', () => {
    test('Should handle concurrent payment webhooks', async () => {
      // ARRANGE: Multiple payment intents for different courses
      const course2 = await storage.createCourse({
        title: 'Advanced Trading',
        description: 'Advanced course',
        price: 199.99,
        status: 'published'
      });
      
      const payments = [
        { ...mockPaymentIntent, id: 'pi_1', metadata: { ...mockPaymentIntent.metadata, productId: testCourse.id } },
        { ...mockPaymentIntent, id: 'pi_2', metadata: { ...mockPaymentIntent.metadata, productId: course2.id } }
      ];
      
      // ACT: Process concurrent payments
      const promises = payments.map(payment => 
        fetch('http://localhost:3000/api/stripe/test-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Mode': 'true'
          },
          body: JSON.stringify({
            type: 'payment_intent.succeeded',
            data: { object: payment }
          })
        })
      );
      
      const responses = await Promise.all(promises);
      
      // ASSERT: All payments processed successfully
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      // ASSERT: Both enrollments created
      const enrollments = await storage.getUserEnrollments(testUser.id);
      expect(enrollments).toHaveLength(2);
      
      console.log('✅ SUCCESS: Concurrent payments handled correctly');
    });
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUser) {
      await storage.deleteUserEnrollments(testUser.id);
    }
  });
});