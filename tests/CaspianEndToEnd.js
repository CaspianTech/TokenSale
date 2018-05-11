// ----------------------------------------------------------------------------
// Caspian End-To-End Scenario Test
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on FlexibleTokenSale end-to-end tests from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies Limited.
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const StdUtils = require('./Enuma/lib/StdTestUtils.js')
const Utils    = require('./lib/CaspianTestUtils.js')


// ----------------------------------------------------------------------------
// Tests Summary
// ----------------------------------------------------------------------------
// - Initial Deployment
//    - Deploy the token contract
//    - Deploy the sale contract
//    - Initialize the sale contract
//    - Set the ops key of token to the sale contract
//    - Set the ops key of sale to a ops key
// - Before Sale
//    - Set time window for the sale
//    - Set the bonus amount
//    - Update whitelist with new applicants
//    - Set the per account contribution limit
//    - Assign new amount of tokens for sale
// - During Sale
//    - Contributor buys max allowed tokens
//    - Raise per account contribution limit
//    - Contributor buys max allowed tokens (again)
//    - Remove the account contribution limit
//    - Contributor buys all remaining tokens
// - After Sale
//    - Reclaim tokens (should be 0)
//    - Finalize the token
//    - Finalize the sale
//    - User staking tokens
//    - User staking more tokens
//    - User unstaking partially
//
describe('Caspian End-To-End Scenario', () => {

   const TOKEN_NAME            = "Caspian Token"
   const TOKEN_SYMBOL          = "CSP"
   const TOKEN_DECIMALS        = 18
   const DECIMALS_FACTOR       = new BigNumber(10).pow(TOKEN_DECIMALS)
   const TOKEN_TOTALSUPPLY     = new BigNumber("900000000").times(DECIMALS_FACTOR)

   const CONTRIBUTION_MIN      = new BigNumber(0.1).times(DECIMALS_FACTOR)


   // Sale configuration
   const SALE_TOKENS              = new BigNumber("85000000").times(DECIMALS_FACTOR)
   const SALE_TOKENSPERKETHER     = 4000000
   const SALE_BONUS               = 0
   const SALE_MAXTOKENSPERACCOUNT = new BigNumber(4000).times(DECIMALS_FACTOR)
   const SALE_STARTTIME           = 1530100800
   const SALE_ENDTIME             = 1530273600


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
   var account6 = null
   var account7 = null


   const buyTokens = async (from, to, amount) => {
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
      account6 = accounts[9]
      account7 = accounts[10]

      var deploymentResult = null
   })


   context('Initial deployment', async () => {

      it('Deploy the token contract', async () => {
         deploymentResult = await TestLib.deploy('CaspianToken', [ ], { from: owner })
         token = deploymentResult.instance

         assert.equal(new BigNumber(await token.methods.balanceOf(owner).call()), TOKEN_TOTALSUPPLY)
      })

      it('Deploy the sale contract', async () => {
         deploymentResult = await TestLib.deploy('CaspianTokenSaleMock', [ wallet, Moment().unix() ], { from: owner })
         sale = deploymentResult.instance

         assert.equal(await sale.methods.owner().call(), owner)
         assert.equal(await sale.methods.currentPhase().call(), 1)
      })

      it('Initialize the sale contract', async () => {
         await sale.methods.initialize(token._address).send({ from: owner })
         assert.equal(await sale.methods.token().call(), token._address)
         assert.equal(new BigNumber(await sale.methods.tokenConversionFactor().call()), new BigNumber(10).pow(18 - TOKEN_DECIMALS + 3 + 4))
      })

      it('Set the ops key of the token to the sale contract', async () => {
         await token.methods.setOpsAddress(sale._address).send({ from: owner })
         assert.equal(await token.methods.opsAddress().call(), sale._address)
      })

      it('Set the ops key of the sale to a ops key', async () => {
         await sale.methods.setOpsAddress(ops).send({ from: owner })
         assert.equal(await sale.methods.opsAddress().call(), ops)
      })

      it('Deploy the staking contract', async () => {
         deploymentResult = await TestLib.deploy('Staking', [ token._address ], { from: owner })
         staking = deploymentResult.instance

         assert.equal(await staking.methods.token().call(), token._address)
      })
   })


   context('Before Sale', async () => {

      it('Set new time window for the public sale', async () => {
         await sale.methods.setSaleWindow(SALE_STARTTIME, SALE_ENDTIME).send({ from: owner })
         assert.equal(await sale.methods.startTime().call(), SALE_STARTTIME)
         assert.equal(await sale.methods.endTime().call(), SALE_ENDTIME)
      })

      it('Set a new bonus amount', async () => {
         await sale.methods.setBonus(SALE_BONUS).send({ from: owner })
         assert.equal(await sale.methods.bonus().call(), SALE_BONUS)
      })

      it('Update whitelist with new applicants', async () => {
         var addresses = [ account7 ]

         assert.equal(await sale.methods.updateWhitelistBatch(addresses, 1).call({ from: ops }), true)
         receipt = await sale.methods.updateWhitelistBatch(addresses, 1).send({ from: ops })

         for (i = 0; i < addresses.length; i++) {
            assert.equal(await sale.methods.whitelist(addresses[i]).call(), 1)
         }
      })

      it('Set per account contribution limit', async () => {
         await sale.methods.setMaxTokensPerAccount(SALE_MAXTOKENSPERACCOUNT).send({ from: owner })
         assert.equal(new BigNumber(await sale.methods.maxTokensPerAccount().call()), SALE_MAXTOKENSPERACCOUNT)
      })

      it('Set the token price', async () => {
         await sale.methods.setTokensPerKEther(SALE_TOKENSPERKETHER).send({ from: owner })
         assert.equal(await sale.methods.tokensPerKEther().call(), SALE_TOKENSPERKETHER)
      })

      it('Give tokens to the sale contract', async () => {
         await token.methods.transfer(sale._address, SALE_TOKENS).send({ from: owner })
         assert.equal(new BigNumber(await token.methods.balanceOf(sale._address).call()), SALE_TOKENS)
      })
   })


   context('During Sale', async () => {


      before(async () => {
         await sale.methods.changeTime(SALE_STARTTIME + 1).send({ from: owner })
      })


      it('Contributor buys max allowed tokens', async () => {
         await buyTokens(account7, account7, -1)
      })

      it('Raise per account contribution limit', async () => {
         await sale.methods.setMaxTokensPerAccount(SALE_MAXTOKENSPERACCOUNT.times(2)).send({ from: owner })
      })

      it('Contributor buys max allowed tokens (again)', async () => {
         await buyTokens(account7, account7, -1)
      })

      it('Remove per account contribution limit', async () => {
         await sale.methods.setMaxTokensPerAccount(0).send({ from: owner })
      })

      it('Contributor buys all remaining tokens', async () => {
         await buyTokens(account7, account7, -1)

         assert.equal(new BigNumber(await sale.methods.totalTokensSold().call()), SALE_TOKENS)
      })
   })


   context('After Sale', async () => {

      it('Reclaim unsold tokens', async () => {
         const ownerTokensBefore = new BigNumber(await token.methods.balanceOf(owner).call())
         const saleTokensBefore = new BigNumber(await token.methods.balanceOf(sale._address).call())

         await sale.methods.reclaimTokens().send({ from: owner })

         const ownerTokensAfter = new BigNumber(await token.methods.balanceOf(owner).call())
         const saleTokensAfter = new BigNumber(await token.methods.balanceOf(sale._address).call())

         assert.isTrue(saleTokensBefore.eq(0))
         assert.equal(saleTokensAfter, new BigNumber(0))

         assert.equal(ownerTokensAfter.minus(ownerTokensBefore), 0)
      })

      it('Finalize the token', async () => {
         assert.equal(await token.methods.finalized().call(), false)
         await token.methods.finalize().send({ from: owner })
         assert.equal(await token.methods.finalized().call(), true)
      })

      it('Finalize the sale', async () => {
         assert.equal(await sale.methods.finalized().call(), false)
         await sale.methods.finalize().send({ from: owner })
         assert.equal(await sale.methods.finalized().call(), true)
      })

      it('User staking tokens', async () => {
         const balance = new BigNumber(await token.methods.balanceOf(account7).call())
         assert.isTrue(balance.gt(0))

         await token.methods.approve(staking._address, 1000).send({ from: account7 })
         assert.equal(await staking.methods.stakeTokens(1000).call({ from: account7 }), true)
         o = await staking.methods.stakeTokens(1000).send({ from: account7 })

         assert.equal(await staking.methods.stakes(account7).call(), 1000)
      })

      it('User staking more tokens', async () => {
         await token.methods.approve(staking._address, 500).send({ from: account7 })
         assert.equal(await staking.methods.stakeTokens(500).call({ from: account7 }), true)
         o = await staking.methods.stakeTokens(500).send({ from: account7 })

         assert.equal(await staking.methods.stakes(account7).call(), 1500)
      })

      it('User unstaking partially', async () => {
         assert.equal(await staking.methods.unstakeTokens(1250).call({ from: account7 }), true)
         await staking.methods.unstakeTokens(1250).send({ from: account7 })

         assert.equal(await staking.methods.stakes(account7).call(), 250)
      })
   })
})
