/*-
 *
 * Hedera Hardhat Example Project
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const hre = require("hardhat");
const { expect } = require("chai");
const { HederaNFT } = require("../utils/hederaNFT");
const { getOperatorId, getOperatorPrivateKey } = require("../utils/hederaClientService");
const { createECDSAAccount, tokenAssociate, approveTokenNftAllowanceAllSerials, fetchContractValue, approveHBAR, getHbarBalance } = require("../utils/hederaAccountService");
const { CustomFee } = require("@hashgraph/sdk");
require("dotenv").config();

const GAS_LIMIT = 1000000;



describe("CryptoTransferTest", function () {
  let contractAddress;
  let signers;
  let contract;

  beforeEach(async function () {
    signers = await hre.ethers.getSigners();
    //Assign the first signer, which comes from the first privateKey from our configuration in hardhat.config.js, to a wallet variable.
    let wallet = signers[0];

    //Initialize a contract factory object
    //name of contract as first parameter
    //wallet/signer used for signing the contract calls/transactions with this contract
    const CryptoTransferTest = await ethers.getContractFactory("CryptoTransferTest", wallet);
    //Using already initialized contract factory object with our contract, we can invoke deploy function to deploy the contract.
    //Accepts constructor parameters from our contract
    const cryptoTransferTest = await CryptoTransferTest.deploy();
    //We use wait to receive the transaction (deployment) receipt, which contains contractAddress
    contractAddress = (await cryptoTransferTest.deployTransaction.wait())
      .contractAddress;
    contract = cryptoTransferTest;
  });

  it("should be able to transfer HBAR for NFT", async function () {
    const nft = await (new HederaNFT().createNFT());
    nft.mintNFT();
    const receiverAccount = await createECDSAAccount();
    await tokenAssociate(nft.tokenId, receiverAccount.accountId, receiverAccount.privateKey);
    const spenderId = (await fetchContractValue(contractAddress));
    await approveTokenNftAllowanceAllSerials(nft.tokenId, getOperatorId(), spenderId, getOperatorPrivateKey());
    await approveHBAR(receiverAccount.accountId, spenderId, receiverAccount.privateKey, 1);
    console.log({ "sender": receiverAccount.evmAddress, "receiver": signers[0].address });
    await contract.cryptoTransferPublic(receiverAccount.evmAddress, signers[0].address, nft.tokenSolidityAddress, nft.nftAmount, {
      value: ethers.utils.parseEther(String(1)),
      gasLimit: GAS_LIMIT,
    });
  });

  it("should be able to transfer HBAR for NFT with royaltyFee", async function () {
    const feeCollectionAccount = await createECDSAAccount(0);
    const hbarBalanceBefore = await getHbarBalance(feeCollectionAccount.accountId);
    const price = 33;
    const fee = price * 0.1;
    console.log({
      "feeCollectionAccount.accountId": feeCollectionAccount.accountId.toString()
    })
    console.log({
      "hbarBalanceBefore": hbarBalanceBefore
    })
    const nft = await (new HederaNFT().createNFTWithRoyaltyFee({
      feeCollectorAccountId: feeCollectionAccount.accountId
    }));
    nft.mintNFT();
    const receiverAccount = await createECDSAAccount(price);
    console.log({
      "receiverAccount.accountId": receiverAccount.accountId.toString()
    })
    await tokenAssociate(nft.tokenId, receiverAccount.accountId, receiverAccount.privateKey);
    const spenderId = (await fetchContractValue(contractAddress));
    await approveTokenNftAllowanceAllSerials(nft.tokenId, getOperatorId(), spenderId, getOperatorPrivateKey());
    await approveHBAR(receiverAccount.accountId, spenderId, receiverAccount.privateKey, price * 2);
    await contract.cryptoTransferPublic(receiverAccount.evmAddress, signers[0].address, nft.tokenSolidityAddress, nft.nftAmount, {
      value: ethers.utils.parseEther(String(33)),
      gasLimit: GAS_LIMIT,
    });

    const hbarBalanceAfter = await getHbarBalance(feeCollectionAccount.accountId);
    console.log({
      "hbarBalanceAfter": hbarBalanceAfter
    })
    expect(hbarBalanceAfter - hbarBalanceBefore).to.be.equal(fee);

  });
});
