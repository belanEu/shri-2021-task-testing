import { execSync } from 'child_process';
import fetch from 'node-fetch';

const BASE_URL = 'https://api.tracker.yandex.net/v2/issues';
const AUTH_TOKEN = 'AQAAAAA7IE6_AAd46F8KihtUREqBrRXr7eV_5yU';
const QUEUE_ID = 6461097;

const bash = (command) => {
    return execSync(command).toString().trim();
};

// todo: реализовать логгирование!!!
// todo: выделить класс Tracker с static методами

class Tracker {
    static requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `OAuth ${AUTH_TOKEN}`,
        'X-Org-Id': QUEUE_ID
    };

    /**
     * 
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
     * 
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
}

class Release {
    constructor() {
        this.currTagVersion = bash('git describe --abbrev=0 --match *-release');
        this.prevTagVersion = bash('git describe --abbrev=0 --tags "$(git rev-list --tags=*-release --skip=1 --max-count=1)" --match *-release');
        this.initReleaseChanges();
    }

    initReleaseChanges() {
        const currTagData = bash(`git show ${this.currTagVersion} --no-patch`).replace(/\n/g, '<br/>');
        // коммиты между текущим релизным тэгом и предыдущим
        const changelog = bash(`git log ${this.prevTagVersion}..${this.currTagVersion} --pretty=medium`).replace(/\n/g, '<br/>'); 

        this.releaseChanges = `${currTagData}<br/><br/><br/>----<b>CHANGELOG</b>----<br/><br/>${changelog}`;
    }

    async run() {
        console.log(this.currTagVersion);
        console.log(this.prevTagVersion);
        console.log(this.releaseChanges);
        
        let testsPassed = false;
        // todo: testing first

        const tasks = await this._getTasks(this.currTagVersion);

        let success = false;
        if (tasks.length > 0) {
            // todo: add comment with changes
            success = await this._addCommentToTask(tasks[0].id);
        } else {
            // todo: create new task
        }

        if (success) {
            // todo: сборка docker-образа
        }
    }

    /**
     * @param {String} unique 
     * @returns {Promise<Array>}
     */
    async _getTasks(unique) {
        return await Tracker.getTasks({
            filter: { unique: unique }
        });
    }

    /**
     * 
     * @param {Number|String} taskId 
     * @returns {Promise<boolean>}
     */
    async _addCommentToTask(taskId) {
        return await Tracker.addCommentToTask(
            taskId,
            { text: `<#<html><head></head><body><div>${this.releaseChanges}</div></body></html>#>` }
        );
    }
}

const release = new Release();
release.run();
