// bob tries to register as a hoster twice
// author has no additional roles
module.exports = [
  { "name": "sponsor", "roles": ["peer", "sponsor"] },
  { "name": "attestor", "roles": ["peer", "attestor"] },
  { "name": "encoder1", "roles": ["peer", "encoder"] },
  { "name": "encoder2", "roles": ["peer", "encoder"] },
  { "name": "encoder3", "roles": ["peer", "encoder"] },
  { "name": "hoster1", "roles": ["peer", "hoster"] },
  { "name": "hoster2", "roles": ["peer", "hoster"] },
  { "name": "hoster3", "roles": ["peer", "hoster"] },
  { "name": "author", "roles": ["peer", "author"] },
]
