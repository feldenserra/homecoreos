import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'HomeCoreOS',
        short_name: 'HomeCoreOS',
        description: 'A personal operating system to bring rhyme and rhythm to everyday life. Grounded. Private. Yours.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1b1e',
        theme_color: '#4c6ef5',
        // TODO: Add your own icons to /public and uncomment:
        // icons: [
        //     { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        //     { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        // ],
    }
}
