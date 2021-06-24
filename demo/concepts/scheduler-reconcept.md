```js
async function take_next_from_priority (next, log) {
  const plan = await getPlanByID(next.id)
  const contract_ids = await make_contracts(plan, log)
  plan.contracts.push(...contract_ids)
  for (var i = 0, len = contract_ids.length; i < len; i++) {
    const contract_id = contract_ids[i]
    const blockNow = header.number
    const delay = plan.duration.from - blockNow
    const { scheduleAction } = await scheduler
    scheduleAction({ 
      from: log.path,
      type: 'plan_execution',
      data: { contract_id }, 
      delay,
    })

    function me_component (scheduler_feed_wire) {

      const scheduler = connect(scheduler_feed)

      const { myfeed, schedulerkey } = self

      const to = {}
      const node = hypernode({ keypair, to })

      node.on('connection', line => {
        const [pubkey, incoming, outgoing] = line

      })

      function hypernode ({ keypair, to }) {
        const publickey = keypair.publickey
        const myaddress = hash(publickey)
        // const feed = hypercore(schedulerkey)
        const ext = feed.registerExtension(myaddress, {
          // 1. get a call from a peer
          onmessage (message, peer) { // verify message via peer.remotePubKey

            // 1. alice sends her ephemeral key to bob
            // 2. bob replies with his ephemeral key, a boxed long term key
            //    => and a multikeyed box as evidence he is bob
            // 3. alice responds with a multikeyd box as evidence she knows
            //    "a" secret and "A" secret
            // 4. bob sends back message showing he was able to derive
            //    shared secret

            // shared secret is not derived via long term keys
            // but instead via ephemeral keys
            // => so "B" secret is not a wild card

            // => 4 PASS Protocol


            // Even if Alice suspects that Conrad may have compromised her
            // long term key, A, she trusts that he surely cannot know
            // her ephemeral key, a
            // Without knowing a_secret Conrad cannot construct a*B
            // unless its really Bob
            // 

            //////////////////////////////////////////////////////
            // PROTOCOL 4 (Deniable Capability Handshake)
            // 1. ? -> ? : a_p
            //   ALICE sends her ephemeral pubkey to BOB
            // 2. ? <- ? : b_p
            //   BOB sends his ephemeral pubkey to ALICE
            // 3. A -> B : Box[a*b,a*B](Ap)
            //   ALICE boxes her long term pubkey to BOB
            // 4. A <- B : Box[a*b,a*B,A*b](okay)
            //   BOB boxes his long term pubkey to ALICE
            //   BOB shows his acceptance by boxing a standard message
            //   so that only ALICE or BOB can read it

            // ... 

            // Requiring Alice to authenticate first is unusual,
            // but I think this is a fair deal.
            // Bob has already put himself at a disadvantage
            // by allowing himself to be publicly addressable.
            // =>  It’s only fair that Alice authenticates first.
            // ==> By encrypting her authentication she need not reveal
            //     her identity to anyone but the one true Bob

            // Likewise, if Bob chooses not to accept the call,
            // then Alice won’t be able to deduce whether or not
            // it was really Bob

            // Maybe it was but he did not wish to speak to her?
            // Maybe it was just a wrong number?
            // This protects Bob from harassment


            // If Bob is unconcerned with the identity of his clients,
            // he may allow anyone knowing Bp to authenticate.
            // A client can remain anonymous by using a
            // second ephemeral identity


            // In this design Bob’s public key is a capability, but it still has the wildcard
            // (KCI) problem that noise and TextSecure have.
            // Key exchange is required for confidentiality and forward security,
            // but signatures are required to avoid wildcards. With signatures,
            // we’ll have a truly well behaved capability system

            // Since we will need both exchange and signing keys,
            // an identity could be represented by a pair of signing
            // and exchange keys. nacl uses ed25519
            // keys for signatures, and curve25519 keys for exchange.

            ////////////////////////////////////////////////////
            // PROTOCOL 5 (Capability-based Handshake)

            // ? -> ? : a_p
            // ? <- ? : b_p
            //          H = A_p|Sig_A(B_p(hash(a*b)))
            // A -> B : Box[a*b,a*B](H)
            // B <- A : Box[a*b,a*B](Sig_b(H))

            // 1. Alice & Bob exchange ephemeral pubkeys
            // 2. 

// to check e.g. EXTENSION MESSAGES:
https://github.com/hypercore-protocol/hypercore


https://github.com/auditdrivencrypto/secret-handshake

see:
http://dominictarr.github.io/secret-handshake-paper/shs.pdf


////////////////////////
            // If ALICE "preauthenticates" BOB
            // Then BOB can authenticate ALICE using one more pass
            // Two initial passes to prevent replay attacks
            // Nobody gets authenticated until the 3rd pass

            // 1. ALICE "preauthenticates" BOB
            //    => ALICE==ProofOfIdentity+ConnectionIntention==>BOB
            //    => e.g. via encryption + signatures
            // 2

            const peerlinekey = message.data
            var myline = to(peerlinekey)
            if (!myline) {
              const { publickey, secretkey } = crypto.keypair()
              myline = to(peerlinekey, { publickey, secretkey })
            }
            var feed = to[peerlinekey]
            if (!feed) feed = to[peerlinekey] = hypercore(myline.publickey)
            const msg = { type: 'handshake', data: publickey }

            ext.send(, peer)
          }
        })
        const swarm = hyperswarm()
        swarm.join(topic)
        swarm.on('connection', (peer, info) => {
          if (peer.remotePublicKey === schedulerkey) {
            const message = { type: '', data: '' }
            ext.send(message, peer)
          }
        })
      }










      const 
      const line = hyperline('schedulerkey')
      const { port1, port2 } = line
      
 

      scheduler.remote
      scheduler.local
      scheduler.append({ type:'scubscribe', data: {  } })





      scheduler.subscribe(mynamefeed, function onblock (msg) {
        if (!verifySchedulerSignature(msg)) return
        const { data: nonce } = msg
        if (!followups[nonce]) return
  
  
      })
      const signed_nonce = gen()
      const { nonce, signature } = signed_nonce
      followups[nonce]
      scheduler.send(signed_nonce, delay)
  
    }


    scheduleAction({
      type: 'plan_execution',
      data: { contract_id }
    })
    const msg = to.scheduler('plan_execution')({ id: contract_id, delay })
    // msg.head = [log.path, 'scheduler', mid]
    // msg.cite = []
    // msg.type = 'plan_execution'
    // msg.data = { id: contract_id, delay }
    const mid = send({
      head: to('scheduler') // 

    })

    send({
      head: to('scheduler') // [log.path, 'scheduler', id]

    })
    send({
      head: to.scheduler() // [log.path, 'scheduler', id]

    })
    log({
      type: 'plan_execution',
      data: { id: contract_id, delay }
    })
    scheduleAction({ 
      from: log.path,
      type: 'plan_execution',
      data: { contract_id }, 
      delay,
    })
  }
}
```