pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// CaspianTokenSaleMock - Mock Token Sale Contract
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
//
// Based on code from Enuma Technologies.
// Copyright (c) 2017 Enuma Technologies Limited.
// ----------------------------------------------------------------------------

import "./CaspianTokenSale.sol";


contract CaspianTokenSaleMock is CaspianTokenSale {

   uint256 public _now;


   constructor(address wallet, uint256 _currentTime) public
      CaspianTokenSale(wallet)
   {
      _now = _currentTime;
   }


   function currentTime() public view returns (uint256) {
      return _now;
   }


   function changeTime(uint256 _newTime) public onlyOwner returns (bool) {
      _now = _newTime;

      return true;
   }
}


