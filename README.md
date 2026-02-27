# The Holy Grail (Diablo II: Resurrected - Reign of the Warlock)

Fork of [pyrosplat/TheHolyGrail](https://github.com/pyrosplat/TheHolyGrail) with additional support for **Reign of the Warlock (RotW)** and quality-of-life improvements.

This desktop app scans your Diablo II: Resurrected offline save files and tracks your **Holy Grail** progress.
Built with **Electron**, **React**, and **TypeScript**.

Also check out [TheHolyGrail Public Tracker](https://github.com/pyrosplat/TheHolyGrail-Public-Tracker) (web app integration project).

<p align="center">
  <img src="docs/images/app-hero.png" alt="Holy Grail App Overview" width="900" />
</p>

## What's New In This Fork

### RotW Support
- Adds support for the new **Warlock** character.
- Support for all new RotW uniques, sets, runewords, and charms (optional with a toggle).
- Adds basic **shared stash** parsing for RotW:
  - Reads all 5 shared stash pages.
  - Reads rune presence from the runes tab (presence, but not quantity).

### New Features
- Recent finds accordion on the app home screen.
- Added an Item Browser that lets you view every owned item and inspect full stats right inside the app, including exactly which character is holding each one.
   - While inspecting an item, click any character name to instantly preview that character’s version and compare specs.
   - Finding your best roll of an item now takes seconds !

  <img src="docs/images/item-hero.png" alt="Holy Grail Item Browser" width="350" />

### Current Limitations
- Rune quantities are not decoded in shared stash (presence only).

## Core Features of [pyrosplat/TheHolyGrail](https://github.com/pyrosplat/TheHolyGrail)

- Include **Sunder charms** in grail tracking.
- Optional **persistent found items** mode:
  - Enable in **Settings -> Persist found on drop**.
  - Lets you count items found historically, even if no longer stored.
- **Previously found** indicators for history-counted items.
- Ability to clear persistent history with confirmation.
- Display live grail progress over the game window without alt-tabbing.
  - Compact, high-contrast design.
  - Adjustable size in settings.
  - Optional recent finds list.
- **Sound notifications** for newly found items:
  - Audio alerts can be configured for newly found items.
  - Volume control
  - Custom sound file support (`.wav`, `.mp3`, `.ogg`)
- Theme and font customization options.

## Getting Started

### 
```bash
yarn install    # Install
yarn start      # Run (development)
yarn package    # Package app
yarn build      # package + build-win
yarn build-win  # build win installer
```

## License

[ISC](https://choosealicense.com/licenses/isc/)
