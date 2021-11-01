import {Tracker} from './Tracker.mjs';
import {QUEUE_NAME, APP} from './constant.mjs';
import {bash, bashAsync, htmlWrapper} from './helper.mjs'

export class Release {
    constructor(logger) {
        this.logger = logger;
        this.logger.info('Начало выполнения скрипта');
        
        this.currTagVersion = bash('git describe --abbrev=0');
        this.prevTagVersion = bash('git describe --abbrev=0 --tags "$(git rev-list --tags --skip=1 --max-count=1)"');
        this.logger.info(`Версия текущего тэга релиза: ${this.currTagVersion}`);
        this.logger.info(`Версия предыдущего тэга релиза: ${this.prevTagVersion}`);

        this._initReleaseChanges();
        this.logger.info('Оформлен changelog');
    }

    _initReleaseChanges() {
        const currTagData = bash(`git show ${this.currTagVersion} --no-patch`).replace(/\n/g, '<br/>');
        // коммиты между текущим релизным тэгом и предыдущим
        const changelog = bash(`git log ${this.prevTagVersion}..${this.currTagVersion} --pretty=medium`).replace(/\n/g, '<br/>'); 

        this.releaseChanges = `${currTagData}<br/><br/><br/>----<b>CHANGELOG</b>----<br/><br/>${changelog}`;
    }

    async run() {
        this.logger.info('Проверка задач в трекере по текущему тэгу');
        const tasks = await this._getTasks(this.currTagVersion);
        let taskId = tasks.length > 0 ? tasks[0].id : null;

        let success = false;

        if (taskId !== null) {
            this.logger.info('Была найдена задача по текущему тэгу. Обновление данных задачи');
            success = await this._updateTaskReleaseData(taskId);
        } else {
            this.logger.info('Нет задач по текущему тэгу. Создание новой задачи');
            taskId = (await this._createTaskReleaseData()).id;
            if (taskId) {
                success = true;
            }
        }

        if (success) {
            this.logger.info('Тестирование. Добавление рзультата в задачу по окончанию');
            let testsResult = await this._execTests();
            await this._fixTestsResultIntoTask(
                taskId,
                '----<b>TEST APP</b>----<br><br>'
                + testsResult
            );
            if (this._checkTestsResult(testsResult)) {
                this.logger.info('Тестирование пройдено успешно');
                this.logger.info('Сборка Docker-образа. Добавление результата в задачу по окончанию');

                let buildDockerImageResult = await this._buildDockerImage();

                if (buildDockerImageResult.includes('Success')) {
                    this.logger.info(`Docker-образ ${APP}:${this.currTagVersion} успешно собран`);
                }
                
                await this._fixDockerBuildResult(
                    taskId,
                    '----<b>BUILD DOCKER IMAGE</b>----<br><br>'
                    + buildDockerImageResult
                );
            } else {
                this.logger.warn('Тестирование не пройдено. Пропуск сборки Docker-образа');
                await this._fixDockerBuildResult(taskId, 'BUILD DOCKER IMAGE skipped');
            }
        } else {
            this.logger.warn('Безуспешные создание/обновление задачи');            
        }
        this.logger.info('Окончание выполнения скрипта');
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
            summary: `RELEASE! tag ${this.currTagVersion} (Evgeny Belan)`,
            description: htmlWrapper(`<div>${this.releaseChanges}</div>`),
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
