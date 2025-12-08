#!/bin/bash

# Test script for organization initialization endpoint

echo "Testing POST /api/organizations/initialize"
echo "=========================================="
echo ""

curl -X POST http://localhost:3000/api/organizations/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test Boutique",
    "slug": "test-boutique-'$(date +%s)'",
    "email": "contact@test-boutique.fr",
    "phone": "+33123456789",
    "address": "123 Rue Test",
    "city": "Paris",
    "postal_code": "75001",
    "country": "France",
    "subscription_plan": "free",
    "userEmail": "manager'$(date +%s)'@test-boutique.fr",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "Manager"
  }' | jq .

echo ""
echo "Test completed!"
