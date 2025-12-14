-- ========================================
-- Suppression d'organisation PAR SLUG
-- ========================================
-- ⚠️ REMPLACER 'votre-slug-ici' par le slug réel
-- ========================================

DO $$
DECLARE
    org_id UUID;
    org_slug TEXT := 'votre-slug-ici'; -- ⚠️ MODIFIER ICI
    deleted_counts JSON;
BEGIN
    -- Récupérer l'ID depuis le slug
    SELECT id INTO org_id FROM "Organization" WHERE slug = org_slug AND deleted_at IS NULL;

    IF org_id IS NULL THEN
        RAISE EXCEPTION 'Organisation avec le slug "%" introuvable', org_slug;
    END IF;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Suppression de l''organisation : %', org_slug;
    RAISE NOTICE 'ID : %', org_id;
    RAISE NOTICE '===========================================';

    -- 1. ContractItem
    WITH deleted AS (
        DELETE FROM "ContractItem"
        WHERE contract_id IN (SELECT id FROM "Contract" WHERE organization_id = org_id)
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ ContractItem : % supprimés', deleted_counts;

    -- 2. Contract
    WITH deleted AS (
        DELETE FROM "Contract" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ Contract : % supprimés', deleted_counts;

    -- 3. CustomerNote
    WITH deleted AS (
        DELETE FROM "CustomerNote"
        WHERE customer_id IN (SELECT id FROM "Customer" WHERE organization_id = org_id)
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ CustomerNote : % supprimés', deleted_counts;

    -- 4. Customer
    WITH deleted AS (
        DELETE FROM "Customer" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ Customer : % supprimés', deleted_counts;

    -- 5. Prospect
    WITH deleted AS (
        DELETE FROM "Prospect" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ Prospect : % supprimés', deleted_counts;

    -- 6. Dress
    WITH deleted AS (
        DELETE FROM "Dress" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ Dress : % supprimés', deleted_counts;

    -- 7. Profile
    WITH deleted AS (
        DELETE FROM "Profile"
        WHERE user_id IN (SELECT id FROM "User" WHERE organization_id = org_id)
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ Profile : % supprimés', deleted_counts;

    -- 8. User
    WITH deleted AS (
        DELETE FROM "User" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ User : % supprimés', deleted_counts;

    -- 9. Role
    WITH deleted AS (
        DELETE FROM "Role" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ Role : % supprimés', deleted_counts;

    -- 10. ServiceType
    WITH deleted AS (
        DELETE FROM "ServiceType" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ ServiceType : % supprimés', deleted_counts;

    -- 11. PricingRule
    WITH deleted AS (
        DELETE FROM "PricingRule" WHERE organization_id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ PricingRule : % supprimés', deleted_counts;

    -- 12. Organization
    WITH deleted AS (
        DELETE FROM "Organization" WHERE id = org_id RETURNING *
    )
    SELECT COUNT(*) INTO deleted_counts FROM deleted;
    RAISE NOTICE '✅ Organization : % supprimée', deleted_counts;

    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ SUPPRESSION TERMINÉE AVEC SUCCÈS !';
    RAISE NOTICE '===========================================';
END $$;
