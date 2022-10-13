const express = require('express');
const router = express.Router();
const lightwallet = require("eth-lightwallet");
const fs = require('fs');
const {User} = require('../models');

// TODO : lightwallet 모듈을 사용하여 랜덤한 니모닉 코드를 얻습니다.
router.post('/newMnemonic', async(req,res) => {
    try {
        const mnemonic = lightwallet.keystore.generateRandomSeed();
        return res.json({mnemonic});
    } catch (error) {
        console.log(err);
    }
    
});

// TODO : 니모닉 코드와 패스워드를 이용해 keystore와 address를 생성합니다.
router.post('/newWallet', async(req, res) => {
    const { password, mnemonic } = req.body;
    try {
        lightwallet.keystore.createVault({
            seedPhrase: mnemonic,
            password,
            hdPathString: "m/0'/0'/0'",
        },
        (err, ks) => {
            ks.keyFromPassword(password, (err, pwDerivedKey) => {
                ks.generateNewAddress(pwDerivedKey, 1);
                const address = ks.getAddresses().toString();
                const keystore = ks.serialize();

                fs.writeFile("/wallets/wallet.json", keystore, (err, data) => {
                    if (err) {
                        return res.json({ code: 999, message: '실패'});
                    }

                    return res.json({ code: 1, message: '성공'});
                })
            })
        })
    } catch (error) {
        console.log(error);
    }
});

router.post('/user', async (req, res) => {
    let {userName: reqUserName, password: reqPassword} = req.body;
    User.findOrCreate({
        where: {
            userName: reqUserName,
        },
        default: {
            password: reqPassword
        }
    }).then(([user, created]) => {
        if (!created) {
            return res.status(409).send("User exists");
        } else {
            let mnemonic;
            mnemonic = lightwallet.keystore.generateRandomSeed();

            mnemonic = lightwallet.keystore.createVault({
                password: reqPassword,
                seedPhrase: mnemonic,
                hdPathString: "m/0'/0'/0'"
            },
            (err, ks) => {
                ks.keyFromPassword(reqPassword, (err, pwDerivedKey) => {
                    ks.generateNewAddress(pwDerivedKey, 1);

                    let address = (ks.getAddresses()).toString();
                    let keyStore = ks.serialize();

                    User.update({
                        password: reqPassword,
                        address,
                        privateKey: mnemonic,
                    }, {
                        where: {
                            userName: reqUserName,
                        },
                    }).then(result => {
                        return res.json(address);
                    }).catch(error => {
                        console.log(error);
                    })
                })
            }
            )
        }
        
    })
    
})

module.exports = router;


/* 
1. mysql -u root -p
2. 비번입력
3. create database wallet
4. use wallet -- wallet database로 들어옴
5. create table user (....);
6. show tables -- 만들어졌는지 확인



*/

/*
1. 컬럼 추가 시 createdAt underscore 에러 : https://yangeok.github.io/node.js/2019/02/18/createdat-table-sequelize.html
2. 중요 - sequelize 기본 사용법 : https://baeharam.netlify.app/posts/Node.js/Node.js-Sequelize-%EB%8B%A4%EB%A3%A8%EA%B8%B0


*/