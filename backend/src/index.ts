import express, { Application } from 'express';
import bodyParser from 'body-parser';
import fileupload from 'express-fileupload';
import cors, { CorsOptions } from 'cors';
import session from 'express-session';
import routes from './routes';
import morgan from 'morgan';
import { httpLogger } from './logger';
import { initKeys } from './store/keyStore';
import { initUserData } from './store/user';
import errorMiddleware from './middlewares/errorHandlingMiddleware';
import './utils/extensions';
import { initTokens } from './store/tokenStore';
import { initYggdrasil } from './service/yggdrasilService';

const corsOptions: CorsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
};

const app: Application = express();

app.use(
    morgan('short', {
        stream: {
            write: (text: string) => {
                httpLogger.http(text);
            },
        },
    }),
);
app.use(errorMiddleware);

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
    }),
);

app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }));
app.use(bodyParser.json({ limit: '100mb' }));

app.use(
    fileupload({
        useTempFiles: true,
        parseNested: true,
    }),
);

app.use('/api/', routes);
//Reading data
initKeys();
initUserData();
initTokens();
initYggdrasil();
