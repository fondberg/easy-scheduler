import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './EasySchedulerApp';
import registerServiceWorker from './registerServiceWorker';
import ons from 'onsenui';
ons.platform.select('ios');


ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
