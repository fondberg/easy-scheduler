import React, { Component } from 'react';
import { withGoogleApi } from '../GoogleApiContext';
import DatePicker from './DatePicker';

class Calendar extends Component {
  state = {
    events: []
  };

  render() {
    const { events } = this.state;
    // console.log('Calendar component:', events);
    return (
      <div>
        <DatePicker />
        <pre>
          {JSON.stringify(events.map(ev => ev.id + ' - ' + ev.summary + '-' + ev.start.dateTime), null , 2)}
        </pre>
      </div>
    );
  }
}

export default withGoogleApi(Calendar);

