import React, { Component, Fragment } from 'react';
import { GoogleApiContext, GoogleApiOptions } from './GoogleApiContext';
import Calendars from './components/Calendars';
import { getCalendars } from './lib/calendar';
import DatePicker from './components/DatePicker';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gapi: null,
      signedIn: false,
      loading: true,
      calendars: [],
      calendarId: null,
      calendarName: ''
    };
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
    let calendarId = localStorage.getItem('calendarId');
    let calendarName = '';

    getCalendars(this.state.gapi).then(res => {
      if (calendarId && res.result.items.length > 0) {
        const foundIdx = res.result.items.findIndex(calendar =>
          calendar.id === calendarId
        );
        // If we didn't find it we set it to null so use can choose new
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
        loading: false
      });
    });
  }

  handleCalendarSelect = (calendar) => {
    this.setState({ calendarId: calendar.id, calendarName: calendar.summary });
    localStorage.setItem('calendarId', calendar.id);
  }

  resetCalendarChoice = () => {
    localStorage.removeItem('calendarId');
    this.setState({
      calendarId: null,
      calendarName: '',
    });
  }

  componentWillMount() {
    this.loadGoogleAPI();
  }

  render() {
    const { loading, signedIn, calendars, calendarId } = this.state;
    if (loading) {
      return <div>loading...</div>
    }

    return (
      <Fragment>
        <button onClick={this.signIn} disabled={signedIn}>Logga in</button>
        <button onClick={this.signOut} disabled={!signedIn}>Logga ut</button>
        <button onClick={this.resetCalendarChoice} disabled={!calendarId}>Välj kalender</button>

        {!signedIn
          ? <div>Not signed in.</div>
          : <GoogleApiContext.Provider value={this.state}>
              {!calendarId
                ? <Calendars calendars={calendars} onCalendarSelected={this.handleCalendarSelect}/>
                : <DatePicker></DatePicker>
              }
            </GoogleApiContext.Provider>
        }
      </Fragment>
    );
  }
}

export default App;


