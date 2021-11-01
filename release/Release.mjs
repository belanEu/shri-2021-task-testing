import {Tracker} from './Tracker.mjs';
import {QUEUE_NAME, APP} from './constant.mjs';
import {bash, bashAsync, htmlWrapper} from './helper.mjs'

export class Release {
    constructor() {
        this.currTagVersion = bash('git describe --abbrev=0 --match *-release');
        this.prevTagVersion = bash('git describe --abbrev=0 --tags "$(git rev-list --tags=*-release --skip=1 --max-count=1)" --match *-release');
        this._initReleaseChanges();
    }

    _initReleaseChanges() {
        const currTagData = bash(`git show ${this.currTagVersion} --no-patch`).replace(/\n/g, '<br/>');
        // коммиты между текущим релизным тэгом и предыдущим
        const changelog = bash(`git log ${this.prevTagVersion}..${this.currTagVersion} --pretty=medium`).replace(/\n/g, '<br/>'); 

        this.releaseChanges = `${currTagData}<br/><br/><br/>----<b>CHANGELOG</b>----<br/><br/>${changelog}`;
    }

    async run() {
        const tasks = await this._getTasks(this.currTagVersion);

        let success = false;
        if (tasks.length > 0) {
            success = await this._updateTaskReleaseData(tasks[0].id);
        } else {
            success = await this._createTaskReleaseData();
        }

        if (success) {
            let testsResult = await this._execTests();
            await this._fixTestsResultIntoTask(
                tasks[0].id,
                '----<b>TEST APP</b>----<br><br>'
                + testsResult
            );
            if (this._checkTestsResult(testsResult)) {
                let buildDockerImageResult = await this._buildDockerImage();
                await this._fixDockerBuildResult(
                    tasks[0].id,
                    '----<b>BUILD DOCKER IMAGE</b>----<br><br>'
                    + buildDockerImageResult
                );
            } else {
                await this._fixDockerBuildResult(tasks[0].id, 'BUILD DOCKER IMAGE skipped');
            }
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
    async _updateTaskReleaseData(taskId) {
        return await Tracker.addCommentToTask(
            taskId,
            { text: htmlWrapper(`<div>${this.releaseChanges}</div>`) }
        );
    }

    async _createTaskReleaseData() {
        return await Tracker.createTask({
            queue: QUEUE_NAME,
            summary: `RELEASE! tag ${this.currTagVersion}`,
            describtion: htmlWrapper(`<div>${this.releaseChanges}</div>`),
            unique: this.currTagVersion
        });
    }

    /**
     * @param {Number} taskId 
     * @returns {Promise<boolean>}
     */
    async _fixTestsResultIntoTask(taskId, result) {
        return await Tracker.addCommentToTask(
            taskId,
            { text: htmlWrapper(`<div>${result}</div>`) }
        );
    }

    /**
     * @param {Number} taskId 
     * @param {String} text 
     * @returns {Promise<boolean>}
     */
    async _fixDockerBuildResult(taskId, text) {
        return await Tracker.addCommentToTask(
            taskId,
            { text: htmlWrapper(`<div>${text}</div>`) }
        );
    }

    async _execTests() {
        return (await bashAsync('npm run test')).stderr.replace(/\n/g, '<br/>');
    }

    _checkTestsResult(result) {
        return !(result.includes('fail') && result.includes('FAIL'));
    }

    async _buildDockerImage() {
        return (await bashAsync(`docker build . -t ${APP}:${this.currTagVersion}`)).stdout
                .split('\n')
                .slice(-3)
                .join('<br/>');
    }
}
