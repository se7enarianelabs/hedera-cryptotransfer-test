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

const { AccountId, PrivateKey, Client } = require("@hashgraph/sdk");
require("dotenv").config();

function getTestnetClient(
    operatorId = AccountId.fromString(process.env.TESTNET_OPERATOR_ACCOUNT_ID),
    operatorKey = PrivateKey.fromString(process.env.TESTNET_OPERATOR_PRIVATE_KEY)
) {
    return Client.forTestnet()
        .setOperator(operatorId, operatorKey)
        .setRequestTimeout(20000);
}

function getMainnetClient(
    operatorId = AccountId.fromString(process.env.MAINNET_OPERATOR_ACCOUNT_ID),
    operatorKey = PrivateKey.fromString(process.env.MAINNET_OPERATOR_PRIVATE_KEY)
) {
    return Client.forMainnet()
        .setOperator(operatorId, operatorKey)
        .setRequestTimeout(20000);
}

function getPreviewnetClient(
    operatorId = AccountId.fromString(process.env.PREVIEWNET_OPERATOR_ACCOUNT_ID),
    operatorKey = PrivateKey.fromStringECDSA(process.env.PREVIEWNET_OPERATOR_PRIVATE_KEY)
) {
    return Client.forPreviewnet()
        .setOperator(operatorId, operatorKey)
        .setRequestTimeout(20000);
}

function getClient() {
    switch (process.env.NETWORK.toUpperCase()) {
        case "TESTNET":
            return getTestnetClient(getOperatorId(), getOperatorPrivateKey());
        case "MAINNET":
            return getMainnetClient(getOperatorId(), getOperatorPrivateKey());
        case "PREVIEWNET":
            return getPreviewnetClient();
    }
}

function getOperatorPrivateKey() {
    switch (process.env.NETWORK.toUpperCase()) {
        case "TESTNET":
            return PrivateKey.fromStringECDSA(process.env.TESTNET_OPERATOR_PRIVATE_KEY);
        case "MAINNET":
            return PrivateKey.fromStringECDSA(process.env.MAINNET_OPERATOR_PRIVATE_KEY);
        case "PREVIEWNET":
            return PrivateKey.fromStringECDSA(process.env.PREVIEWNET_OPERATOR_PRIVATE_KEY);

    }
}

function getOperatorId() {
    switch (process.env.NETWORK.toUpperCase()) {
        case "TESTNET":
            return AccountId.fromString(process.env.TESTNET_OPERATOR_ACCOUNT_ID);
        case "MAINNET":
            return AccountId.fromString(process.env.MAINNET_OPERATOR_ACCOUNT_ID);
        case "PREVIEWNET":
            return AccountId.fromString(process.env.PREVIEWNET_OPERATOR_ACCOUNT_ID);
    }
}

module.exports = { getClient, getOperatorPrivateKey, getOperatorId };
