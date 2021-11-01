import { execSync, exec } from 'child_process';

export const bash = (command) => {
    return execSync(command).toString().trim();
};

export const bashAsync = async (command) => {
    return new Promise(resolve => exec(command, (error, stdout, stderr) => {
        resolve({stdout, stderr});
    }));
};

export const htmlWrapper = (markup) => {
    return `<#<html><head></head><body>${markup}</body></html>#>`;
};
