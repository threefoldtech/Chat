import { DtId } from './../types/index';
import axios from 'axios';
import { ref } from 'vue';
import { reactive } from '@vue/reactivity';
import { useAuthState } from '@/store/authStore';
import { calcExternalResourceLink } from '../services/urlService';
import { Contact } from '@/types';

export const statusList = reactive<Object>({});
export const watchingUsers = [];

export const fetchStatus = async (digitalTwinId: DtId) => {
    const { user } = useAuthState();
    const locationApiEndpoint = '/api/user/getStatus';
    let location = '';
    if (digitalTwinId == user.id) {
        location = `${window.location.origin}${locationApiEndpoint}`;
    } else {
        location = calcExternalResourceLink(
            `http://[${
                watchingUsers[<string>digitalTwinId].location
            }]${locationApiEndpoint}`
        );
    }
    const response = await axios.get(location);
    let status = response.data;

    statusList[<string>digitalTwinId] = status;
    return status;
};

export const startFetchStatusLoop = (contact: Contact) => {
    if (watchingUsers.find(wu => wu === contact.id)) {
        return;
    }
    watchingUsers.push(contact.id);
    watchingUsers[<string>contact.id] = {
        location: contact.location,
    };
    fetchStatus(contact.id);

    setInterval(() => {
        try {
            fetchStatus(contact.id);
        } catch (e) {}
    }, 5000 * 60);
};
