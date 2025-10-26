# AURALIS AUDIO ENGINE

## Overview

Web Audio Engine Pro is a high-performance, extensible audio middleware designed for modern web games. Inspired by industry standards like Wwise and FMOD, it leverages the native Web Audio API to deliver a feature-complete, hierarchical audio system without external dependencies.

Key highlights:

- Modular & Hierarchical – Virtual mixer with nested buses, customizable effects, volume/mute controls.
- Event-Driven – Logical audio events mapped to sound assets for clean game integration.
- Advanced SoundBank Management – Load and organize banks from JSON manifests or remote URLs.
- 3D Spatialization – Accurate positional audio with support for dynamic listener and emitter updates.
- Automatic Virtualization – Intelligent CPU/memory optimization for inaudible sources.
- Real-Time Parameters (RTPCs) – Drive DSP parameters via in-game variables (e.g., speed, health).
- Snapshots & States – Save and recall complex mix setups for gameplay contexts (menus, combat, cutscenes).
- Debug & Inspection – Built-in web UI for inspecting buses, events, instances, and firing test sounds.
- Integrated Playground – Live demo environment with interactive controls and Typedoc documentation.

## Architectural Components
1. AudioSystem
- Initializes the AudioContext, global volume, time, and sample-rate management.

2. SoundBankManager
- Loads, caches, and unloads banks of AudioBuffer assets defined in JSON or fetched URLs.

3. AudioEventSystem
- Registers logical events, resolves parameters, and dispatches SoundInstance playback.

4. SoundObject & SoundInstance
- Immutable definitions (SoundObject) and runtime instances (SoundInstance) with per-instance overrides.

5. AudioBus
- Hierarchical grouping of audio routes, effects chains (Biquad, Convolver, Dynamics), and mix controls.

6. AudioListener
- Manages 3D listener transforms; integrates with game engine camera or physics.

7. ParametersManager
- Maps external game variables to audio parameter automation curves.

8. SnapshotManager
- Captures and applies mixer states (volumes, effect bypass, RTPC values) on demand.

9. DebugPanel
- Browser-based UI component for real-time inspection, event triggering, and parameter tweaking.

## Tech Stack
- Language: TypeScript (strict, ESNext)
- API: Native Web Audio API (no wrappers)
- Build: Vite
- Docs: Typedoc with live code examples
- Playground: In-browser sandbox with hot-reload

## Why Auralis?
- Zero external dependencies—full control over audio behavior and performance
- Professional feature set rivaling desktop middleware, tailored for the web
- Extensible architecture for custom DSP, platform integrations, and game engines
- Comprehensive debugging and runtime tooling to speed up development

## Get Started:
1. Clone the repo
2. npm install
3. npm run dev to open the interactive playground
4. Explore src/ and Typedoc for API details

Contributions, feedback, and feature requests are welcome! Let’s build the next-generation audio engine for web games.