// ----------------------------------------------------------------------------
// Staking Contract Tests
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on staking library tests from Enuma Technologies Limited.
// Copyright (c) 2018 Enuma Technologies Limited.
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const StdUtils = require('./Enuma/lib/StdTestUtils.js')
const Utils    = require('./lib/CaspianTestUtils.js')


// ----------------------------------------------------------------------------
// Tests Summary
// ----------------------------------------------------------------------------
// Construction and basic properties
//    - token
//    - stakes
//    - totalTokensStaked
// stakeTokens
//    - stake 0 tokens
//    - stake 1 token
//    - stake 1 more token
// unstakeTokens
//    - unstake 0 tokens
//    - unstake 1 token
//    - unstake all tokens + 1
//    - unstake all tokens
//    - unstake again (no tokens staked)
// Events
//    - TokensStaked
//    - TokensUnstaked
//       * Covered when appropriate in the different function tests.
//
describe('Staking Contract', () => {

   const TOKEN_NAME        = "CSP"
   const TOKEN_SYMBOL      = "Caspian Token"
   const TOKEN_DECIMALS    = 18
   const DECIMALS_FACTOR   = new BigNumber(10).pow(TOKEN_DECIMALS)
   const TOKEN_TOTALSUPPLY = new BigNumber("270000000").times(DECIMALS_FACTOR)


   var token = null
   var staking = null
   var accounts = null

   // Accounts used for testing
   var owner    = null
   var ops      = null
   var account1 = null

   var now = null


   before(async () => {
      await TestLib.initialize()

      accounts = await web3.eth.getAccounts()

      owner    = accounts[1]
      ops      = accounts[2]
      wallet   = accounts[3]
      account1 = accounts[4]

      var deploymentResult = null

      deploymentResult = await TestLib.deploy('FinalizableToken', [ TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOKEN_TOTALSUPPLY ], { from: owner })
      token = deploymentResult.instance

      deploymentResult = await TestLib.deploy('Staking', [ token._address ], { from: owner })
      staking = deploymentResult.instance

      await token.methods.finalize().send({ from: owner })

      now = Moment().unix()
   })


   context('Construction and basic properties', async () => {

      it('token', async () => {
         assert.equal(await staking.methods.token().call(), token._address)
      })

      it('stakes', async () => {
         assert.equal(await staking.methods.stakes(owner).call(), 0)
      })

      it('totalTokensStaked', async () => {
         assert.equal(await staking.methods.totalTokensStaked().call(), 0)
      })

      it('opsAddress', async () => {
         assert.isTrue(typeof staking.methods.opsAddress === 'undefined')
      })

      it('owner', async () => {
         assert.isTrue(typeof staking.methods.owner === 'undefined')
      })

      it('proposedOwner', async () => {
         assert.isTrue(typeof staking.methods.proposedOwner === 'undefined')
      })
   })


   context('stakeTokens', async () => {

      before(async () => {
         await token.methods.transfer(ops, new BigNumber("10000").times(DECIMALS_FACTOR)).send({ from: owner })
         await token.methods.transfer(account1, new BigNumber("10000").times(DECIMALS_FACTOR)).send({ from: owner })
      })


      it('stake 0 tokens', async () => {
         await token.methods.approve(staking._address, 50).send({ from: account1 })

         await TestLib.assertCallFails(staking.methods.stakeTokens(0).call({ from: account1 }))

         await token.methods.approve(staking._address, 0).send({ from: account1 })
      })

      it('stake 1 token', async () => {
         await token.methods.approve(staking._address, 1).send({ from: account1 })

         const accountBalanceBefore  = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceBefore  = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceBefore = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceBefore    = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedBefore     = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.equal(await staking.methods.stakeTokens(1).call({ from: account1 }), true)
         Utils.checkStakeTokens(await staking.methods.stakeTokens(1).send({ from: account1 }), account1, 1)

         const accountBalanceAfter   = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceAfter  = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceAfter  = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceAfter     = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedAfter      = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.equal(accountBalanceAfter.minus(accountBalanceBefore).toString(), -1)
         assert.equal(contractBalanceAfter.minus(contractBalanceBefore).toString(), 1)
         assert.equal(approvalBalanceAfter.minus(approvalBalanceBefore).toString(), -1)
         assert.equal(stakeBalanceAfter.minus(stakeBalanceBefore).toString(), 1)
         assert.equal(totalStakedAfter.minus(totalStakedBefore).toString(), 1)
      })

      it('stake 1 more token', async () => {
         await token.methods.approve(staking._address, 1).send({ from: account1 })

         const accountBalanceBefore  = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceBefore  = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceBefore = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceBefore    = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedBefore     = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.equal(await staking.methods.stakeTokens(1).call({ from: account1 }), true)
         Utils.checkStakeTokens(await staking.methods.stakeTokens(1).send({ from: account1 }), account1, 1)

         const accountBalanceAfter   = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceAfter  = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceAfter  = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceAfter     = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedAfter      = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.equal(accountBalanceAfter.minus(accountBalanceBefore).toString(), -1)
         assert.equal(contractBalanceAfter.minus(contractBalanceBefore).toString(), 1)
         assert.equal(approvalBalanceAfter.minus(approvalBalanceBefore).toString(), -1)
         assert.equal(stakeBalanceAfter.minus(stakeBalanceBefore).toString(), 1)
         assert.equal(totalStakedAfter.minus(totalStakedBefore).toString(), 1)
         assert.equal(contractBalanceAfter.toString(), 2)
         assert.equal(stakeBalanceAfter.toString(), 2)
         assert.equal(totalStakedAfter.toString(), 2)
      })
   })


   context('unstakeTokens', async () => {

      before(async () => {
         const tokensStaked = new BigNumber(await staking.methods.stakes(account1).call())
         assert.isTrue(tokensStaked.gt(1))
      })


      it('unstake 0 tokens', async () => {
         await TestLib.assertCallFails(staking.methods.unstakeTokens(0).call({ from: account1 }))
      })

      it('unstake 1 token', async () => {
         const accountBalanceBefore  = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceBefore = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceBefore = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceBefore    = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedBefore     = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.equal(await staking.methods.unstakeTokens(1).call({ from: account1 }), true)
         Utils.checkUnstakeTokens(await staking.methods.unstakeTokens(1).send({ from: account1 }), account1, 1)

         const accountBalanceAfter   = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceAfter  = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceAfter  = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceAfter     = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedAfter      = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.equal(accountBalanceAfter.minus(accountBalanceBefore).toString(), 1)
         assert.equal(contractBalanceAfter.minus(contractBalanceBefore).toString(), -1)
         assert.equal(approvalBalanceAfter.minus(approvalBalanceBefore).toString(), 0)
         assert.equal(stakeBalanceAfter.minus(stakeBalanceBefore).toString(), -1)
         assert.equal(totalStakedAfter.minus(totalStakedBefore).toString(), -1)
      })

      it('unstake all tokens + 1', async () => {
         const tokensStaked = new BigNumber(await staking.methods.stakes(account1).call())
         assert.isTrue(tokensStaked.gt(0))

         await TestLib.assertCallFails(staking.methods.unstakeTokens(tokensStaked.plus(1)).call({ from: account1 }))
      })

      it('unstake all tokens', async () => {
         const accountBalanceBefore  = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceBefore = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceBefore = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceBefore    = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedBefore     = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.isTrue(stakeBalanceBefore.gt(0))

         assert.equal(await staking.methods.unstakeTokens(stakeBalanceBefore).call({ from: account1 }), true)
         Utils.checkUnstakeTokens(await staking.methods.unstakeTokens(stakeBalanceBefore).send({ from: account1 }), account1, stakeBalanceBefore.toString())

         const accountBalanceAfter   = new BigNumber(await token.methods.balanceOf(account1).call())
         const contractBalanceAfter  = new BigNumber(await token.methods.balanceOf(staking._address).call())
         const approvalBalanceAfter  = new BigNumber(await token.methods.allowance(account1, staking._address).call())
         const stakeBalanceAfter     = new BigNumber(await staking.methods.stakes(account1).call())
         const totalStakedAfter      = new BigNumber(await staking.methods.totalTokensStaked().call())

         assert.equal(accountBalanceAfter.minus(accountBalanceBefore).toString(), stakeBalanceBefore)
         assert.equal(contractBalanceAfter.minus(contractBalanceBefore).toString(), stakeBalanceBefore.times(-1))
         assert.equal(approvalBalanceAfter.minus(approvalBalanceBefore).toString(), 0)
         assert.equal(stakeBalanceAfter.minus(stakeBalanceBefore).toString(), stakeBalanceBefore.times(-1))
         assert.equal(totalStakedAfter.minus(totalStakedBefore).toString(), stakeBalanceBefore.times(-1))
      })
   })
})
