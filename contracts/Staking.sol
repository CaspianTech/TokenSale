pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// Staking - Caspian ERC20 Staking Contract
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on staking contract libraries from Enuma Technologies.
// Copyright (c) 2018 Enuma Technologies Limited.
// https://www.enuma.io/
// ----------------------------------------------------------------------------

import "./Enuma/ERC20Interface.sol";
import "./Enuma/Math.sol";


contract Staking {

   using Math for uint256;


   //
   // Fields
   //
   ERC20Interface public token;

   mapping(address => uint256) public stakes;

   uint256 public totalTokensStaked;


   //
   // Events
   //
   event TokensStaked(address indexed _account, uint256 _amount);
   event TokensUnstaked(address indexed _account, uint256 _amount);


   constructor(ERC20Interface _token) public
   {
      require(address(_token) != address(0));

      token = _token;
   }


   // Allows the caller to stake tokens. This relies on ERC20 allowances
   // so caller needs to call approve before calling stakeTokens.
   function stakeTokens(uint256 _amount) external returns (bool) {
      require(_amount > 0);

      address account = msg.sender;

      require(token.transferFrom(account, address(this), _amount));

      totalTokensStaked = totalTokensStaked.add(_amount);

      uint256 balance = token.balanceOf(address(this));
      require(balance >= totalTokensStaked);

      stakes[account] = stakes[account].add(_amount);

      emit TokensStaked(account, _amount);

      return true;
   }


   // Allows the caller to unstake tokens in any desired amount.
   // Tokens are immediately transferred back to the caller's address.
   function unstakeTokens(uint256 _amount) external returns (bool) {
      require(_amount > 0);

      address account = msg.sender;

      uint256 userStake = stakes[account];
      require(userStake >= _amount);

      stakes[account] = stakes[account].sub(_amount);

      totalTokensStaked = totalTokensStaked.sub(_amount);

      require(token.transfer(account, _amount));

      emit TokensUnstaked(account, _amount);

      return true;
   }
}


