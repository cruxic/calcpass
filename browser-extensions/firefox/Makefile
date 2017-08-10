TEMPDIR := /tmp/calcpass-firefox-build
DIRFILE := $(TEMPDIR)/.placeholder

all: popup-bundle.js content-script-bundle.js parallel-bcrypt-webworker.js background-script-bundle.js

popup-bundle.js: js-src/*.ts Makefile
	tsc --outDir "$(TEMPDIR)" --project ./js-src
	browserify $(TEMPDIR)/popup.js --outfile $@

#the popup-bundle.js dependency compiles all typescript
content-script-bundle.js: popup-bundle.js
	browserify $(TEMPDIR)/content-script.js --outfile $(TEMPDIR)/content-script-bundle.tmp
#Firefox needs the last statement in a content-script to be a primtive value to satisfy tabs.executeScript()
	@echo '\n1234; //ignored but necessary for tabs.executeScript()' >> $(TEMPDIR)/content-script-bundle.tmp
	cp $(TEMPDIR)/content-script-bundle.tmp $@

parallel-bcrypt-webworker.js: popup-bundle.js
	browserify $(TEMPDIR)/parallel-bcrypt-webworker.js --outfile $@

background-script-bundle.js: popup-bundle.js
	browserify $(TEMPDIR)/background-script.js --outfile $@


#Make TEMPDIR
$(DIRFILE):
	mkdir -p $(TEMPDIR)
	touch $@	

clean:
	rm -rf $(TEMPDIR) popup-bundle.js
