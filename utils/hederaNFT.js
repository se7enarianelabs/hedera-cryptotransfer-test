/*
 * Hedera Claimbox contracts
 *
 * Copyright (C) 2023 - 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const { getClient, getOperatorId, getOperatorPrivateKey } = require("./hederaClientService");
const {
    TokenCreateTransaction,
    Hbar,
    TokenType,
    TokenMintTransaction,
    AccountId,
    CustomFixedFee,
    CustomRoyaltyFee,
} = require("@hashgraph/sdk");

function tokenCreateTransactionBuilder(
    adminAccountId,
    adminPrivateKey,
    treasuryAccount,
    name = "Test",
    symbol = "T",
    fees
) {
    let transactionBuilder = new TokenCreateTransaction()
        .setTokenType(TokenType.NonFungibleUnique)
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTreasuryAccountId(treasuryAccount)
        .setSupplyKey(adminPrivateKey)
        .setAdminKey(adminPrivateKey)
        .setMaxTransactionFee(new Hbar(30)); //Change the default max transaction fee

    if (fees != null) {
        transactionBuilder.setCustomFees([fees]);
    }
    return transactionBuilder;
}

class HederaNFT {

    async createNFTWithRoyaltyFee(
        customFees = null,
        adminAccountId = getOperatorId(),
        adminPrivateKey = getOperatorPrivateKey(),
        treasuryAccount = getOperatorId(),
        name = "Test",
        symbol = "T",
        client = getClient()
    ) {
        let customFee = null;
        if (customFees != null) {
            customFee = //Create a custom token fixed fee
                new CustomRoyaltyFee()
                    .setNumerator(1) // The numerator of the fraction
                    .setDenominator(10) // The denominator of the fraction
                    .setFeeCollectorAccountId(customFees.feeCollectorAccountId) // The account that will receive the royalty fee


            //Version: 2.0.30
        }
        //Create the transaction and freeze for manual signing
        const transaction = await tokenCreateTransactionBuilder(
            adminAccountId,
            adminPrivateKey,
            treasuryAccount,
            name,
            symbol,
            customFee
        ).freezeWith(client);

        const signTx = await transaction.sign(adminPrivateKey);
        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const tokenId = receipt.tokenId;
        console.log("The new token ID is " + tokenId);

        this.tokenId = tokenId;
        this.tokenSolidityAddress =
            "0x" + tokenId.toSolidityAddress().toLowerCase();
        this.nftAmount = 0;
        this.adminKey = adminPrivateKey;
        this.supplyKey = adminPrivateKey;
        return this;
    }
    async createNFT(
        adminAccountId = getOperatorId(),
        adminPrivateKey = getOperatorPrivateKey(),
        treasuryAccount = getOperatorId(),
        name = "Test",
        symbol = "T",
        client = getClient()
    ) {
        return this.createNFTWithRoyaltyFee(
            null,
            adminAccountId,
            adminPrivateKey,
            treasuryAccount,
            name,
            symbol,
            client
        )

    }

    async mintNFT(client = getClient()) {
        //Mint another 1,000 tokens and freeze the unsigned transaction for manual signing
        const transaction = await new TokenMintTransaction()
            .setTokenId(this.tokenId)
            .addMetadata(Uint8Array.of(1))
            .freezeWith(client);

        const signTx = await transaction.sign(this.supplyKey);

        const txResponse = await signTx.execute(client);

        const receipt = await txResponse.getReceipt(client);

        const transactionStatus = receipt.status;

        console.log(
            "The transaction consensus status " + transactionStatus.toString()
        );

        return ++this.nftAmount;
    }
}

module.exports = { HederaNFT };
