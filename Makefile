.PHONY: install dev build preview lint test storybook build-storybook clean

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

preview:
	pnpm preview

lint:
	pnpm lint

test:
	pnpm test

storybook:
	pnpm storybook

build-storybook:
	pnpm build-storybook

clean:
	rm -rf dist storybook-static node_modules
