-- ========================================
-- Script de suppression d'une organisation
-- et toutes ses données liées (CASCADE)
-- ========================================
--
-- ATTENTION : Cette opération est IRREVERSIBLE !
--
-- Usage dans DBeaver :
-- 1. Remplacer 'YOUR-ORG-ID-HERE' par l'ID de l'organisation à supprimer
-- 2. Exécuter le script complet (Ctrl+Enter ou F9)
--
-- Pour trouver l'ID de l'organisation :
-- SELECT id, name, slug, email FROM "Organization" WHERE slug = 'votre-slug';
--
-- ========================================

BEGIN;

-- Remplacer par l'ID de votre organisation
\set org_id 'YOUR-ORG-ID-HERE'

-- OU directement dans la requête :
DO $$
DECLARE
    org_id UUID := 'YOUR-ORG-ID-HERE'; -- ⚠️ REMPLACER ICI
BEGIN
    RAISE NOTICE 'Suppression de l''organisation %', org_id;

    -- 1. Supprimer les éléments de contrat (ContractItem)
    DELETE FROM "ContractItem"
    WHERE contract_id IN (
        SELECT id FROM "Contract" WHERE organization_id = org_id
    );
    RAISE NOTICE '✅ ContractItem supprimés';

    -- 2. Supprimer les contrats (Contract)
    DELETE FROM "Contract"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ Contract supprimés';

    -- 3. Supprimer les notes clients (CustomerNote)
    DELETE FROM "CustomerNote"
    WHERE customer_id IN (
        SELECT id FROM "Customer" WHERE organization_id = org_id
    );
    RAISE NOTICE '✅ CustomerNote supprimés';

    -- 4. Supprimer les clients (Customer)
    DELETE FROM "Customer"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ Customer supprimés';

    -- 5. Supprimer les prospects (Prospect)
    DELETE FROM "Prospect"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ Prospect supprimés';

    -- 6. Supprimer les robes (Dress)
    DELETE FROM "Dress"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ Dress supprimés';

    -- 7. Supprimer les profils utilisateurs (Profile)
    DELETE FROM "Profile"
    WHERE user_id IN (
        SELECT id FROM "User" WHERE organization_id = org_id
    );
    RAISE NOTICE '✅ Profile supprimés';

    -- 8. Supprimer les utilisateurs (User)
    DELETE FROM "User"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ User supprimés';

    -- 9. Supprimer les rôles de l'organisation (Role)
    DELETE FROM "Role"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ Role supprimés';

    -- 10. Supprimer les types de service (ServiceType) - si liés à l'organisation
    DELETE FROM "ServiceType"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ ServiceType supprimés';

    -- 11. Supprimer les règles de tarification (PricingRule) - si liées à l'organisation
    DELETE FROM "PricingRule"
    WHERE organization_id = org_id;
    RAISE NOTICE '✅ PricingRule supprimés';

    -- 12. ENFIN, supprimer l'organisation (Organization)
    DELETE FROM "Organization"
    WHERE id = org_id;
    RAISE NOTICE '✅ Organization supprimée';

    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Suppression terminée avec succès !';
    RAISE NOTICE '====================================';
END $$;

COMMIT;

-- ========================================
-- Alternative : Suppression par SLUG
-- ========================================
/*
DO $$
DECLARE
    org_id UUID;
    org_slug TEXT := 'votre-slug-ici'; -- ⚠️ REMPLACER ICI
BEGIN
    -- Récupérer l'ID depuis le slug
    SELECT id INTO org_id FROM "Organization" WHERE slug = org_slug;

    IF org_id IS NULL THEN
        RAISE EXCEPTION 'Organisation avec le slug "%" introuvable', org_slug;
    END IF;

    RAISE NOTICE 'Suppression de l''organisation : % (ID: %)', org_slug, org_id;

    -- Même logique de suppression que ci-dessus
    DELETE FROM "ContractItem" WHERE contract_id IN (SELECT id FROM "Contract" WHERE organization_id = org_id);
    DELETE FROM "Contract" WHERE organization_id = org_id;
    DELETE FROM "CustomerNote" WHERE customer_id IN (SELECT id FROM "Customer" WHERE organization_id = org_id);
    DELETE FROM "Customer" WHERE organization_id = org_id;
    DELETE FROM "Prospect" WHERE organization_id = org_id;
    DELETE FROM "Dress" WHERE organization_id = org_id;
    DELETE FROM "Profile" WHERE user_id IN (SELECT id FROM "User" WHERE organization_id = org_id);
    DELETE FROM "User" WHERE organization_id = org_id;
    DELETE FROM "Role" WHERE organization_id = org_id;
    DELETE FROM "ServiceType" WHERE organization_id = org_id;
    DELETE FROM "PricingRule" WHERE organization_id = org_id;
    DELETE FROM "Organization" WHERE id = org_id;

    RAISE NOTICE '✅ Organisation supprimée avec succès !';
END $$;
*/

-- ========================================
-- Vérification après suppression
-- ========================================
/*
SELECT
    'Organization' as table_name, COUNT(*) as count FROM "Organization" WHERE id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'User', COUNT(*) FROM "User" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Dress', COUNT(*) FROM "Dress" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Customer', COUNT(*) FROM "Customer" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Prospect', COUNT(*) FROM "Prospect" WHERE organization_id = 'YOUR-ORG-ID-HERE'
UNION ALL
SELECT 'Contract', COUNT(*) FROM "Contract" WHERE organization_id = 'YOUR-ORG-ID-HERE';
*/
