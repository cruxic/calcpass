TEMPDIR := /tmp/calcpass-unittest-with-browser-build
DIRFILE := $(TEMPDIR)/.placeholder


all: unittest_everything_bundle.js parallel-bcrypt-webworker.js

unittest_everything_bundle.js: ../*.ts Makefile
	tsc --outDir "$(TEMPDIR)" --project .
	browserify $(TEMPDIR)/unittest_everything.js --outfile unittest_everything_bundle.js

parallel-bcrypt-webworker.js: unittest_everything_bundle.js
	browserify $(TEMPDIR)/parallel-bcrypt-webworker.js --outfile $@



#Make TEMPDIR
$(DIRFILE):
	mkdir -p $(TEMPDIR)
	touch $@	

clean:
	rm -rf $(TEMPDIR) unittest_everything_bundle.js
