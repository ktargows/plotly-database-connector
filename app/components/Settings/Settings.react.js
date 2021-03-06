import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './Settings.css';
import DatabaseDropdown from './DatabaseDropdown/DatabaseDropdown.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import UserCredentials from './UserCredentials/UserCredentials.react';
import LoggerController from './Logger/LoggerController.react';
import Preview from './Preview/Preview.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import {APP_STATUS} from '../../constants/constants';

export default class Settings extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            configuration, configActions,
            ipc, ipcActions,
            connection, connectionActions
        } = this.props;

        const dialectSelector = (
            <div>
                <DialectSelector
                    configActions={configActions}
                    configuration={configuration}
                />
            </div>
        );

        const userCredentials = (
            <UserCredentials
                configuration={configuration}
                configActions={configActions}
            />
        );

        const connectButton = (
            <ConnectButton
                configuration={configuration}
                connection={connection}
                connectionActions={connectionActions}
                ipc={ipc}
                ipcActions={ipcActions}
            />
        );

        const databasePreview = (
            <div>

                <DatabaseDropdown
                    configuration={configuration}
                    configActions={configActions}
                    ipcActions={ipcActions}
                    ipc={ipc}
                />

                <div className={styles.previewController}>
                    <Preview ipc={ipc}/>
                </div>

            </div>
        );

        const logger = (
            <LoggerController ipc={ipc}/>
        );

        const step1 = (
            <div>
                <h5>1. Connect to Database</h5>
                <div className={styles.configurationOptions}>
                    <div className={styles.dialectSelector}>
                        {dialectSelector}
                    </div>
                    <div className={styles.userCredentials}>
                        {userCredentials}
                    </div>
                </div>
                <div className={styles.connectButton}>
                    {connectButton}
                </div>
            </div>
        );

        let step2 = null;
        let step3 = null;

        if (connection.get('status') === APP_STATUS.CONNECTED ||
            connection.get('status') === APP_STATUS.ERROR) {
            step2 = (
                <div className={styles.step2Container}>
                    <h5>2. Select Database and Preview Tables</h5>
                    {databasePreview}
                </div>
            );

            step3 = (
                <div className={styles.step3Container}>
                    <h5>3. Query from Plotly 2.0</h5>
                    <div>
                        Query data by importing data from
                        plot.ly website via SQL.<br/>
                        Remember to keep this app running
                        while you are making queries!
                    </div>
                </div>
            );
        }

        const logContainer = (
            <div className={styles.logContainer}>
                <hr/>
                <div className={styles.log}>
                    {logger}
                </div>
            </div>
        );

        return (
            <div className={styles.containerWrapper}>

                <div className={styles.container}>
                    <img
                        src="./images/plotlyLogo.png"
                        className={styles.plotlyLogo}
                    >
                    </img>
                    <h4>
                        Plotly 2.0 Database Connector
                    </h4>

                    {step1}
                    {step2}
                    {step3}
                    {logContainer}

                </div>

            </div>
        );
    }
}

Settings.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    configActions: PropTypes.object,
    ipc: ImmutablePropTypes.map.isRequired,
    ipcActions: PropTypes.object,
    connection: ImmutablePropTypes.map.isRequired,
    connectionActions: PropTypes.object
};
