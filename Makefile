.PHONY: help
.DEFAULT_GOAL := help

# From: http://disq.us/p/16327nq
help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: run
run: ## Run locally
	zola serve --port 1313
