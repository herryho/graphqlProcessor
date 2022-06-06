import fs from 'fs';

const main = async () => {
  const merkleId = '16';
  const dataPath = './phaMerkle.json';
  const merkleInfo = JSON.parse(fs.readFileSync(dataPath).toString()).claims;

  const accounts = Object.keys(merkleInfo);
  console.log(`total accounts: ${accounts.length}`);

  const entryList = [];
  const proofList = [];
  // 准备两个表数据
  for (let i = 0; i < accounts.length; i++) {
    // 首先是merkle_entries数据
    const new_entry = {};
    const account = accounts[i];
    new_entry['merkle_entry_id'] = `${merkleId}-${account}`;
    new_entry['merkle_id'] = merkleId;
    new_entry['account'] = account;
    new_entry['index'] = merkleInfo[account].index;
    new_entry['amount'] = merkleInfo[account].amount;
    entryList.push(new_entry);

    // 然后准备proof表
    const proof_length = merkleInfo[account].proof.length;
    for (let proofIndex = 0; proofIndex < proof_length; proofIndex++) {
      const proof_item = {};
      proof_item['id'] = `${merkleId}-${account}-${proofIndex}`;
      proof_item['merkle_entry_id'] = `${merkleId}-${account}`;
      proof_item['proof_index'] = proofIndex;
      proof_item['proof'] = merkleInfo[account]['proof'][proofIndex];
      proofList.push(proof_item);
    }
  }

  // 写入merkle_entries json文件
  fs.writeFileSync(`phaEntryList.json`, JSON.stringify(entryList));
  // 写入proof表 json文件
  fs.writeFileSync(`phaProofList.json`, JSON.stringify(proofList));
};

main();
