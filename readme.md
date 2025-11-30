### welcome to my portfolio!
let me explain my freaking mess for yall
This portfolio is structured to provide an interactive, cross-device experience with a stylish "cosmic night" theme and personalized details. Here’s a full explanation of the codebase and its intentions:

---

## 1. Project Overview

This is a personal portfolio by Phan Chí Vỹ (aka Hoshimiya), designed to be both visually appealing and deeply interactive, with distinct modes for PC/Desktop and Mobile/Phone users. It even features a retro "terminal" mode!

---

## 2. Top-Level Navigation and Selection (`index.html`)

- **Device Selection:** The landing page (`index.html`) invites users to pick their preferred experience: PC/Desktop or Mobile/Phone.
- **Styling:** Uses a modern, glassmorphic style with gradients and responsive design.
- **Logic:** Clicking a card (PC or Mobile) redirects to the appropriate subfolder for that experience.

---

## 3. Desktop Experience (`PC-UI/` folder)

### a. Main Desktop UI (`pc-main.html`)

- **Navigation Bar:** Provides access to "About Me", "My Projects", and the "No GUI mode" (terminal). Includes language switcher buttons (Vietnamese, English, Japanese).
- **Profile Section:** Shows an avatar, animated typewriter introduction, and a tagline about trying new things.
- **Sections:** Includes areas like About Me, Projects, etc.

### b. Styling (`pc-layout.css`)

- **Theme:** Implements a cosmic/nightsky color palette, gradients, glassmorphism, and soft blur effects.
- **Variables:** CSS custom properties (`--bg-deep`, `--text-primary`, etc.) make the palette configurable.
- **Responsive:** Adapts layout for different devices and screen sizes.
- **Details:** Extra flair with glows, transitions, and smooth hover effects.

### c. Interactivity (`script.js`)

- **Typewriter Effect:** Animates the display of several names using a typewriter delete/insert animation.
- **Multi-language Support:** Stubs for translations in Vietnamese (`vi`), English (`en`), and Japanese (`ja`).
- **Age Calculation:** (Not shown fully above, but referenced) Can calculate and display detailed birthday/age info via JS.
- **Future Expansion:** The structure allows for easy addition of more interactive features.

---

## 4. Mobile Experience (`phone-UI/` folder)

- **Structure and Logic:** Mirrors the PC UI, but tailored for touchscreens and smaller sizes.
- **Typewriter and Interactivity:** Uses a similar `script.js` with appropriate DOM adjustments for mobile.
- **Goal:** Provides a thumb-friendly, visually similar interface on phones.

---

## 5. "No GUI" Terminal Mode (`PC-UI/pc-terminal/` folder)

### a. Terminal UI (`pc-terminal.html` + `pc-terminal-layout.css`)

- **Simulated Terminal:** Styled to look like a macOS/Linux terminal, with colored "window dots" and monospace fonts.
- **Input/Output:** User interacts by typing commands or numbers, mimicking a CLI experience.
- **Responsive:** Adapts for various screen sizes, stays centered.

### b. Terminal Logic (`pc-terminal.js`)

- **Bootup Sequence:** Mimics classic terminal loading, with a step-by-step status boot.
- **Language Support:** All boot messages and menu options are multi-lingual.
- **Menu System:** Lets users select info they want (about, projects, Discord status, "inspirational" quotes, etc.) via keyboard.
- **Easter Eggs:** Fun messages, playful menu items, and even pokes fun at user mistakes.
- **Stateful:** Keeps track of state (booting, menu, language selection) and input.

---

## 6. General Notes

- **Custom Fonts:** Uses Google Fonts for style consistency and personality (e.g., Outfit, JetBrains Mono, Playfair Display).
- **Flexible and Modular:** The same logical structure (language switching, age calculations, typing animations) applies across both PC and Mobile.
- **Expandable:** Structure allows for new modules, translations, experiences, or themes to be added with minimal disruption.
- **Fun + Functionality:** The portfolio is designed not just to inform, but to engage and entertain — blending memes, retro aesthetics, and personalized info.

---

## 7. File Overview

- `index.html` - Main entry page, lets users choose device experience.
- `PC-UI/pc-main.html`, `PC-UI/pc-layout.css`, `PC-UI/script.js` - Desktop interface, style, JS.
- `phone-UI/phone-main.html`, `phone-UI/phone-layout.css`, `phone-UI/script.js` - Mobile interface, style, JS.
- `PC-UI/pc-terminal/pc-terminal.html`, `.css`, `.js` - Terminal interface and engine.
- `img/` - (Implied) Profile pictures or decorations.
- Translations and logic prepared for further expansion.

---

## 8. How to Read/Extend

- **Add Languages:** Populate the `translations` objects in all JS files.
- **Add Sections:** Expand corresponding HTML/JS/CSS files.
- **Change Theme:** Adjust the CSS variables.
- **Add Devices:** Copy structure from PC/Mobile folders.

---

## 9. Motivation

- Showcases my skills in frontend engineering, playful UI/UX, and cross-device experiences.
- Meant to be fun, clever, welcoming, and just a bit over-engineered — like me!
- also pardon for my poor stupidity ... i completly forgot to code for mobile UI in the first place so that why you see i have a choosing screen 
---


### special note:
- feel free to explore, learn from, or take inspiration from this project — just please don’t copy it in its entirety!
