import { config as loadEnvVars } from 'dotenv';

import { MakerAppX } from '@electron-forge/maker-appx';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import type { ForgeConfig } from '@electron-forge/shared-types';
import path from 'path';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

// load env vars
loadEnvVars({ path: path.join(__dirname, '..', 'desktopProbe', '.env') });

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'packagers', 'icons', 'paper-plane'),
    appBundleId: process.env.APP_BUNDLE_ID,
    protocols: [
      {
        name: 'First 2 Apply',
        schemes: ['first2apply'],
      },
    ],
    osxSign: {},
    osxNotarize: {
      appleId: process.env.APPLE_ID ?? '',
      appleIdPassword: process.env.APPLE_PASSWORD ?? '',
      teamId: process.env.APPLE_TEAM_ID ?? '',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      authors: 'BeastX Industries',
      name: 'f2a',
      setupIcon: path.join(__dirname, 'packagers', 'icons', 'paper-plane.ico'),
    }),
    new MakerDMG({
      format: 'ULFO',
      background: path.join(__dirname, 'packagers', 'macos-dmg-background.png'),
      additionalDMGOptions: {
        window: {
          size: {
            width: 658,
            height: 498,
          },
        },
      },
    }),
    new MakerAppX({
      packageName: 'BeastXIndustries.First2Apply',
      publisher: 'CN=A2CA7EBA-28F4-4422-B08E-763EC4EEEACE',
      makeVersionWinStoreCompatible: true,
      // @ts-expect-error - Property doesn't exist on type definition but is valid
      publisherDisplayName: 'BeastX Industries',
      assets: './packagers/appx/icons',
      manifest: './packagers/appx/AppXManifest.xml',
    }),
    // new MakerRpm({}),
    new MakerDeb({
      options: {
        name: 'First 2 Apply',
        bin: 'First 2 Apply',
        icon: path.join(__dirname, 'packagers', 'icons', 'paper-plane.png'),
        mimeType: ['x-scheme-handler/first2apply'],
      },
    }),
    {
      name: '@electron-forge/maker-zip',
      config: (arch: string) => ({
        // Note that we must provide this S3 URL here
        // in order to support smooth version transitions
        // especially when using a CDN to front your updates
        macUpdateManifestBaseUrl: `https://s3.eu-central-1.amazonaws.com/first2apply.com/releases/darwin/${arch}`,
      }),
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-s3',
      config: {
        bucket: 'first2apply.com',
        region: 'eu-central-1',
        public: true,
        keyResolver: (fileName: string, platform: string, arch: string) => {
          return `releases/${platform}/${arch}/${fileName}`;
        },
      },
    },
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      devContentSecurityPolicy: `default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;`,
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
      port: 3049,
    }),
  ],
};

export default config;
