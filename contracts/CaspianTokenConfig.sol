pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// CaspianTokenConfig - Token Contract Configuration
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
// ----------------------------------------------------------------------------


contract CaspianTokenConfig {

    string  public constant TOKEN_SYMBOL      = "CSP";
    string  public constant TOKEN_NAME        = "Caspian Token";
    uint8   public constant TOKEN_DECIMALS    = 18;

    uint256 public constant DECIMALSFACTOR    = 10**uint256(TOKEN_DECIMALS);
    uint256 public constant TOKEN_TOTALSUPPLY = 1000000000 * DECIMALSFACTOR;
}

