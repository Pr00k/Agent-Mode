.PHONY: dev build preview tauri-dev tauri-build zip icons

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

tauri-dev:
	npm run tauri:dev

tauri-build:
	npm run tauri:build

zip:
	npm run zip

icons:
	bash scripts/icons.sh
