import { Router } from 'express';
import { getStatus, getAvatar, getLastSeen, updateAvatar, getImage } from '../store/user';
import { connections } from '../store/connections';
import { UploadedFile } from 'express-fileupload';
import { deleteAvatar, saveAvatar } from '../service/dataService';
import { uuidv4 } from '../common';
import { config } from '../config/config';
import { uint8ToBase64 } from '../service/encryptionService';
import { getPublicKey } from '../store/keyStore';

const router = Router();

router.get("/publickey", (req, res) => {
    const key = getPublicKey();
    const keyString = uint8ToBase64(key);
    res.json(keyString);
})

router.get('/getStatus', async (req, res) => {
    const isOnline = connections.getConnections().length ? true : false;
    const status = getStatus();
    const avatar = await getAvatar();
    const lastSeen = getLastSeen();
    const data = {
        status,
        avatar,
        isOnline,
        lastSeen,
    };
    // console.log("getStatus",data);
    res.json(data);
});

router.get('/avatar/:avatarId', async (req, res) => {
    if (!req.params.avatarId) {
        res.sendStatus(403);
    }
    let path = `${config.baseDir}user/avatar-${req.params.avatarId}`;
    res.download(path);
});

router.post('/avatar', async (req, resp) => {
    console.log(req.files);
    const file = <UploadedFile>req.files.file;
    const avatarId = uuidv4();
    await saveAvatar(file, avatarId);
    await deleteAvatar(getImage())

    updateAvatar(avatarId);
    const newUrl = await getAvatar();
    resp.status(200).json(newUrl);
});

export default router;
