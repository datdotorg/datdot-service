# DatDot

**DatDot** is the infrastructure for running a hosting network for p2p data systems. Think of it as a Filecoin but for Hypercore protocol, built with Substrate.

[Hypercore protocol](https://hypercore-protocol.org/) (started in 2013) is a distributed ledger technology and set of data syncronization primitives with focus on immutable history.

Due to their P2P nature it's hard to have guarantees about the availability of p2p data systems. If we want to keep data available and up to date we have to keep our computer running or we have to rent a server.

**Challenges: What if you want other people to help you host your data?**

- what incentives do they have?
- how to find them and trust them?
- how to verify they are 'seeding' your data?

**Solution:** A bridge between Hypercore Protocol and Substrate with a built-in incentive model which manages relationships between:

- hypercore creators/publishers and
- hosters (who keep data available/host the data)

To read more, visit our [documentation](https://datdot.org/#doc)

Join our [telegram](https://t.me/joinchat/CgTftxXJvp6iYayqDjP7lQ) or follow [@DatDotorg](https://twitter.com/datdotorg) on Twitter for latest updates

## Building

Clone
##### `git clone https://github.com/playproject-io/datdot-service.git`

Install dependencies
##### `npm install`

## Running

To run the scenario, type

##### `npm run simulation 1`

## License

MIT


![](https://i.imgur.com/oGPIbZQ.jpg)
