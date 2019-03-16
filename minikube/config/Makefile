deployments := $(patsubst %.k8s.js,%.k8s.made.json,$(wildcard *.k8s.js))
olio := $(wildcard *.olio.js)
prolific := $(wildcard *.prolific.js)

targets := $(deployments) olio.made.json prolific.made.json

all: $(targets)

%.k8s.made.json: %.k8s.js
	node $< > $@

olio.made.json: olio.js $(olio)
	node $^ > $@

prolific.made.json: prolific.js $(prolific)
	node $^ > $@

clean:
	rm -f $(targets)
