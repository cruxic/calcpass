TEMPDIR := /tmp/calcpass-build
DIRFILE := $(TEMPDIR)/.placeholder


all: main-bundle.js tests-bundle.js

main-bundle.js: src/*.ts
	tsc --outDir "$(TEMPDIR)" --project ./src
	browserify $(TEMPDIR)/main.js --outfile $@

#main-bundle.js dependency ensures all typescript gets compiled
tests-bundle.js: main-bundle.js
	browserify $(TEMPDIR)/tests.js --outfile $@


#Make TEMPDIR
$(DIRFILE):
	mkdir -p $(TEMPDIR)
	touch $@	

clean:
	rm -rf $(TEMPDIR) main-bundle.js tests-bundle.js
