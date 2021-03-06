import * as fs from 'fs';
import {app, BrowserWindow, Menu, shell} from 'electron';
import restify from 'restify';
import bunyan from 'bunyan';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import {ipcMessageReceive,
        serverMessageReceive,
        channel} from './messageHandler';

const timestamp = () => (new Date()).toTimeString();

const ipcMain = require('electron').ipcMain;

let menu;
let template;
let mainWindow = null;

const clearLog = () => fs.writeFile(OPTIONS.logpath, '');


if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false,
        width: OPTIONS.large ? 1024 : 728,
        height: 728
    });


    const logToFile = bunyan.createLogger({
        name: 'plotly-database-connector-logger',
        streams: [
            {
                level: 'info',
                path: OPTIONS.logpath
            }
        ]
    });

    function log(logEntry, code = 2) {

        // default log detail set to 1 (warn level) in ./args.js
        if (code <= OPTIONS.logdetail) {
            switch (code) {
                case 0:
                    logToFile.error(logEntry);
                    break;
                case 1:
                    logToFile.warn(logEntry);
                    break;
                case 2:
                    logToFile.info(logEntry);
                    break;
                default:
                    logToFile.info(logEntry);
            }

            if (!OPTIONS.headless) {
                mainWindow.webContents.send(channel, {
                    log: {
                        logEntry,
                        timestamp: timestamp()
                    }
                });
            }

        }
    }

    const sequelizeManager = new SequelizeManager(log);

    // clear the log if the file existed already and had entries
    clearLog();

    const server = restify.createServer();

    sequelizeManager.log(`Setting up server on port ${OPTIONS.port} ...`, 2);

    server.use(restify.queryParser());
    server.use(restify.CORS({
        origins: ['*'],
        credentials: false,
        headers: ['Access-Control-Allow-Origin']
    })).listen(OPTIONS.port);

    sequelizeManager.log('Done.', 2);

    sequelizeManager.log('Rendering the app...', 2);

    mainWindow.loadURL(`file://${__dirname}/app/app.html`);

    mainWindow.webContents.on('did-finish-load', () => {
        sequelizeManager.log('Rendering the app...', 2);

        // show window if it's not running in headless mode
        if (!OPTIONS.headless) {
            sequelizeManager.log('Running as headless.', 2);
            mainWindow.show();
            mainWindow.focus();
        }

        ipcMain.removeAllListeners(channel);
        ipcMain.on(channel, ipcMessageReceive(sequelizeManager));

        sequelizeManager.log('Setting up routes...', 2);

        // TODO: simplify this restify server routing code
        server.get('/connect', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/login', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/query', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/tables', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/disconnect', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/v0/connect', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/v0/login', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/v0/query', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/v0/tables', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );
        server.get('/v0/disconnect', serverMessageReceive(
            sequelizeManager, mainWindow.webContents)
        );

        sequelizeManager.log('Done.', 2);

    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.openDevTools();
    }

    if (process.platform === 'darwin') {
        template = [{
            label: 'Electron',
            submenu: [{
                label: 'About ElectronReact',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Services',
                submenu: []
            }, {
                type: 'separator'
            }, {
                label: 'Hide ElectronReact',
                accelerator: 'Command+H',
                selector: 'hide:'
            }, {
                label: 'Hide Others',
                accelerator: 'Command+Shift+H',
                selector: 'hideOtherApplications:'
            }, {
                label: 'Show All',
                selector: 'unhideAllApplications:'
            }, {
                type: 'separator'
            }, {
                label: 'Quit',
                accelerator: 'Command+Q',
                click() {
                    app.quit();
                }
            }]
        }, {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'Command+Z',
                selector: 'undo:'
            }, {
                label: 'Redo',
                accelerator: 'Shift+Command+Z',
                selector: 'redo:'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'Command+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'Command+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'Command+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'Command+A',
                selector: 'selectAll:'
            }]
        }, {
            label: 'View',
            submenu: (process.env.NODE_ENV === 'development') ? [{
                label: 'Reload',
                accelerator: 'Command+R',
                click() {
                    mainWindow.restart();
                }
            }, {
                label: 'Toggle Full Screen',
                accelerator: 'Ctrl+Command+F',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }, {
                label: 'Toggle Developer Tools',
                accelerator: 'Alt+Command+I',
                click() {
                    mainWindow.toggleDevTools();
                }
            }] : [{
                label: 'Toggle Full Screen',
                accelerator: 'Ctrl+Command+F',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }]
        }, {
            label: 'Window',
            submenu: [{
                label: 'Minimize',
                accelerator: 'Command+M',
                selector: 'performMiniaturize:'
            }, {
                label: 'Close',
                accelerator: 'Command+W',
                selector: 'performClose:'
            }, {
                type: 'separator'
            }, {
                label: 'Bring All to Front',
                selector: 'arrangeInFront:'
            }]
        }, {
            label: 'Help',
            submenu: [{
                label: 'Learn More',
                click() {
                    shell.openExternal('http://electron.atom.io');
                }
            }, {
                label: 'Documentation',
                click() {
                    shell.openExternal('https://github.com/' +
                        'atom/electron/tree/master/docs#readme');
                }
            }, {
                label: 'Community Discussions',
                click() {
                    shell.openExternal('https://discuss.atom.io/c/electron');
                }
            }, {
                label: 'Search Issues',
                click() {
                    shell.openExternal('https://github.com/' +
                        'atom/electron/issues');
                }
            }]
        }];
        menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    } else {
        template = [{
            label: '&File',
            submenu: [{
                label: '&Open',
                accelerator: 'Ctrl+O'
            }, {
                label: '&Close',
                accelerator: 'Ctrl+W',
                click() {
                    mainWindow.close();
                }
            }]
        }, {
            label: '&View',
            submenu: (process.env.NODE_ENV === 'development') ? [{
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click() {
                    mainWindow.restart();
                }
            }, {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }, {
                label: 'Toggle &Developer Tools',
                accelerator: 'Alt+Ctrl+I',
                click() {
                    mainWindow.toggleDevTools();
                }
            }] : [{
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }]
        }, {
            label: 'Help',
            submenu: [{
                label: 'Learn More',
                click() {
                    shell.openExternal('http://electron.atom.io');
                }
            }, {
                label: 'Documentation',
                click() {
                    shell.openExternal('https://github.com/' +
                        'atom/electron/tree/master/docs#readme');
                }
            }, {
                label: 'Community Discussions',
                click() {
                    shell.openExternal('https://discuss.atom.io/c/electron');
                }
            }, {
                label: 'Search Issues',
                click() {
                    shell.openExternal('https://github.com/' +
                        'atom/electron/issues');
                }
            }]
        }];
        menu = Menu.buildFromTemplate(template);
        mainWindow.setMenu(menu);
    }
});
