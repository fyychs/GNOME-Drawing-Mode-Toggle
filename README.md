# GNOME Drawing Mode Toggle

A GNOME Shell extension that adds a **Drawing Mode** toggle to the Quick Settings menu and top panel.

I built this for use with a browser-based drawing app. In browsers and therefore also electron-based apps, using a stylus causes the standard system cursor to appear on touch. This is annoying, so I wanted a solution until the upstream bug ([Chromium Issue #40236040](https://issues.chromium.org/issues/40236040) / [Electron #39438](https://github.com/electron/electron/issues/39438)) is fixed. 

![GNOME 45+](https://img.shields.io/badge/GNOME-45%20--%2051-blue)
![Wayland](https://img.shields.io/badge/Compositor-Wayland%20%7C%20X11-success)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Native Quick Settings Tile**: Clean toggle button in the GNOME Quick Settings menu.
- **Top Bar Status Indicator**: Visual tablet icon in the status bar indicating when Drawing Mode is active.
- **Global Keyboard Shortcut**: Toggle on/off instantly via `<Ctrl><Alt>d`.
- **Bundled Transparent Cursor**: Also installs a transparent cursor theme.

---

## Installation

### Quick Install

```bash
git clone https://github.com/fyychs/GNOME-Drawing-Mode-Toggle.git
cd GNOME-Drawing-Mode-Toggle
./install.sh
```

### Manual Install

1. Compile schemas:
   ```bash
   glib-compile-schemas schemas/
   ```
2. Copy files to extension directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/drawing-mode-toggle@fyychs.github.com
   cp -r * ~/.local/share/gnome-shell/extensions/drawing-mode-toggle@fyychs.github.com/
   ```
3. Enable extension:
   ```bash
   gnome-extensions enable drawing-mode-toggle@fyychs.github.com
   ```

---

## Usage

- **Click**: Open the Quick Settings menu (top right) and click **Drawing Mode**.
- **Shortcut**: Press `Ctrl+Alt+D` anytime to toggle (customizable).

---

## Configuration

You can customize the keyboard shortcut and indicator behavior in two ways:

### 1. Graphical Interface (Extension Manager / GNOME Extensions)
1. Open **Extension Manager** or the **GNOME Extensions** app.
2. Click the **Settings (gear icon)** next to **Drawing Mode Toggle**.
3. Click on the **Toggle Drawing Mode** shortcut row.
4. Press your desired key combination (e.g. `Ctrl+Alt+D`, `Super+Alt+D`, or `F10`), or press `Backspace` to disable.

### 2. Command Line (gsettings)
You can also view and change settings directly from the terminal or scripts:

```bash
# Set a custom keyboard shortcut:
gsettings set org.gnome.shell.extensions.drawing-mode-toggle toggle-shortcut "['<Control><Alt>d']"

# View current shortcut:
gsettings get org.gnome.shell.extensions.drawing-mode-toggle toggle-shortcut

# Toggle top-bar status indicator on or off:
gsettings set org.gnome.shell.extensions.drawing-mode-toggle show-indicator true
```

---

## Uninstall

```bash
./install.sh --uninstall
```
