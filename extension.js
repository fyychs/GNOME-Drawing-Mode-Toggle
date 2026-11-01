import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import { QuickToggle, SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';

const DESKTOP_INTERFACE_SCHEMA = 'org.gnome.desktop.interface';
const CURSOR_THEME_KEY = 'cursor-theme';
const TRANSPARENT_THEME = 'transparent';
const DEFAULT_FALLBACK_THEME = 'Adwaita';

function showCustomOSD(iconName, message) {
    try {
        const icon = Gio.Icon.new_for_string(iconName);
        const osd = Main.osdWindowManager;
        if (!osd) return;

        if (typeof osd.showAll === 'function') {
            osd.showAll(icon, message, null);
        } else if (typeof osd.showOne === 'function') {
            osd.showOne(0, icon, message, null);
        } else if (typeof osd.show === 'function') {
            osd.show(0, icon, message, null);
        }
    } catch {
        // Fallback gracefully if OSD display is unsupported
    }
}

const DrawingModeToggle = GObject.registerClass(
class DrawingModeToggle extends QuickToggle {
    _init() {
        super._init({
            title: _('Drawing Mode'),
            iconName: 'input-tablet-symbolic',
            toggleMode: true,
        });
    }
});

const DrawingModeIndicator = GObject.registerClass(
class DrawingModeIndicator extends SystemIndicator {
    _init(extension, extSettings) {
        super._init();
        this._extension = extension;
        this._extSettings = extSettings;
        this._interfaceSettings = new Gio.Settings({ schema: DESKTOP_INTERFACE_SCHEMA });

        // Ensure transparent cursor theme is in the user's icon path
        this._ensureCursorThemeInstalled();

        // Initialize previous-cursor-theme with the active system theme if not already transparent
        const initialTheme = this._interfaceSettings.get_string(CURSOR_THEME_KEY);
        if (initialTheme && initialTheme !== TRANSPARENT_THEME) {
            this._extSettings?.set_string('previous-cursor-theme', initialTheme);
        }

        // 1. Top bar indicator icon (visible when drawing mode is active)
        this._indicator = this._addIndicator();
        this._indicator.iconName = 'input-tablet-symbolic';

        // 2. Quick Settings toggle tile
        this._toggle = new DrawingModeToggle();
        this.quickSettingsItems.push(this._toggle);

        // Click handler for Quick Settings toggle
        this._toggleClickedId = this._toggle.connect('clicked', () => {
            this.toggle();
        });

        // Watch for external cursor-theme changes (e.g. user changing theme in GNOME Settings)
        this._settingsChangedId = this._interfaceSettings.connect(
            `changed::${CURSOR_THEME_KEY}`,
            () => {
                this._syncState();
            }
        );

        // Watch for show-indicator preference change
        this._extSettingsChangedId = this._extSettings?.connect(
            'changed::show-indicator',
            () => {
                this._syncState();
            }
        );

        this._syncState();
    }

    _getSystemDefaultTheme() {
        try {
            const def = this._interfaceSettings.get_default_value(CURSOR_THEME_KEY);
            const val = def ? def.unpack() : null;
            if (val && val !== TRANSPARENT_THEME) {
                return val;
            }
        } catch {}
        return DEFAULT_FALLBACK_THEME;
    }

    _getValidPreviousTheme() {
        const saved = this._extSettings?.get_string('previous-cursor-theme');
        if (saved && saved !== TRANSPARENT_THEME) {
            return saved;
        }
        return this._getSystemDefaultTheme();
    }

    _ensureCursorThemeInstalled() {
        const homeDir = GLib.get_home_dir();
        const targetDir = GLib.build_filenamev([homeDir, '.local', 'share', 'icons', 'transparent']);
        const oldIconsDir = GLib.build_filenamev([homeDir, '.icons', 'transparent']);

        if (GLib.file_test(targetDir, GLib.FileTest.IS_DIR) || GLib.file_test(oldIconsDir, GLib.FileTest.IS_DIR)) {
            return;
        }

        try {
            const bundledThemeDir = GLib.build_filenamev([this._extension.path, 'icons', 'transparent']);
            if (GLib.file_test(bundledThemeDir, GLib.FileTest.IS_DIR)) {
                GLib.mkdir_with_parents(GLib.build_filenamev([homeDir, '.local', 'share', 'icons']), 0o755);
                const srcFile = Gio.File.new_for_path(bundledThemeDir);
                const destFile = Gio.File.new_for_path(targetDir);
                this._copyDir(srcFile, destFile);
            }
        } catch (e) {
            console.warn(`[DrawingModeToggle] Could not copy transparent theme: ${e.message}`);
        }
    }

    _copyDir(src, dest) {
        dest.make_directory_with_parents(null);
        const enumerator = src.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
        let info;
        while ((info = enumerator.next_file(null)) !== null) {
            const childSrc = src.get_child(info.get_name());
            const childDest = dest.get_child(info.get_name());
            if (info.get_file_type() === Gio.FileType.DIRECTORY) {
                this._copyDir(childSrc, childDest);
            } else {
                childSrc.copy(childDest, Gio.FileCopyFlags.OVERWRITE, null, null);
            }
        }
    }

    toggle() {
        const currentTheme = this._interfaceSettings.get_string(CURSOR_THEME_KEY);
        const isCurrentlyTransparent = (currentTheme === TRANSPARENT_THEME);

        if (isCurrentlyTransparent) {
            // Restore user's actual cursor theme (without hardcoding Adwaita)
            const restoreTheme = this._getValidPreviousTheme();
            this._interfaceSettings.set_string(CURSOR_THEME_KEY, restoreTheme);
            showCustomOSD('input-mouse-symbolic', _('Drawing Mode: Inactive (Cursor Visible)'));
        } else {
            // Save current theme dynamically before switching to transparent
            if (currentTheme && currentTheme !== TRANSPARENT_THEME) {
                this._extSettings?.set_string('previous-cursor-theme', currentTheme);
            }
            this._interfaceSettings.set_string(CURSOR_THEME_KEY, TRANSPARENT_THEME);
            showCustomOSD('input-tablet-symbolic', _('Drawing Mode: Active (Cursor Hidden)'));
        }
    }

    _syncState() {
        const currentTheme = this._interfaceSettings.get_string(CURSOR_THEME_KEY);
        const isDrawingMode = (currentTheme === TRANSPARENT_THEME);

        if (!isDrawingMode && currentTheme && currentTheme !== TRANSPARENT_THEME) {
            // Keep previous-cursor-theme in sync whenever the user changes cursor pack in GNOME settings
            this._extSettings?.set_string('previous-cursor-theme', currentTheme);
        }

        if (this._toggle.checked !== isDrawingMode) {
            this._toggle.checked = isDrawingMode;
        }

        const showIndicator = this._extSettings ? this._extSettings.get_boolean('show-indicator') : true;
        this._indicator.visible = isDrawingMode && showIndicator;

        if (isDrawingMode) {
            this._toggle.subtitle = _('Cursor Hidden');
        } else {
            this._toggle.subtitle = _('Cursor Visible');
        }
    }

    destroy() {
        if (this._settingsChangedId) {
            this._interfaceSettings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        if (this._extSettingsChangedId) {
            this._extSettings.disconnect(this._extSettingsChangedId);
            this._extSettingsChangedId = null;
        }
        if (this._toggleClickedId) {
            this._toggle.disconnect(this._toggleClickedId);
            this._toggleClickedId = null;
        }
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

export default class DrawingModeExtension extends Extension {
    enable() {
        this._extSettings = this.getSettings();
        this._indicator = new DrawingModeIndicator(this, this._extSettings);

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        // Register global keyboard shortcut (<Control><Alt>d by default)
        Main.wm.addKeybinding(
            'toggle-shortcut',
            this._extSettings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            () => {
                this._indicator?.toggle();
            }
        );
    }

    disable() {
        Main.wm.removeKeybinding('toggle-shortcut');

        // Safety: If cursor is currently transparent when disabling, restore normal cursor theme
        try {
            const interfaceSettings = new Gio.Settings({ schema: DESKTOP_INTERFACE_SCHEMA });
            if (interfaceSettings.get_string(CURSOR_THEME_KEY) === TRANSPARENT_THEME) {
                const restoreTheme = this._indicator?._getValidPreviousTheme() || 'Adwaita';
                interfaceSettings.set_string(CURSOR_THEME_KEY, restoreTheme);
            }
        } catch {}

        this._indicator?.destroy();
        this._indicator = null;
        this._extSettings = null;
    }
}
