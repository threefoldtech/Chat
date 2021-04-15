import messages from '../routes/messages';
import Message from '../models/message';

export interface UserInterface extends AnonymousContactInterface {
    image: string;
    status: string;
    lastSeen: number;
}

export interface AppInterface {
    id: string;
    name: string;
    url: string;
    iconUrl: string;
    sharedWith: UserInterface[];
    accessHistory: UserInterface[];
}

export interface TabInterface {
    name: string;
    icon: string;
}

export enum MessageTypes {
    STRING = 'STRING',
    SYSTEM = 'SYSTEM',
    GIF = 'GIF',
    MESSAGE = 'MESSAGE',
    FILE = 'FILE',
    FILE_UPLOAD = 'FILE_UPLOAD',
    EDIT = 'EDIT',
    READ = 'READ',
    CONTACT_REQUEST = 'CONTACT_REQUEST',
    DELETE = 'DELETE',
    GROUP_UPDATE = 'GROUP_UPDATE',
    QUOTE = 'QUOTE',
}

export enum MessageOperations {
    NEW = 'NEW',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export interface MessageInterface<T> extends MessageBodyTypeInterface {
    id: IdInterface;
    from: DtIdInterface;
    to: IdInterface | DtIdInterface;
    body: T;
    type: MessageTypes;
    timeStamp: Date;
    subject: IdInterface | null;
    replies: MessageInterface<MessageBodyTypeInterface>[];
    signatures: string[],
    updated?: Date | undefined;
}

export interface MessageBodyTypeInterface {}

export interface StringMessageTypeInterface extends MessageBodyTypeInterface {}

export interface ContactRequest
    extends MessageBodyTypeInterface,
        ContactInterface {}
export interface FileMessageType extends MessageBodyTypeInterface {
    filename: string;
    url: string;
}

export interface GroupUpdateType extends MessageBodyTypeInterface {
    type: string;
    contact: AnonymousContactInterface | ContactInterface;
    adminLocation: string;
}

export interface ChatInterface {
    chatId: IdInterface;
    messages: MessageInterface<MessageBodyTypeInterface>[];
    read: {
        [key: string]: string;
    };
    name: string;
}
export interface PersonChatInterface extends ChatInterface {
    chatId: DtIdInterface;
    messages: MessageInterface<MessageBodyTypeInterface>[];
}

export interface GroupChatInterface extends ChatInterface {
    chatId: IdInterface;
    contacts: (AnonymousContactInterface | ContactInterface)[];
}

export interface ContactInterface extends AnonymousContactInterface {
    id: DtIdInterface;
    location: string;
}

export interface AnonymousContactInterface {
    id: DtIdInterface;
}

export interface DtIdInterface extends IdInterface {
}

export interface IdInterface extends String {
}

const test: IdInterface = '';

export interface WorkspaceInterface extends GroupChatInterface {
    subGroups: GroupChatInterface[];
}
