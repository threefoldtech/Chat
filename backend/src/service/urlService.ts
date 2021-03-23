export const getFullIPv6ApiLocation = (
    location: string,
    apiEndPoint: string
) => {
    return `http://[${location}]/api${apiEndPoint}`;
};
