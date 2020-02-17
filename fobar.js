
---
async function getChallenges (opts) {
  const {address, respondToChallenges} = opts
  const respondingChallenges = []
  const challengeIndeces = await getUserChallengeIndeces(address)
  challengeIndeces.forEach(async challengeIndex => {
    const challenge = await API.query.datVerify.selectedChallenges(challengeIndex)
    const challengeObject = { }
    challengeObject.user = address
    challengeObject.pubkey = challenge[0]
    challengeObject.index = challenge[1]
    challengeObject.deadline = challenge[2]
    challengeObject.challengeIndex = challenge[3]
    respondingChallenges.push(challengeObject)
    LOG('CHALLENGE OBJ', challenge.toJSON())
    if (respondingChallenges.length === challengeIndeces.length) {
      respondToChallenges(respondingChallenges)
    }
  })
 }

 async function getUserChallengeIndeces (address) {
   const selectedUserIndex = await addressToSelectedUserIndex(address)
   const allChallenges = await API.query.datVerify.challengeMap()
   LOG('All challenges', allChallenges.toString()) //logs [[idsOfChallenges], [idsOfUsers]]
   const idsOfUsers = allChallenges[1]
   const userChallengeIndeces = []
   for (var i = 0; i < idsOfUsers.length; i++) {
     if (idsOfUsers[i].toString() === Number(selectedUserIndex).toString()) {
       userChallengeIndeces.push(i)
     }
   }
   LOG(`Indexes of all the challenges for user ${address}:`, userChallengeIndeces)
   return userChallengeIndeces
 }

 async function addressToSelectedUserIndex(address){
     const challengedUser = await API.query.datVerify.selectedUserIndex(address)
     const userIndex = challengedUser[0]
     const challengeCount = challengedUser[1]
     LOG("User: "+address+", at index: "+userIndex+" has "+challengeCount+" challenges!")
     return userIndex
 }
