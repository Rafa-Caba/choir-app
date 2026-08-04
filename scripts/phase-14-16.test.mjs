// scripts/phase-14-16.test.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const permissions = read('src/auth/permissions.ts');
const appNavigator = read('src/navigation/AppNavigator.tsx');
const platformNavigator = read('src/navigation/PlatformNavigator.tsx');
const apiClient = read('src/api/choirApi.ts');
const cleanup = read('src/services/sessionCleanup.ts');
const choirList = read('src/screens/choir/ChoirsListScreen.tsx');
const auditTypes = read('src/types/audit.ts');
const manageUser = read('src/screens/admin/ManageUserScreen.tsx');
const platformProfile = read('src/screens/platform/PlatformProfileScreen.tsx');
const targetChoirStore = read('src/store/useTargetChoirStore.ts');

assert.match(permissions, /canManageChoirs: isSuperAdmin/u);
assert.match(permissions, /canManageUsers: isSuperAdmin \|\| isAdmin/u);
assert.match(permissions, /canManageContent: isSuperAdmin \|\| isAdmin \|\| isEditor/u);
assert.match(appNavigator, /shouldShowTenantApp/u);
assert.match(appNavigator, /return <PlatformNavigator \/>/u);
assert.match(appNavigator, /return <TabsNavigator \/>/u);
assert.match(platformNavigator, /name="ManageChoirScreen"/u);
assert.match(platformNavigator, /name="UsersListScreen"/u);
assert.match(platformNavigator, /name="AuditLogsScreen"/u);
assert.match(apiClient, /x-target-choir-id/u);
assert.match(apiClient, /x-device-id/u);
assert.match(cleanup, /useTargetChoirStore/u);
assert.match(cleanup, /useAuditLogsStore/u);
assert.match(choirList, /selectChoir\(choir\)/u);
assert.match(auditTypes, /actorUserId/u);
assert.match(auditTypes, /targetUserId/u);
assert.match(auditTypes, /timestamp/u);
assert.match(manageUser, /result\.temporaryPassword/u);
assert.match(platformProfile, /preferredChoirId/u);
assert.match(platformProfile, /completePasswordChange/u);
assert.match(targetChoirStore, /enterChoir/u);
assert.match(targetChoirStore, /returnToPlatform/u);

console.log('Phase 14-16 RN contract tests passed.');
