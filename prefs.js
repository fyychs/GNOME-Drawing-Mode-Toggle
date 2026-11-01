import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { KeybindingRow } from './keybinding.js';

export default class DrawingModePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'input-tablet-symbolic',
        });
        window.add(page);

        // General settings
        const generalGroup = new Adw.PreferencesGroup({
            title: _('General Settings'),
            description: _('Configure drawing mode indicators and panel behavior'),
        });
        page.add(generalGroup);

        const indicatorRow = new Adw.SwitchRow({
            title: _('Show Top Bar Status Indicator'),
            subtitle: _('Displays a tablet icon in the status bar when drawing mode is active'),
        });
        generalGroup.add(indicatorRow);
        settings.bind('show-indicator', indicatorRow, 'active', Gio.SettingsBindFlags.DEFAULT);

        // Shortcut settings
        const shortcutGroup = new Adw.PreferencesGroup({
            title: _('Keyboard Shortcut'),
            description: _('Click the row below to record a new key combination'),
        });
        page.add(shortcutGroup);

        const shortcutRow = new KeybindingRow(
            settings,
            'toggle-shortcut',
            _('Toggle Drawing Mode'),
            _('Press to record key combination (Default: Ctrl + Alt + D)')
        );
        shortcutGroup.add(shortcutRow);

        // Information group
        const aboutGroup = new Adw.PreferencesGroup({
            title: _('About'),
        });
        page.add(aboutGroup);

        const infoRow = new Adw.ActionRow({
            title: _('GNOME Drawing Mode Toggle'),
            subtitle: _('https://github.com/fyychs/GNOME-Drawing-Mode-Toggle'),
        });
        aboutGroup.add(infoRow);
    }
}
