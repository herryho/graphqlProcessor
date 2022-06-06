// 连接相关引入
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import fs from 'fs';

const main = async () => {
  const dataPath = './SDN.json';
  const contributionJson = JSON.parse(fs.readFileSync(dataPath).toString());
  const ss58Format = 5;

  const keys_list = Object.keys(contributionJson);
  const converted_object = {};

  for (const account of keys_list) {
    // 如果是有效地址，刚对地址进行重新编码
    const publicKey = isHex(account)
      ? hexToU8a(account)
      : decodeAddress(account);
    const convertedAccount = encodeAddress(publicKey, ss58Format);

    // 如果账户及金额均显示正常，则放入数组里
    if (convertedAccount) {
      converted_object[convertedAccount] = contributionJson[account];
    }
  }
  fs.writeFileSync(`sdnConverted.json`, JSON.stringify(converted_object));
};

main();
