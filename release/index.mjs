import {Release} from './Release.mjs';
import SimpleNodeLogger from 'simple-node-logger';

const logger = SimpleNodeLogger.createSimpleLogger({
    logFilePath: './release/release.log',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
});

try {
    const release = new Release(logger);
    release.run();
} catch (err) {
    logger.error(err);
}
