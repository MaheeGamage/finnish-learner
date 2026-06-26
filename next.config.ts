import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config, { isServer, webpack }: { isServer: boolean; webpack: any }) {
    if (!isServer) {
      // @yongsk0066/voikko imports node:fs/promises, node:path, node:url
      // inside its isNode() branch. Webpack's UnhandledSchemeError fires
      // before alias resolution, so we strip the "node:" prefix first via
      // NormalModuleReplacementPlugin, then stub the bare names to false.
      // The browser path in voikko uses fetch() and never calls these.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'fs/promises': false,
        path: false,
        url: false,
      };
    }
    return config;
  },
};

export default nextConfig;
