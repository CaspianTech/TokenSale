// ----------------------------------------------------------------------------
// Caspian Unit Test Utilities
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on test utilities from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies Limited.
// https://www.enuma.io/
// ----------------------------------------------------------------------------

const TestLib = require('../../tools/testlib.js')
const StdUtils = require('../Enuma/lib/StdTestUtils.js')


module.exports.checkReclaimTokens = (receipt, from, to, amount) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 2)

   assert.equal(typeof receipt.events.Transfer, 'object')
   const transferEventArgs = receipt.events.Transfer.returnValues
   assert.equal(Object.keys(transferEventArgs).length, 6)
   assert.equal(transferEventArgs._from, from)
   assert.equal(transferEventArgs._to, to)
   assert.equal(transferEventArgs._value, amount)

   assert.equal(typeof receipt.events.TokensReclaimed, 'object')
   const reclaimEventArgs = receipt.events.TokensReclaimed.returnValues
   assert.equal(Object.keys(reclaimEventArgs).length, 2)
   assert.equal(reclaimEventArgs._amount, amount)
}


module.exports.checkUpdateWhitelist = (receipt, address, phase) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 1)
   assert.equal(typeof receipt.events.WhitelistUpdated, 'object')
   const eventArgs = receipt.events.WhitelistUpdated.returnValues
   assert.equal(Object.keys(eventArgs).length, 4)
   assert.equal(eventArgs._address, address)
   assert.equal(eventArgs._phase, phase)
}


module.exports.checkUpdateWhitelistBatch = (receipt, addresses, phase) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 1)
   assert.equal(typeof receipt.events.WhitelistUpdated, 'object')
   const eventsArray = receipt.events.WhitelistUpdated
   assert.equal(eventsArray.length, addresses.length)

   for (i = 0; i < addresses.length; i++) {
      const e = eventsArray[i]

      assert.equal(e.event, 'WhitelistUpdated')
      assert.equal(Object.keys(e.returnValues).length, 4)
      assert.equal(e.returnValues._address, addresses[i])
      assert.equal(e.returnValues._phase, phase)
   }
}


module.exports.checkStakeTokens = (receipt, account, amount) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 2)
   assert.equal(typeof receipt.events.TokensStaked, 'object')
   const eventArgs = receipt.events.TokensStaked.returnValues
   assert.equal(Object.keys(eventArgs).length, 4)
   assert.equal(eventArgs._account, account)
   assert.equal(eventArgs._amount, amount)
}


module.exports.checkUnstakeTokens = (receipt, account, amount) => {

   TestLib.checkStatus(receipt)

   assert.equal(Object.keys(receipt.events).length, 2)
   assert.equal(typeof receipt.events.TokensUnstaked, 'object')
   const eventArgs = receipt.events.TokensUnstaked.returnValues
   assert.equal(Object.keys(eventArgs).length, 4)
   assert.equal(eventArgs._account, account)
   assert.equal(eventArgs._amount, amount)
}


