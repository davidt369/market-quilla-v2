import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Market Quilla',
    short_name: 'Market Quilla',
    description: 'Sistema de gestión de paquetes y entregas',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/market-quilla-600px.webp',
        sizes: '192x192',
        type: 'image/webp',
      },
      {
        src: '/market-quilla-600px.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
    ],
  }
}
