import { popupCenter } from '@/services/popupService';

export const login = () => {
    return new Promise<void>(resolve => {
        const loginUrl = `/api/auth/signin`;
        const popup = popupCenter(loginUrl + "?username=" + window.location.host.split('.')[0], 'Threefold login', 800, 550);
        window.onmessage = async (e: MessageEvent) => {
            if (e.data.message !== 'LoginRedirectSuccess') {
                return;
            }
            popup?.close();

            let name = window.location.host.split('.')[0];
            const user = {
                name,
                image: `${window.location.origin}/api/user/avatar`,
                email: `${name.replace(/ /g, '')}@domain.com`,
            };
            localStorage.setItem('user', JSON.stringify(user));
            resolve();
        };
    });
};
