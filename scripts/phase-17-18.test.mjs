// scripts/phase-17-18.test.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (relativePath) => fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8'
);

const appConfig = read('app.config.ts');
const easConfig = JSON.parse(read('eas.json'));
const environment = read('src/config/env.ts');
const sessionStorage = read('src/storage/secureSessionStorage.ts');
const cleanup = read('src/services/sessionCleanup.ts');
const authStore = read('src/store/useAuthStore.ts');
const appNavigator = read('src/navigation/AppNavigator.tsx');
const preflight = read('scripts/qa/phase-18-testflight-preflight.sh');
const qaGuide = read('docs/PHASE_17_18_QA.md');

assert.match(appConfig, /IOS_BUNDLE_IDENTIFIER/u);
assert.match(appConfig, /expo-notifications/u);
assert.match(appConfig, /ITSAppUsesNonExemptEncryption/u);
assert.match(appConfig, /scheme: 'choirapp'/u);
assert.equal(easConfig.build.production.environment, 'production');
assert.equal(easConfig.build.production.autoIncrement, true);
assert.equal(easConfig.build['development-simulator'].ios.simulator, true);
assert.match(environment, /EXPO_PUBLIC_API_URL is required for production builds/u);
assert.match(sessionStorage, /current: 'choir_app_secure_access_token'/u);
assert.match(sessionStorage, /SecureStore\.setItemAsync\(key\.current/u);
assert.match(sessionStorage, /choir_app_secure_access_token/u);
assert.match(cleanup, /clearTenantStorage/u);
assert.match(cleanup, /clearTenantMediaCache/u);
assert.match(authStore, /status: 'unauthenticated'/u);
assert.match(appNavigator, /status === 'checking'/u);
assert.match(preflight, /eas env:pull --environment production/u);
assert.match(preflight, /eas build --platform ios --profile production/u);
assert.match(qaGuide, /Cambio entre Coro A y Coro B sin fuga de caché/u);

console.log('Phase 17-18 RN contract tests passed.');
