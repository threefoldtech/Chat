import { ref } from 'vue';
import {
    Notification, NotificationOptions,
    NotificationType,
    ProgressNotification,
    ProgressNotificationOptions,
    Status,
} from '@/types/notifications';

export const notifications = ref<Notification[]>([]);
export const addNotification = (n: Notification) => notifications.value.push(n);
const destroyNotification = (n: Notification) => {
    notifications.value = notifications.value.filter(x => x.id !== n.id);
    console.log("nots", notifications.value);
};

const defaultOptions = {
    interval: 5000,
    destroy: destroyNotification
} as NotificationOptions

export const createNotification = (title: string, text: string, options = defaultOptions) => {
    const n = new Notification(Status.Info, title, text, options);
    notifications.value.push(n);
    return n;
};

export const createErrorNotification = (title: string, text: string, options = defaultOptions) => {
    const n = new Notification(Status.Error, title, text, options);
    notifications.value.push(n);
    return n;
};

export const createPercentProgressNotification = (title: string, text: string, start = 0, options = defaultOptions as ProgressNotificationOptions) => {
    const n = new ProgressNotification(Status.Info, title, text, 1, start, options);
    notifications.value.push(n);
    return n;
};

export const createProgressNotification = (title: string, text, max: number, interval = 5000, start = 0, options = defaultOptions as ProgressNotificationOptions) => {
    const n = new ProgressNotification(Status.Info, title, text, max, start, options);
    notifications.value.push(n);
    return n;
};


