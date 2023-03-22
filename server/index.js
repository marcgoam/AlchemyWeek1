const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp = require("ethereum-cryptography/secp256k1");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

const balances = {
  "18f738d7b1e8fadac651": 100, //30eafccfe7abdedb0ae879875d91450488b88b316b3939db2b5ea4accb0ce132
  "21d87d0121ed13aa8b83": 50, //6e181873331db9d8e85d171bb802127a52228939e6a5c19c389be4492ac91a04
  "34c8aadf7688ba4e9329": 75, //e0aa1907791c4fef93635e7c0b457d0c5fcb1b37139c4e94ec4325bdab860de5
};

const transactionCount = {
  "18f738d7b1e8fadac651": 0,
  "21d87d0121ed13aa8b83": 0,
  "34c8aadf7688ba4e9329": 0,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.get("/transactionCount/:sender", (req, res) => {
  const { sender } = req.params;
  setInitialTransactionCount(sender);
  res.send({ transactionCount: transactionCount[sender] });
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount, signature, recoveryBit } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  // const {signature, recoveryBit} = sign;
  // const sign = signature[0].toString();
  // const recoveryBit = signature[1].toString();
  const formattedSignature = Uint8Array.from(Object.values(signature));

  const msgToBytes = utf8ToBytes(recipient + amount);
  const msgHash = toHex(keccak256(msgToBytes));

  const publicKey = await secp.recoverPublicKey(
    msgHash,
    formattedSignature,
    recoveryBit
  );

  const verifyTx = secp.verify(formattedSignature, msgHash, publicKey);

  if (!verifyTx) {
    res.status(400).send({ message: "Invalid Transection" });
  }

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else if (sender == recipient) {
    res.status(400).send({ message: "Please! Enter Another address" });
  } else if (recipient && amount) {
    balances[sender] -= amount;
    balances[recipient] += amount;
    transactionCount[sender]++;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialTransactionCount(address) {
  if (!transactionCount[address]) {
    transactionCount[address] = 0;
  }
}

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
