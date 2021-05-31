import nacl from 'tweetnacl';
import { encodeHex, getKeyPair } from './encryptionService';
import { exec } from 'child_process';

export interface YggdrasilConfig {
    signingPrivateKey: string;
    signingPublicKey: string;
    encryptionPrivateKey: string;
    encryptionPublicKey: string;
}

const replaceValues = async (generatedConfig: string, replaceConfig: YggdrasilConfig) => {
    let config = generatedConfig;
    config = config.replace(/EncryptionPublicKey: .*$/g, `EncryptionPublicKey: ${replaceConfig.encryptionPublicKey}`);
    config = config.replace(/EncryptionPrivateKey: .*$/g, `EncryptionPrivateKey: ${replaceConfig.encryptionPrivateKey}`);
    config = config.replace(/SigningPublicKey: .*$/g, `EncryptionPrivateKey: ${replaceConfig.signingPublicKey}`);
    config = config.replace(/SigningPrivateKey: .*$/g, `SigningPrivateKey: ${replaceConfig.signingPublicKey}`);
    return config;
};

const generateConfig = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const p = exec(' yggdrasil -genconf');
        p.stdout.on('data', (data) => {resolve(data as string)});
        p.stdout.on('error', (data) => {reject(data)})
    })
}

const saveConfigs = ()

export const yggdrasilInit = async (seed: string) => {
    try {
        seed = 'Frd9GGoV0l+1vRxtftwzb/8weS4ceuwsv6cenJ6uOls=';
        const chatSeed = `${seed}-chat`;
        const hash = nacl.hash(Buffer.from(chatSeed)).slice(0, 32);
        const signKeyPair = nacl.sign.keyPair.fromSeed(hash);
        const encryptionKeyPair = nacl.box.keyPair.fromSecretKey(hash);
        const replacements = {
            signingPublicKey: encodeHex(signKeyPair.publicKey),
            signingPrivateKey: encodeHex(signKeyPair.secretKey),
            encryptionPublicKey: encodeHex(encryptionKeyPair.publicKey),
            encryptionPrivateKey: encodeHex(encryptionKeyPair.secretKey)
        } as YggdrasilConfig

        console.log("Replcaing yggdrasil config with: ", replacements);
        const generatedConfig = await generateConfig();
        const config = replaceValues(generatedConfig, replacements);


    } catch (ex) {
        console.log(ex);
    }
};