// Modified version of Enuma's StdTestLib.buyTokens to cover additional cases with:
//    - bonus amounts per stage
//    - tokens purchased per account
//
module.exports.buyTokens = async (token, sale, owner, wallet, DECIMALS_FACTOR, from, to, amount) => {

   //
   // Capture state before purchase
   //
   const saleTokensBefore          = new BigNumber(await token.methods.balanceOf(sale._address).call())
   const fromTokensBefore          = new BigNumber(await token.methods.balanceOf(from).call())
   const toTokensBefore            = new BigNumber(await token.methods.balanceOf(to).call())

   const saleEthBefore             = new BigNumber(await TestLib.getBalance(sale._address))
   const fromEthBefore             = new BigNumber(await TestLib.getBalance(from))
   const toEthBefore               = new BigNumber(await TestLib.getBalance(to))
   const walletEthBefore           = new BigNumber(await TestLib.getBalance(wallet))

   const totalTokensSoldBefore     = new BigNumber(await sale.methods.totalTokensSold().call())
   const totalEtherCollectedBefore = new BigNumber(await sale.methods.totalEtherCollected().call())

   const beneficiaryStage          = await sale.methods.whitelist(to).call()

   const bonus                     = new BigNumber(await sale.methods.bonus().call())
   var   tokensPerKEther           = new BigNumber(await sale.methods.tokensPerKEther().call())
   const maxTokensPerAccount       = new BigNumber(await sale.methods.maxTokensPerAccount().call())

   const gasPrice                  = await web3.eth.getGasPrice()


   //
   // Calculate costs, tokens, refund
   //
   var expectedTokens = null
   var expectedTokenCost = null
   var transferAmount = null

   var maxTokens = saleTokensBefore
   if (maxTokensPerAccount.gt(0)) {
      if (maxTokensPerAccount.lt(saleTokensBefore)) {
         maxTokens = maxTokensPerAccount
      }

      const tokensPurchased = await token.methods.balanceOf(to).call()

      const quotaLeft = maxTokensPerAccount.minus(tokensPurchased)

      if (quotaLeft.gt(0) && quotaLeft.lt(maxTokens)) {
         maxTokens = quotaLeft
      }
   }

   if (amount == -1) {
      // Set the token price to that we can buy everything with 1 ETH, to make it easier for testing
      tokensPerKEther = maxTokens.times(1000).div(DECIMALS_FACTOR).integerValue(BigNumber.ROUND_DOWN)

      if (tokensPerKEther.eq(0)) {
         tokensPerKEther = new BigNumber(1)
      }

      await sale.methods.setTokensPerKEther(tokensPerKEther).send({ from: owner })

      // Send 2 ETH to make sure we send way over the cost for purchasing the entire window
      transferAmount = new BigNumber(web3.utils.toWei('2', 'ether'))

      expectedTokens    = maxTokens
      expectedTokenCost = StdUtils.weiFromTokens(tokensPerKEther, expectedTokens, bonus).integerValue(BigNumber.ROUND_DOWN)
   } else {
      transferAmount    = amount
      expectedTokens    = StdUtils.tokensFromWei(tokensPerKEther, transferAmount, bonus).integerValue(BigNumber.ROUND_DOWN)

      if (expectedTokens.gt(maxTokens)) {
         expectedTokens    = maxTokens
         expectedTokenCost = StdUtils.weiFromTokens(tokensPerKEther, expectedTokens, bonus).integerValue(BigNumber.ROUND_DOWN)
      } else {
         expectedTokenCost = transferAmount
      }
   }


   //
   // Purchase the tokens
   //
   assert.equal(new BigNumber(await sale.methods.buyTokens(to).call({ from: from, value: transferAmount, gasPrice: gasPrice })), expectedTokens)
   const receipt = await sale.methods.buyTokens(to).send({ from: from, value: transferAmount, gasPrice: gasPrice })


   //
   // Capture state after purchase
   //
   const saleTokensAfter          = new BigNumber(await token.methods.balanceOf(sale._address).call())
   const fromTokensAfter          = new BigNumber(await token.methods.balanceOf(from).call())
   const toTokensAfter            = new BigNumber(await token.methods.balanceOf(to).call())

   const saleEthAfter             = new BigNumber(await TestLib.getBalance(sale._address))
   const fromEthAfter             = new BigNumber(await TestLib.getBalance(from))
   const toEthAfter               = new BigNumber(await TestLib.getBalance(to))
   const walletEthAfter           = new BigNumber(await TestLib.getBalance(wallet))

   const totalTokensSoldAfter     = new BigNumber(await sale.methods.totalTokensSold().call())
   const totalEtherCollectedAfter = new BigNumber(await sale.methods.totalEtherCollected().call())


   //
   // Validate state change
   //
   assert.equal(saleTokensAfter.minus(saleTokensBefore), expectedTokens.times(-1))

   if (from !== to) {
      assert.equal(fromTokensAfter.minus(fromTokensBefore), new BigNumber(0))
      assert.equal(toTokensAfter.minus(toTokensBefore), expectedTokens)
   } else {
      assert.equal(toTokensAfter.minus(toTokensBefore), expectedTokens)
   }

   assert.equal(totalTokensSoldAfter.minus(totalTokensSoldBefore), expectedTokens)
   assert.equal(totalEtherCollectedAfter.minus(totalEtherCollectedBefore), expectedTokenCost)

   const fromEthSpent     = fromEthBefore.minus(fromEthAfter)
   const gasUsed          = new BigNumber(receipt.gasUsed)
   const expectedEthSpent = expectedTokenCost.plus(gasUsed.times(gasPrice))
   assert.equal(fromEthSpent, expectedEthSpent)

   if (from !== to && to != wallet) {
      assert.equal(toEthAfter.minus(toEthBefore), new BigNumber(0))
   }

   assert.equal(walletEthAfter.minus(walletEthBefore), expectedTokenCost)


   //
   // Validate events
   //
   StdUtils.checkBuyTokens(receipt, from, to, expectedTokenCost, expectedTokens)
}

