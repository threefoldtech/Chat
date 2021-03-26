import { logger } from './../logger';
import { Router } from 'express';
import { user } from '../store/user';
import { connections } from '../store/connections';
import { UploadedFile } from 'express-fileupload';
import { deleteAvatar, saveAvatar } from '../service/dataService';
import { uuidv4 } from '../common';
import { config } from '../config/config';
import im from 'imagemagick';
import fs from 'fs';

const router = Router();

router.get('/getStatus', async (req, res) => {
    const isOnline = connections.getConnections().length ? true : false;
    const status = user.getStatus();
    const avatar = await user.getAvatar();
    const lastSeen = user.getLastSeen();
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
    const file = <UploadedFile>req.files.file;
    const avatarId = uuidv4();
    await saveAvatar(file.data, avatarId);
    await deleteAvatar(user.image)

    user.updateAvatar(avatarId);
    const newUrl = user.getAvatar();
    resp.status(200).json(newUrl);
});

export default router;
