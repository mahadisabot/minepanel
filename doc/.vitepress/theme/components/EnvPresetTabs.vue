<script setup>
import { computed, ref } from 'vue';

const active = ref('local');

const presets = [
  {
    key: 'local',
    label: 'Local',
    desc: 'Development on the same machine.',
    value: `JWT_SECRET=your_secret\nJWT_EXPIRES_IN=2d`,
  },
  {
    key: 'remote',
    label: 'LAN / Remote',
    desc: 'Access from other devices in your network.',
    value: `JWT_SECRET=your_secret\nJWT_EXPIRES_IN=2d\nFRONTEND_URL=http://your-ip:3000\nNEXT_PUBLIC_BACKEND_URL=http://your-ip:8091`,
  },
  {
    key: 'ssl',
    label: 'Domain + SSL',
    desc: 'Production access with HTTPS.',
    value: `JWT_SECRET=your_secret\nJWT_EXPIRES_IN=2d\nFRONTEND_URL=https://minepanel.yourdomain.com\nNEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com`,
  },
];

const current = computed(() => presets.find((preset) => preset.key === active.value) || presets[0]);
</script>

<template>
  <section class="env-tabs" aria-label="Environment presets">
    <div class="tab-list" role="tablist" aria-label="Environment preset tabs">
      <button
        v-for="preset in presets"
        :key="preset.key"
        class="tab-btn"
        :class="{ active: active === preset.key }"
        role="tab"
        :aria-selected="active === preset.key"
        :aria-controls="`env-panel-${preset.key}`"
        @click="active = preset.key"
      >
        {{ preset.label }}
      </button>
    </div>

    <p class="tab-desc">{{ current.desc }}</p>

    <Transition name="panel-fade" mode="out-in">
      <div :id="`env-panel-${current.key}`" :key="current.key" class="env-panel" role="tabpanel">
        <pre><code>{{ current.value }}</code></pre>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.env-tabs {
  margin: 20px 0 10px;
  border: 3px solid rgba(73, 95, 60, 0.45);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(250, 247, 239, 0.92), rgba(237, 231, 216, 0.95));
  overflow: hidden;
}

.dark .env-tabs {
  border-color: rgba(116, 150, 92, 0.5);
  background: linear-gradient(180deg, rgba(31, 43, 26, 0.95), rgba(24, 33, 20, 0.95));
}

.tab-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  border-bottom: 2px solid rgba(93, 118, 78, 0.3);
}

.tab-btn {
  border: 2px solid rgba(83, 113, 67, 0.5);
  border-radius: 5px;
  padding: 8px 10px;
  font: 400 10px var(--minecraft-font-ui);
  color: var(--vp-c-text-2);
  background: rgba(166, 185, 149, 0.22);
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.15s ease, color 0.15s ease;
}

.tab-btn:hover {
  transform: translateY(-1px);
}

.tab-btn.active {
  color: #f4ffe9;
  background: var(--vp-c-brand-3);
  border-color: #2c4422;
}

.tab-desc {
  margin: 0;
  padding: 10px 14px 2px;
  font-size: 14px;
}

.env-panel {
  padding: 10px 14px 14px;
}

.env-panel pre {
  margin: 0;
  border: 2px solid rgba(72, 104, 55, 0.55);
  border-radius: 6px;
  background: #121810;
  color: #e7f3df;
  padding: 12px;
  overflow-x: auto;
}

.env-panel code {
  font: 400 13px/1.6 var(--vp-font-family-mono);
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

@media (max-width: 768px) {
  .tab-btn {
    font-size: 9px;
    padding: 7px 9px;
  }
}
</style>
