import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import moment from 'moment-timezone';
import 'moment/locale/sv';

import DayPicker, { DateUtils } from 'react-day-picker';
import MomentLocaleUtils from 'react-day-picker/moment';

import './daypicker-style.css';

import { deleteEvents, insertPasses, getEventsForMonth } from '../lib/calendar';
import { withGoogleApi } from '../GoogleApiContext';

class DatePickerStyles extends Component {
  render() {
    return (
      <Fragment>
        <Helmet>
          <style type="text/css">{`
  .SchemaChooser .DayPicker-Day--eveningpasses:not(.DayPicker-Day--selected) {
    color: white !important;
    background-color: #d66900 !important;
  }

  .SchemaChooser .DayPicker-Day--daypasses:not(.DayPicker-Day--selected) {
    color: white !important;
    background-color: #ffc107 !important;
  }
        `}</style>
        </Helmet>
        <button className="passButton daypassButton" disabled={!selectedDays.length} onClick={this.addPasses(true)}>Dagpass</button>
        <button className="passButton eveningpassButton"  disabled={!selectedDays.length} onClick={this.addPasses(false)}>Kvällspass</button>
      </Fragment>
    );
  }
}

class DatePicker extends Component {
  static propTypes = {
    gapi: PropTypes.object.isRequired,
    calendarId: PropTypes.string.isRequired
  };

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

    insertPasses(this.props.gapi, this.props.calendarId, dayPass, passesToAdd)
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

    deleteEvents(this.props.gapi, this.props.calendarId, eventIdsToDelete)
      .then(res => this.fetchPassesFromServer());

    const daypasses = this.removeDaysFromArray(this.state.daypasses, selectedDays);
    const eveningpasses = this.removeDaysFromArray(this.state.eveningpasses, selectedDays);

    this.setState({ daypasses, eveningpasses, selectedDays: [] });

  }

  handleMonthChange = (newmonth) => {
    this.fetchPassesFromServer(newmonth);
  }

  componentWillMount() {
    this.fetchPassesFromServer();
  }

  fetchPassesFromServer = (monthToFetch) => {

    // TODO: refactor
    if (!monthToFetch) {
      monthToFetch = this.state.currentMonth;
    }

    if (monthToFetch.getMonth() !==  this.state.currentMonth.getMonth()) {
      this.setState({ currentMonth: monthToFetch });
    }

    getEventsForMonth(this.props.gapi, this.props.calendarId, monthToFetch)
      .then(response => {
        // TODO: summary can be undef
        const events = response.result.items.filter(event => event.summary && event.summary.includes('Ming jobbar'));
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
    const { currentMonth, daypasses, eveningpasses, selectedDays } = this.state;

    return (
      <Fragment>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <DayPicker
            showWeekNumbers
            localeUtils={MomentLocaleUtils}
            locale="sv"
            month={currentMonth}
            className="SchemaChooser"
            onDayClick={this.handleDayClick}
            onMonthChange={this.handleMonthChange}
            selectedDays={selectedDays}
            modifiers={ {daypasses, eveningpasses} }
          />
          <div>
            <DatePickerStyles />
            <button className="passButton removepassButton" disabled={!selectedDays.length} onClick={this.clearDay}>Rensa</button>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withGoogleApi(DatePicker);

