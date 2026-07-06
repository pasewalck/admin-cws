BASE_SCRIPT_DIR=/usr/local/lib/admin-cws

.PHONY: install uninstall

install:
	@sudo mkdir -p $(BASE_SCRIPT_DIR)
	@sudo install -m 755 run.bash $(BASE_SCRIPT_DIR)/run.bash
	@sudo install -m 755 setup.bash $(BASE_SCRIPT_DIR)/setup.bash
	@sudo install -m 755 config.bash $(BASE_SCRIPT_DIR)/config.bash
	@sudo install -m 755 log.bash $(BASE_SCRIPT_DIR)/log.bash
	@sudo install -m 755 remove.bash $(BASE_SCRIPT_DIR)/remove.bash

uninstall:
	@sudo rm -f $(BASE_SCRIPT_DIR)/run.bash
	@sudo rm -f $(BASE_SCRIPT_DIR)/log.bash
	@sudo rm -f $(BASE_SCRIPT_DIR)/setup.bash
	@sudo rm -f $(BASE_SCRIPT_DIR)/config.bash
	@sudo rm -f $(BASE_SCRIPT_DIR)/remove.bash
