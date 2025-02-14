import path from 'path';
import { fileURLToPath } from 'url';
import { withPayload } from '@payloadcms/next/withPayload';
import { composePlugins, withNx } from '@nx/next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    reactCompiler: false,
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withPayload,
];

export default composePlugins(...plugins)(nextConfig);
