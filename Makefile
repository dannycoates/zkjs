TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 10000

install:
	@npm install

test: install
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(TESTS)

.PHONY: install test
