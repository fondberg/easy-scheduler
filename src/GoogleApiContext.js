import React from 'react';

export const GoogleApiContext = React.createContext({
  gapi: null,
  signedIn: false
});

export const withGoogleApi = (Component) => {
  return props => {
    return (
      <GoogleApiContext.Consumer>
        {context => <Component {...props}
                               gapi={context.gapi}
                               easySchedulerModel={context.easySchedulerModel}
                               calendarId={context.calendarId}/>}
      </GoogleApiContext.Consumer>
    );
  }
}

export const GoogleApiOptions = {
  // Client ID and API key from the Developer Console
  CLIENT_ID: '282504731182-0araibtfgi6bb4br55qjneme0q7ek3kb.apps.googleusercontent.com',
  API_KEY: 'AIzaSyBbXPZ0YVjj88NVZeFjgmX-HB_fgZ9xlQE',
  // Array of API discovery doc URLs for APIs
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  SCOPES: 'https://www.googleapis.com/auth/calendar'
};
