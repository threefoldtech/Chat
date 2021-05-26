import { uuidv4 } from '@/common';

export enum Status {
    Info = 'Info',
    Success = 'Success',
    Error = 'Error'
}

export enum NotificationType {
    Info = 'Info',
    Progress = 'Progress'
}

type DestroyFn = (n: Notification) => void;
type ProgressListener = (p: number) => void;

export interface NotificationOptions {
    interval: number;
    destroy?: DestroyFn;
    onSuccess?: () => void;
    onFailed?: () => void;
}

export class Notification<T extends NotificationOptions = NotificationOptions> {
    id: string;
    type: NotificationType;
    title: string;
    text: string;
    private _options: T;
    timeoutIsTriggered = false;
    status: Status;

    constructor(status: Status, title: string, text: string, options: T) {
        this.id = uuidv4();
        this.status = status;
        this.type = NotificationType.Info;
        this.title = title;
        this.text = text;
        this._options = options;
        this.triggerDestroyTimeout();
    }

    canDestroy(): boolean {
        return this.status === Status.Success;
    }

    getFormattedText(): string {
        return this.text;
    }

    destroy() {
        console.log(this._options.destroy);
        this._options.destroy(this);
    }

    triggerDestroyTimeout() {
        if (!this.canDestroy() || this.timeoutIsTriggered) return;
        this.timeoutIsTriggered = true;
        setTimeout(() => this.destroy(), this._options.interval);
    }

    get key() {
        return `${this.id}-${this.status}`;
    }

    failed() {
        this.status = Status.Error;
        if (this._options.onFailed)
            this._options.onFailed();
    }

    success() {
        this.status = Status.Success;
        if (this._options.onSuccess)
            this._options.onSuccess();
    }
}

export interface ProgressNotificationOptions extends NotificationOptions {
    onSuccess?: () => void
}

export class ProgressNotification extends Notification<ProgressNotificationOptions> {
    max: number;
    private _progress: number;
    private _progressListener: ProgressListener;

    constructor(status: Status, title: string, text: string, max: number, start: number, options: ProgressNotificationOptions) {
        super(status, title, text, options);
        this.type = NotificationType.Progress;
        this.max = max;
        this._progress = start;
    }

    updateProgress(progress: number) {
        if (this.status === Status.Success || this.status === Status.Error || this.timeoutIsTriggered || progress > this.max || progress === this._progress) return;
        this._progress = progress;
        if (this._progressListener)
            this._progressListener(progress);
        this.triggerDestroyTimeout();
    }

    get progress() {
        return this._progress;
    }

    get isPercentage() {
        return this.max === 1;
    }

    setProgressListener(fn: ProgressListener): void {
        this._progressListener = fn;
    }

    getFormattedText(): string {
        return format(this.text, [this._progress.toString(), this.max.toString()]);
    }

    get key() {
        return `${super.key}-${this._progress}`;
    }

    failed() {
        super.failed();
        this.triggerDestroyTimeout();
    }

    success() {
        super.success();
        this.triggerDestroyTimeout();
    }
}

const format = (source: string, params: string[]) => {
    params.forEach((val, i) => {
        source = source.replace(new RegExp('\\{' + i + '\\}', 'g'), val);
    });
    return source;
};