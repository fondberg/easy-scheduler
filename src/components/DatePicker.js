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
import { AlertDialog, Button, ProgressBar } from 'react-onsenui';

class DatePickerStyles extends Component {
  render() {

    const passes = [
      {
        name: 'daypasses',
        color: '#ffc107'
      },
      {
        name: 'eveningpasses',
        color: '#d66900'
      }
    ];

    const styles = passes.map(pass => {
      return `
.SchemaChooser .DayPicker-Day--${pass.name}:not(.DayPicker-Day--selected) {
  color: white !important;
  background-color: ${pass.color} !important;
}
.${pass.name}Button {
  color: white;
  background-color: ${pass.color};
}
  `;
    }).join('\n');

    return (
      <Fragment>
        <Helmet>
          <style type="text/css">
            {styles}
            </style>
        </Helmet>
      </Fragment>
    );
  }
}

class DatePicker extends Component {
  static propTypes = {
    gapi: PropTypes.object.isRequired,
    easySchedulerModel: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    const date = new Date();

    this.state = {
      loading: true,
      alertDialogShown: false,
      currentMonth: new Date(date.getFullYear(), date.getMonth(), 1),
      selectedDays: [],
      daypasses: [],
      eveningpasses: [],
      events: [],
      settings: {}
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

  // ============================
  // Biz logic methods

  addPasses = (dayPass) => () => {
    this.setState({loading: true});

    // filter out already inserted days
    const passesToAdd = this.removeDaysFromArray(this.state.selectedDays,
      dayPass ? this.state.daypasses : this.state.eveningpasses);

    insertPasses(this.props.gapi, this.state.settings.calendarId, dayPass, passesToAdd, this.state.settings)
      .then(res => this.fetchPassesFromServer())
      .catch(e => {
        this.setState(
          { alertDialogShown: true },
          () => setTimeout(this.fetchPassesFromServer, 500)
        );
      });

    // if (dayPass) {
    //   const daypasses = [...this.state.daypasses, ...this.state.selectedDays];
    //   this.setState({ daypasses, selectedDays: [] });
    // } else {
    //   const eveningpasses = [...this.state.eveningpasses, ...this.state.selectedDays];
    //   this.setState({ eveningpasses, selectedDays: [] });
    // }
  }

  clearDays = () => {
    const { events, selectedDays } = this.state;
    this.setState({loading: true});

    const eventIdsToDelete = [];
    events.forEach(event => {
      const dayToRemove = selectedDays.find(date => {
        return DateUtils.isSameDay(date, moment(event.start.dateTime).toDate());
      });
      if (dayToRemove) {
        eventIdsToDelete.push(event.id);
      }
    });

    deleteEvents(this.props.gapi, this.state.settings.calendarId, eventIdsToDelete)
      .then(res => this.fetchPassesFromServer())
      .catch(e => {
        console.log(e);
        this.setState(
          { alertDialogShown: true },
          () => setTimeout(this.fetchPassesFromServer, 500)
        );
      });

    // const daypasses = this.removeDaysFromArray(this.state.daypasses, selectedDays);
    // const eveningpasses = this.removeDaysFromArray(this.state.eveningpasses, selectedDays);
    //
    // this.setState({ daypasses, eveningpasses, selectedDays: [] });

  }

  handleMonthChange = (newmonth) => {
    this.fetchPassesFromServer(newmonth);
  }

  componentDidUpdate(nextProps, prevState) {
    if(prevState.settings.calendarId !== this.state.settings.calendarId) {
      this.fetchPassesFromServer();
    }
  }

  componentWillMount() {

    this.setState(
      { settings: this.props.easySchedulerModel.getSettings() },
      () => this.fetchPassesFromServer()
    );
  }

  fetchPassesFromServer = (monthToFetch) => {
    this.setState({loading: true});
    if (!monthToFetch) {
      monthToFetch = this.state.currentMonth;
    }

    if (monthToFetch.getMonth() !==  this.state.currentMonth.getMonth()) {
      this.setState({ currentMonth: monthToFetch });
    }

    getEventsForMonth(this.props.gapi, this.state.settings.calendarId, monthToFetch)
      .then(events => {
        const daypasses = events
          .filter(event => moment(event.start.dateTime).hour() < 8)
          .map(event => moment(event.start.dateTime).toDate());
        const eveningpasses = events
          .filter(event => moment(event.start.dateTime).hour() > 8)
          .map(event => moment(event.start.dateTime).toDate());
        this.setState({ loading: false, events, daypasses, eveningpasses, selectedDays: [] });
      });
  }

  render() {
    const { loading, currentMonth, daypasses, eveningpasses, selectedDays } = this.state;


    return (
      <Fragment>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>

          {loading && <ProgressBar style={{ width: '100%' }} indeterminate />}

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
            <button className="passButton daypassesButton" disabled={!selectedDays.length} onClick={this.addPasses(true)}>Dagpass</button>
            <button className="passButton eveningpassesButton"  disabled={!selectedDays.length} onClick={this.addPasses(false)}>Kvällspass</button>
            <button className="passButton removepassesButton" disabled={!selectedDays.length} onClick={this.clearDays}>Rensa</button>
          </div>
        </div>


        <AlertDialog isOpen={this.state.alertDialogShown} isCancelable={false}>
          <div className="alert-dialog-title">Warning!</div>
          <div className="alert-dialog-content">
            Alla pass kunde inte sparas. <br />
            Prova en gång till.
          </div>
          <div className="alert-dialog-footer">
            <Button onClick={() => { this.fetchPassesFromServer(); this.setState({alertDialogShown: false}) }} className="alert-dialog-button">
              Ok
            </Button>
          </div>
        </AlertDialog>


      </Fragment>
    );
  }
}

export default withGoogleApi(DatePicker);

