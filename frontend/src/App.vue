<script setup>
import { onMounted, ref } from 'vue'

import ActionHeader from './components/ActionsHeader.vue'
import {
  captureThemeVariantApplied,
  onThemeVariantLoaded,
} from '@/utils/posthog'

const themeVariant = ref('light')

onMounted(() => {
  onThemeVariantLoaded((variant) => {
    themeVariant.value = variant
    captureThemeVariantApplied(variant)
  })
})
</script>

<template>
  <div
    class="app-shell"
    :class="`theme-${themeVariant}`"
    :data-theme="themeVariant"
  >
    <header>
      <ActionHeader/>
    </header>

    <main>
      <router-view/>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--app-background);
  color: var(--app-text);

  --app-background: #f4f6f8;
  --app-surface: #ffffff;
  --app-text: #1f2933;
  --app-muted-text: #52606d;
  --app-accent: #18776f;
  --app-border: #cbd5df;
}

.app-shell.theme-dark {
  --app-background: #323232;
  --app-surface: #222222;
  --app-text: #ffffff;
  --app-muted-text: #c0c0c0;
  --app-accent: #31b1a4;
  --app-border: #ffffff;
}

header {
  line-height: 1.5;
}

main {
  background: var(--app-background);
  color: var(--app-text);
}

@media (min-width: 1024px) {
  header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 75px;
    justify-content: center;
  }

  main {
    position: absolute;
    top: 75px;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--app-background);
    color: var(--app-text);
  }
}
</style>