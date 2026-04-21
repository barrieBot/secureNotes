import {createWebHistory, createRouter} from 'vue-router'
import { authStore } from '@/stores/auth'


const routes = [{
    path: '/',
    name: 'Login',
    component: () => import('../views/LoginPage.vue')
},{
    path: '/notes',
    name: 'Notes',
    component: () => import('../views/NotesPage.vue'),
    /*meta: { requiresAuth: true }*/
}]


const router = createRouter({
    history: createWebHistory(),
    routes,
})


router.beforeEach((to, from, next) => {
    const auth = authStore()
    if(to.meta.requiresAuth && !auth.jwt) {
        next({name: 'Login'})
    } else {
        next()
    }
})


export default router