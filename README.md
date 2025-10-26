semplicemente incollarlo nel tuo progetto GitHub alla radice (README.md):

# 🏗️ TokenFactory — Create Your Own ERC20 Tokens on Base

A decentralized **ERC20 Token Factory** built on the **Base network**, allowing anyone to create and deploy customizable tokens instantly — with automatic badges based on total supply created.

---

## 🚀 Features

- **Instant Token Creation:** Deploy an ERC20 token with a single transaction.  
- **Badge System:** Earn badges based on your total minted supply:  
  - 🟢 **New Creator** — less than 10,000 total supply  
  - 🔵 **Novice Creator** — over 10,000  
  - 🟣 **Token Master** — over 100,000  
  - 🟡 **Super Minter** — over 1,000,000  
- **Transparent Fee Model:** Fixed base creation fee (currently `0.00005 ETH`).  
- **Secure Withdrawals:** Safe ETH handling using nonReentrant + Address utilities.  
- **Fully Ownable:** Only the contract owner can withdraw collected platform fees.  
- **Base Network Compatible:** Optimized for [Base Mainnet](https://basescan.org).

---

## 📜 Smart Contracts

**Main Contract:** [`TokenFactory.sol`](contracts/TokenFactory.sol)

### 🔧 Core Functions

| Function | Description |
|-----------|-------------|
| `createToken(string name, string symbol, uint256 supply)` | Deploys a new ERC20 token and assigns all minted tokens to the creator. |
| `withdraw()` | Withdraws any pending ETH refunds. |
| `withdrawFees()` | Allows the contract owner to withdraw collected platform fees. |
| `getBadge(address user)` | Returns the badge earned based on total supply created. |
| `totalTokensCreated()` | Returns total number of tokens deployed via the factory. |

---

## 💰 Fee Structure

- **Base Creation Fee:** `0.00005 ETH`  
- **Excess Refund:** Any ETH sent above the base fee is automatically refunded to your balance.

---

## 🧱 Example Usage

### Create a Token (Ethers.js)
```js
const factory = new ethers.Contract(factoryAddress, abi, signer);
const tx = await factory.createToken(
  "SanCoin",
  "SAN",
  100000,
  { value: ethers.utils.parseEther("0.00005") }
);
await tx.wait();
console.log("Token created!");

Get Your Badge
const badge = await factory.getBadge(userAddress);
console.log("Your badge:", badge);

🌍 Deployment
Network	Status	Explorer
Base Mainnet	✅ Active	View on BaseScan

Contract Owner: 0x4e9ec042f7d74ab1006b11dab61893388b3a19dd

🧠 Tech Stack

Solidity ^0.8.20

OpenZeppelin (ERC20, Ownable, ReentrancyGuard, Address)

Verified on BaseScan

Compatible with Remix / Hardhat / Foundry

🛡️ Security

✅ No admin control over user tokens — creators are full owners

✅ No proxy pattern — simple, immutable smart contracts

✅ Reentrancy protection and safe ETH transfers

👤 Author

Fahd El Atifi (Sanlui)

GitHub: @sanlui

Project: saname.base.eth

Website: Disrole.com
