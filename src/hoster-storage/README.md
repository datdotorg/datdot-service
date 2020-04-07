# Hoster storage

This module helps a hoster store encoded data for a hypercore and to seed a hypercore.

The hypercore should be sparsely replicating since the hosterstorage will request chunks from the hypercore to verify that the encoded data is legit.

The storage will store encoded data in leveldb, and when hypercore replication requests a chunk of data, it will be fetched from leveldb and decoded.
