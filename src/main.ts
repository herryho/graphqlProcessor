import fs from 'fs';
import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';

const main = async () => {
  const dataPath = './kar_raindrops.json';
  // const dataPath = './kar1.json';
  const raindropList = JSON.parse(fs.readFileSync(dataPath).toString());

  // 获取所有账户
  const allAccounts = [];
  for (const item of raindropList.data.getCampaignTopList) {
    allAccounts.push(item.account);
  }

  // 对于每一个账户，获得它的收益

  const endpoint = 'https://dapp-api.bifrost.finance/rainbow-pro';
  const tokenList = ['KAR', 'MOVR', 'SDN', 'PHA', 'BNC'];
  const precisionList = [10 ** 12, 10 ** 18, 10 ** 18, 10 ** 12, 10 ** 12];

  const allObject = {};
  for (const token of tokenList) {
    allObject[token] = {};
  }

  for (const account of allAccounts) {
    const query = gql`
    {
      getPersonalRewards(
        account: "${account}"
      ) {
        token
        amount
      }
    }
  `;

    const data = await request(endpoint, query);

    for (const tokenReward of data.getPersonalRewards) {
      for (let i = 0; i < tokenList.length; i++) {
        const token = tokenList[i];
        const precision = precisionList[i];
        if (tokenReward.token == token) {
          if (tokenReward.amount > 0) {
            const amt = BigInt(
              new BigNumber(tokenReward.amount * precision)
                .multipliedBy(precision)
                .toFixed(0),
            ).toString(16);

            allObject[token][account] = amt;
          }
        }
      }
    }
  }

  const keyList = Object.keys(allObject);

  for (const key of keyList) {
    fs.writeFileSync(`${key}.json`, JSON.stringify(allObject[key]));
  }
};

main();
