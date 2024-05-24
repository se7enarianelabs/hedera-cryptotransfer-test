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
} = require("@hashgraph/sdk");

function tokenCreateTransactionBuilder(
    adminAccountId,
    adminPrivateKey,
    treasuryAccount,
    name = "Test",
    symbol = "T"
) {
    return new TokenCreateTransaction()
        .setTokenType(TokenType.FungibleCommon)
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTreasuryAccountId(treasuryAccount)
        .setSupplyKey(adminPrivateKey)
        .setAdminKey(adminPrivateKey)
        .setMaxTransactionFee(new Hbar(30)); //Change the default max transaction fee
}

class HederaFT {
    async createFT(
        adminAccountId = getOperatorId(),
        adminPrivateKey = getOperatorPrivateKey(),
        treasuryAccount = getOperatorId(),
        name = "Test",
        symbol = "T",
        client = getClient()
    ) {
        //Create the transaction and freeze for manual signing
        const transaction = await tokenCreateTransactionBuilder(
            adminAccountId,
            adminPrivateKey,
            treasuryAccount,
            name,
            symbol
        ).freezeWith(client);

        const signTx = await transaction.sign(adminPrivateKey);
        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        const tokenId = receipt.tokenId;
        console.log("The new token ID is " + tokenId);

        this.tokenId = tokenId;
        this.tokenSolidityAddress =
            "0x" + tokenId.toSolidityAddress().toLowerCase();
        this.adminKey = adminPrivateKey;
        this.supplyKey = adminPrivateKey;
        return this;
    }

    async mintFT(amount,client = getClient()) {
        //Mint another 1,000 tokens and freeze the unsigned transaction for manual signing
        const transaction = await new TokenMintTransaction()
            .setTokenId(this.tokenId)
            .setAmount(amount)
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

module.exports = { HederaFT };
