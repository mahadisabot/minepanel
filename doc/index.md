---
title: Minepanel - Minecraft Server Manager for Java & Bedrock
description: Free open source Minecraft server management panel for Java and Bedrock Edition. Self-hosted Docker alternative to Pterodactyl and Aternos. Manage Paper, Forge, Fabric, Spigot, Purpur, and Bedrock servers.
head:
  - - meta
    - property: og:title
      content: Minepanel - Minecraft Java & Bedrock Server Manager
  - - meta
    - property: og:description
      content: Open source web panel to manage Minecraft Java and Bedrock servers. Self-hosted, Docker-based, supports Paper/Forge/Neoforge/Fabric/Spigot/Purpur/Bedrock.
  - - meta
    - name: keywords
      content: minecraft server manager, minecraft java server, minecraft bedrock server, minecraft server panel, minecraft docker, pterodactyl alternative, aternos alternative
layout: home

hero:
  name: 'Minepanel'
  text: 'Minecraft Server Manager'
  tagline: Java & Bedrock Edition. Free, self-hosted, Docker-based. Your servers, your rules.
  image:
    src: /cubo.webp
    alt: Minepanel - Minecraft Server Manager
  actions:
    - theme: brand
      text: Get Started →
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/Ketbome/minepanel

---

<TerminalCommand
  title="quick-deploy"
  command="docker compose up -d"
  :outputs="[
    '[+] Running 3/3',
    ' ✔ Container minepanel-backend   Started',
    ' ✔ Container minepanel-frontend  Started',
    ' ✔ Container minepanel-db        Started'
  ]"
/>

## Quick Start

```bash
git clone https://github.com/Ketbome/minepanel.git
cd minepanel
docker compose up -d
```

Open http://localhost:3000 → Login: `admin` / `admin`

## Why Minepanel

<div class="home-highlights">
  <article class="home-highlight">
    <h3>Java + Bedrock in one panel</h3>
    <p>Run both editions from the same dashboard with edition-specific controls.</p>
  </article>
  <article class="home-highlight">
    <h3>Docker-first workflow</h3>
    <p>Each server is isolated, easy to restart, and simple to migrate.</p>
  </article>
  <article class="home-highlight">
    <h3>World and file management</h3>
    <p>Upload worlds, edit configs, and manage folders without leaving the UI.</p>
  </article>
  <article class="home-highlight">
    <h3>Live monitoring and logs</h3>
    <p>Track status, resources, and errors in real time while players are connected.</p>
  </article>
  <article class="home-highlight">
    <h3>Backups and restore</h3>
    <p>Schedule backups and recover quickly when testing goes wrong.</p>
  </article>
  <article class="home-highlight">
    <h3>Proxy and networking tools</h3>
    <p>Use hostname routing for Java or direct UDP ports for Bedrock servers.</p>
  </article>
</div>

## Powered By

Minepanel is built on top of amazing open source projects by [itzg](https://github.com/itzg):

- [itzg/docker-minecraft-server](https://github.com/itzg/docker-minecraft-server) — Java Edition servers
- [itzg/docker-minecraft-bedrock-server](https://github.com/itzg/docker-minecraft-bedrock-server) — Bedrock Edition servers
- [itzg/docker-mc-backup](https://github.com/itzg/docker-mc-backup) — Automatic backups
- [itzg/mc-router](https://github.com/itzg/mc-router) — Proxy routing by hostname

**Stack:** Next.js + NestJS + TypeScript + Docker

---

<p align="center">
  <a href="https://github.com/Ketbome/minepanel/stargazers"><img src="https://img.shields.io/github/stars/Ketbome/minepanel?style=social" alt="Stars"></a>
  <a href="https://hub.docker.com/r/ketbom/minepanel"><img src="https://img.shields.io/docker/pulls/ketbom/minepanel?logo=docker" alt="Docker Pulls"></a>
</p>
