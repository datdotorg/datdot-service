# Hoster/Encoder communication

This module facilitates the hoster/encoder communication.

The way it works is that every peer initializes their ID as part of corestore, this gets persisted in storage.
They can then use their ID as a fake hypercore key to listen for incoming peers.
Once they get a peer, they can use extension messages to do whatever they want with them.
Peers looking for the original peer, will also create a hypercore and listen for peers.
They will however check that the publicKey of the connected peer is the same as the original peer.
This works because noise uses the public key in the communication and it can't be forged by any other peers during the handshake.

With this in place, we can have authenticated duplex communication channels between peers to do whatever we need. Like having encoders send data to hosters.
