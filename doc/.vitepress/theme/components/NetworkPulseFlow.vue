<template>
  <section class="network-flow" aria-label="HTTPS request flow">
    <div class="canvas">
      <div class="node user">User</div>
      <div class="node proxy">Proxy / SSL</div>
      <div class="node frontend">Frontend :3000</div>
      <div class="node backend">Backend :8091</div>

      <div class="link l1"><span class="pulse"></span></div>
      <div class="link l2"><span class="pulse"></span></div>
      <div class="link l3"><span class="pulse"></span></div>
    </div>
  </section>
</template>

<style scoped>
.network-flow {
  margin: 14px 0 18px;
}

.canvas {
  position: relative;
  border: 3px solid rgba(73, 95, 60, 0.5);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(248, 244, 233, 0.95), rgba(234, 227, 209, 0.96));
  min-height: 250px;
  overflow: hidden;
}

.dark .canvas {
  border-color: rgba(116, 150, 92, 0.52);
  background: linear-gradient(180deg, rgba(28, 39, 24, 0.96), rgba(21, 30, 18, 0.96));
}

.node {
  position: absolute;
  z-index: 2;
  border: 2px solid rgba(56, 82, 45, 0.7);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.6);
  padding: 10px 12px;
  font: 400 10px var(--minecraft-font-ui);
  color: var(--vp-c-text-1);
}

.dark .node {
  background: rgba(36, 48, 31, 0.9);
  border-color: rgba(126, 166, 100, 0.5);
}

.user {
  left: 8%;
  top: 50%;
  transform: translateY(-50%);
}

.proxy {
  left: 36%;
  top: 50%;
  transform: translateY(-50%);
}

.frontend {
  right: 9%;
  top: 30%;
}

.backend {
  right: 9%;
  bottom: 30%;
}

.link {
  position: absolute;
  z-index: 1;
  height: 4px;
  background: rgba(103, 143, 79, 0.45);
  border-radius: 999px;
  overflow: hidden;
}

.l1 {
  left: 20%;
  top: 50%;
  width: 17%;
  transform: translateY(-50%);
}

.l2 {
  left: 50%;
  top: 35%;
  width: 34%;
}

.l3 {
  left: 50%;
  bottom: 35%;
  width: 34%;
}

.pulse {
  position: absolute;
  inset: 0 auto 0 -20%;
  width: 20%;
  background: linear-gradient(90deg, rgba(155, 220, 120, 0), rgba(155, 220, 120, 0.95));
  animation: move 2.2s linear infinite;
}

.l2 .pulse,
.l3 .pulse {
  animation-delay: 0.35s;
}

@keyframes move {
  to {
    left: 100%;
  }
}

@media (max-width: 900px) {
  .canvas {
    min-height: 320px;
  }

  .user,
  .proxy,
  .frontend,
  .backend {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  .user {
    top: 14%;
  }

  .proxy {
    top: 38%;
  }

  .frontend {
    top: 64%;
  }

  .backend {
    top: 84%;
  }

  .link {
    width: 4px;
    height: 42px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(103, 143, 79, 0.5);
  }

  .l1 {
    top: 22%;
  }

  .l2 {
    top: 47%;
  }

  .l3 {
    top: 70%;
    bottom: auto;
  }

  .pulse {
    inset: -20% 0 auto 0;
    width: 100%;
    height: 20%;
    background: linear-gradient(180deg, rgba(155, 220, 120, 0), rgba(155, 220, 120, 0.95));
    animation-name: move-vertical;
  }

  @keyframes move-vertical {
    to {
      top: 100%;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .pulse {
    animation: none;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.45;
  }
}
</style>
