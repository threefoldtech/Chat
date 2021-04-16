import express, { Application } from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import fileupload from 'express-fileupload';
import cors, { CorsOptions } from 'cors';
import session from 'express-session';
import { startSocketIo } from './service/socketService';
import routes from './routes';
import morgan from 'morgan';
import { logger, httpLogger } from './logger';
import { initKeys } from './store/keyStore';
import { initUserData } from './store/user';

const corsOptions: CorsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

const app: Application = express();
const httpServer: http.Server = http.createServer(app);

startSocketIo(httpServer);

app.use(
    morgan('short', {
        stream: {
            write: (text: string) => {
                httpLogger.http(text);
            },
        },
    })
);

app.use(cors(corsOptions));

// app.enable('trust proxy');
app.set('trust proxy', 1);

app.use(
    session({
        name: 'sessionId',
        secret: 'secretpassphrase',
        resave: false,
        saveUninitialized: false,
        proxy: true,
        cookie: {
            path: '/',
            httpOnly: false,
            secure: false,
        },
    })
);

app.use(bodyParser.raw());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    fileupload({
        limits: { filesize: 50 * 1024 * 1024 },
    })
);

app.use('/api/', routes);

//Reading data
initKeys();
initUserData();

httpServer.listen(3000, 'localhost', () => {
    logger.info('go to http://localhost:3000');
});
