pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// ERC20Batch - Contract to help batching ERC20 operations.
// Enuma Blockchain Platform
//
// Copyright (c) 2017 Enuma Technologies Limited.
// https://www.enuma.io/
// ----------------------------------------------------------------------------

import "./ERC20Interface.sol";
import "./Owned.sol";
import "./Math.sol";


contract ERC20Batch is Owned {

   using Math for uint256;

   ERC20Interface public token;
   address public tokenHolder;


   event TransferFromBatchCompleted(uint256 _batchSize);


   constructor(address _token, address _tokenHolder) public
      Owned()
   {
      require(_token != address(0));
      require(_tokenHolder != address(0));

      token = ERC20Interface(_token);
      tokenHolder = _tokenHolder;
   }


   function transferFromBatch(address[] _toArray, uint256[] _valueArray) public onlyOwner returns (bool success) {
      require(_toArray.length == _valueArray.length);
      require(_toArray.length > 0);

      for (uint256 i = 0; i < _toArray.length; i++) {
         require(token.transferFrom(tokenHolder, _toArray[i], _valueArray[i]));
      }

      emit TransferFromBatchCompleted(_toArray.length);

      return true;
   }
}
