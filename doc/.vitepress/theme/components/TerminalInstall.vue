<template>
  <section class="terminal-wrap" aria-label="Installation command demo">
    <div class="terminal" role="img" aria-label="Terminal animation showing docker compose up -d">
      <div class="terminal-bar">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="label">minepanel-install</span>
      </div>

      <div class="terminal-body">
        <p class="line command">
          <span class="prompt">$</span>
          <span class="typed">docker compose up -d</span>
        </p>
        <p class="line output out-1">[+] Running 3/3</p>
        <p class="line output out-2"> ✔ Container minepanel-backend   Started</p>
        <p class="line output out-3"> ✔ Container minepanel-frontend  Started</p>
        <p class="line output out-4"> ✔ Container minepanel-db        Started</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.terminal-wrap {
  margin: 24px 0 10px;
}

.terminal {
  border: 3px solid rgba(53, 79, 42, 0.8);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(20, 38, 16, 0.25);
  background: #11170f;
}

.terminal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(180deg, #313f2d 0%, #1f291d 100%);
  border-bottom: 2px solid rgba(122, 166, 93, 0.4);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.red {
  background: #d66b6b;
}

.yellow {
  background: #dfc37f;
}

.green {
  background: #82c763;
}

.label {
  margin-left: 8px;
  color: #dbe8d4;
  font: 400 12px var(--minecraft-font-ui);
}

.terminal-body {
  padding: 14px 16px 16px;
  color: #e9f2e4;
  font: 400 15px/1.55 var(--vp-font-family-mono);
}

.line {
  margin: 0;
  white-space: pre-wrap;
}

.command {
  display: flex;
  align-items: center;
  gap: 10px;
}

.prompt {
  color: #7fbe5f;
  font-weight: 700;
}

.typed {
  overflow: hidden;
  white-space: nowrap;
  width: 0;
  border-right: 2px solid #a7e181;
  animation:
    typing 2.2s steps(20, end) 0.2s forwards,
    blink 0.75s step-end infinite;
}

.output {
  opacity: 0;
  transform: translateY(4px);
  animation: reveal 0.35s ease forwards;
}

.out-1 {
  margin-top: 10px;
  color: #b9dca7;
  animation-delay: 2.6s;
}

.out-2 {
  animation-delay: 2.95s;
}

.out-3 {
  animation-delay: 3.25s;
}

.out-4 {
  animation-delay: 3.55s;
}

@keyframes typing {
  to {
    width: 20ch;
  }
}

@keyframes blink {
  50% {
    border-right-color: transparent;
  }
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .terminal-body {
    font-size: 13px;
  }

  .label {
    font-size: 10px;
  }
}
</style>
