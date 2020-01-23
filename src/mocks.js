const fs = require('fs');
const request = require('request');
const properties = require('./utils/properties');
const logger = require('./utils/logger');

const mocksFolder = properties.get('mocks-path') ? properties.get('mocks-path') : process.cwd() + '/mocks/';

function run() {
    checkServerStatus()
        .then(() => initMocks())
        .catch(() => process.exit());
}

function checkServerStatus() {

    return new Promise((resolve, reject) => {
        request.get(`http://${properties.get('host')}:${properties.get('port')}/__admin/requests/`)
            .on('error', () => {
                logger.error('Server déconnecté.');
                reject();
            })
            .on('data', () => {
                logger.info('Server connecté.');
                resolve();
            });
    });
}

function initMocks() {

    fs.readdir(mocksFolder, (err, files) => {

        if (!files) {
            logger.error('Dossier mocks invalide, arrêt du processus.');
            process.exit();
        }

        files.forEach(file => {
            fs.readFile( mocksFolder + '/' + file, 'utf8', (err, data) => {
                if (err) {
                    throw new Error(JSON.stringify(err))
                }

                request.post(`http://${properties.get('host')}:${properties.get('port')}/__admin/mappings/new`, {form: data})
                    .on('error', () => {
                        logger.warn('Le server s\'est déconnecté, arrêt du processus.');
                        process.exit();
                    })
                    .on('response', (res) => {
                        if (res.statusCode >= 200 && res.statusCode < 400) {
                            logger.info(`Mock ${file} créé.`);
                        } else {
                            logger.error(`Mock non ${file} créé.`);
                        }
                    });
            });
        });
    });
}

run();
