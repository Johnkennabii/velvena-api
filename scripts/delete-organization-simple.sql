-- ========================================
-- Suppression d'organisation (VERSION SIMPLE)
-- ========================================
-- ⚠️ REMPLACER 'YOUR-ORG-ID-HERE' par l'ID réel
-- ========================================

-- Pour trouver l'ID :
-- SELECT id, name, slug, email FROM "Organization" WHERE slug = 'votre-slug';

BEGIN;

-- 1. ContractItem
DELETE FROM "ContractItem"
WHERE contract_id IN (
    SELECT id FROM "Contract" WHERE organization_id = 'YOUR-ORG-ID-HERE'
);

-- 2. Contract
DELETE FROM "Contract"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 3. CustomerNote
DELETE FROM "CustomerNote"
WHERE customer_id IN (
    SELECT id FROM "Customer" WHERE organization_id = 'YOUR-ORG-ID-HERE'
);

-- 4. Customer
DELETE FROM "Customer"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 5. Prospect
DELETE FROM "Prospect"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 6. Dress
DELETE FROM "Dress"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 7. Profile
DELETE FROM "Profile"
WHERE user_id IN (
    SELECT id FROM "User" WHERE organization_id = 'YOUR-ORG-ID-HERE'
);

-- 8. User
DELETE FROM "User"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 9. Role
DELETE FROM "Role"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 10. ServiceType
DELETE FROM "ServiceType"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 11. PricingRule
DELETE FROM "PricingRule"
WHERE organization_id = 'YOUR-ORG-ID-HERE';

-- 12. Organization (ENFIN)
DELETE FROM "Organization"
WHERE id = 'YOUR-ORG-ID-HERE';

COMMIT;

-- Vérification (toutes les requêtes doivent retourner 0)
SELECT 'User' as table_name, COUNT(*) as remaining FROM "User" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Dress', COUNT(*) FROM "Dress" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Customer', COUNT(*) FROM "Customer" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Contract', COUNT(*) FROM "Contract" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Organization', COUNT(*) FROM "Organization" WHERE id = 'YOUR-ORG-ID-HERE';
