import nacl from 'tweetnacl';
import { encodeHex } from './encryptionService';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import PATH from 'path';
import { config } from '../config/config';

export interface YggdrasilConfig {
    signingPrivateKey: string;
    signingPublicKey: string;
    encryptionPrivateKey: string;
    encryptionPublicKey: string;
    peers: string;
}

const configPath = PATH.join(config.baseDir, 'yggdrasil.conf');
const jsonPath = PATH.join(config.baseDir, 'user', 'yggdrasil.json');

export let isInitialized = false;

const replaceValues = (generatedConfig: string, replaceConfig: YggdrasilConfig) => {
    let cfg = generatedConfig;
    cfg = cfg.replace(/EncryptionPublicKey: .*$/mg, `EncryptionPublicKey: ${replaceConfig.encryptionPublicKey}`);
    cfg = cfg.replace(/EncryptionPrivateKey: .*$/mg, `EncryptionPrivateKey: ${replaceConfig.encryptionPrivateKey}`);
    cfg = cfg.replace(/SigningPublicKey: .*$/mg, `SigningPublicKey: ${replaceConfig.signingPublicKey}`);
    cfg = cfg.replace(/SigningPrivateKey: .*$/mg, `SigningPrivateKey: ${replaceConfig.signingPrivateKey}`);
    cfg = cfg.replace(/Peers: \[]/mg, `Peers: ${config.yggdrasil.peers.length === 0 ? [] : `["${config.yggdrasil.peers.join('","')}"]`}`);
    return cfg;
};

const generateConfig = (): string => {
    return execSync('yggdrasil -genconf').toString();
};

const getReplacements = (seed: string) => {
    if (fs.existsSync(jsonPath)) {
        console.log('Existing replacements for yggdrasil found');
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
    const hash = nacl.hash(Buffer.from(seed)).slice(0, 32);
    const signKeyPair = nacl.sign.keyPair.fromSeed(hash);
    const encryptionKeyPair = nacl.box.keyPair.fromSecretKey(hash);
    return {
        signingPublicKey: encodeHex(signKeyPair.publicKey),
        signingPrivateKey: encodeHex(signKeyPair.secretKey),
        encryptionPublicKey: encodeHex(encryptionKeyPair.publicKey),
        encryptionPrivateKey: encodeHex(encryptionKeyPair.secretKey),
    } as YggdrasilConfig;
};

const saveConfigs = (conf: string, replacements: YggdrasilConfig) => {
    fs.writeFileSync(PATH.join(config.baseDir, 'yggdrasil.conf'), conf);
    fs.writeFileSync(PATH.join(config.baseDir, 'user', 'yggdrasil.json'), JSON.stringify(replacements));
};

const runYggdrasil = () => {
    spawnSync(`yggdrasil -useconffile ${configPath} -logto /var/log/yggdrasil/yggdrasil.log >> /var/log/yggdrasil/yggdrasil.log &`);
};

export const initYggdrasil = () => {
    if (!fs.existsSync(configPath)) return;
    console.log('Yggdrasil initialized');
    isInitialized = true;
    return;
}

export const setupYggdrasil = async (seed: string) => {
    const chatSeed = `${seed}-chat`;
    const replacements = getReplacements(chatSeed);
    console.log('Replacing yggdrasil config with: ', replacements);
    const generatedConfig = generateConfig();
    const config = replaceValues(generatedConfig, replacements);
    saveConfigs(config, replacements);
    runYggdrasil();
};