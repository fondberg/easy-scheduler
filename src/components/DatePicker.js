import React, { Component, Fragment } from 'react';
import moment from 'moment-timezone';
import Helmet from 'react-helmet';
import DayPicker, { DateUtils } from 'react-day-picker';
import 'react-day-picker/lib/style.css';

import { deleteEvents, insertPasses, getEventsForMonth } from '../lib/calendar';
import { withGoogleApi } from '../GoogleApiContext';

const modifiersStyles = {
  daypasses: {
    color: 'white',
    backgroundColor: '#ffc107',
  },
  eveningpasses: {
    color: 'white',
    backgroundColor: '#d66900',
  }
};


class DatePicker extends Component {
  /*
  * Proptypes:
  * events
  * gapi
  * gapiOptions
  *
  * */

  constructor(props) {
    super(props);

    this.state = {
      currentMonth: new Date(),
      selectedDays: [],
      daypasses: [],
      eveningpasses: [],
      events: []
    };
  }

  // Helpers
  removeDaysFromArray = (dayArray, days2remove) => {
    return dayArray.filter(day => {
      const foundIdx = days2remove.findIndex(removeDay =>
        DateUtils.isSameDay(removeDay, day)
      );
      return foundIdx === -1;
    });
    // do network request
  }

  // DayPicker functions
  handleDayClick = (day, { selected }) => {
    const { selectedDays } = this.state;
    if (selected) {
      const selectedIndex = selectedDays.findIndex(selectedDay =>
        DateUtils.isSameDay(selectedDay, day)
      );
      selectedDays.splice(selectedIndex, 1);
    } else {
      selectedDays.push(day);
    }
    this.setState({ selectedDays });
  }

  // Biz logic methods

  addPasses = (dayPass) => () => {
    // TODO: move to context later
    // filter out already inserted days
    const passesToAdd = this.removeDaysFromArray(this.state.selectedDays,
      dayPass ? this.state.daypasses : this.state.eveningpasses);

    insertPasses(this.props.gapi, this.props.gapiOptions.CALENDAR_ID, dayPass, passesToAdd)
      .then(res => this.fetchPassesFromServer());

    if (dayPass) {
      const daypasses = [...this.state.daypasses, ...this.state.selectedDays];
      this.setState({ daypasses, selectedDays: [] });
    } else {
      const eveningpasses = [...this.state.eveningpasses, ...this.state.selectedDays];
      this.setState({ eveningpasses, selectedDays: [] });
    }
  }

  clearDay = () => {
    const { events, selectedDays } = this.state;

    const eventIdsToDelete = [];
    events.forEach(event => {
      const dayToRemove = selectedDays.find(date => {
        return DateUtils.isSameDay(date, moment(event.start.dateTime).toDate());
      });
      if (dayToRemove) {
        eventIdsToDelete.push(event.id);
      }
    });

    deleteEvents(this.props.gapi, this.props.gapiOptions.CALENDAR_ID, eventIdsToDelete)
      .then(res => this.fetchPassesFromServer());

    const daypasses = this.removeDaysFromArray(this.state.daypasses, selectedDays);
    const eveningpasses = this.removeDaysFromArray(this.state.eveningpasses, selectedDays);

    this.setState({ daypasses, eveningpasses, selectedDays: [] });

  }

  handleMonthChange = (monthdate) => {
    console.log('handleMonthChange:', monthdate);
  }

  componentWillMount() {
    // getCalendars(this.props.gapi).then(res => console.log(res));
    this.fetchPassesFromServer();
  }

  fetchPassesFromServer = () => {
    getEventsForMonth(this.props.gapi, this.props.gapiOptions.CALENDAR_ID, this.state.monthDate)
      .then(response => {
        const events = response.result.items.filter(event => event.summary.includes('Ming jobbar'));
        const daypasses = events
          .filter(event => moment(event.start.dateTime).hour() < 8)
          .map(event => moment(event.start.dateTime).toDate());
        const eveningpasses = events
          .filter(event => moment(event.start.dateTime).hour() > 8)
          .map(event => moment(event.start.dateTime).toDate());
        this.setState({ events, daypasses, eveningpasses, selectedDays: [] });
      });
  }

  render() {
    const { daypasses, eveningpasses, selectedDays } = this.state;

    return (
      <Fragment>
        <DatePickerStyles />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <DayPicker
            showWeekNumbers
            firstDayOfWeek={1}
            className="SchemaChooser"
            onDayClick={this.handleDayClick}
            onMonthChange={this.handleMonthChange}
            selectedDays={selectedDays}
            modifiers={ {daypasses, eveningpasses} }
          />
          <div>
            <button style={modifiersStyles.daypasses} disabled={!selectedDays.length} onClick={this.addPasses(true)}>Dagpass</button>
            <button style={modifiersStyles.eveningpasses} disabled={!selectedDays.length} onClick={this.addPasses(false)}>Kvällspass</button>
            <button disabled={!selectedDays.length} onClick={this.clearDay}>Rensa</button>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withGoogleApi(DatePicker);

const DatePickerStyles = (props) => (
  <Helmet>
    <style>{`
  .SchemaChooser .DayPicker-Day--selected {
    background-color: #4a90e2 !important;
    color: #4a90e2;
  }

  .SchemaChooser .DayPicker-Day--eveningpasses:not(.DayPicker-Day--selected) {
      color: white !important;
      background-color: #d66900 !important;
  }

  .SchemaChooser .DayPicker-Day--daypasses:not(.DayPicker-Day--selected) {
      color: white !important;
      background-color: #ffc107 !important;
  }

  .SchemaChooser .DayPicker-Day {

  }

`}</style>
  </Helmet>
);

