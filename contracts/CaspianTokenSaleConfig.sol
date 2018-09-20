pragma solidity ^0.4.23;

// ----------------------------------------------------------------------------
// CaspianTokenSaleConfig - Token Sale Configuration
//
// Copyright (c) 2018 Caspian, Limited (TM).
// http://www.caspian.tech/
// ----------------------------------------------------------------------------

import "./CaspianTokenConfig.sol";


contract CaspianTokenSaleConfig is CaspianTokenConfig {

    //
    // Time
    //
    uint256 public constant INITIAL_STARTTIME    = 1538553600; // 2018-10-03, 08:00:00 UTC
    uint256 public constant INITIAL_ENDTIME      = 1538726400; // 2018-10-05, 08:00:00 UTC


    //
    // Purchases
    //

    // Minimum amount of ETH that can be used for purchase.
    uint256 public constant CONTRIBUTION_MIN     = 0.5 ether;

    // Price of tokens, based on the 1 ETH = 4000 CSP conversion ratio.
    uint256 public constant TOKENS_PER_KETHER    = 4000000;

    // Amount of bonus applied to the sale. 2000 = 20.00% bonus, 750 = 7.50% bonus, 0 = no bonus.
    uint256 public constant BONUS                = 0;

    // Maximum amount of tokens that can be purchased for each account. 0 for no maximum.
    uint256 public constant TOKENS_ACCOUNT_MAX   = 400000 * DECIMALSFACTOR; // 100 ETH Max
}

