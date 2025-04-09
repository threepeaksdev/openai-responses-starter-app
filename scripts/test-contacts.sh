#!/bin/bash

# Get these values from your .env.local file
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"

# Replace with a valid contact ID from your database
CONTACT_ID="your-contact-id"

# Test data
TEST_DATA='{
  "first_name": "John",
  "last_name": "Doe Updated",
  "email": "john.doe@example.com",
  "phone": "123-456-7890",
  "company": "Test Corp",
  "location": "New York",
  "relationship_status": "colleague"
}'

echo "Testing contact update..."
curl -v "${SUPABASE_URL}/functions/v1/contacts?id=${CONTACT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -X PUT \
  -d "${TEST_DATA}" 