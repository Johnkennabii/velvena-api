# Swagger Path Index.ts Spread Operator Issues - Analysis Report

## Executive Summary

**Total Directories Analyzed:** 17
**Already Fixed (Using Manual Merge):** 2
**Need Fixing (Using Spread Operator with Conflicts):** 15

---

## Directories Already Fixed

These directories are already using the manual merge pattern correctly:

1. **customer** - `/var/www/allure-api/src/docs/paths/customer`
2. **customer-note** - `/var/www/allure-api/src/docs/paths/customer-note`

---

## Directories Needing Fixes

The following 15 directories have the spread operator issue where multiple JSON files share the same path key, causing methods to be overwritten:

### 1. bucket/avatar
**Path:** `/var/www/allure-api/src/docs/paths/bucket/avatar/index.ts`

**Conflicts:**
- **Path `/avatars`** (2 files share this path):
  - `list-avatars.json` → GET
  - `upload-avatar.json` → POST

- **Path `/avatars/{id}`** (2 files share this path):
  - `get-avatar-by-id.json` → GET
  - `delete-avatar-by-id.json` → DELETE

---

### 2. bucket/dress
**Path:** `/var/www/allure-api/src/docs/paths/bucket/dress/index.ts`

**Conflicts:**
- **Path `/dress-storage`** (2 files share this path):
  - `list-dress-images.json` → GET
  - `upload-dress-images.json` → POST

---

### 3. contract
**Path:** `/var/www/allure-api/src/docs/paths/contract/index.ts`

**Conflicts:**
- **Path `/contracts`** (2 files share this path):
  - `get-contract.json` → GET
  - `create-contract.json` → POST

- **Path `/contracts/{id}`** (3 files share this path):
  - `get-contract-by-id.json` → GET
  - `update-contract.json` → PUT
  - `delete-contract-soft.json` → PATCH

---

### 4. contract-addon
**Path:** `/var/www/allure-api/src/docs/paths/contract-addon/index.ts`

**Conflicts:**
- **Path `/contract-addons`** (2 files share this path):
  - `get-contract-addons.json` → GET
  - `create-contract-addon.json` → POST

- **Path `/contract-addons/{id}`** (2 files share this path):
  - `get-contract-addon-by-id.json` → GET
  - `update-contract-addon.json` → PUT

**Note:** Missing soft/hard delete methods from the spread (they use different paths: `/contract-addons/{id}/soft` and `/contract-addons/{id}/hard`)

---

### 5. contract-package
**Path:** `/var/www/allure-api/src/docs/paths/contract-package/index.ts`

**Conflicts:**
- **Path `/contract-packages`** (2 files share this path):
  - `get-contract-packages.json` → GET
  - `create-contract-package.json` → POST

- **Path `/contract-packages/{id}`** (2 files share this path):
  - `get-contract-package-by-id.json` → GET
  - `update-contract-package.json` → PUT

**Note:** Missing soft/hard delete methods from the spread (they use different paths: `/contract-packages/{id}/soft` and `/contract-packages/{id}/hard`)

---

### 6. contract-type
**Path:** `/var/www/allure-api/src/docs/paths/contract-type/index.ts`

**Conflicts:**
- **Path `/contract-types`** (2 files share this path):
  - `get-contract-types.json` → GET
  - `create-contract-type.json` → POST

- **Path `/contract-types/{id}`** (2 files share this path):
  - `get-contract-type-by-id.json` → GET
  - `update-contract-type.json` → PUT

**Note:** Missing soft/hard delete methods from the spread (they use different paths: `/contract-types/{id}/soft` and `/contract-types/{id}/hard`)

---

### 7. dress
**Path:** `/var/www/allure-api/src/docs/paths/dress/index.ts`

**Conflicts:**
- **Path `/dresses`** (2 files share this path):
  - `get-dress.json` → GET
  - `create-dress.json` → POST

- **Path `/dresses/{id}`** (2 files share this path):
  - `get-dress-by-id.json` → GET
  - `update-dress.json` → PUT

- **Path `/dresses/{id}/images`** (2 files share this path):
  - `create-dress-image.json` → POST
  - `delete-dress-image.json` → DELETE

**Note:** Missing soft/hard delete methods from the spread (they use different paths)

---

### 8. dress-colors
**Path:** `/var/www/allure-api/src/docs/paths/dress-colors/index.ts`

