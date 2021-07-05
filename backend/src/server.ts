import express, { Application } from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import fileupload from 'express-fileupload';
import cors, { CorsOptions } from 'cors';
import session from 'express-session';
import { startSocketIo } from './service/socketService';
import routes from './routes';
import morgan from 'morgan';
import { httpLogger } from './logger';
import errorMiddleware from './middlewares/errorHandlingMiddleware';
import './utils/extensions';
import { initAll } from './index';

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

initAll();

httpServer.listen(process.env.PORT ?? 3000, () => {
    console.log(`Server started on port ${process.env.PORT ?? 3000}`);
});