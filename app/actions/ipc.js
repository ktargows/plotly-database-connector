import {createAction} from 'redux-actions';
import Immutable from 'immutable';
import {TASKS} from './../../messageHandler';

const ipcRenderer = require('electron').ipcRenderer;

export const UPDATE_STATE = 'UPDATE_STATE';

export const updateState = createAction(UPDATE_STATE);

export function query (statement) {
    return () => {
        ipcSend(TASKS.SEND_QUERY, {statement});
    };
}

export function connect (credentials) {
    return () => {
        ipcSend(TASKS.CONNECT, immutableToJS(credentials));
    };
}

export function selectDatabase () {
    return function (dispatch, getState) {
        const state = getState();
        ipcSend(TASKS.SELECT_DATABASE, state.configuration.toJS());
    };
}

export function disconnect () {
    return () => {
        ipcSend(TASKS.DISCONNECT);
    };
}

function immutableToJS(immutableThing) {
    let jsonThing = {};
    if (Immutable.Iterable.isIterable(immutableThing)) {
        jsonThing = immutableThing.toJS();
    }
    return jsonThing;
}

function ipcSend(task, message = {}) {
    ipcRenderer.send('channel', {task, message});
}
