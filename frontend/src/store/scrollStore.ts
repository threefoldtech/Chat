import { reactive } from '@vue/reactivity';

const state = reactive<State>({
    scrollEvents: [],
});

const addScrollEvent = () => {
    state.scrollEvents.push(<string>'scrollEvent');
};

export const useScrollState = () => {
    return {
        ...state,
    };
};

export const useScrollActions = () => {
    return {
        addScrollEvent,
    };
};

interface State {
    scrollEvents: string[];
}