**Conflicts:**
- **Path `/dress-colors`** (2 files share this path):
  - `get-dress-colors.json` → GET
  - `create-dress-color.json` → POST

- **Path `/dress-colors/{id}`** (3 files share this path):
  - `update-dress-color.json` → PUT
  - `soft-delete-dress-color.json` → PATCH
  - `hard-delete-dress-color.json` → DELETE

---

### 9. dress-conditions
**Path:** `/var/www/allure-api/src/docs/paths/dress-conditions/index.ts`

**Conflicts:**
- **Path `/dress-conditions`** (2 files share this path):
  - `get-dress-conditions.json` → GET
  - `create-dress-condition.json` → POST

- **Path `/dress-conditions/{id}`** (3 files share this path):
  - `update-dress-condition.json` → PUT
  - `soft-delete-dress-condition.json` → PATCH
  - `delete-dress-condition-hard.json` → DELETE

---

### 10. dress-size
**Path:** `/var/www/allure-api/src/docs/paths/dress-size/index.ts`

**Conflicts:**
- **Path `/dress-sizes`** (2 files share this path):
  - `get-dress-sizes.json` → GET
  - `create-dress-size.json` → POST

- **Path `/dress-sizes/{id}`** (3 files share this path):
  - `update-dress-size.json` → PUT
  - `soft-delete-dress-size.json` → PATCH
  - `delete-dress-size-hard.json` → DELETE

---

### 11. dress-type
**Path:** `/var/www/allure-api/src/docs/paths/dress-type/index.ts`

**Conflicts:**
- **Path `/dress-types`** (2 files share this path):
  - `get-dress-types.json` → GET
  - `create-dress-type.json` → POST

- **Path `/dress-types/{id}`** (3 files share this path):
  - `update-dress-type.json` → PUT
  - `soft-delete-dress-type.json` → PATCH
  - `delete-dress-type-hard.json` → DELETE

---

### 12. mail
**Path:** `/var/www/allure-api/src/docs/paths/mail/index.ts`

**Conflicts:**
- **Path `/mails/folders`** (2 files share this path):
  - `get-mail-folders.json` → GET
  - `create-mail-folder.json` → POST

---

### 13. profile
**Path:** `/var/www/allure-api/src/docs/paths/profile/index.ts`

**Conflicts:**
- **Path `/profiles`** (2 files share this path):
  - `get-profiles.json` → GET
  - `create-profile.json` → POST

---

### 14. prospect
**Path:** `/var/www/allure-api/src/docs/paths/prospect/index.ts`

**Conflicts:**
- **Path `/prospects`** (2 files share this path):
  - `get-prospects.json` → GET
  - `create-prospect.json` → POST

---

### 15. user
**Path:** `/var/www/allure-api/src/docs/paths/user/index.ts`

**Conflicts:**
- **Path `/users/{id}`** (4 files share this path):
  - `get-user-by-id.json` → GET
  - `update-user.json` → PUT
  - `soft-delete-user.json` → PATCH
  - `delete-user-hard.json` → DELETE

---

## The Problem

When using the spread operator (`...`) on multiple JSON objects that have the same path key, only the LAST one in the spread chain is retained. All previous methods are overwritten.

### Example of Current (Broken) Code:
```typescript
import getContractAddons from "./get-contract-addons.json" with { type: "json" };
import createContractAddon from "./create-contract-addon.json" with { type: "json" };

export default {
  ...getContractAddons,  // This has "/contract-addons": { get: {...} }
  ...createContractAddon, // This ALSO has "/contract-addons": { post: {...} }
                         // Result: Only POST is kept, GET is lost!
};
```

### Solution (Manual Merge by Path):
```typescript
import getContractAddons from "./get-contract-addons.json" with { type: "json" };
import createContractAddon from "./create-contract-addon.json" with { type: "json" };

export default {
  "/contract-addons": {
    ...getContractAddons["/contract-addons"],    // GET method
    ...createContractAddon["/contract-addons"],  // POST method
  },
  // ... other paths
};
```

---

## Recommended Action

For each of the 15 directories listed above, update the `index.ts` file to use manual path merging instead of top-level spread operators. Follow the pattern already used in the `customer` and `customer-note` directories.

---

## Additional Files

- **JSON Report:** `/tmp/swagger_fix_report.json` - Machine-readable report with all details
- **This Summary:** `/tmp/swagger_fix_summary.md` - Human-readable summary
