#!/usr/bin/env bash
set -euo pipefail

UUID="drawing-mode-toggle@fyychs.github.com"
INSTALL_DIR="${HOME}/.local/share/gnome-shell/extensions/${UUID}"
ICONS_DIR="${HOME}/.local/share/icons/transparent"
LEGACY_ICONS_DIR="${HOME}/.icons/transparent"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " GNOME Drawing Mode Toggle — Installer"
echo "=========================================================="

if [[ "${1:-}" == "--uninstall" ]]; then
    echo "Disabling and removing ${UUID}..."
    if command -v gnome-extensions &>/dev/null; then
        gnome-extensions disable "${UUID}" 2>/dev/null || true
    fi
    rm -rf "${INSTALL_DIR}"
    echo "✓ Successfully uninstalled Drawing Mode Toggle extension."
    exit 0
fi

# 1. Compile GSettings schemas
if [ -d "${SCRIPT_DIR}/schemas" ]; then
    echo "Compiling GSettings schemas..."
    glib-compile-schemas "${SCRIPT_DIR}/schemas"
fi

# 2. Install transparent cursor theme if needed
if [ ! -d "${ICONS_DIR}" ] && [ ! -d "${LEGACY_ICONS_DIR}" ]; then
    echo "Installing transparent cursor theme to ${ICONS_DIR}..."
    mkdir -p "${HOME}/.local/share/icons"
    cp -r "${SCRIPT_DIR}/icons/transparent" "${ICONS_DIR}"
fi

# 3. Copy extension files to GNOME user extensions dir
echo "Installing extension files to ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}"
cp "${SCRIPT_DIR}/extension.js" "${INSTALL_DIR}/"
cp "${SCRIPT_DIR}/metadata.json" "${INSTALL_DIR}/"
[ -f "${SCRIPT_DIR}/prefs.js" ] && cp "${SCRIPT_DIR}/prefs.js" "${INSTALL_DIR}/"
[ -f "${SCRIPT_DIR}/keybinding.js" ] && cp "${SCRIPT_DIR}/keybinding.js" "${INSTALL_DIR}/"
[ -f "${SCRIPT_DIR}/stylesheet.css" ] && cp "${SCRIPT_DIR}/stylesheet.css" "${INSTALL_DIR}/"

if [ -d "${SCRIPT_DIR}/schemas" ]; then
    mkdir -p "${INSTALL_DIR}/schemas"
    cp "${SCRIPT_DIR}/schemas/"* "${INSTALL_DIR}/schemas/"
fi

if [ -d "${SCRIPT_DIR}/icons" ]; then
    mkdir -p "${INSTALL_DIR}/icons"
    cp -r "${SCRIPT_DIR}/icons" "${INSTALL_DIR}/"
fi

echo "Extension files installed."

# 4. Enable extension via gnome-extensions CLI
if command -v gnome-extensions &>/dev/null; then
    echo "Enabling extension in GNOME Shell..."
    gnome-extensions disable "${UUID}" 2>/dev/null || true
    gnome-extensions enable "${UUID}" || true
    echo "Extension enabled: ${UUID}"
fi

echo ""
echo "Installation complete."
echo "Quick Settings: Drawing Mode toggle"
echo "Default shortcut: Ctrl+Alt+D"
