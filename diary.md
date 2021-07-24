## Sat Jul 24 04:02:40 CDT 2021

Going to simpify this so that it can be used somewhat generically. Do have an
idea for a distributed, half-paxos backed key-value store, but until I'm able to
create that, we'll have to refresh our lookup tables using a whole lot of
messaging, and perhaps through Paxos so we can get a version number.

Each worker keeps a set of ids. An arrival is when the id is not in the set.
When an arrival occurs it does a round of paxos to get a promise it can use as a
connection version. That way, if it reconnects somewhere else, but then there is
a crash and we're updating, the two won't cancel each other out.
