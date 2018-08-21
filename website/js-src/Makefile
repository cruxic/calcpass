TEMPDIR := /tmp/calcpass-website-build
DIRFILE := $(TEMPDIR)/.placeholder

OUTPUTS := ../create-wordlist-bundle.js

all: $(OUTPUTS)

../create-wordlist-bundle.js: *.ts Makefile
	tsc --outDir "$(TEMPDIR)" --project .
	browserify $(TEMPDIR)/create-wordlist.js --outfile $@

clean:
	rm -rf $(TEMPDIR) $(OUTPUTS)
