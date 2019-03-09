deployments := $(patsubst %.k8s.js,%.k8s.made.json,$(wildcard *.k8s.js))
olio := $(wildcard *.olio.js)
prolific := $(wildcard *.prolific.js)

targets := $(deployments) olio.json prolific.json

all: $(targets)

%.k8s.made.json: %.k8s.js
	node $< > $@

olio.json: olio.js $(olio)
	node $^ > $@

prolific.json: prolific.js $(prolific)
	node $^ > $@

clean:
	rm -f $(targets)
