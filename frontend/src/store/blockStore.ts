import axios from 'axios';
import config from '../../public/config/config';

let blocklist = [];

export const initBlocklist = async () => {
    try {
        const axiosResponse = await axios.get(`${config.baseUrl}api/blocked/`);
        blocklist = axiosResponse.data;
    } catch (e) {
        console.log('could not get blocklist');
    }
};

export const getBlockList = () => {
    return blocklist;
};

export const addUserToBlockList = userid => {
    blocklist.push(userid);
};

export const deleteBlockedEntry = async user => {
    await axios.delete(`${config.baseUrl}api/blocked/${user}/`);
};
