## Tue Jul 27 20:29:26 CDT 2021

Facture used to be based on hashing, but it is no longer. Would be nice to have
hashing to split message processing by a hash of the id.

You see, I am considering how to move from one version of the lookup table to
the next.

New arrival so new table is generated. Everyone who receives the table sends a
message (and it does not need a response, but hey, we're not going to optimize
that away just yet.) When all say that they have the new table, all can start
using the new table. However, the use of the table, for forwarding and the like,
is happening in parallel, so we have a race condition. We don't know if there is
a slow-moving hop that is using the old table so we can't delete it even though
we know that everyone has got it.

We need another round to delete the old version, to say that we promise we'll
never use the old queue again.

Or else, we need to check on the arrival of each hop if we have that version of
the table, if not we need to rehash and hop again. Oh, yeah, that's pretty easy.

## Sat Jul 24 04:02:40 CDT 2021

Going to simpify this so that it can be used somewhat generically. Do have an
idea for a distributed, half-paxos backed key-value store, but until I'm able to
create that, we'll have to refresh our lookup tables using a whole lot of
messaging, and perhaps through Paxos so we can get a version number.

Each worker keeps a set of ids. An arrival is when the id is not in the set.
When an arrival occurs it does a round of paxos to get a promise it can use as a
connection version. That way, if it reconnects somewhere else, but then there is
a crash and we're updating, the two won't cancel each other out.
