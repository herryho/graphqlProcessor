// 连接相关引入
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import fs from 'fs';
import XLSX from 'xlsx';

const main = async () => {
  let dataPath = './tokens_accounts_acala.xlsx';

  let contributionJson = [];
  if (dataPath.endsWith('xlsx')) {
    const xlsxSheet = XLSX.readFile(dataPath).Sheets['Sheet1'];
    contributionJson = XLSX.utils.sheet_to_json(xlsxSheet);
  } else {
    contributionJson = JSON.parse(fs.readFileSync(dataPath));
  }

  let correctedList = [];
  let ss58Format = 6;

  for (const { account } of contributionJson) {
    // 如果是有效地址，刚对地址进行重新编码
    let publicKey = isHex(account) ? hexToU8a(account) : decodeAddress(account);
    let convertedAccount = encodeAddress(publicKey, ss58Format);

    // 如果账户及金额均显示正常，则放入数组里
    if (convertedAccount) {
      correctedList.push({
        original: account,
        converted: convertedAccount,
      });
    }
  }

  const workSheet = XLSX.utils.json_to_sheet(correctedList);
  const workBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');
  XLSX.writeFile(workBook, './acala.xlsx');
};

main();
