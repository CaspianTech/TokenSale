// ----------------------------------------------------------------------------
// CaspianTokenSale Contract Tests
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on FlexibleTokenSale tests from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies Limited.
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const StdUtils = require('./Enuma/lib/StdTestUtils.js')
const Utils    = require('./lib/CaspianTestUtils.js')


// ----------------------------------------------------------------------------
// Tests Summary
// ----------------------------------------------------------------------------
// Construction and basic properties
//    - whitelist
//    - currentPhase
//    - startTime
//    - endTime
//    - suspended
//    - tokensPerKEther
//    - bonus
//    - maxTokensPerAccount
//    - contributionMin
//    - walletAddress
//    - token
//    - totalTokensSold
//    - totalEtherCollected
//    - finalized (inherited)
//    - opsAddress (inherited)
//    - owner (inherited)
//    - proposedOwner (inherited)
// updateWhitelist
//    - updateWhitelist(0, 1)
//    - updateWhitelist(this, 1)
//    - updateWhitelist(wallet, 1)
//    - updateWhitelist(owner, 1)
//    - updateWhitelist(ops, 1)
//    - updateWhitelist(normal, 0)
//    - updateWhitelist(normal, 1)
//    - updateWhitelist(normal, 2)
//    - updateWhitelist(normal, 0)
//    - updateWhitelist owner
//    - updateWhitelist as ops
//    - updateWhitelist as normal
// updateWhitelistBatch
//    - updateWhitelistBatch with empty batch
//    - updateWhitelistBatch as normal
//    - updateWhitelistBatch as ops
//    - updateWhitelistBatch as owner
//    - updateWhitelistBatch - rerun the same batch again
//    - updateWhitelistBatch - remove everybody from whitelist
// buyTokens
//    - buyTokens where neither sender nor receiver whitelisted
//    - buyTokens where sender not whitelisted
//    - buyTokens where beneficiary not whitelisted
//    - buyTokens whitelisted stage 1
//    - buyTokens after removed from whitelist
//    - buyTokens with limit of 1000 tokens
//    - buyTokens with limit of 1000 tokens and someone else did a proxy purchase already
//    - buyTokens with limit of 1000 tokens and owner already assigned tokens out-of-band
// Events
//    - WhitelistUpdated
//       * Covered when appropriate in the different function tests.
//
describe('CaspianTokenSale Contract', () => {

   const TOKEN_NAME          = "Caspian Token"
   const TOKEN_SYMBOL        = "CSP"
   const TOKEN_DECIMALS      = 18
   const DECIMALS_FACTOR     = new BigNumber(10).pow(TOKEN_DECIMALS)
   const TOKEN_TOTALSUPPLY   = new BigNumber("1000000000").times(DECIMALS_FACTOR)

   const TOKENSPERKETHER     = 4000000
   const BONUS               = new BigNumber(0)
   const MAXTOKENSPERACCOUNT = new BigNumber("400000").times(DECIMALS_FACTOR)
   const CONTRIBUTION_MIN    = new BigNumber(0.5).times(DECIMALS_FACTOR)
   const START_TIME          = 1538553600
   const END_TIME            = 1538726400


   var sale = null
   var token = null
   var accounts = null

   // Accounts used for testing
   var owner    = null
   var ops      = null
   var wallet   = null
   var account1 = null
   var account2 = null
   var account3 = null
   var account4 = null
   var account5 = null


   const buyTokens = async (from, to, amount, actualBonus) => {
      return Utils.buyTokens(
         token,
         sale,
         owner,
         wallet,
         DECIMALS_FACTOR,
         from,
         to,
         amount
      )
   }


   before(async () => {
      await TestLib.initialize()

      accounts = await web3.eth.getAccounts()

      owner    = accounts[1]
      ops      = accounts[2]
      wallet   = accounts[3]
      account1 = accounts[4]
      account2 = accounts[5]
      account3 = accounts[6]
      account4 = accounts[7]
      account5 = accounts[8]

      var deploymentResult = null

      deploymentResult = await TestLib.deploy('CaspianToken', [ ], { from: owner })
      token = deploymentResult.instance

      deploymentResult = await TestLib.deploy('CaspianTokenSaleMock', [ wallet, Moment().unix() ], { from: owner })
      sale = deploymentResult.instance

      const initialSaleTokens = new BigNumber("1000000").times(DECIMALS_FACTOR)
      await token.methods.setOpsAddress(sale._address).send({ from: owner })
      await sale.methods.setOpsAddress(ops).send({ from: owner })
      await token.methods.transfer(sale._address, initialSaleTokens).send({ from: owner })
      await sale.methods.initialize(token._address).send({ from: owner })
   })


   context('Construction and basic properties', async () => {

      it('startTime', async () => {
         assert.equal(await sale.methods.startTime().call(), START_TIME)
      })

      it('endTime', async () => {
         assert.equal(await sale.methods.endTime().call(), END_TIME)
      })

      it('suspended', async () => {
         assert.equal(await sale.methods.suspended().call(), false)
      })

      it('tokensPerKEther', async () => {
         assert.equal(await sale.methods.tokensPerKEther().call(), TOKENSPERKETHER)
      })

      it('bonus', async () => {
         assert.equal(await sale.methods.bonus().call(), BONUS)
      })

      it('maxTokensPerAccount', async () => {
         assert.equal(new BigNumber(await sale.methods.maxTokensPerAccount().call()), MAXTOKENSPERACCOUNT)
      })

      it('contributionMin', async () => {
         assert.equal(await sale.methods.contributionMin().call(), CONTRIBUTION_MIN)
      })

      it('walletAddress', async () => {
         assert.equal(await sale.methods.walletAddress().call(), wallet)
      })

      it('token', async () => {
         assert.equal(await sale.methods.token().call(), token._address)
      })

      it('totalTokensSold', async () => {
         assert.equal(await sale.methods.totalTokensSold().call(), 0)
      })

      it('totalEtherCollected', async () => {
         assert.equal(await sale.methods.totalEtherCollected().call(), 0)
      })

      it('finalized', async () => {
         assert.equal(await sale.methods.finalized().call(), false)
      })

      it('opsAddress', async () => {
         assert.equal(await sale.methods.opsAddress().call(), ops)
      })

      it('owner', async () => {
         assert.equal(await sale.methods.owner().call(), owner)
      })

      it('proposedOwner', async () => {
         assert.equal(await sale.methods.proposedOwner().call(), 0)
      })

      it('whitelist', async () => {
         assert.equal(await sale.methods.whitelist(0).call(), 0)
      })

      it('currentPhase', async () => {
         assert.equal(await sale.methods.currentPhase().call(), 1)
      })
   })


   context('updateWhitelist', async () => {

      it('updateWhitelist(0, 1)', async () => {
         await TestLib.assertCallFails(sale.methods.updateWhitelist(0, 1).call({ from: owner }))
      })

      it('updateWhitelist(this, 1)', async () => {
         await TestLib.assertCallFails(sale.methods.updateWhitelist(sale._address, 1).call({ from: owner }))
      })

      it('updateWhitelist(wallet, 1)', async () => {
         await TestLib.assertCallFails(sale.methods.updateWhitelist(wallet, 1).call({ from: owner }))
      })

      it('updateWhitelist(owner, 1)', async () => {
         assert.equal(await sale.methods.updateWhitelist(owner, 1).call({ from: owner }), true)
         Utils.checkUpdateWhitelist(await sale.methods.updateWhitelist(owner, 1).send({ from: owner }), owner, 1)
         assert.equal(await sale.methods.whitelist(owner).call(), 1)
      })

      it('updateWhitelist(ops, 1)', async () => {
         assert.equal(await sale.methods.updateWhitelist(ops, 1).call({ from: owner }), true)
         Utils.checkUpdateWhitelist(await sale.methods.updateWhitelist(ops, 1).send({ from: owner }), ops, 1)
         assert.equal(await sale.methods.whitelist(ops).call(), 1)
      })

      it('updateWhitelist(normal, 0)', async () => {
         assert.equal(await sale.methods.updateWhitelist(account1, 0).call({ from: owner }), true)
         Utils.checkUpdateWhitelist(await sale.methods.updateWhitelist(account1, 0).send({ from: owner }), account1, 0)
         assert.equal(await sale.methods.whitelist(account1).call(), 0)
      })

      it('updateWhitelist(normal, 1)', async () => {
         assert.equal(await sale.methods.updateWhitelist(account1, 1).call({ from: owner }), true)
         Utils.checkUpdateWhitelist(await sale.methods.updateWhitelist(account1, 1).send({ from: owner }), account1, 1)
         assert.equal(await sale.methods.whitelist(account1).call(), 1)
      })

      it('updateWhitelist(normal, 2)', async () => {
         await TestLib.assertCallFails(sale.methods.updateWhitelist(account2, 2).call({ from: account1 }))
      })

      it('updateWhitelist(normal, 0)', async () => {
         assert.equal(await sale.methods.updateWhitelist(account1, 0).call({ from: owner }), true)
         Utils.checkUpdateWhitelist(await sale.methods.updateWhitelist(account1, 0).send({ from: owner }), account1, 0)
         assert.equal(await sale.methods.whitelist(account1).call(), 0)
      })

      it('updateWhitelist as ops', async () => {
         assert.equal(await sale.methods.updateWhitelist(account1, 1).call({ from: ops }), true)
         Utils.checkUpdateWhitelist(await sale.methods.updateWhitelist(account1, 1).send({ from: ops }), account1, 1)
         assert.equal(await sale.methods.whitelist(account1).call(), 1)
      })

      it('updateWhitelist as normal', async () => {
         await TestLib.assertCallFails(sale.methods.updateWhitelist(account2, 1).call({ from: account1 }))
      })
   })


   context('updateWhitelistBatch', async () => {

      it('updateWhitelistBatch with empty batch', async () => {
         var addresses = []

         await TestLib.assertCallFails(sale.methods.updateWhitelistBatch(addresses, 1).call({ from: owner }))
      })

      it('updateWhitelistBatch as normal', async () => {
         var addresses = [ account1, account2, account3, account4, account5 ]

         await TestLib.assertCallFails(sale.methods.updateWhitelistBatch(addresses, 5).call({ from: account1 }))
      })

      it('updateWhitelistBatch as ops', async () => {
         var addresses = [ account1, account2, account3, account4, account5 ]

         assert.equal(await sale.methods.updateWhitelistBatch(addresses, 1).call({ from: ops }), true)
         receipt = await sale.methods.updateWhitelistBatch(addresses, 1).send({ from: ops })
         Utils.checkUpdateWhitelistBatch(receipt, addresses, 1)

         for (i = 0; i < addresses.length; i++) {
            assert.equal(await sale.methods.whitelist(addresses[i]).call(), 1)
         }
      })

      it('updateWhitelistBatch as owner', async () => {
         var addresses = [ account1, account2, account3, account4, account5 ]

         assert.equal(await sale.methods.updateWhitelistBatch(addresses, 0).call({ from: owner }), true)
         receipt = await sale.methods.updateWhitelistBatch(addresses, 0).send({ from: owner })
         Utils.checkUpdateWhitelistBatch(receipt, addresses, 0)

         for (i = 0; i < addresses.length; i++) {
            assert.equal(await sale.methods.whitelist(addresses[i]).call(), 0)
         }
      })

      it('rerun same batch again', async () => {
         var addresses = [ account1, account2, account3, account4, account5 ]

         assert.equal(await sale.methods.updateWhitelistBatch(addresses, 1).call({ from: ops }), true)
         receipt = await sale.methods.updateWhitelistBatch(addresses, 1).send({ from: ops })
         Utils.checkUpdateWhitelistBatch(receipt, addresses, 1)

         for (i = 0; i < addresses.length; i++) {
            assert.equal(await sale.methods.whitelist(addresses[i]).call(), 1)
         }
      })

      it('remove everybody from whitelist', async () => {
         var addresses = [ account1, account2, account3, account4, account5 ]

         assert.equal(await sale.methods.updateWhitelistBatch(addresses, 0).call({ from: ops }), true)
         receipt = await sale.methods.updateWhitelistBatch(addresses, 0).send({ from: ops })
         Utils.checkUpdateWhitelistBatch(receipt, addresses, 0)

         for (i = 0; i < addresses.length; i++) {
            assert.equal(await sale.methods.whitelist(addresses[i]).call(), 0)
         }
      })
   })


   context('buyTokens - whitelist', async () => {

      before(async () => {
         deploymentResult = await TestLib.deploy('CaspianToken', [ ], { from: owner })
         token = deploymentResult.instance

         deploymentResult = await TestLib.deploy('CaspianTokenSaleMock', [ wallet, Moment().unix() ], { from: owner })
         sale = deploymentResult.instance

         const initialSaleTokens = new BigNumber("1000000").times(DECIMALS_FACTOR)
         await token.methods.setOpsAddress(sale._address).send({ from: owner })
         await sale.methods.setOpsAddress(ops).send({ from: owner })
         await token.methods.transfer(sale._address, initialSaleTokens).send({ from: owner })
         await sale.methods.initialize(token._address).send({ from: owner })
         await sale.methods.changeTime(START_TIME + 1).send({ from: owner })
         await sale.methods.setMaxTokensPerAccount(0).send({ from: owner })
      })


      it('buyTokens where neither sender nor receiver whitelisted', async () => {
         assert.equal(await sale.methods.currentPhase().call(), 1)
         assert.equal(await sale.methods.whitelist(account1).call(), 0)

         await TestLib.assertCallFails(buyTokens(account1, account1, CONTRIBUTION_MIN))
      })

      it('buyTokens where sender not whitelisted', async () => {
         assert.equal(await sale.methods.currentPhase().call(), 1)
         assert.equal(await sale.methods.whitelist(account1).call(), 0)
         await sale.methods.updateWhitelist(account2, 1).send({ from: owner })
         assert.equal(await sale.methods.whitelist(account2).call(), 1)

         await TestLib.assertCallFails(buyTokens(account1, account2, CONTRIBUTION_MIN))
      })

      it('buyTokens where beneficiary not whitelisted', async () => {
         assert.equal(await sale.methods.currentPhase().call(), 1)
         assert.equal(await sale.methods.whitelist(account1).call(), 0)
         assert.equal(await sale.methods.whitelist(account2).call(), 1)

         await TestLib.assertCallFails(buyTokens(account2, account1, CONTRIBUTION_MIN))
      })

      it('buyTokens stage 1, whitelisted stage 1', async () => {
         assert.equal(await sale.methods.currentPhase().call(), 1)
         await sale.methods.updateWhitelist(account1, 1).send({ from: owner })

         await buyTokens(account1, account1, CONTRIBUTION_MIN)
      })

      it('buyTokens stage 1, after removed from whitelist', async () => {
         await sale.methods.updateWhitelist(account1, 0).send({ from: owner })

         await TestLib.assertCallFails(buyTokens(account1, account1, CONTRIBUTION_MIN))
      })

      it('buyTokens with limit of 1000 tokens', async () => {
         await sale.methods.updateWhitelist(account3, 1).send({ from: owner })
         await sale.methods.setMaxTokensPerAccount(1000).send({ from: owner })
         assert.equal(await token.methods.balanceOf(account3).call(), 0)

         await buyTokens(account3, account3, CONTRIBUTION_MIN)

         assert.equal(await token.methods.balanceOf(account3).call(), 1000)
      })

      it('buyTokens with limit of 1000 tokens and someone else did a proxy purchase already', async () => {
         await sale.methods.updateWhitelist(account4, 1).send({ from: owner })
         await sale.methods.setMaxTokensPerAccount(1000).send({ from: owner })
         assert.equal(await token.methods.balanceOf(account3).call(), 1000)
         assert.equal(await token.methods.balanceOf(account4).call(), 0)

         await buyTokens(account3, account4, CONTRIBUTION_MIN)
         await TestLib.assertCallFails(buyTokens(account4, account4, CONTRIBUTION_MIN))

         assert.equal(await token.methods.balanceOf(account3).call(), 1000)
         assert.equal(await token.methods.balanceOf(account4).call(), 1000)

         assert.equal(await token.methods.balanceOf(account3).call(), 1000)
         assert.equal(await token.methods.balanceOf(account4).call(), 1000)
      })

      it('buyTokens with limit of 1000 tokens and owner already assigned tokens out-of-band', async () => {
         await sale.methods.updateWhitelist(account5, 1).send({ from: owner })
         await sale.methods.setMaxTokensPerAccount(1000).send({ from: owner })
         assert.equal(await token.methods.balanceOf(account5).call(), 0)

         await token.methods.transfer(account5, 500).send({ from: owner })

         await buyTokens(account5, account5, CONTRIBUTION_MIN)

         assert.equal(await token.methods.balanceOf(account5).call(), 1000)
      })
   })
})
