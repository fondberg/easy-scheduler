import React, { Component, Fragment } from 'react';
import { GoogleApiContext, GoogleApiOptions } from './GoogleApiContext';
import Calendar from './components/Calendar';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gapi: null,
      gapiOptions: GoogleApiOptions,
      signedIn: false,
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
      this.setState({ signedIn })
    });
  }

  signIn = () => {
    this.state.gapi.auth2.getAuthInstance().signIn();
  }

  signOut = () => {
    this.state.gapi.auth2.getAuthInstance().signOut();
  }

  componentWillMount() {
    this.loadGoogleAPI();
  }

  render() {
    const { signedIn } = this.state;
    return (
      <Fragment>
        <button onClick={this.signIn} disabled={signedIn}>Authorize</button>
        <button onClick={this.signOut} disabled={!signedIn}>Sign Out</button>

        {!signedIn
          ? <div>loading or not signed in.</div>
          : <GoogleApiContext.Provider value={this.state}>
              <Calendar/>
            </GoogleApiContext.Provider>
        }
      </Fragment>
    );
  }
}

export default App;


