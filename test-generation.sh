#!/bin/bash

# Test Script for Image Generation System
# This script tests the new generation endpoints

echo "🧪 Testing Image Generation System"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-https://kusomakids.com}"
echo "📍 Base URL: $BASE_URL"
echo ""

# Test 1: Check if endpoints are accessible (will redirect if not authenticated)
echo "Test 1: Checking endpoint accessibility..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/generation-status")
echo "Status endpoint returned: $STATUS_CODE"

if [ "$STATUS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Endpoint accessible${NC}"
elif [ "$STATUS_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠ Authentication required (expected for production)${NC}"
elif [ "$STATUS_CODE" = "302" ] || [ "$STATUS_CODE" = "307" ]; then
    echo -e "${YELLOW}⚠ Redirecting (likely to login)${NC}"
else
    echo -e "${RED}✗ Unexpected status code${NC}"
fi

echo ""
echo "📝 Next Steps:"
echo "1. Run the SQL migration in Supabase"
echo "2. Use the browser console to test (you'll be authenticated)"
echo "3. Or provide a session token for curl testing"
echo ""
echo "Browser Console Test:"
echo "====================="
cat << 'EOF'
// Copy this into your browser console while logged into kusomakids.com

// Test 1: Check generation status
fetch('/api/admin/generation-status')
  .then(r => r.json())
  .then(data => {
    console.log('📊 Generation Status:', data);
    if (data.books && data.books.length > 0) {
      console.log(`Found ${data.books.length} books`);
      console.log('Stats:', data.stats);
      
      // Find a book to test with
      const testBook = data.books[0];
      console.log('Test book:', testBook.id, testBook.title);
      
      // Test 2: Trigger generation for first book
      return fetch('/api/admin/trigger-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: testBook.id })
      });
    }
  })
  .then(r => r ? r.json() : null)
  .then(data => {
    if (data) {
      console.log('🚀 Generation triggered:', data);
    }
  })
  .catch(err => console.error('❌ Error:', err));
EOF
