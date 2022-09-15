import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex, bnToBn } from '@polkadot/util';
import { sortAddresses } from '@polkadot/util-crypto';
import fs from 'fs';
import XLSX from 'xlsx';

require('dotenv').config();
const DATA_PATH = process.env.DATA_PATH;
const THRESHOLD = Number(process.env.THRESHOLD);
const OTHER_SIGNATORIES = process.env.OTHER_SIGNATORIES.split('|');

const MAX_WEIGHT = 99999999;

/**
 * Convert address format
 * @param {string} addr The address you want to convert.
 * @param {number} ss58Format The format you want to convert.
 * @returns {string} The address converted.
 */
const convertAddressFormat = (addr, ss58Format) => {
  let publicKey;
  try {
    // 如果是有效地址，刚对地址进行重新编码
    publicKey = isHex(addr) ? hexToU8a(addr) : decodeAddress(addr);
    return encodeAddress(publicKey, ss58Format);
  } catch {
    // 如果不是有效地址，则返回空
    return null;
  }
};

/* ********************************** */
// 读数据，处理数据
/* ********************************** */
const readSourceData = () => {
  let contributionJson = [];
  if (DATA_PATH.endsWith('xlsx')) {
    const xlsxSheet = XLSX.readFile(DATA_PATH).Sheets['Sheet1'];
    contributionJson = XLSX.utils.sheet_to_json(xlsxSheet);
  } else {
    contributionJson = JSON.parse(fs.readFileSync(DATA_PATH));
  }

  let correctedList = [];

  for (const { account, value } of contributionJson) {
    let dotAccount = convertAddressFormat(account, 0);

    // 如果数额小于0，则置0
    let bnValue = bnToBn(value) > bnToBn(0) ? bnToBn(value) : null;

    // 如果账户及金额均显示正常，则放入数组里
    if (dotAccount && bnValue) {
      correctedList.push({
        account: dotAccount,
        value: bnValue,
      });
    }
  }

  return correctedList;
};

/* ********************************** */
/* 生成批量交易数据，并打包成一个batch交易 */
/* ********************************** */
const generateTransactionList = (correctedList, api) => {
  //生成批量交易数据
  const transactionList = correctedList.map(({ account, value }) => {
    return api.tx.balances.transfer(account, value);
  });

  // 打包成batch交易
  return api.tx.utility.batchAll(transactionList);
};

/* ********************************** */
// 确保账号都转换成正确的polkadot地址     */
/* **********************************  */
const signTransaction = (batchTransaction, api) => {
  const other_sigs = sortAddresses(
    OTHER_SIGNATORIES.map((account) => convertAddressFormat(account, 0)),
  );

  // 构造多签交易
  const opaque_call = batchTransaction.method.toHex();
  console.log('opaque_call:', opaque_call);
  const multisig_tx = api.tx.multisig.asMulti(
    THRESHOLD,
    other_sigs,
    null,
    opaque_call,
    true,
    MAX_WEIGHT,
  );

  return multisig_tx;
};

/* ********************************** */
// 发出多签交易，并且打印相关事件          */
/* ********************************** */
const sendMultisigTransaction = async (signedTransaction, senderKeyring) => {
  const unsub = await signedTransaction.signAndSend(
    senderKeyring,
    async ({ status, events, dispatchError }) => {
      // 如果交易已经被执行
      if (status.isInBlock || status.isFinalized) {
        if (dispatchError != undefined) {
          console.log(`Failed: Send multisig extrinsic: ${status.asInBlock}`);
          console.log(dispatchError.toString());
        } else {
          const error_events = events.map(
            ({ event }) => `${event.section}.${event.method}(${event.data})`,
          );

          console.log(events);
        }
        unsub();
      }
    },
  );
};

export {
  convertAddressFormat,
  readSourceData,
  generateTransactionList,
  signTransaction,
  sendMultisigTransaction,
};
