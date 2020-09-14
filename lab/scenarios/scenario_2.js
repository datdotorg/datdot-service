// bob tries to register as a hoster twice
// author has no additional roles
module.exports = [
  { "name": "alice", "roles": ["peer", "sponsor", "publisher", "attestor", "hoster", "encoder"] },
  { "name": "bob", "roles": ["peer", "hoster", "attestor", "encoder", "hoster"] },
  { "name": "charlie", "roles": ["peer", "encoder", "hoster", "attestor"] },
  { "name": "dave", "roles": ["peer", "encoder", "hoster", "attestor"] },
  { "name": "eve", "roles": ["peer", "author"] },
  { "name": "ferdie", "roles": ["peer", "encoder", "hoster", "attestor"] },
  { "name": "one", "roles": ["peer", "encoder", "hoster", "attestor"] },
  { "name": "two", "roles": ["peer", "encoder", "hoster", "attestor"] },
]
