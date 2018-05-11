pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// CaspianToken - ERC20 Compatible Token
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on code from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies Limited.
// ----------------------------------------------------------------------------

import "./Enuma/FinalizableToken.sol";
import "./CaspianTokenConfig.sol";


contract CaspianToken is FinalizableToken, CaspianTokenConfig {


   event TokensReclaimed(uint256 _amount);


   constructor() public
      FinalizableToken(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, TOKEN_TOTALSUPPLY)
   {
   }


   function reclaimTokens() public onlyOwner returns (bool) {

      address account = address(this);
      uint256 amount  = balanceOf(account);

      if (amount == 0) {
         return false;
      }

      balances[account] = balances[account].sub(amount);
      balances[owner] = balances[owner].add(amount);

      emit Transfer(account, owner, amount);

      emit TokensReclaimed(amount);

      return true;
   }
}

