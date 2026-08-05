import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@views/Home.vue')
  },
  {
    path: '/game/:mode',
    name: 'game',
    component: () => import('@views/Game.vue'),
    props: true
  },
  {
    path: '/levels',
    name: 'levels',
    component: () => import('@views/Levels.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@views/Settings.vue')
  },
  {
    path: '/records',
    name: 'records',
    component: () => import('@views/Records.vue')
  },
  {
    path: '/shop',
    name: 'shop',
    component: () => import('@views/Shop.vue')
  },
  {
    path: '/collection',
    name: 'collection',
    component: () => import('@views/Collection.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
