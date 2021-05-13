/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

/*
 * dependencies
 */
import { precacheAndRoute } from 'workbox-precaching'

import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies'

import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

/*
* config
*/
precacheAndRoute(self.__WB_MANIFEST)

/*
* caching strategies
*/
registerRoute(
    // For resources unlikely to change
    // If not found in cache fetch from server
    // Useful for font files
    ({ url }) => url.pathname.startsWith('/font'),
    new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 30
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200]
            })
        ]
    })
)

registerRoute(
    // Always takes fresh data from backend skyping cached data
    // Data is then cached
    // In case of network failure, it fallbacks to cache
    ({ url }) => url.pathname.startsWith('/google.firestore'),
    new NetworkFirst()
)

registerRoute(
    // First time will cache resources
    // Next time it will take the resource from cache
    // At the same time hit the server to renew resource if changed
    // In case of lost network, this could be usefull.
    ({ url }) => url.href.startsWith('https://firebasestorage'),
    new StaleWhileRevalidate()
)
