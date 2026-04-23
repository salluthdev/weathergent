.PHONY: deploy

# Just typing 'make' will now run the full deployment
default: deploy

deploy:
	git pull origin main
	bun install
	bun run build
	pm2 restart ecosystem.config.js
	pm2 save
	@echo "------------------------------------------------"
	@echo "Deployment Complete! All processes are updated."
	@echo "------------------------------------------------"
