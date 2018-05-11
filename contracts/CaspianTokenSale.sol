pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// CaspianTokenSale - Token Sale Contract
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on code from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies Limited.
// ----------------------------------------------------------------------------

import "./Enuma/FlexibleTokenSale.sol";
import "./CaspianTokenSaleConfig.sol";


contract CaspianTokenSale is FlexibleTokenSale, CaspianTokenSaleConfig {

   //
   // Whitelist
   //
   uint8 public currentPhase;

   mapping(address => uint8) public whitelist;


   //
   // Events
   //
   event WhitelistUpdated(address indexed _address, uint256 _phase);


   constructor(address wallet) public
      FlexibleTokenSale(INITIAL_STARTTIME, INITIAL_ENDTIME, wallet)
   {
      tokensPerKEther     = TOKENS_PER_KETHER;
      bonus               = BONUS;
      maxTokensPerAccount = TOKENS_ACCOUNT_MAX;
      contributionMin     = CONTRIBUTION_MIN;
      currentPhase        = 1;
   }


   // Allows the owner or ops to add/remove people from the whitelist.
   function updateWhitelist(address _address, uint8 _phase) external onlyOwnerOrOps returns (bool) {
      return updateWhitelistInternal(_address, _phase);
   }


   function updateWhitelistInternal(address _address, uint8 _phase) internal returns (bool) {
      require(_address != address(0));
      require(_address != address(this));
      require(_address != walletAddress);
      require(_phase <= 1);

      whitelist[_address] = _phase;

      emit WhitelistUpdated(_address, _phase);

      return true;
   }


   // Allows the owner or ops to add/remove people from the whitelist, in batches.
   function updateWhitelistBatch(address[] _addresses, uint8 _phase) external onlyOwnerOrOps returns (bool) {
      require(_addresses.length > 0);

      for (uint256 i = 0; i < _addresses.length; i++) {
         require(updateWhitelistInternal(_addresses[i], _phase));
      }

      return true;
   }


   // This is an extension to the buyToken function in FlexibleTokenSale which also takes
   // care of checking contributors against the whitelist. Since buyTokens supports proxy payments
   // we check that both the sender and the beneficiary have been whitelisted.
   function buyTokensInternal(address _beneficiary, uint256 _bonus) internal returns (uint256) {
      require(whitelist[msg.sender] >= currentPhase);
      require(whitelist[_beneficiary] >= currentPhase);

      return super.buyTokensInternal(_beneficiary, _bonus);
   }
}

