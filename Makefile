UUID = drawing-mode-toggle@fyychs.github.com
BUILD_DIR = build
SCHEMA_DIR = schemas

all: compile-schemas

compile-schemas:
	glib-compile-schemas $(SCHEMA_DIR)

install: compile-schemas
	./install.sh

uninstall:
	./install.sh --uninstall

pack: compile-schemas
	gnome-extensions pack --force --extra-source=icons/ --extra-source=stylesheet.css --extra-source=prefs.js --extra-source=keybinding.js --schema=$(SCHEMA_DIR)/org.gnome.shell.extensions.drawing-mode-toggle.gschema.xml .

clean:
	rm -f $(SCHEMA_DIR)/gschemas.compiled
	rm -f *.shell-extension.zip
