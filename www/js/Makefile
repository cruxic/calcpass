TEMPDIR := /tmp/calcpass-build
DIRFILE := $(TEMPDIR)/.placeholder



#TODO: expand js/*.js to $(DEST)/js/a.js $(DEST)/js/b.js ...
all: main-bundle.js tests-bundle.js

main-bundle.js: $(TEMPDIR)/main.js src/*.ts
	browserify $(TEMPDIR)/main.js --outfile $@

tests-bundle.js: $(TEMPDIR)/tests.js src/*.ts
	browserify $(TEMPDIR)/tests.js --outfile $@

#all: $(DIRFILE) $(TEMPDIR)/main.js

$(TEMPDIR)/main.js: src/*.ts
	tsc --outDir "$(TEMPDIR)" src/main.ts

$(TEMPDIR)/tests.js: src/*.ts
	tsc --outDir "$(TEMPDIR)" src/tests.ts
	

#$(TEMPDIR)/%.js: src/%.ts
#	tsc --outDir "$(TEMPDIR)" "$^"


#this command is not smart
#flow-remove-types --out-dir $(DEST)/js/ js/


#Make TEMPDIR
$(DIRFILE):
	mkdir -p $(TEMPDIR)
	touch $@	

clean:
	rm -rf $(TEMPDIR) main-bundle.js tests-bundle.js
