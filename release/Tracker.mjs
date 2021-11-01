import fetch from 'node-fetch';
import {QUEUE_ID, AUTH_TOKEN, BASE_URL} from './constant.mjs';

export class Tracker {
    static requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `OAuth ${AUTH_TOKEN}`,
        'X-Org-Id': QUEUE_ID
    };

    /**
     * @param {Object} body 
     * @returns {Promise<Array>}
     */
     static async getTasks(body) {
        const res = fetch(
            `${BASE_URL}/_search`,
            {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.requestHeaders
            }
        );

        const data = await res;
        return await data.json();
    }

    /**
     * @param {Number|String} taskId 
     * @param {Object} body 
     * @returns {Promise<boolean>}
     */
     static async addCommentToTask(taskId, body) {
        const res = fetch(
            `${BASE_URL}/${taskId}/comments`,
            {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.requestHeaders
            }
        );

        return (await res).ok;
    }

    /**
     * @param {Object} body 
     * @returns {Promise<boolean>}
     */
    static async createTask(body) {
        const res = fetch(
            BASE_URL,
            {
                method: 'POST',
                body: JSON.stringify(body),
                headers: this.requestHeaders
            }
        );

        let data = await res;
        return await data.json();
    }
}