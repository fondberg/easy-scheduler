import React, { Component } from 'react';

import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';
import {
  Button,
  Page,
  ProgressBar,
  Tab,
  Tabbar,
  Toolbar
} from 'react-onsenui';

import { GoogleApiContext, GoogleApiOptions } from './GoogleApiContext';
import { getCalendars } from './lib/calendar';

import DatePicker from './components/DatePicker';
import Settings from './components/Settings';

class MyTab extends React.Component {
  render() {
    return (
      <Page>
        <section>
          {this.props.children}.
        </section>
      </Page>
    );
  }
}

class EasySchedulerApp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tabIndex: 0,
      loading: true,
      signedIn: false,
      gapi: null,
      easySchedulerModel: this,
      calendars: [],
      calendarName: '',
      calendarId: null,
      daypass: {
        start: '07:00',
        end: '16:30',
        color: '#ffc107'
      },
      eveningpass: {
        start: '13:00',
        end: '21:30',
        color: '#d66900'
      },
      eventText: 'Ming jobbar',
      address: 'Huddinge sjukhus'
    };
  }

  getCalendars = () => {
    return this.state.calendars;
  }

  getSettings = () => {
    return {
      calendarId: this.state.calendarId,
      daypass: this.state.daypass,
      eveningpass: this.state.eveningpass,
      eventText: this.state.eventText,
      address: this.state.address
    }
  }

  init = () => {
    const settingsJson = localStorage.getItem('settings');
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      this.setState({...settings});
    }
  }

  saveSettings = (settings) => {
    console.log('Save:', settings);
    localStorage.setItem('settings', JSON.stringify(settings));
    // this.init();
    window.location.reload();
  }

  loadGoogleAPI = () => {
    const googleApiScript = document.createElement('script')
    googleApiScript.src = 'https://apis.google.com/js/api.js'
    googleApiScript.onload = () => {
      const gapi = window.gapi;
      this.setState({ gapi });
      gapi.load('client:auth2', this.initClient);
    };
    document.body.appendChild(googleApiScript)
  }

  initClient = () => {
    const { gapi } = this.state;
    gapi.client.init({
      apiKey: GoogleApiOptions.API_KEY,
      clientId: GoogleApiOptions.CLIENT_ID,
      discoveryDocs: GoogleApiOptions.DISCOVERY_DOCS,
      scope: GoogleApiOptions.SCOPES
    }).then(() => {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(signedIn => {
        this.setState({ signedIn })
      });
      // Handle the initial sign-in state.
      const signedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
      this.setState({ signedIn });
      if(signedIn) {
        this.loadCalendars();
      } else {
        this.setState({ loading: false });
      }
    });
  }

  signIn = () => {
    this.state.gapi.auth2.getAuthInstance().signIn().then(this.loadCalendars);
  }

  signOut = () => {
    this.state.gapi.auth2.getAuthInstance().signOut();
  }

  // calendars
  loadCalendars = () => {
    let calendarId = this.getSettings().calendarId;
    let calendarName = '';
    getCalendars(this.state.gapi).then(res => {
      if (calendarId && res.result.items.length > 0) {
        const foundIdx = res.result.items.findIndex(calendar =>
          calendar.id === calendarId
        );
        // If we didn't find it we set it to null so user can choose new
        if(foundIdx === -1) {
          calendarId = null;
        } else {
          calendarName = res.result.items[foundIdx].summary;
        }
      }

      this.setState({
        calendarId,
        calendarName,
        calendars: res.result.items,
        loading: false,
        tabIndex: (!calendarId) ? 1 : 0
      });
    });
  }

  componentWillMount() {
    this.init(); // TODO: make async load googleApoi after settings state
    this.loadGoogleAPI();
  }

  componentDidUpdate(nextProps, prevState) {
    if(prevState.calendarId !== this.state.calendarId) {
      this.loadCalendars();
    }
  }


  // ==========  Render logic
  renderToolbar = tabIndex => () => {
    const titles = ['Min kalender', 'Inställningar'];
    return (
      <Toolbar>
        <div className='center'>{titles[tabIndex]}</div>
      </Toolbar>
    );
  }

  renderTabs = () => {
    const { calendarId } = this.state;
    return [
      {
        content: (
          <MyTab key="Schedule-c">
          {!calendarId
            ? <span>Välj en kalender i inställningar</span>
            : <DatePicker />
          }
          </MyTab>),
        tab: <Tab key="Schedule-t" label='Kalender' icon='md-calendar' />
      },
      {
        content: (
          <MyTab key="Settings-c">
            <Settings active={new Date().toISOString()}/>
          </MyTab>),
        tab: <Tab key="Settings-t" label='Inställningar' icon='md-settings' />
      }
    ];
  }

  render() {
    const { tabIndex, loading, signedIn } = this.state;

    if (loading || !signedIn) {
      return (
        <Page contentStyle={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ height: '300px' }}>
            <img alt="logo" src="images/logo-es.png" className="logo_big"/>
            {loading
              ? <div style={{ textAlign: 'center' }}>
                  <ProgressBar indeterminate />
                </div>
              : null}
            {!loading && !signedIn
              ? <Button style={{ marginTop: '50px' }}
                      modifier='easyscheduler--outline'
                      onClick={this.signIn}>
                Logga in för att för att börja
              </Button>
            : null}
          </div>
        </Page>);
    }

    // <button onClick={this.signOut} disabled={!signedIn}>Logga ut</button>
    // <button onClick={this.resetCalendarChoice} disabled={!signedIn || !calendarId}>Välj kalender</button>
    return (
      <GoogleApiContext.Provider value={this.state}>
        <Page renderToolbar={this.renderToolbar(tabIndex)}>
            <Tabbar
              swipeable={false}
              position='auto'
              index={tabIndex}
              onPreChange={(event) => {
                  if (event.index !== tabIndex) {
                    this.setState({tabIndex: event.index});
                  }
                }
              }
              renderTabs={this.renderTabs}
              />
        </Page>
      </GoogleApiContext.Provider>

    );
  }

}

export default EasySchedulerApp;


