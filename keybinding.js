'use strict';

import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import { gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export const KeybindingRow = GObject.registerClass(
class KeybindingRow extends Adw.ActionRow {
    _init(settings, key, title, subtitle) {
        super._init({
            title: title || _('Shortcut'),
            subtitle: subtitle || _('Click to record a new key combination'),
            activatable: true,
        });

        this.settings = settings;
        this.key = key;

        const currentAccels = this.settings.get_strv(this.key);
        const currentAccel = (currentAccels && currentAccels.length > 0) ? currentAccels[0] : '';

        // Display current keybinding
        this.label = new Gtk.ShortcutLabel({
            disabled_text: _('Disabled'),
            valign: Gtk.Align.CENTER,
            accelerator: currentAccel,
        });

        this.box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
        });
        this.box.append(this.label);

        // Reset button
        this.resetButton = new Gtk.Button({
            has_frame: false,
            valign: Gtk.Align.CENTER,
            halign: Gtk.Align.END,
            tooltip_text: _('Clear shortcut'),
            icon_name: 'edit-clear-symbolic',
        });
        this.resetButton.connect('clicked', this.resetKeybind.bind(this));
        this.box.append(this.resetButton);

        this.add_suffix(this.box);

        if (!currentAccel) {
            this.resetButton.visible = false;
        }

        this.connect('activated', this.openCaptureWindow.bind(this));

        this.label.connect('notify::accelerator', widget => {
            if (widget.accelerator) {
                this.settings.set_strv(this.key, [widget.accelerator]);
                this.resetButton.visible = true;
            } else {
                this.settings.set_strv(this.key, []);
                this.resetButton.visible = false;
            }
        });
    }

    resetKeybind() {
        this.label.accelerator = '';
        this.resetButton.visible = false;
    }

    openCaptureWindow() {
        const controller = new Gtk.EventControllerKey();

        const content = new Adw.StatusPage({
            title: this.title,
            description: _('Press any key combination\n(Press Esc to cancel, Backspace to clear)'),
            icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
        });

        this.captureWindow = new Adw.Window({
            modal: true,
            hide_on_close: true,
            transient_for: this.get_root(),
            width_request: 420,
            height_request: 280,
            content,
        });

        this.captureWindow.add_controller(controller);
        controller.connect('key-pressed', this.registerKey.bind(this));
        this.captureWindow.present();
    }

    registerKey(widget, keyval, keycode, state) {
        let mask = state & Gtk.accelerator_get_default_mod_mask();
        mask &= ~Gdk.ModifierType.LOCK_MASK;

        // Esc closes dialog
        if (!mask && keyval === Gdk.KEY_Escape) {
            this.captureWindow.close();
            return Gdk.EVENT_STOP;
        }

        // Backspace resets shortcut
        if (keyval === Gdk.KEY_BackSpace) {
            this.resetKeybind();
            this.captureWindow.close();
            return Gdk.EVENT_STOP;
        }

        if (!this.isValidBinding(mask, keycode, keyval) || !this.isValidAccel(mask, keyval)) {
            return Gdk.EVENT_STOP;
        }

        this.label.accelerator = Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask);
        this.resetButton.visible = true;
        this.captureWindow.close();
        return Gdk.EVENT_STOP;
    }

    isValidBinding(mask, keycode, keyval) {
        if (mask === 0) return false;
        if (mask === Gdk.ModifierType.SHIFT_MASK && keycode !== 0) {
            if (
                this.isKeyInRange(keyval, Gdk.KEY_A, Gdk.KEY_Z) ||
                this.isKeyInRange(keyval, Gdk.KEY_0, Gdk.KEY_9) ||
                this.isKeyInRange(keyval, Gdk.KEY_a, Gdk.KEY_z) ||
                (keyval === Gdk.KEY_space && mask === 0) ||
                this.keyvalIsForbidden(keyval)
            ) {
                return false;
            }
        }
        return true;
    }

    keyvalIsForbidden(keyval) {
        return [
            Gdk.KEY_Home,
            Gdk.KEY_Left,
            Gdk.KEY_Up,
            Gdk.KEY_Right,
            Gdk.KEY_Down,
            Gdk.KEY_Page_Up,
            Gdk.KEY_Page_Down,
            Gdk.KEY_End,
            Gdk.KEY_Tab,
            Gdk.KEY_KP_Enter,
            Gdk.KEY_Return,
            Gdk.KEY_Mode_switch,
        ].includes(keyval);
    }

    isKeyInRange(keyval, start, end) {
        return keyval >= start && keyval <= end;
    }

    isValidAccel(mask, keyval) {
        return Gtk.accelerator_valid(keyval, mask) || (keyval === Gdk.KEY_Tab && mask !== 0);
    }
});
