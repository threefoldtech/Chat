import { Router } from 'express';
import authRouter from './auth';
import chatsRouter from './chats';
import messageRouter from './messages';
import contactsRouter from './contacts';
import userRouter from './user';
import filesRouter from './files';
import groupUser from './group';
import blockedRouter from './blocked';

import misc from './misc';

const routes = Router();

routes.use('/auth/', authRouter);
routes.use('/chats/', chatsRouter);
routes.use('/contacts/', contactsRouter);
routes.use('/files/', filesRouter);
routes.use('/messages/', messageRouter);
routes.use('/user/', userRouter);
routes.use('/group/', groupUser);
routes.use('/blocked/', blockedRouter);
routes.use('/', misc);

export default routes;
