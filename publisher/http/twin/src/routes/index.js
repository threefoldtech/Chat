"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const chats_1 = __importDefault(require("./chats"));
const messages_1 = __importDefault(require("./messages"));
const contacts_1 = __importDefault(require("./contacts"));
const user_1 = __importDefault(require("./user"));
const files_1 = __importDefault(require("./files"));
const group_1 = __importDefault(require("./group"));
const blocked_1 = __importDefault(require("./blocked"));
const filebrowser_1 = __importDefault(require("./filebrowser"));
const misc_1 = __importDefault(require("./misc"));
const routes = express_1.Router();
routes.use('/auth/', auth_1.default);
routes.use('/chats/', chats_1.default);
routes.use('/contacts/', contacts_1.default);
routes.use('/files/', files_1.default);
routes.use('/messages/', messages_1.default);
routes.use('/user/', user_1.default);
routes.use('/group/', group_1.default);
routes.use('/blocked/', blocked_1.default);
routes.use('/browse/', filebrowser_1.default);
routes.use('/', misc_1.default);
exports.default = routes;
