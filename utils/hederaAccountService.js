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

require("dotenv").config();
require("fs");
const {
    AccountBalanceQuery,
    AccountId,
    TokenAssociateTransaction,
    ContractInfoQuery,
    PrivateKey,
    ContractId,
    AccountAllowanceApproveTransaction,
    TransferTransaction,
    AccountCreateTransaction,
    Hbar,
} = require("@hashgraph/sdk");
const { getClient, getOperatorId } = require("./hederaClientService");
const axios = require("axios");

require("dotenv").config();

async function tokenAssociate(
    tokenId,
    accountId,
    privateKey,
    client = getClient()
) {
    const transaction = await new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId])
        .freezeWith(client);

    const signTx = await transaction.sign(privateKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const transactionStatus = receipt.status;
    console.log(
        "The transaction consensus status " + transactionStatus.toString()
    );
}

async function approveTokenNftAllowanceAllSerials(
    tokenId,
    ownerId,
    spenderId,
    ownerPrivateKey,
    client = getClient()
) {

    //Create the transaction
    const transaction =
        new AccountAllowanceApproveTransaction().approveTokenNftAllowanceAllSerials(
            tokenId,
            ownerId,
            spenderId
        );

    //Sign the transaction with the owner account key
    const signTx = await transaction.freezeWith(client).sign(ownerPrivateKey);

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(
        "The transaction consensus status is" + transactionStatus.toString()
    );

    //v2.13.0
}



async function approveHBAR(
    ownerId,
    spenderId,
    ownerPrivateKey,
    amount,
    client = getClient()
) {
    //Create the transaction
    const transaction = new AccountAllowanceApproveTransaction()
        .approveHbarAllowance(ownerId, spenderId, Hbar.from(amount))
        .freezeWith(client)

    //Sign the transaction with the owner account key
    const signTx = await transaction.sign(ownerPrivateKey);

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await signTx.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log("The transaction consensus status is " + transactionStatus.toString());

//v2.13.0
    //v2.13.0
}

async function getHbarBalance(accountId, client = getClient()) {
    //Create the account balance query
    const query = new AccountBalanceQuery().setAccountId(accountId);

    //Submit the query to a Hedera network
    const accountBalance = await query.execute(client);
    return accountBalance.hbars.toTinybars().toNumber();
}

async function transferHBar(
    accountIdSender,
    privateKeySender,
    accountIdReceiver,
    amount,
    client = getClient()
) {
    //Create the transfer transaction
    const transaction = new TransferTransaction()
        .addHbarTransfer(accountIdSender, amount * -1) //Sending account
        .addHbarTransfer(accountIdReceiver, amount) //Receiving account
        .freezeWith(client);

    const signTx = await transaction.sign(privateKeySender);

    const txResponse = await signTx.execute(client);
    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(
        "The transaction consensus status is " + transactionStatus.toString()
    );

    //v2.0.0
}

async function getHbarBalanceForContract(
    contractAddress,
    client = getClient()
) {
    const contractId = await fetchContractValue(contractAddress);

    const query = new ContractInfoQuery().setContractId(contractId);

    //Submit the query to a Hedera network
    const accountBalance = await query.execute(client);
    return accountBalance.balance.toTinybars().toNumber();
}

function getPrivateKeyForENV(id) {
    switch (process.env.NETWORK.toUpperCase()) {
        case "TESTNET":
            return PrivateKey.fromString(
                process.env[`TESTNET_ACCOUNT_${id}_PRIVATE_KEY`]
            );
    }
}

function getAccountIdForENV(id) {
    switch (process.env.NETWORK.toUpperCase()) {
        case "TESTNET":
            return AccountId.fromString(
                process.env[`TESTNET_ACCOUNT_${id}_ACCOUNT_ID`]
            );
    }
}

async function fetchContractValue(contractAddress) {
    const url = `${process.env.PREVIEWNET_MIRROR_NODE_ENDPOINT}${contractAddress}`;

    try {
        const response = await axios.get(url);
        const data = await response.data;
        return ContractId.fromString(data.account);
    } catch (error) {
        console.error(error);
    }
}

async function createECDSAAccount(initialBalance = 10, client = getClient()) {
    const privateKey = PrivateKey.generateECDSA();
    //Create the transaction
    const transaction = new AccountCreateTransaction()
        .setKey(privateKey.publicKey)
        .setInitialBalance(new Hbar(initialBalance));

    //Sign the transaction with the client operator private key and submit to a Hedera network
    const txResponse = await transaction.execute(client);

    //Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    //Get the account ID
    const newAccountId = receipt.accountId;
    const evmAddress = `0x${newAccountId.toSolidityAddress()}`;

    const transferToAliasTx = await new TransferTransaction()
        .addHbarTransfer(getOperatorId(), new Hbar(-1))
        .addHbarTransfer(newAccountId, new Hbar(1))
        .execute(client);

    await transferToAliasTx.getReceipt(client);


    return {
        accountId: newAccountId,
        evmAddress,
        privateKey
    }


    //v2.0.5
}



module.exports = {
    tokenAssociate,
    getPrivateKeyForENV,
    getAccountIdForENV,
    getHbarBalance,
    getHbarBalanceForContract,
    transferHBar,
    approveTokenNftAllowanceAllSerials,
    createECDSAAccount,
    fetchContractValue,
    approveHBAR
};
