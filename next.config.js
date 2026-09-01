/** @type {import('next').NextConfig} */
const nextConfig = {
  // O núcleo é publicado em TypeScript, sem passo de build próprio. Sem isto
  // o Next recebe .tsx cru de dentro de node_modules e quebra no import.
  transpilePackages: ['valora-nucleo'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

module.exports = nextConfig
