export const calculateBaseUrl = userId => {
    let location = '';
    if (window.location.origin === 'http://localhost:8080') {
        return (location = 'http://localhost:3000');
    }
    let url: Array<String> = window.location.host.split('.');
    url.splice(0, 1);
    return (location = `https://${userId}.${url.join('.')}`);
};

export const calcExternalResourceLink = location => {
    location = location.replace("[201:bc4a:fd82:5db8:7403:ebbf:37df:f3c0]", "127.0.0.1:3010")
    return `${window.location.origin}/api/getExternalResource?resource=${location}`;
};
