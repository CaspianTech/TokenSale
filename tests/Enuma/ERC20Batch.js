// ----------------------------------------------------------------------------
// ERC20Batch Contract Tests
// Enuma Blockchain Platform
//
// Copyright (c) 2017 Enuma Technologies Limited.
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const Utils = require('./lib/StdTestUtils.js')


// ----------------------------------------------------------------------------
// Tests Summary
// ----------------------------------------------------------------------------
// Construction and basic properties
//    - token
// transferFromBatch
//    - transferFromBatch with arrays of different length
//    - transferFromBatch with empty arrays
//    - transferFromBatch with a single entry incorrect approval
//    - transferFromBatch with a single entry and correct approval
//    - transferFromBatch with a single entry again and no approval left
//    - transferFromBatch with multiple entries and 1 incorrect approval
//    - transferFromBatch with multiple entries and correct approvals
// Events
//    TransferFromBatchCompleted
//       * Covered when appropriate in the different function tests.
//
describe('ERC20Batch Contract', () => {

   var token = null
   var accounts = null

   const TOKEN_NAME        = "A"
   const TOKEN_SYMBOL      = "B"
   const TOKEN_DECIMALS    = 18
   const DECIMALS_FACTOR   = new BigNumber(10).pow(TOKEN_DECIMALS)
   const TOKEN_TOTALSUPPLY = new BigNumber("1000000").times(DECIMALS_FACTOR)

   var deploymentResult = null

   // Accounts used for testing
   var tokenHolder = null
   var tokenBatch  = null
   var account1    = null
   var account2    = null
   var account3    = null


   before(async () => {
      await TestLib.initialize()

      accounts = await web3.eth.getAccounts()

      tokenHolder = accounts[1]
      batchOwner  = accounts[2]
      account1    = accounts[3]
      account2    = accounts[4]
      account3    = accounts[5]

      deploymentResult = await TestLib.deploy('ERC20Token', [ TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOKEN_TOTALSUPPLY, tokenHolder ])
      token = deploymentResult.instance

      deploymentResult = await TestLib.deploy('ERC20Batch', [ token._address, tokenHolder ], { from: batchOwner })
      tokenBatch = deploymentResult.instance
   })


   context('Construction and basic properties', async () => {

      it('token', async () => {
         assert.equal(await tokenBatch.methods.token().call(), token._address)
      })
   })


//    - transferFromBatch with multiple entries and incorrect approval
//    - transferFromBatch with multiple entries and correct approval
   context('transferFromBatch function', async () => {

      it('transferFromBatch with arrays of different length', async () => {
         await token.methods.approve(tokenBatch._address, 1000).send({ from: tokenHolder })

         const toArray    = [ account1 ]
         const valueArray = [ 1, 2 ]

         await TestLib.assertCallFails(tokenBatch.methods.transferFromBatch(toArray, valueArray).call({ from: batchOwner }))
      })

      it('transferFromBatch with empty arrays', async () => {
         await token.methods.approve(tokenBatch._address, 0).send({ from: tokenHolder })
         await token.methods.approve(tokenBatch._address, 1000).send({ from: tokenHolder })

         const toArray    = [ ]
         const valueArray = [ ]

         await TestLib.assertCallFails(tokenBatch.methods.transferFromBatch(toArray, valueArray).call({ from: batchOwner }))
      })

      it('transferFromBatch with a single entry and incorrect approval', async () => {
         await token.methods.approve(tokenBatch._address, 0).send({ from: tokenHolder })
         await token.methods.approve(tokenBatch._address, 1).send({ from: tokenHolder })

         const toArray    = [ account1 ]
         const valueArray = [ 2 ]

         await TestLib.assertCallFails(tokenBatch.methods.transferFromBatch(toArray, valueArray).call({ from: batchOwner }))
      })

      it('transferFromBatch with a single entry and correct approval', async () => {
         await token.methods.approve(tokenBatch._address, 0).send({ from: tokenHolder })
         await token.methods.approve(tokenBatch._address, 5).send({ from: tokenHolder })

         const toArray    = [ account1 ]
         const valueArray = [ 5 ]

         assert.equal(await tokenBatch.methods.transferFromBatch(toArray, valueArray).call({ from: batchOwner }), true)

         const balanceBefore = new BigNumber(await token.methods.balanceOf(account1).call())
         Utils.checkTransferFromBatch(await tokenBatch.methods.transferFromBatch(toArray, valueArray).send({ from: batchOwner }), 1)
         const balanceAfter = new BigNumber(await token.methods.balanceOf(account1).call())

         assert.equal(balanceAfter.minus(balanceBefore).toString(), 5)
      })

      it('transferFromBatch with a single entry again and no approval left', async () => {
         const toArray    = [ account1 ]
         const valueArray = [ 1 ]

         await TestLib.assertCallFails(tokenBatch.methods.transferFromBatch(toArray, valueArray).call({ from: batchOwner }))
      })

      it('transferFromBatch with a multiple entries and incorrect approval', async () => {
         await token.methods.approve(tokenBatch._address, 0).send({ from: tokenHolder })
         await token.methods.approve(tokenBatch._address, 20).send({ from: tokenHolder })

         const toArray    = [ account1, account2 ]
         const valueArray = [ 10, 20 ]

         await TestLib.assertCallFails(tokenBatch.methods.transferFromBatch(toArray, valueArray).call({ from: batchOwner }))
      })

      it('transferFromBatch with a multiple entries and correct approval', async () => {
         await token.methods.approve(tokenBatch._address, 0).send({ from: tokenHolder })
         await token.methods.approve(tokenBatch._address, 30).send({ from: tokenHolder })

         const toArray    = [ account1, account2 ]
         const valueArray = [ 10, 20 ]

         assert.equal(await tokenBatch.methods.transferFromBatch(toArray, valueArray).call({ from: batchOwner }), true)

         const balance1Before = new BigNumber(await token.methods.balanceOf(account1).call())
         const balance2Before = new BigNumber(await token.methods.balanceOf(account2).call())
         Utils.checkTransferFromBatch(await tokenBatch.methods.transferFromBatch(toArray, valueArray).send({ from: batchOwner }), 2)
         const balance1After = new BigNumber(await token.methods.balanceOf(account1).call())
         const balance2After = new BigNumber(await token.methods.balanceOf(account2).call())

         assert.equal(balance1After.minus(balance1Before).toString(), 10)
         assert.equal(balance2After.minus(balance2Before).toString(), 20)
      })
   })
})
