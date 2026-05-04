/* ──────────────────────────────────────────────────────────────────────────────
 * Vue‑Router setup for the frontend.
 *
 * 1️⃣  Route definitions – which components to render for each path.
 * 2️⃣  Navigation guard – redirects users to Login if they try to reach a
 *     protected route without a valid JWT.
 * 3️⃣  Export the router so it can be used in `main.ts`.
 * ────────────────────────────────────────────────────────────────────────────── */

import { createWebHistory, createRouter } from 'vue-router'
import { authStore } from '@/stores/auth'   // Pinia store that holds `jwt`

/* ──────────────────────────────────────────────────────────────────────────────
 * Route definitions
 * ──────────────────────────────────────────────────────────────────────────────
 *
 *   - `/`   → Login page (public)
 *   - `/notes` → Notes list (protected, requires authentication)
 * ────────────────────────────────────────────────────────────────────────────── */
const routes = [
    {
        path: '/',
        name: 'Login',
        component: () => import('../views/LoginPage.vue')
    },
    {
        path: '/notes',
        name: 'Notes',
        component: () => import('../views/NotesPage.vue'),
        meta: { requiresAuth: true }          // ← flag the route as protected
    }
]

/* ──────────────────────────────────────────────────────────────────────────────
 * Router instance
 * ────────────────────────────────────────────────────────────────────────────── */
const router = createRouter({
    history: createWebHistory(),
    routes
})

/* ──────────────────────────────────────────────────────────────────────────────
 * Global navigation guard
 *
 * Runs before every route change.
 *  - If the target route has `meta.requiresAuth` and the user has no JWT,
 *    the guard redirects to the Login page.
 *  - Otherwise the navigation proceeds normally.
 * ────────────────────────────────────────────────────────────────────────────── */
router.beforeEach((to, from, next) => {
    const auth = authStore()

    if (to.meta.requiresAuth && !auth.jwt) {
        // User is not authenticated – redirect to Login.
        next({ name: 'Login' })
    } else {
        // User is authenticated or route is public – allow navigation.
        next()
    }
})

export default router